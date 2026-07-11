-- imblocked.in — initial schema
-- Mirrors db/schema.ts (Drizzle). Hand-authored so RLS/grants can be reviewed alongside DDL;
-- regenerate the table/enum portions with `npm run db:generate` if the Drizzle schema changes.

create extension if not exists "pgcrypto";

-- ============ Enums ============

create type sticker_status as enum ('active', 'inactive');
create type incident_status as enum ('pending', 'notified', 'failed', 'resolved', 'cancelled');
create type message_status as enum ('queued', 'sent', 'failed');
create type message_provider as enum ('mtalkz');

-- ============ Tables ============

-- Sticker owners.
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users (id) on delete set null,
  name text,
  phone_number text not null,
  created_at timestamptz not null default now()
);

-- One row per physical/printed sticker (QR code -> /scan/[sticker_id]).
create table stickers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users (id) on delete cascade,
  vehicle_hint text,
  status sticker_status not null default 'active',
  created_at timestamptz not null default now()
);
create index stickers_owner_user_id_idx on stickers (owner_user_id);

-- One row per scan-and-notify event.
create table incidents (
  id uuid primary key default gen_random_uuid(),
  sticker_id uuid not null references stickers (id) on delete cascade,
  status incident_status not null default 'pending',
  reporter_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index incidents_sticker_id_idx on incidents (sticker_id);

-- Append-only SMS attempt log, written only by the trigger-sms edge function (service role).
create table messages (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents (id) on delete cascade,
  provider message_provider not null default 'mtalkz',
  to_number text not null,
  body text not null,
  status message_status not null default 'queued',
  provider_response jsonb,
  created_at timestamptz not null default now()
);
create index messages_incident_id_idx on messages (incident_id);

-- ============ Row Level Security ============

alter table users enable row level security;
alter table stickers enable row level security;
alter table incidents enable row level security;
alter table messages enable row level security;

-- users: an owner may read their own profile once authenticated. No public access.
create policy "users_select_own" on users
  for select
  using (auth_user_id = auth.uid());

-- stickers: publicly readable so the anonymous /scan/[sticker_id] page can look up a sticker.
-- This is safe because contact info lives in `users`, not here — RLS is row-level, so a public
-- select policy on `stickers` never exposes phone numbers.
create policy "stickers_select_public" on stickers
  for select
  using (true);

-- stickers: an authenticated owner may manage their own stickers (redundant with the public
-- select above for reads, but grants insert/update/delete scoped to their own rows).
create policy "stickers_owner_manage" on stickers
  for all
  using (owner_user_id in (select id from users where auth_user_id = auth.uid()))
  with check (owner_user_id in (select id from users where auth_user_id = auth.uid()));

-- incidents: anyone may create an incident — this is what an anonymous scan does before the
-- edge function sends the SMS (the edge function itself uses the service role and bypasses RLS
-- entirely, but the client-side insert path stays available for future direct-insert flows).
create policy "incidents_insert_public" on incidents
  for insert
  with check (true);

-- incidents: the reporter (anonymous) may update status/resolved_at on the "Was this resolved?"
-- prompt. The incident's uuid — handed back only to the reporter by trigger-sms and unguessable
-- — is the capability that scopes this to "the incident you just created". Column-level grants
-- below further restrict *which* columns anon can touch, since RLS alone is row- not column-scoped.
create policy "incidents_update_status_public" on incidents
  for update
  using (true)
  with check (true);

-- incidents: an authenticated owner may read incidents raised against their own stickers.
create policy "incidents_select_owner" on incidents
  for select
  using (
    sticker_id in (
      select s.id
      from stickers s
      join users u on u.id = s.owner_user_id
      where u.auth_user_id = auth.uid()
    )
  );

-- messages: intentionally no policies for anon/authenticated. RLS defaults to deny, and only
-- the service role (which bypasses RLS) reads/writes this table from the edge function.

-- ============ Column-level grants ============
-- RLS controls *which rows*; grants here control *which columns*, since Postgres privileges
-- are separate from RLS policies.

revoke all on users from anon, authenticated;
grant select on users to authenticated;

revoke all on stickers from anon, authenticated;
grant select on stickers to anon, authenticated;
grant insert, update, delete on stickers to authenticated;

revoke all on incidents from anon, authenticated;
grant insert on incidents to anon, authenticated;
grant select on incidents to authenticated;
grant update (status, resolved_at) on incidents to anon, authenticated;

revoke all on messages from anon, authenticated;
-- no grants for messages: fully inaccessible outside the service role.
