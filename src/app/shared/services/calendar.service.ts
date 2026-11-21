import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';

export type CalendarSource = 'personal' | 'shared';
export type GoogleCalendarOAuthResult = 'connected' | 'cancelled' | 'error';

export interface CalendarEvent {
  id: string;
  calendarId: string;
  eventId: string;
  title: string;
  source: CalendarSource;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  recurringEventId?: string;
  etag?: string;
}

export interface CalendarConnectionStatus {
  kind: 'connected' | 'disconnected' | 'incomplete';
  events: CalendarEvent[];
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly supabase = inject(SupabaseService);

  async getConnectionStatus(): Promise<CalendarConnectionStatus> {
    try {
      const response = await fetch(`${this.getFunctionsUrl()}/google-calendar-oauth/status`, {
        headers: await this.getAuthHeaders(),
      });

      if (response.status === 404) {
        return { kind: 'disconnected', events: [], message: 'Google Calendar todavía no está desplegado.' };
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'No se pudo consultar Google Calendar.');
      }

      const status = (await response.json()) as { kind: 'connected' | 'disconnected' | 'incomplete'; message?: string };
      return { kind: status.kind, events: [], message: status.message };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No se pudo consultar Google Calendar.');
    }
  }

  async startGoogleConnection(platform: 'web' | 'android' = 'web'): Promise<string> {
    const requestBody: { platform: 'web' | 'android'; redirectDestination?: string } = { platform };
    if (platform === 'web') {
      requestBody.redirectDestination =
        typeof window === 'undefined' ? '/tabs/calendar' : `${window.location.origin}/tabs/calendar`;
    }

    const response = await fetch(`${this.getFunctionsUrl()}/google-calendar-oauth/start`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(requestBody),
    });

    const responseBody = (await response.json().catch(() => null)) as {
      authorizationUrl?: string;
      message?: string;
    } | null;
    if (!response.ok || !responseBody?.authorizationUrl) {
      throw new Error(responseBody?.message ?? 'No se pudo iniciar la conexión con Google.');
    }
    return responseBody.authorizationUrl;
  }

  async disconnectGoogle(): Promise<void> {
    const response = await fetch(`${this.getFunctionsUrl()}/google-calendar-oauth/disconnect`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('No se pudo desconectar Google Calendar.');
    }
  }

  async getEvents(
    timeMin: Date,
    timeMax: Date,
  ): Promise<{
    events: CalendarEvent[];
    failedSources: CalendarSource[];
  }> {
    const response = await fetch(`${this.getFunctionsUrl()}/google-calendar-oauth/events`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
      }),
    });

    if (response.status === 409) {
      const body = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;
      throw new Error(body?.message ?? 'Google Calendar no está conectado.');
    }
    if (!response.ok) {
      throw new Error('No se pudo cargar Google Calendar.');
    }

    const body = (await response.json()) as {
      events: Array<Omit<CalendarEvent, 'start' | 'end'> & { start: string; end: string }>;
      failedSources: CalendarSource[];
    };
    return {
      events: body.events.map((event) => ({
        ...event,
        start: event.allDay ? this.parseCivilDate(event.start) : new Date(event.start),
        end: event.allDay ? this.parseCivilDate(event.end) : new Date(event.end),
      })),
      failedSources: body.failedSources,
    };
  }

  private getFunctionsUrl(): string {
    return 'https://idwvzaculamfmywkbbou.supabase.co/functions/v1';
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data } = await this.supabase.client.auth.getSession();
    if (!data.session) {
      throw new Error('Inicia sesión en Haven para consultar Google Calendar.');
    }

    return {
      apikey: environment.supabasePublishableKey,
      Authorization: `Bearer ${data.session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  private parseCivilDate(value: string): Date {
    const datePart = value.slice(0, 10);
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
}
