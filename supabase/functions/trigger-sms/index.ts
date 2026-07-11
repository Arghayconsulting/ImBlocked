// Edge Function: trigger-sms
// Invoked by the client (anon key) via supabase.functions.invoke('trigger-sms', { body: { sticker_id } }).
// Runs with the service role internally so it can read owner contact info and write logs that
// are otherwise locked down by RLS — the anon caller never sees the owner's phone number or
// the SUPABASE_SERVICE_ROLE_KEY itself.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { sendSms } from './mtalkz.ts';
import { sendWhatsapp } from './whatsapp.ts';

type NotifyProvider = 'whatsapp' | 'mtalkz';

// ── Expo Push Notification ────────────────────────────────────────────────────
async function sendExpoPush(
  expoPushToken: string,
  vehicleHint: string | null,
  incidentId: string,
) {
  if (!expoPushToken?.startsWith('ExponentPushToken')) return { ok: false, error: 'Invalid token' };

  const label = vehicleHint ?? 'your vehicle';
  const payload = {
    to: expoPushToken,
    channelId: 'incidents_v2',           // Android: uses our MAX-importance channel with sound
    sound: 'default',                  // iOS + Android fallback
    priority: 'high',
    title: '🚨 Someone is blocked by your car!',
    body: `Your ${label} is blocking someone. Tap to move it now.`,
    data: { incident_id: incidentId, type: 'incident' },
    ttl: 300,                          // 5 min TTL — stale alerts are useless
  };

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const raw = await res.json();
    const ok = raw?.data?.status === 'ok';
    return { ok, raw, error: ok ? undefined : raw?.data?.message };
  } catch (e: any) {
    return { ok: false, raw: null, error: e?.message };
  }
}


// ── SMS / WhatsApp ────────────────────────────────────────────────────────────
async function notifyOwnerPhone(to: string | null, body: string) {
  if (!to) return { provider: 'none' as const, result: { ok: false, error: 'No phone number' } };
  const provider = (Deno.env.get('NOTIFY_PROVIDER') as NotifyProvider) || 'whatsapp';
  const result = provider === 'mtalkz' ? await sendSms(to, body) : await sendWhatsapp(to, body);
  return { provider, result };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let stickerId: string | undefined;
  try {
    const body = await req.json();
    stickerId = body?.sticker_id;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!stickerId) return json({ error: 'sticker_id is required' }, 400);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // ── 1. Fetch sticker ──────────────────────────────────────────────────────
  const { data: sticker, error: stickerError } = await admin
    .from('stickers')
    .select('id, status, vehicle_hint, owner_user_id')
    .eq('id', stickerId)
    .maybeSingle();

  if (stickerError) return json({ error: 'Failed to look up sticker', details: stickerError.message }, 500);
  if (!sticker || sticker.status !== 'active') return json({ error: 'Sticker not found or inactive' }, 404);

  // ── 2. Fetch owner (including expo_push_token) ────────────────────────────
  const { data: owner, error: ownerError } = await admin
    .from('users')
    .select('id, phone_number, expo_push_token')
    .eq('id', sticker.owner_user_id)
    .maybeSingle();

  if (ownerError || !owner) return json({ error: 'Failed to look up sticker owner' }, 500);

  // ── 3. Create incident ────────────────────────────────────────────────────
  const { data: incident, error: incidentError } = await admin
    .from('incidents')
    .insert({ sticker_id: sticker.id, status: 'pending' })
    .select('id')
    .single();

  if (incidentError || !incident) {
    return json({ error: 'Failed to create incident', details: incidentError?.message }, 500);
  }

  const vehicleLabel = sticker.vehicle_hint ?? 'your vehicle';

  // ── 4a. Expo Push (primary — instant, with sound) ─────────────────────────
  let pushSent = false;
  if (owner.expo_push_token) {
    const pushResult = await sendExpoPush(
      owner.expo_push_token,
      sticker.vehicle_hint,
      incident.id,
    );
    pushSent = pushResult.ok;
    console.log('Expo push result:', JSON.stringify(pushResult));
  }

  // ── 4b. SMS / WhatsApp fallback ───────────────────────────────────────────
  const messageBody =
    `imblocked.in: Someone is blocked by ${vehicleLabel}. Open the app or move now.`;

  const { provider, result: sendResult } = await notifyOwnerPhone(owner.phone_number, messageBody);

  // ── 5. Log the phone notification attempt ─────────────────────────────────
  if (owner.phone_number && provider !== 'none') {
    const { error: logErr } = await admin.from('messages').insert({
      incident_id: incident.id,
      provider,
      to_number: owner.phone_number,
      body: messageBody,
      status: sendResult.ok ? 'sent' : 'failed',
      provider_response: sendResult.raw ?? { error: sendResult.error },
    });
    if (logErr) console.error('Failed to log message row:', logErr.message);
  }

  // ── 6. Update incident status ─────────────────────────────────────────────
  // Mark notified if push or SMS/WA worked, OR if owner has no working channel.
  // "No working channel" = no push token AND (no phone OR no provider configured).
  // This prevents "failed" when owner has a phone number saved but no WA/SMS creds set up.
  const providerConfigured =
    !!Deno.env.get('WHATSAPP_ACCESS_TOKEN') || !!Deno.env.get('MTALKZ_API_KEY');
  const hasNoWorkingChannel =
    !owner.expo_push_token && (!owner.phone_number || !providerConfigured);
  const newStatus = (pushSent || sendResult.ok || hasNoWorkingChannel) ? 'notified' : 'failed';
  const { error: updateErr } = await admin
    .from('incidents')
    .update({ status: newStatus })
    .eq('id', incident.id);
  if (updateErr) console.error('Failed to update incident status:', updateErr.message);

  return json({
    incident_id: incident.id,
    status: newStatus,
    push_sent: pushSent,
    sms_sent: sendResult.ok,
  }, 200);
});
