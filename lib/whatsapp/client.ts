import twilio from "twilio";

// Twilio sits as a layer on top of Meta's WhatsApp Business Platform —
// chosen over calling Meta's Graph API directly because Twilio's sandbox
// lets you message a shared number immediately (send "join <code>") without
// waiting on Meta Business verification. Trade-off: an extra per-message
// Twilio markup on top of Meta's own fees, and Twilio's own webhook shape
// (form-encoded, X-Twilio-Signature) instead of Meta's raw JSON + HMAC.

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// Sandbox default; e.g. "whatsapp:+14155238886". Must include the
// "whatsapp:" prefix — this is a distinct sender identity from Twilio's SMS
// numbers even if the underlying number looks the same.
const FROM_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!ACCOUNT_SID || !AUTH_TOKEN) throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not set");
  client ??= twilio(ACCOUNT_SID, AUTH_TOKEN);
  return client;
}

function toWhatsAppAddress(phone: string): string {
  return phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
}

/** Strips the "whatsapp:" prefix Twilio puts on every From/To address, back
 * to a bare phone number — the identity key used elsewhere (sellerId,
 * lib/store/whatsapp.ts). */
export function stripWhatsAppPrefix(address: string): string {
  return address.replace(/^whatsapp:/, "");
}

export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  if (!FROM_NUMBER) throw new Error("TWILIO_WHATSAPP_NUMBER is not set");
  await getClient().messages.create({ from: FROM_NUMBER, to: toWhatsAppAddress(to), body });
}

/** mediaUrl must be a publicly reachable URL — Twilio fetches it itself
 * rather than accepting uploaded bytes, unlike Meta's Graph API. */
export async function sendWhatsAppImage(to: string, mediaUrl: string, caption?: string): Promise<void> {
  if (!FROM_NUMBER) throw new Error("TWILIO_WHATSAPP_NUMBER is not set");
  await getClient().messages.create({
    from: FROM_NUMBER,
    to: toWhatsAppAddress(to),
    body: caption,
    mediaUrl: [mediaUrl],
  });
}

/** Verifies X-Twilio-Signature (HMAC-SHA1 over the exact webhook URL plus
 * sorted POST params, keyed with the Auth Token) — Twilio's equivalent of
 * the Monnify webhook's raw-body HMAC check, just computed over the parsed
 * form fields instead of raw bytes since Twilio don't sign the raw body. */
export function isValidTwilioSignature(url: string, params: Record<string, string>, signature: string | null): boolean {
  if (!signature || !AUTH_TOKEN) return false;
  return twilio.validateRequest(AUTH_TOKEN, signature, url, params);
}
