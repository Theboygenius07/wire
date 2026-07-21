import { Redis } from "@upstash/redis";

// Backed by Upstash Redis instead of a JSON file on disk: Vercel's
// serverless functions have an ephemeral, per-instance filesystem, so a file
// written by one request isn't guaranteed to exist for the next — exactly
// the bug that made lib/gateway/registry.ts unreliable, just less obvious
// here since local dev never hits it. Unlike generated gateways, FlowPay
// records are real payment pages and get no TTL — they live indefinitely.

const redis = Redis.fromEnv();

export type FlowPayRecord = {
  slug: string;
  title: string;
  priceNaira: number;
  ticketCap: number;
  ticketsSold: number;
  revenueNaira: number;
  accountReference: string;
  accountNumber?: string;
  bankName?: string;
  checkoutUrl?: string;
  createdAt: string;
  /** Monnify transactionReferences already applied — Monnify retries webhook
   * delivery, so this is how recordSale avoids double-counting a retry. */
  processedTransactionRefs?: string[];
  /** The browser-cookie seller token active when this page was created —
   * looked up against lib/store/seller.ts at webhook time to see whether a
   * connected system should hear about a sale. Not set for pages created
   * before the seller-connection feature existed. */
  sellerId?: string;
  /** Plain-English summary of what the last sale did (or didn't do) in the
   * seller's connected system, e.g. "Reduced stock count by 1." Shown on
   * the dashboard so the automation isn't invisible. */
  lastConnectedAction?: string;
};

function key(slug: string): string {
  return `flowpay:${slug}`;
}

export async function saveFlowPay(record: FlowPayRecord) {
  await redis.set(key(record.slug), record);
  return record;
}

export async function getFlowPay(slug: string) {
  return (await redis.get<FlowPayRecord>(key(slug))) ?? null;
}

export async function recordSale(slug: string, amountNaira: number, transactionReference: string) {
  const record = await getFlowPay(slug);
  if (!record) return null;

  record.processedTransactionRefs ??= [];
  if (record.processedTransactionRefs.includes(transactionReference)) {
    return record; // Already applied — Monnify retried this notification.
  }

  record.processedTransactionRefs.push(transactionReference);
  record.ticketsSold += 1;
  record.revenueNaira += amountNaira;
  await redis.set(key(slug), record);
  return record;
}

export async function saveConnectedAction(slug: string, summary: string) {
  const record = await getFlowPay(slug);
  if (!record) return null;
  record.lastConnectedAction = summary;
  await redis.set(key(slug), record);
  return record;
}
