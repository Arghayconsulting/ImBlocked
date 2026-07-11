// WhatsApp Cloud API (Meta) provider adapter — same sendX(to, body) shape as mtalkz.ts so the two
// are interchangeable behind the dispatcher in index.ts.
//
// Important constraint: our notifications are "business-initiated" (the vehicle owner has never
// messaged our WhatsApp number first), so Meta requires a pre-approved message TEMPLATE — a
// free-form text message would be rejected outside a 24-hour customer-service session window.
//
// Every new Meta WhatsApp test setup ships with a default "hello_world" template that's already
// approved, so WHATSAPP_TEMPLATE_NAME defaults to it — good enough to prove delivery end-to-end
// immediately, but it's a fixed static message and ignores `body`. Once you've created and gotten
// your own utility template approved (a single body variable, e.g. "{{1}}"), set
// WHATSAPP_TEMPLATE_NAME to its name and `body` will be sent as that template's one parameter.

const GRAPH_VERSION = 'v19.0';

export interface WhatsappSendResult {
  ok: boolean;
  raw: unknown;
  error?: string;
}

export async function sendWhatsapp(to: string, body: string): Promise<WhatsappSendResult> {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  const templateName = Deno.env.get('WHATSAPP_TEMPLATE_NAME') ?? 'hello_world';
  const templateLang = Deno.env.get('WHATSAPP_TEMPLATE_LANG') ?? 'en_US';

  if (!accessToken || !phoneNumberId) {
    return {
      ok: false,
      raw: null,
      error: 'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured',
    };
  }

  const toMsisdn = to.replace(/^\+/, '');
  const isDefaultSampleTemplate = templateName === 'hello_world';

  const template: Record<string, unknown> = {
    name: templateName,
    language: { code: templateLang },
  };
  if (!isDefaultSampleTemplate) {
    template.components = [{ type: 'body', parameters: [{ type: 'text', text: body }] }];
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toMsisdn,
          type: 'template',
          template,
        }),
      },
    );

    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      return { ok: false, raw, error: `WhatsApp API responded with HTTP ${response.status}` };
    }

    return { ok: true, raw };
  } catch (err) {
    return { ok: false, raw: null, error: err instanceof Error ? err.message : String(err) };
  }
}
