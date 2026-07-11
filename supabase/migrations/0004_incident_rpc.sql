-- The direct-table-access approach for anonymous reporters (0001) had two problems, surfaced by
-- testing the real scan -> notify flow:
--   1. incidents_select_owner's policy expression subqueries `users`. Postgres requires baseline
--      table privilege on any table a policy references — even just to evaluate the check to
--      false — so anon (which intentionally has zero grants on `users`) got a hard
--      "permission denied for table users" error instead of a clean "no rows" RLS result. This
--      fired on every insert, because PostgREST's insert...select(...) does an INSERT ...
--      RETURNING under the hood, which re-checks SELECT policies on the table.
--   2. Anonymous reporters never had *any* SELECT policy on incidents, so even without bug #1
--      they could not read back the id of the row they had just created — which the "mark
--      resolved" step needs.
--
-- Fix: route incident creation/resolution through SECURITY DEFINER functions. These run with the
-- function owner's privileges (bypassing RLS internally) and hand back only the single value the
-- caller needs, so anon needs no table-level grants on incidents or users at all.

drop policy if exists "incidents_insert_public" on incidents;
drop policy if exists "incidents_update_status_public" on incidents;
revoke insert on incidents from anon, authenticated;
revoke update (status, resolved_at) on incidents from anon, authenticated;

create function public.create_incident(p_sticker_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status sticker_status;
  v_incident_id uuid;
begin
  select status into v_status from stickers where id = p_sticker_id;

  if v_status is null or v_status <> 'active' then
    raise exception 'Sticker not found or inactive';
  end if;

  insert into incidents (sticker_id, status)
  values (p_sticker_id, 'pending')
  returning id into v_incident_id;

  return v_incident_id;
end;
$$;

comment on function public.create_incident(uuid) is
  'Callable by anon: creates a pending incident for an active sticker and returns its id.';

grant execute on function public.create_incident(uuid) to anon, authenticated;

create function public.resolve_incident(p_incident_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update incidents
  set status = 'resolved', resolved_at = now()
  where id = p_incident_id
    and status in ('pending', 'notified', 'failed');
end;
$$;

comment on function public.resolve_incident(uuid) is
  'Callable by anon or the owner: marks an incident resolved. Possessing the incident''s uuid
   (handed back only to whoever created it, or visible to the owner via their dashboard) is the
   capability that authorizes this — see create_incident().';

grant execute on function public.resolve_incident(uuid) to anon, authenticated;
