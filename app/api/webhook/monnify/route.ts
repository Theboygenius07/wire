import crypto from "crypto";
import { recordSale, recordTierSale, saveConnectedAction } from "@/lib/store/flow";
import { getSeller } from "@/lib/store/seller";
import { getGateway, compileSpec } from "@/lib/gateway";
import { runSellerAction } from "@/lib/openai/sellerAction";
import { saveSubscription, addCycle } from "@/lib/store/subscription";
import * as monnify from "@/lib/monnify/client";

// Receives Monnify's payment-succeeded notifications and updates the
// Flow dashboard. Verified against developers.monnify.com as of
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
  // when creating the sale. For single-price Flow pages (app/api/flow/route.ts)
  // that's just the Flow slug. For a multi-tier page, a per-purchase invoice
  // reference looks like "{slug}--{tierId}--{random}" (see
  // app/api/flow/[slug]/purchase) — split it back apart to route the sale to
  // the right tier.
  const [flowSlug, tierId] = reference.includes("--") ? reference.split("--") : [reference, undefined];

  const record = tierId
    ? await recordTierSale(flowSlug, tierId, amountPaid, transactionReference)
    : await recordSale(flowSlug, amountPaid, transactionReference);

  // Recurring Flow: this is a subscriber's first (manually-paid) charge —
  // pull their card token out of the transaction so future cycles can be
  // billed automatically with no action from them. Best-effort and NOT
  // independently verified against a real card payment — the field names
  // below (cardDetails.cardToken, customer.email/name) are copied from
  // Monnify's docs, not confirmed live; if a real subscriber signup doesn't
  // produce a token, check the actual verifyTransaction response shape here.
  if (record?.recurring && !tierId) {
    try {
      const txn = (await monnify.verifyTransaction({ transactionReference })) as {
        cardDetails?: { cardToken?: string; token?: string };
        cardToken?: string;
        customer?: { email?: string; name?: string };
        customerEmail?: string;
        customerName?: string;
      };
      const cardToken = txn.cardDetails?.cardToken ?? txn.cardDetails?.token ?? txn.cardToken;
      if (cardToken) {
        await saveSubscription({
          id: crypto.randomUUID(),
          flowSlug,
          cardToken,
          customerEmail: txn.customer?.email ?? txn.customerEmail ?? `flow+${flowSlug}@wire.dev`,
          customerName: txn.customer?.name ?? txn.customerName ?? record.title,
          amountNaira: amountPaid,
          frequency: record.recurring.frequency,
          nextChargeAt: addCycle(new Date(), record.recurring.frequency).toISOString(),
          status: "active",
          failedAttempts: 0,
          createdAt: new Date().toISOString(),
        });
      } else {
        console.error("Recurring signup: no card token in verifyTransaction response for", transactionReference);
      }
    } catch (err) {
      console.error("Failed to set up recurring subscription:", err);
    }
  }

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
        await saveConnectedAction(flowSlug, summary);
      }
    } catch (err) {
      console.error("Connected-system action failed:", err);
    }
  }

  return Response.json({ received: true });
}
