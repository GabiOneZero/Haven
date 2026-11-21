create or replace function public.cancel_google_oauth(p_state_hash text)
returns table (redirect_destination text)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  update public.google_oauth_states
  set used_at = now()
  where state_hash = p_state_hash
    and used_at is null
    and expires_at > now()
  returning redirect_destination;
$$;

revoke all on function public.cancel_google_oauth(text) from anon, authenticated;
grant execute on function public.cancel_google_oauth(text) to anon, authenticated;
