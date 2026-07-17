-- 0008 hardcoded the wrong admin email into admin_set_user_plan()/admin_list_users()
-- (copied from a stale local .env.local rather than the actual configured
-- NEXT_PUBLIC_ADMIN_EMAIL in Vercel production, which is ceo@arghayconsulting.co.in).
-- create or replace to correct the already-deployed functions without a drop/recreate.

create or replace function public.admin_set_user_plan(p_user_id uuid, p_plan user_plan)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (auth.jwt() ->> 'email') is distinct from 'ceo@arghayconsulting.co.in' then
    raise exception 'Not authorized';
  end if;

  update users set plan = p_plan where id = p_user_id;
end;
$$;

create or replace function public.admin_list_users()
returns table (id uuid, name text, phone_number text, plan user_plan, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if (auth.jwt() ->> 'email') is distinct from 'ceo@arghayconsulting.co.in' then
    raise exception 'Not authorized';
  end if;

  return query
    select u.id, u.name, u.phone_number, u.plan, u.created_at
    from users u
    order by u.created_at desc;
end;
$$;
