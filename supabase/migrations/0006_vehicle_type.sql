-- Add vehicle type classification for stickers.
-- Both clients (web dashboard + mobile app) now require plate + type before allowing
-- the insert, but the column stays nullable here so existing rows created before this
-- migration remain valid without a backfill.

create type vehicle_type as enum ('car', 'bike', 'scooter', 'auto', 'bus', 'truck', 'other');

alter table stickers add column if not exists vehicle_type vehicle_type;
