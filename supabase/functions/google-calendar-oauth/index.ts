import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const androidOAuthReturnUri = 'com.ionic.haven://calendar/oauth-return';
type OAuthReturnResult = 'connected' | 'cancelled' | 'error';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function redirectOAuthResult(destination: string, result: OAuthReturnResult): Response {
  if (destination === androidOAuthReturnUri) {
    const returnUrl = new URL(destination);
    returnUrl.searchParams.set('result', result);
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: returnUrl.toString() },
    });
  }

  return Response.redirect(destination, 302);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function pkceChallenge(verifier: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function randomString(bytes = 32): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(bytes))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function encrypt(secret: string, value: string): Promise<string> {
  const keyMaterial = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey('raw', keyMaterial, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(value));
  const payload = new Uint8Array(iv.length + encrypted.byteLength);
  payload.set(iv);
  payload.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...payload));
}

async function decrypt(secret: string, value: string): Promise<string> {
  const payload = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  const iv = payload.slice(0, 12);
  const encrypted = payload.slice(12);
  const keyMaterial = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey('raw', keyMaterial, 'AES-GCM', false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return new TextDecoder().decode(decrypted);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    Deno.env.get('SERVICE_ROLE_KEY') ??
    Deno.env.get('SUPABASE_SECRET_KEY');
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const redirectUri = Deno.env.get('GOOGLE_OAUTH_REDIRECT_URI');
  const tokenEncryptionKey = Deno.env.get('GOOGLE_TOKEN_ENCRYPTION_KEY');
  const scopes = Deno.env.get('GOOGLE_OAUTH_SCOPES') ?? 'https://www.googleapis.com/auth/calendar.events';

  if (!supabaseUrl || !serviceRoleKey || !clientId || !clientSecret || !redirectUri || !tokenEncryptionKey) {
    return json({ code: 'configuration_incomplete', message: 'La integración Google no está configurada.' }, 503);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const authorization = request.headers.get('Authorization');
  const jwt = authorization?.replace(/^Bearer\s+/i, '');
  const url = new URL(request.url);
  const action = url.pathname.split('/').filter(Boolean).at(-1);

  if (action === 'callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (!state) {
      return new Response('El estado OAuth no está presente.', { status: 400 });
    }

    const stateHash = await sha256(state);
    const publishableKey =
      Deno.env.get('SUPABASE_ANON_KEY') ??
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ??
      'sb_publishable__wT0kabupLV4Dg4KvMhOcw_leS3TDkZ';
    const publishableClient = createClient(supabaseUrl, publishableKey);

    if (error || !code) {
      const { data: cancelled, error: cancelError } = await publishableClient.rpc('cancel_google_oauth', {
        p_state_hash: stateHash,
      });
      if (cancelError || !cancelled?.length) {
        return new Response('La autorización cancelada no tiene un estado válido.', { status: 400 });
      }

      return redirectOAuthResult(cancelled[0].redirect_destination, error === 'access_denied' ? 'cancelled' : 'error');
    }

    const { data: stateRows, error: stateError } = await publishableClient.rpc('get_google_oauth_state', {
      p_state_hash: stateHash,
    });
    const oauthState = stateRows?.[0];

    if (stateError || !oauthState) {
      return new Response('El estado OAuth no es válido o ya fue utilizado.', { status: 400 });
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: oauthState.code_verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const { data: cancelled, error: cancelError } = await publishableClient.rpc('cancel_google_oauth', {
        p_state_hash: stateHash,
      });
      if (cancelError || !cancelled?.length) {
        return new Response('Google rechazó el intercambio de autorización.', { status: 502 });
      }
      return redirectOAuthResult(cancelled[0].redirect_destination, 'error');
    }

    const tokens = (await tokenResponse.json().catch(() => null)) as {
      refresh_token?: string;
      access_token?: string;
      expires_in?: number;
      scope?: string;
    } | null;

    if (!tokens?.refresh_token || !tokens.access_token || !tokens.expires_in) {
      const { data: cancelled, error: cancelError } = await publishableClient.rpc('cancel_google_oauth', {
        p_state_hash: stateHash,
      });
      if (cancelError || !cancelled?.length) {
        return new Response('Google no devolvió credenciales renovables.', { status: 400 });
      }
      return redirectOAuthResult(cancelled[0].redirect_destination, 'error');
    }

    const refreshEncrypted = await encrypt(tokenEncryptionKey, tokens.refresh_token);
    const accessEncrypted = await encrypt(tokenEncryptionKey, tokens.access_token);

    const { data: completed, error: connectionError } = await publishableClient.rpc('complete_google_oauth', {
      p_state_hash: stateHash,
      p_refresh_token_encrypted: refreshEncrypted,
      p_access_token_encrypted: accessEncrypted,
      p_access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      p_scopes: (tokens.scope ?? scopes).split(' ').filter(Boolean),
    });

    if (connectionError || !completed?.length) {
      const { data: cancelled, error: cancelError } = await publishableClient.rpc('cancel_google_oauth', {
        p_state_hash: stateHash,
      });
      if (cancelError || !cancelled?.length) {
        return new Response('No se pudo guardar la conexión.', { status: 500 });
      }
      return redirectOAuthResult(cancelled[0].redirect_destination, 'error');
    }

    const destination = completed[0].redirect_destination || oauthState.redirect_destination || '/tabs/calendar';
    return redirectOAuthResult(destination, 'connected');
  }

  if (!jwt) {
    return json({ code: 'authentication_required', message: 'Inicia sesión en Haven.' }, 401);
  }

  const { data: authData, error: authError } = await admin.auth.getUser(jwt);
  if (authError || !authData.user) {
    return json({ code: 'authentication_required', message: 'La sesión no es válida.' }, 401);
  }

  const userId = authData.user.id;
  const publishableKey =
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ??
    'sb_publishable__wT0kabupLV4Dg4KvMhOcw_leS3TDkZ';
  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  if (action === 'status') {
    const { data: connection, error: statusError } = await userClient.rpc('google_calendar_status', {
      p_user_id: userId,
    });

    if (statusError) {
      return json({ code: 'status_failed', message: 'No se pudo consultar el estado de Google.' }, 500);
    }

    const status = connection?.[0];
    return json({
      kind: status?.kind === 'connected' ? 'connected' : 'disconnected',
      connectedAt: status?.connected_at ?? null,
      email: status?.google_email ?? null,
      message: status?.last_error ?? null,
    });
  }

  if (action === 'disconnect') {
    const { error } = await userClient.rpc('disconnect_google_calendar', { p_user_id: userId });

    if (error) {
      return json({ code: 'disconnect_failed', message: 'No se pudo desconectar Google.' }, 500);
    }
    return json({ kind: 'disconnected' });
  }

  if (action === 'start') {
    let body: { platform?: string; redirectDestination?: string } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const platform = body.platform ?? 'web';
    if (platform !== 'web' && platform !== 'android') {
      return json({ code: 'invalid_platform', message: 'La plataforma no es válida.' }, 400);
    }

    const { data: memberships, error: membershipError } = await userClient
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .limit(2);

    if (membershipError || !memberships?.length) {
      return json(
        {
          code: 'workspace_missing',
          message: 'No tienes acceso a un workspace.',
          detail: membershipError?.message ?? null,
        },
        403,
      );
    }
    if (memberships.length !== 1) {
      return json({ code: 'workspace_ambiguous', message: 'La cuenta tiene varios workspaces.' }, 409);
    }

    const state = randomString();
    const verifier = randomString(64);
    const stateHash = await sha256(state);
    const workspaceId = memberships[0].workspace_id;
    const redirectDestination =
      platform === 'android' ? androidOAuthReturnUri : (body.redirectDestination ?? '/tabs/calendar');

    const { error: stateError } = await userClient.from('google_oauth_states').insert({
      state_hash: stateHash,
      user_id: userId,
      workspace_id: workspaceId,
      code_verifier: verifier,
      redirect_destination: redirectDestination,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    if (stateError) {
      return json(
        {
          code: 'oauth_state_failed',
          message: 'No se pudo iniciar Google.',
        },
        500,
      );
    }

    const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorizationUrl.searchParams.set('client_id', clientId);
    authorizationUrl.searchParams.set('redirect_uri', redirectUri);
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('scope', scopes);
    authorizationUrl.searchParams.set('state', state);
    authorizationUrl.searchParams.set('code_challenge', await pkceChallenge(verifier));
    authorizationUrl.searchParams.set('code_challenge_method', 'S256');
    authorizationUrl.searchParams.set('access_type', 'offline');
    authorizationUrl.searchParams.set('prompt', 'consent');
    authorizationUrl.searchParams.set('include_granted_scopes', 'true');

    return json({ authorizationUrl: authorizationUrl.toString() });
  }

  if (action === 'events') {
    let body: { timeMin?: string; timeMax?: string } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    if (!body.timeMin || !body.timeMax) {
      return json({ code: 'invalid_range', message: 'Debes indicar inicio y fin.' }, 400);
    }

    const timeMin = new Date(body.timeMin);
    const timeMax = new Date(body.timeMax);
    if (Number.isNaN(timeMin.getTime()) || Number.isNaN(timeMax.getTime()) || timeMax <= timeMin) {
      return json({ code: 'invalid_range', message: 'El rango de fechas no es válido.' }, 400);
    }
    if (timeMax.getTime() - timeMin.getTime() > 45 * 24 * 60 * 60 * 1000) {
      return json({ code: 'invalid_range', message: 'El rango solicitado es demasiado amplio.' }, 400);
    }

    const { data: connectionRows, error: connectionError } = await userClient.rpc('get_google_calendar_connection', {
      p_user_id: userId,
    });
    const connection = connectionRows?.[0];

    if (connectionError || !connection || connection.revoked_at) {
      return json({ code: 'not_connected', message: 'Google Calendar no está conectado.' }, 409);
    }

    if (!connection.refresh_token_encrypted) {
      return json({ code: 'authorization_revoked', message: 'Google Calendar debe volver a autorizarse.' }, 409);
    }

    let accessToken = connection.access_token_encrypted
      ? await decrypt(tokenEncryptionKey, connection.access_token_encrypted)
      : '';
    const expiresAt = connection.access_token_expires_at ? new Date(connection.access_token_expires_at).getTime() : 0;

    if (!accessToken || expiresAt <= Date.now() + 60_000) {
      const refreshToken = await decrypt(tokenEncryptionKey, connection.refresh_token_encrypted);
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        return json({ code: 'authorization_revoked', message: 'Google rechazó la renovación.' }, 409);
      }

      const refreshed = (await refreshResponse.json()) as { access_token: string; expires_in: number };
      accessToken = refreshed.access_token;
      await userClient.rpc('update_google_calendar_access', {
        p_user_id: userId,
        p_access_token_encrypted: await encrypt(tokenEncryptionKey, accessToken),
        p_access_token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      });
    }

    const sharedCalendarId = Deno.env.get('GOOGLE_SHARED_CALENDAR_ID');
    if (!sharedCalendarId) {
      return json({ code: 'shared_calendar_missing', message: 'Falta configurar el calendario compartido.' }, 503);
    }

    async function fetchSource(source: 'personal' | 'shared', calendarId: string) {
      const events: unknown[] = [];
      let pageToken: string | undefined;

      do {
        const apiUrl = new URL(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        );
        apiUrl.searchParams.set('timeMin', timeMin.toISOString());
        apiUrl.searchParams.set('timeMax', timeMax.toISOString());
        apiUrl.searchParams.set('singleEvents', 'true');
        apiUrl.searchParams.set('orderBy', 'startTime');
        apiUrl.searchParams.set('maxResults', '250');
        if (pageToken) {
          apiUrl.searchParams.set('pageToken', pageToken);
        }

        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          throw new Error(source);
        }

        const page = (await response.json()) as {
          items?: Array<{
            id: string;
            summary?: string;
            start?: { date?: string; dateTime?: string; timeZone?: string };
            end?: { date?: string; dateTime?: string; timeZone?: string };
            location?: string;
            recurringEventId?: string;
            etag?: string;
          }>;
          nextPageToken?: string;
        };
        events.push(
          ...(page.items ?? []).map((event) => ({
            id: event.id,
            calendarId,
            eventId: event.id,
            title: event.summary?.trim() || 'Sin título',
            source,
            start: event.start?.dateTime ?? event.start?.date ?? timeMin.toISOString(),
            end: event.end?.dateTime ?? event.end?.date ?? timeMin.toISOString(),
            allDay: Boolean(event.start?.date),
            location: event.location,
            recurringEventId: event.recurringEventId,
            etag: event.etag,
          })),
        );
        pageToken = page.nextPageToken;
      } while (pageToken);

      return events;
    }

    const results = await Promise.allSettled([
      fetchSource('personal', 'primary'),
      fetchSource('shared', sharedCalendarId),
    ]);

    const events: unknown[] = [];
    const failedSources: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        events.push(...result.value);
      } else {
        failedSources.push(index === 0 ? 'personal' : 'shared');
      }
    });

    return json({
      events,
      failedSources,
      stale: false,
    });
  }

  return json({ code: 'not_found', message: 'Acción no encontrada.' }, 404);
});
