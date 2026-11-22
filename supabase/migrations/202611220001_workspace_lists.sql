-- Reuse the existing public.lists and public.list_items tables.
alter table public.lists
  add column if not exists key text,
  add column if not exists is_default boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists deleted_at timestamptz;

alter table public.list_items
  add column if not exists deleted_at timestamptz;

create unique index if not exists lists_workspace_key_unique
  on public.lists(workspace_id, key)
  where key is not null and coalesce(deleted_at, 'infinity'::timestamptz) = 'infinity'::timestamptz;

create index if not exists lists_workspace_active_idx
  on public.lists(workspace_id, sort_order)
  where coalesce(deleted_at, 'infinity'::timestamptz) = 'infinity'::timestamptz;

create index if not exists list_items_list_active_idx
  on public.list_items(list_id, position)
  where coalesce(deleted_at, 'infinity'::timestamptz) = 'infinity'::timestamptz;

create or replace function public.set_lists_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lists_updated_at on public.lists;
create trigger lists_updated_at
  before update on public.lists
  for each row execute function public.set_lists_updated_at();

drop trigger if exists list_items_updated_at on public.list_items;
create trigger list_items_updated_at
  before update on public.list_items
  for each row execute function public.set_lists_updated_at();

create or replace function public.prevent_default_list_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(old.is_default, false) then
    if tg_op = 'DELETE' then
      raise exception 'The default shopping list is protected';
    end if;

    if coalesce(new.deleted_at, 'infinity'::timestamptz) != 'infinity'::timestamptz then
      raise exception 'The default shopping list is protected';
    end if;
    if new.name distinct from old.name then
      raise exception 'The default shopping list is protected';
    end if;
    if new.is_default distinct from old.is_default then
      raise exception 'The default shopping list is protected';
    end if;
    if new.key distinct from old.key then
      raise exception 'The default shopping list is protected';
    end if;
    if coalesce(new.is_archived, false) then
      raise exception 'The default shopping list is protected';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists lists_protect_default on public.lists;
create trigger lists_protect_default
  before update or delete on public.lists
  for each row execute function public.prevent_default_list_mutation();

create or replace function public.ensure_workspace_lists(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_list_id uuid;
  v_now timestamptz := now();
begin
  if not is_workspace_member(p_workspace_id) then
    raise exception 'Not a workspace member';
  end if;

  insert into public.lists (
    workspace_id, key, name, type, is_default, sort_order,
    created_by, created_at, updated_at
  )
  values (
    p_workspace_id, 'shopping', 'Compra', 'shopping', true, 0,
    auth.uid(), v_now, v_now
  )
  on conflict do nothing;

  insert into public.lists (
    workspace_id, key, name, type, is_default, sort_order,
    created_by, created_at, updated_at
  )
  values (
    p_workspace_id, 'trip-ideas', 'Ideas para el viaje', 'custom', false, 1,
    auth.uid(), v_now, v_now
  )
  on conflict do nothing;

  select id into v_list_id
  from public.lists
  where workspace_id = p_workspace_id
    and key = 'shopping'
    and coalesce(deleted_at, 'infinity'::timestamptz) = 'infinity'::timestamptz
  limit 1;

  if v_list_id is not null then
    insert into public.list_items (
      workspace_id, list_id, created_by, name, quantity, is_completed,
      position, metadata, created_at, updated_at
    )
    select
      p_workspace_id,
      v_list_id,
      auth.uid(),
      item.name,
      1,
      false,
      item.position,
      '{}'::jsonb,
      v_now,
      v_now
    from (values ('Mantequila Lorenzana', 0), ('pavo', 1))
      as item(name, position)
    where not exists (
      select 1
      from public.list_items existing
      where existing.workspace_id = p_workspace_id
        and existing.list_id = v_list_id
        and coalesce(existing.deleted_at, 'infinity'::timestamptz) = 'infinity'::timestamptz
    );
  end if;

  select id into v_list_id
  from public.lists
  where workspace_id = p_workspace_id
    and key = 'trip-ideas'
    and coalesce(deleted_at, 'infinity'::timestamptz) = 'infinity'::timestamptz
  limit 1;

  if v_list_id is not null then
    insert into public.list_items (
      workspace_id, list_id, created_by, name, quantity, is_completed,
      position, metadata, created_at, updated_at
    )
    select
      p_workspace_id,
      v_list_id,
      auth.uid(),
      item.name,
      1,
      false,
      item.position,
      '{}'::jsonb,
      v_now,
      v_now
    from (
      values ('Sitios que visitar', 0),
             ('Restaurantes por probar', 1),
             ('Qué llevar', 2)
    ) as item(name, position)
    where not exists (
      select 1
      from public.list_items existing
      where existing.workspace_id = p_workspace_id
        and existing.list_id = v_list_id
        and coalesce(existing.deleted_at, 'infinity'::timestamptz) = 'infinity'::timestamptz
    );
  end if;
end;
$$;

grant execute on function public.ensure_workspace_lists(uuid) to authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table public.lists;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.list_items;
  exception when duplicate_object then null;
  end;
end;
$$;
