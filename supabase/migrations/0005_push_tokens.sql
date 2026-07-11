-- Add Expo Push Token storage for mobile app notifications.
-- The token is written by the app on login (lib/notifications.ts → registerForPushNotifications)
-- and read by the trigger-sms edge function to send push alerts via Expo's Push API.

alter table users add column if not exists expo_push_token text;

-- Only the authenticated owner may read/write their own token.
-- No grant needed for anon — the column is on the `users` table which anon cannot touch.
-- The service role (edge function) can read it without RLS.
grant update (expo_push_token) on users to authenticated;

comment on column users.expo_push_token is
  'Expo push notification token registered by the mobile app. Written by the owner client
   via updateProfile(); read by the trigger-sms edge function to send push alerts.';
