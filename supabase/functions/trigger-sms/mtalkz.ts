// Isolated Mtalkz provider adapter. Nothing outside this file knows about Mtalkz's request/response
// shape — swapping providers later means writing a new file with this same sendSms() signature
// and changing one import in index.ts.
//
// Request shape confirmed against https://developers.mtalkz.com/sms: the API key goes in an
// `apikey` header (not Authorization: Bearer), and the body uses `sender`/`to`/`text`/`type`
// rather than a generic `message` field. `to` must be a bare MSISDN (country code + number,
// no leading `+`), while numbers are stored in the DB in +E.164 form — hence the strip below.

const MTALKZ_ENDPOINT = 'https://api.mtalkz.com/v1/sms';

export interface MtalkzSendResult {
  ok: boolean;
  raw: unknown;
  error?: string;
}

export async function sendSms(to: string, body: string): Promise<MtalkzSendResult> {
  const apiKey = Deno.env.get('MTALKZ_API_KEY');
  const senderId = Deno.env.get('MTALKZ_SENDER_ID') ?? 'IMBLKD';

  if (!apiKey) {
    return { ok: false, raw: null, error: 'MTALKZ_API_KEY is not configured' };
  }

  const toMsisdn = to.replace(/^\+/, '');

  try {
    const response = await fetch(MTALKZ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify({
        sender: senderId,
        to: toMsisdn,
        text: body,
        type: 'TRANS',
      }),
    });

    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      return { ok: false, raw, error: `Mtalkz responded with HTTP ${response.status}` };
    }

    return { ok: true, raw };
  } catch (err) {
    return { ok: false, raw: null, error: err instanceof Error ? err.message : String(err) };
  }
}
