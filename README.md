# imblocked.in

A Qarlo-style "reunite the finder with the owner" product, focused specifically on parking:
owners create an account, register vehicles, and get a QR sticker per vehicle. Anyone who's
blocked scans the sticker and taps "Notify Owner" — the incident shows up live on the owner's
dashboard. They mark it resolved once they've moved. SMS/WhatsApp push notifications are built
but **dormant** (see below) — pending a DLT-registered Mtalkz sender id / a permanent WhatsApp
token — so for now the owner has to be watching the dashboard.

Static Next.js frontend, Supabase (Postgres + Auth + Realtime + Edge Functions) backend.

## Architecture

```
Anonymous finder                    Supabase
┌─────────────────────┐            ┌──────────────────────────────────────┐
│ /scan/[sticker_id]   │  select    │ stickers (public read via RLS)       │
│  - fetch sticker     │───────────▶│                                      │
│  - "Notify Owner"    │  rpc()     │ create_incident() — SECURITY DEFINER │
│                      │───────────▶│  inserts incidents (pending),        │
│                      │            │  returns the new id                  │
│  - "Was it resolved?"│  rpc()     │ resolve_incident() — SECURITY DEFINER│
│                      │───────────▶│  marks status = resolved             │
└─────────────────────┘            └──────────────────────────────────────┘
                                              │ Realtime (RLS-scoped)
                                              ▼
Owner (authenticated)                ┌──────────────────────────────────────┐
┌─────────────────────┐              │ incidents stream to the owner's own  │
│ /dashboard           │◀─────────────  sticker rows only (postgres_changes)│
│  - profile           │              └──────────────────────────────────────┘
│  - vehicles + QR     │  insert/update (owner-scoped RLS)
│  - live incidents    │─────────────▶ stickers, users
└─────────────────────┘
```

`supabase/functions/trigger-sms` (Edge Function, Mtalkz + WhatsApp provider adapters) is fully
built and deployed, but nothing currently calls it — `create_incident()` is what the scan page
uses today. Re-wiring the scan page to invoke the function again (once a notification channel is
actually usable) is a small, contained change.

## Step-by-step setup

1. **Provision Supabase project** — create it via dashboard or `supabase projects create`, then
   `supabase login` and `supabase link --project-ref <ref>`.
2. **Apply migrations**: `supabase db push` (runs `supabase/migrations/*.sql` in order). If you
   change `db/schema.ts` (Drizzle) instead, run `npm run db:generate` first to produce SQL, then
   push.
3. **Auth**: Email/password auth is on by default in every Supabase project — nothing to enable.
   A trigger (`handle_new_user`, in `0003_owner_auth.sql`) auto-creates the matching `public.users`
   row on signup, seeded from the `name` passed in `signUp({ options: { data: { name } } })`.
4. **Configure the frontend env** — copy `.env.example` to `.env.local`, fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
5. **Run locally**: `npm install && npm run dev`, visit `http://localhost:3000`, sign up, add a
   vehicle, and use the QR code / scan URL it generates.
   - Note: `next dev` does **not** apply the `/scan/:id` hosting rewrite (see below) — the exact
     dynamic sticker URL only resolves correctly against a real static export. For that, build
     (`npm run build`) and serve `out/` with `node scripts/static-server.mjs`, which reproduces
     the rewrite locally.
6. **Build + deploy**: `npm run build` outputs to `out/`. On Vercel, the included `vercel.json`
   rewrite makes every `/scan/:id` request serve the single prebuilt `/scan/_/index.html` (see the
   comment in `app/scan/[sticker_id]/page.tsx` for why `output: 'export'` needs this trick at all).
   On Netlify/Cloudflare Pages, add the equivalent catch-all redirect
   (`/scan/*  /scan/_/index.html  200`) instead of `vercel.json`.

## Re-enabling SMS/WhatsApp later

- **Mtalkz** (`supabase/functions/trigger-sms/mtalkz.ts`) needs a DLT-registered sender id — a
  TRAI regulatory requirement for India, independent of which provider you use. Registering as a
  proprietorship (GST/Udyam) is generally lighter-weight than incorporating a company; confirm
  exact accepted documents with Mtalkz support.
- **WhatsApp** (`supabase/functions/trigger-sms/whatsapp.ts`) needs a Meta app + a permanent
  System User access token (the quick-start temporary token expires in ~24h) and your own
  approved message template (the default `hello_world` template only proves connectivity — it's
  static and ignores the message body).
- Once either is ready: set the relevant secrets (`supabase secrets set ...`), redeploy
  (`supabase functions deploy trigger-sms`), set `NOTIFY_PROVIDER` if you want `mtalkz` instead of
  the `whatsapp` default, and change the scan page's `handleNotify` in
  `app/scan/[sticker_id]/ScanClient.tsx` to call `supabase.functions.invoke('trigger-sms', ...)`
  instead of `supabase.rpc('create_incident', ...)`.

## Security notes worth knowing

- The anon key is safe to ship in the JS bundle — it grants nothing by itself. All access control
  is RLS policies + grants across `supabase/migrations/*.sql`.
- Incident creation/resolution go through `create_incident()` / `resolve_incident()` — SECURITY
  DEFINER functions (`0004_incident_rpc.sql`), not direct table access. This was a deliberate fix:
  an earlier direct-insert design broke because RLS policies elsewhere reference the `users`
  table, and Postgres demands baseline table privilege on anything a policy references even to
  evaluate it to `false` — anon has none on `users`. Routing through RPCs sidesteps that entirely
  and means anon needs no table-level grants on `incidents` or `users` at all.
- Possessing an incident's UUID (handed back only to whoever created it, or visible to the owner
  on their dashboard) is what authorizes marking it resolved — not a login.
- `messages` (the dormant SMS/WhatsApp log) has no anon/authenticated grants at all — only the
  service role (used exclusively inside the Edge Function) can read or write it.
- Realtime respects RLS: the owner dashboard subscribes table-wide to `incidents`, but only ever
  receives events for rows its own `incidents_select_owner` policy would allow it to `SELECT`.

## Android app (future)

Not built yet, by design — noted here so today's choices don't box it out later. The RPC
functions and RLS-protected tables are already a generic API, so the Android app can call
Supabase directly via `supabase-kt`, using the same anon key + RLS/RPC model as the web frontend.
