create table if not exists public.google_calendar_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_email text,
  refresh_token_encrypted text,
  access_token_encrypted text,
  access_token_expires_at timestamptz,
  scopes text[] not null default array[]::text[],
  connected_at timestamptz,
  revoked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_calendar_connections enable row level security;

revoke all on public.google_calendar_connections from anon, authenticated;
drop policy if exists google_calendar_connections_no_client_access on public.google_calendar_connections;
create policy google_calendar_connections_no_client_access
  on public.google_calendar_connections
  for all
  to authenticated
  using (false)
  with check (false);

create table if not exists public.google_calendar_config (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  shared_calendar_id text not null,
  configured_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.google_calendar_config enable row level security;

drop policy if exists google_calendar_config_select_members on public.google_calendar_config;
create policy google_calendar_config_select_members
  on public.google_calendar_config
  for select
  to authenticated
  using (is_workspace_member(workspace_id));

drop policy if exists google_calendar_config_write_owner on public.google_calendar_config;
create policy google_calendar_config_write_owner
  on public.google_calendar_config
  for all
  to authenticated
  using (is_workspace_owner(workspace_id))
  with check (is_workspace_owner(workspace_id));

create table if not exists public.google_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  code_verifier text not null,
  redirect_destination text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.google_oauth_states enable row level security;

revoke all on public.google_oauth_states from anon, authenticated;

grant insert, update on public.google_oauth_states to authenticated;

drop policy if exists google_oauth_states_insert_own on public.google_oauth_states;
create policy google_oauth_states_insert_own
  on public.google_oauth_states
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and is_workspace_member(workspace_id)
  );

drop policy if exists google_oauth_states_update_own on public.google_oauth_states;
create policy google_oauth_states_update_own
  on public.google_oauth_states
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.complete_google_oauth(
  p_state_hash text,
  p_refresh_token_encrypted text,
  p_access_token_encrypted text,
  p_access_token_expires_at timestamptz,
  p_scopes text[]
)
returns table (redirect_destination text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid;
  v_workspace_id uuid;
  v_redirect_destination text;
begin
  select os.user_id, os.workspace_id, os.redirect_destination
    into v_user_id, v_workspace_id, v_redirect_destination
  from public.google_oauth_states os
  where os.state_hash = p_state_hash
    and os.used_at is null
    and os.expires_at > now()
  limit 1;

  if v_user_id is null then
    raise exception 'invalid_or_expired_oauth_state';
  end if;

  update public.google_oauth_states
  set used_at = now()
  where state_hash = p_state_hash;

  insert into public.google_calendar_connections (
    user_id,
    refresh_token_encrypted,
    access_token_encrypted,
    access_token_expires_at,
    scopes,
    connected_at,
    revoked_at,
    updated_at
  ) values (
    v_user_id,
    p_refresh_token_encrypted,
    p_access_token_encrypted,
    p_access_token_expires_at,
    p_scopes,
    now(),
    null,
    now()
  )
  on conflict (user_id) do update
  set refresh_token_encrypted = excluded.refresh_token_encrypted,
      access_token_encrypted = excluded.access_token_encrypted,
      access_token_expires_at = excluded.access_token_expires_at,
      scopes = excluded.scopes,
      connected_at = now(),
      revoked_at = null,
      updated_at = now();

  return query select v_redirect_destination;
end;
$$;

revoke all on function public.complete_google_oauth(text, text, text, timestamptz, text[]) from anon, authenticated;
grant execute on function public.complete_google_oauth(text, text, text, timestamptz, text[]) to anon, authenticated;

create or replace function public.get_google_oauth_state(p_state_hash text)
returns table (
  user_id uuid,
  workspace_id uuid,
  code_verifier text,
  redirect_destination text
)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select os.user_id, os.workspace_id, os.code_verifier, os.redirect_destination
  from public.google_oauth_states os
  where os.state_hash = p_state_hash
    and os.used_at is null
    and os.expires_at > now()
  limit 1;
$$;

revoke all on function public.get_google_oauth_state(text) from anon, authenticated;
grant execute on function public.get_google_oauth_state(text) to anon, authenticated;

create or replace function public.google_calendar_status(p_user_id uuid)
returns table (
  kind text,
  connected_at timestamptz,
  google_email text,
  last_error text
)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select
    case
      when gcc.connected_at is not null and gcc.revoked_at is null then 'connected'
      else 'disconnected'
    end,
    gcc.connected_at,
    gcc.google_email,
    gcc.last_error
  from public.google_calendar_connections gcc
  where gcc.user_id = p_user_id
    and p_user_id = auth.uid()
  union all
  select 'disconnected', null, null, null
  where not exists (
    select 1
    from public.google_calendar_connections gcc
    where gcc.user_id = p_user_id
      and p_user_id = auth.uid()
  );
$$;

revoke all on function public.google_calendar_status(uuid) from anon, authenticated;
grant execute on function public.google_calendar_status(uuid) to authenticated;

create or replace function public.disconnect_google_calendar(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  update public.google_calendar_connections
  set revoked_at = now(), updated_at = now()
  where user_id = p_user_id
    and p_user_id = auth.uid()
  returning true;
$$;

revoke all on function public.disconnect_google_calendar(uuid) from anon, authenticated;
grant execute on function public.disconnect_google_calendar(uuid) to authenticated;

create or replace function public.get_google_calendar_connection(p_user_id uuid)
returns table (
  refresh_token_encrypted text,
  access_token_encrypted text,
  access_token_expires_at timestamptz,
  scopes text[],
  revoked_at timestamptz
)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select gcc.refresh_token_encrypted,
         gcc.access_token_encrypted,
         gcc.access_token_expires_at,
         gcc.scopes,
         gcc.revoked_at
  from public.google_calendar_connections gcc
  where gcc.user_id = p_user_id
    and p_user_id = auth.uid();
$$;

revoke all on function public.get_google_calendar_connection(uuid) from anon, authenticated;
grant execute on function public.get_google_calendar_connection(uuid) to authenticated;

create or replace function public.update_google_calendar_access(
  p_user_id uuid,
  p_access_token_encrypted text,
  p_access_token_expires_at timestamptz
)
returns boolean
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  update public.google_calendar_connections
  set access_token_encrypted = p_access_token_encrypted,
      access_token_expires_at = p_access_token_expires_at,
      updated_at = now()
  where user_id = p_user_id
    and p_user_id = auth.uid()
  returning true;
$$;

revoke all on function public.update_google_calendar_access(uuid, text, timestamptz) from anon, authenticated;
grant execute on function public.update_google_calendar_access(uuid, text, timestamptz) to authenticated;
