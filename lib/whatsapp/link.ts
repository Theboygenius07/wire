// The public "message Flow on WhatsApp" link (app/flow/page.tsx) — a wa.me
// deep link, since that's the one thing that works with zero setup on the
// visitor's end. While TWILIO_WHATSAPP_NUMBER is still Twilio's shared
// Sandbox number, the Sandbox won't route anyone's messages to our webhook
// until they've first sent "join <code>" — so the link prefills that
// instead of a real request. See TWILIO_WHATSAPP_SANDBOX_CODE in .env.example.

export type WhatsAppLink = { href: string; isSandbox: boolean };

export function getWhatsAppLink(): WhatsAppLink | null {
  const number = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!number) return null;

  const digits = number.replace(/^whatsapp:/, "").replace(/[^\d]/g, "");
  const sandboxCode = process.env.TWILIO_WHATSAPP_SANDBOX_CODE;
  const text = sandboxCode ? `join ${sandboxCode}` : undefined;

  return {
    href: `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`,
    isSandbox: Boolean(sandboxCode),
  };
}
