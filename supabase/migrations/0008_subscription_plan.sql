-- Subscription plan tiers. Free is the only self-serve/default tier right now —
-- Premium and Premium Pro have no payment flow yet, so they're admin-granted only,
-- via admin_set_user_plan() below, called from the website admin page.
--   free:        push notification only.
--   premium:     push + SMS + WhatsApp.
--   premium_pro: push + SMS + WhatsApp + phone call (call channel is a placeholder
--                for now — see the 'call' provider added below and
--                supabase/functions/trigger-sms/index.ts).
create type user_plan as enum ('free', 'premium', 'premium_pro');

alter table users add column if not exists plan user_plan not null default 'free';

-- Extend message_provider so a (currently dummy) Premium Pro call alert can be logged
-- the same way SMS/WhatsApp attempts already are.
alter type message_provider add value if not exists 'call';

-- Admin-only plan change, mirroring the SECURITY DEFINER pattern 0004 uses for
-- create_incident/resolve_incident: runs with elevated privilege internally so no
-- broad UPDATE grant on `users` is needed, and checks the caller's email against the
-- same admin account the website already gates /admin on.
-- IMPORTANT: keep this email in sync with NEXT_PUBLIC_ADMIN_EMAIL in the website's env.
create function public.admin_set_user_plan(p_user_id uuid, p_plan user_plan)
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

comment on function public.admin_set_user_plan(uuid, user_plan) is
  'Admin-only: changes a user''s subscription plan. Called from the website admin page.
   No self-serve payment flow exists yet for Premium/Premium Pro.';

grant execute on function public.admin_set_user_plan(uuid, user_plan) to authenticated;

-- users_select_own RLS only lets a user read their own row, so the admin page needs a
-- dedicated read path to list every user (rather than loosening that policy).
create function public.admin_list_users()
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

comment on function public.admin_list_users() is
  'Admin-only: lists all users with their plan for the website admin page.';

grant execute on function public.admin_list_users() to authenticated;
