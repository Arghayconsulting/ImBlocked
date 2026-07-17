-- Rate-limit alert notifications per sticker to prevent spam from repeated scans.
-- Enforced in supabase/functions/trigger-sms/index.ts:
--   - No new alert while the sticker's most recently alerted incident is still
--     unresolved (owner has already been notified about this ongoing block).
--   - Otherwise, at most 5 alert attempts per sticker in a rolling 24h window.
--   - Consecutive alerts for the same sticker must be at least 15 minutes apart.
-- `alert_attempted` distinguishes a real notification attempt from a scan that was
-- logged but had its alert suppressed by the above rules. Defaults to true so all
-- pre-existing incidents (created before this migration) are treated as real alerts.

alter table incidents add column if not exists alert_attempted boolean not null default true;

create index if not exists incidents_sticker_created_idx on incidents (sticker_id, created_at desc);
