-- Owner self-service: Supabase Auth signup creates the matching public.users row automatically,
-- owners can edit their own profile, and incidents stream to the owner's dashboard in real time
-- (the SMS/WhatsApp channel from 0001/0002 is dormant for now — see supabase/functions/trigger-sms).

-- phone_number is no longer known at signup time (owners add it later from the dashboard).
alter table users alter column phone_number drop not null;

-- Auto-provision a public.users row whenever someone signs up via Supabase Auth.
-- security definer: runs as the function owner, bypassing RLS, since this must succeed
-- regardless of the (not-yet-existing) new user's own row-level permissions.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_user_id, name, phone_number)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'phone_number'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Owners may edit their own profile (name / phone_number only — auth_user_id is immutable).
create policy "users_update_own" on users
  for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

grant update (name, phone_number) on users to authenticated;

-- Stream incident inserts/updates to owners' dashboards. Realtime enforces the existing RLS
-- select policies (incidents_select_owner), so an owner only ever receives rows for their own
-- stickers even though this replication is table-wide.
alter publication supabase_realtime add table incidents;
