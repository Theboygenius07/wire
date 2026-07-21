import { getUserByEmail } from "@/lib/auth/users";
import { claimFlowsBySeller, getFlowsBySeller } from "@/lib/store/flow";
import { touchWhatsAppLink, linkWhatsAppToUser, markMessageProcessed } from "@/lib/store/whatsapp";
import { sendWhatsAppText, sendWhatsAppImage, isValidTwilioSignature, stripWhatsAppPrefix } from "@/lib/whatsapp/client";
import { runWhatsAppAgent } from "@/lib/whatsapp/agent";

// New front door onto the same Flow engine app/api/flow/route.ts exposes —
// message a WhatsApp number (via Twilio), get a payment page back, same as
// typing into the web box. Twilio POSTs form-encoded params and signs with
// X-Twilio-Signature (HMAC-SHA1 over the exact webhook URL + sorted params),
// unlike Meta's raw-JSON-body HMAC the Monnify webhook mirrors — no GET
// verification handshake either, Twilio's webhook config is just a URL.

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Behind Vercel's proxy, request.url reports the internal scheme/host, not
 * the public one Twilio actually posted to and signed against — reconstruct
 * from the forwarded headers so signature validation lines up with what's
 * configured in the Twilio console. */
function publicRequestUrl(request: Request): string {
  const parsed = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? parsed.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? parsed.host;
  return `${proto}://${host}${parsed.pathname}${parsed.search}`;
}

const LINK_COMMAND = /link\b.*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;

export async function POST(request: Request) {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of formData.entries()) params[k] = String(v);

  if (!isValidTwilioSignature(publicRequestUrl(request), params, request.headers.get("x-twilio-signature"))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const messageSid = params.MessageSid;
  const from = params.From; // "whatsapp:+234..."
  const body = params.Body?.trim();

  // Non-text or malformed deliveries (status callbacks land on a separate
  // Twilio-configured URL, not this one, but stay defensive) are ack'd with
  // 200 and otherwise ignored.
  if (!messageSid || !from || !body) {
    return new Response(null, { status: 200 });
  }

  const isNewMessage = await markMessageProcessed(messageSid);
  if (!isNewMessage) {
    return new Response(null, { status: 200 });
  }

  const phone = stripWhatsAppPrefix(from);

  try {
    const linkMatch = body.match(LINK_COMMAND);
    if (linkMatch) {
      await handleLinkCommand(phone, linkMatch[1]);
      return new Response(null, { status: 200 });
    }

    await touchWhatsAppLink(phone);
    const flows = await getFlowsBySeller(phone);
    const result = await runWhatsAppAgent(body, flows, phone);

    await sendWhatsAppText(phone, result.reply);

    if (result.createdSlug) {
      await sendWhatsAppImage(phone, `${APP_URL}/api/flow/${result.createdSlug}/qr`, "Scan to pay");
    }
  } catch (err) {
    // Best-effort: a failure here shouldn't turn into a non-2xx response —
    // markMessageProcessed already means Twilio won't be told to retry, so a
    // non-2xx here would just be a silent drop either way, with no reply.
    console.error("WhatsApp message handling failed:", err);
  }

  return new Response(null, { status: 200 });
}

async function handleLinkCommand(phone: string, email: string): Promise<void> {
  // No password check here — same no-verification trust model the existing
  // sellerId cookie already uses (see lib/store/seller.ts): whoever texts
  // from this number and knows the email gets it linked. Fine for an
  // account-free MVP; revisit before this ever guards anything sensitive.
  const user = await getUserByEmail(email);
  if (!user) {
    await sendWhatsAppText(phone, `I couldn't find a Wire account for ${email} — check the address, or sign up on the web first.`);
    return;
  }
  await linkWhatsAppToUser(phone, user.id);
  await claimFlowsBySeller(phone, user.id);
  await sendWhatsAppText(phone, `Linked! This number is now tied to ${email} — any Flow pages you've made here are on your dashboard now.`);
}
