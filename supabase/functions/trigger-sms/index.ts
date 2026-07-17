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

  // ── 2. Fetch owner (including expo_push_token and plan) ───────────────────
  const { data: owner, error: ownerError } = await admin
    .from('users')
    .select('id, phone_number, expo_push_token, plan')
    .eq('id', sticker.owner_user_id)
    .maybeSingle();

  if (ownerError || !owner) return json({ error: 'Failed to look up sticker owner' }, 500);

  const plan = owner.plan ?? 'free';

  // ── 3. Rate-limit ──────────────────────────────────────────────────────────
  // Per-sticker alert throttle — the same pattern paging/alerting systems use to
  // rate-limit repeat notifications for an ongoing condition (e.g. PagerDuty/
  // Alertmanager's repeat_interval): a minimum gap between alerts plus a rolling
  // cap, applied UNIFORMLY regardless of whether the prior incident was resolved.
  // Deliberately not bypassed by resolution — otherwise a resolve-then-rescan loop
  // could blow through the cap and rack up SMS/WhatsApp cost, which is exactly what
  // this exists to prevent. A still-blocking vehicle still gets periodic reminder
  // alerts (not silence) once the cooldown passes, instead of alerting only once.
  const ALERT_WINDOW_HOURS = 24;
  const MAX_ALERTS_PER_WINDOW = 5;
  const MIN_GAP_MINUTES = 15;
  const windowStart = new Date(Date.now() - ALERT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const { data: lastAlerted } = await admin
    .from('incidents')
    .select('id, status, created_at')
    .eq('sticker_id', sticker.id)
    .eq('alert_attempted', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: recentAlertCount } = await admin
    .from('incidents')
    .select('id', { count: 'exact', head: true })
    .eq('sticker_id', sticker.id)
    .eq('alert_attempted', true)
    .gte('created_at', windowStart);

  const cooldownOk = !lastAlerted
    || (Date.now() - new Date(lastAlerted.created_at).getTime()) >= MIN_GAP_MINUTES * 60 * 1000;
  const withinCap = (recentAlertCount ?? 0) < MAX_ALERTS_PER_WINDOW;
  const canAlert = withinCap && cooldownOk;
  const stillOpen = !!lastAlerted && lastAlerted.status !== 'resolved' && lastAlerted.status !== 'cancelled';

  // ── 4. Create incident (always logged, even when the alert itself is suppressed) ──
  const { data: incident, error: incidentError } = await admin
    .from('incidents')
    .insert({ sticker_id: sticker.id, status: 'pending', alert_attempted: canAlert })
    .select('id')
    .single();

  if (incidentError || !incident) {
    return json({ error: 'Failed to create incident', details: incidentError?.message }, 500);
  }

  if (!canAlert) {
    return json({
      incident_id: incident.id,
      status: 'pending',
      rate_limited: true,
      duplicate: stillOpen,
      message: stillOpen
        ? 'The owner has already been notified about this vehicle. Please wait a few minutes before alerting again.'
        : (withinCap
            ? `Please wait at least ${MIN_GAP_MINUTES} minutes between alerts for the same vehicle.`
            : 'Alert limit reached for this vehicle in the last 24 hours. Please try again later.'),
    }, 200);
  }

  const vehicleLabel = sticker.vehicle_hint ?? 'your vehicle';

  // ── 5a. Expo Push (primary — instant, with sound) ─────────────────────────
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

  // ── 5b. SMS / WhatsApp — Premium and Premium Pro only ─────────────────────
  const messageBody =
    `imblocked.in: Someone is blocked by ${vehicleLabel}. Open the app or move now.`;
  const canSmsWhatsapp = plan === 'premium' || plan === 'premium_pro';

  let smsSent = false;
  if (canSmsWhatsapp) {
    const { provider, result: sendResult } = await notifyOwnerPhone(owner.phone_number, messageBody);
    smsSent = sendResult.ok;

    // ── 6a. Log the phone notification attempt ────────────────────────────
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
  }

  // ── 6b. Phone call — Premium Pro only ──────────────────────────────────────
  // Placeholder: no voice-call provider is wired up yet, this only logs the intent
  // to call so the channel is visible on the dashboard. Replace with a real call
  // (e.g. Twilio/Exotel voice) later — see message_provider's 'call' value.
  let callQueued = false;
  if (plan === 'premium_pro' && owner.phone_number) {
    const { error: callLogErr } = await admin.from('messages').insert({
      incident_id: incident.id,
      provider: 'call',
      to_number: owner.phone_number,
      body: messageBody,
      status: 'queued',
      provider_response: { note: 'Placeholder — automated call alerts are not implemented yet.' },
    });
    callQueued = !callLogErr;
    if (callLogErr) console.error('Failed to log call placeholder row:', callLogErr.message);
  }

  // ── 7. Update incident status ─────────────────────────────────────────────
  // Mark notified if push or SMS/WA worked, OR if owner has no working channel.
  // "No working channel" = no push token AND (no phone OR no provider configured).
  // This prevents "failed" when owner has a phone number saved but no WA/SMS creds set up.
  // Incident is always visible on the dashboard.
  // Only mark 'failed' if Expo push was attempted and failed (i.e. token exists but push failed).
  // SMS/WA failure alone never blocks — owner sees it on dashboard regardless.
  const newStatus = (pushSent || !owner.expo_push_token) ? 'notified' : 'failed';
  const { error: updateErr } = await admin
    .from('incidents')
    .update({ status: newStatus })
    .eq('id', incident.id);
  if (updateErr) console.error('Failed to update incident status:', updateErr.message);

  return json({
    incident_id: incident.id,
    status: newStatus,
    plan,
    push_sent: pushSent,
    sms_sent: smsSent,
    call_queued: callQueued,
  }, 200);
});
