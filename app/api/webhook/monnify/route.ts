import crypto from "crypto";
import { recordSale, saveConnectedAction } from "@/lib/store/flowpay";
import { getSeller } from "@/lib/store/seller";
import { getGateway, compileSpec } from "@/lib/gateway";
import { runSellerAction } from "@/lib/openai/sellerAction";

// Receives Monnify's payment-succeeded notifications and updates the
// FlowPay dashboard. Verified against developers.monnify.com as of
// 2026-07-21: the "monnify-signature" header is HMAC-SHA512 over the raw
// request body, keyed with the merchant's secret key — not a separate
// webhook-specific secret, despite the name MONNIFY_WEBHOOK_SECRET (kept as
// an optional override; falls back to MONNIFY_SECRET_KEY, which is what
// Monnify actually signs with).

export const runtime = "nodejs";

const SECRET = process.env.MONNIFY_WEBHOOK_SECRET || process.env.MONNIFY_SECRET_KEY;

function isValidSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !SECRET) return false;
  const expected = crypto.createHmac("sha512", SECRET).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const givenBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== givenBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, givenBuf);
}

type SuccessfulTransactionPayload = {
  eventType?: string;
  eventData?: {
    product?: { reference?: string };
    transactionReference?: string;
    amountPaid?: number;
    paymentStatus?: string;
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!isValidSignature(rawBody, request.headers.get("monnify-signature"))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: SuccessfulTransactionPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Ack every event type with 200 (Monnify retries on non-2xx) — we only
  // act on the one that means "money landed."
  if (payload.eventType !== "SUCCESSFUL_TRANSACTION") {
    return Response.json({ received: true });
  }

  const { product, transactionReference, amountPaid, paymentStatus } = payload.eventData ?? {};
  const reference = product?.reference;

  if (paymentStatus !== "PAID" || !reference || !transactionReference || typeof amountPaid !== "number") {
    return Response.json({ received: true });
  }

  // `reference` is whatever we passed as accountReference/invoiceReference
  // when creating the sale (app/api/flowpay/route.ts uses the same value —
  // our FlowPay slug — for both), so it doubles as the lookup key.
  const record = await recordSale(reference, amountPaid, transactionReference);

  // Fan out to whatever system the seller connected via /connect, if any.
  // Best-effort: a failure here shouldn't turn into a non-2xx response,
  // since that would make Monnify retry an event we've already recorded.
  if (record?.sellerId) {
    try {
      const seller = await getSeller(record.sellerId);
      const entry = seller ? await getGateway(seller.gatewayId) : undefined;
      if (entry) {
        const tools = compileSpec(entry.spec, entry.authValue);
        const summary = await runSellerAction(
          `Sold "${record.title}" for ₦${amountPaid}.`,
          tools
        );
        await saveConnectedAction(reference, summary);
      }
    } catch (err) {
      console.error("Connected-system action failed:", err);
    }
  }

  return Response.json({ received: true });
}
