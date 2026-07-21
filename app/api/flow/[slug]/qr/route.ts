import QRCode from "qrcode";
import { getFlow } from "@/lib/store/flow";

// Twilio's WhatsApp API takes a mediaUrl it fetches itself, not uploaded
// bytes (unlike Meta's Graph API) — this serves the same checkout-page QR
// app/checkout/[slug]/page.tsx renders inline, as a standalone PNG the
// WhatsApp webhook (app/api/webhook/whatsapp) can hand Twilio a public URL
// for.

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = await getFlow(slug);
  if (!record) return new Response("Not found", { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const buffer = await QRCode.toBuffer(`${appUrl}/checkout/${slug}`, {
    margin: 1,
    color: { dark: "#0b0b0c", light: "#ffffff" },
  });

  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
  });
}
