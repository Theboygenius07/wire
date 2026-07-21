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
  /** Owning account. Unset if created while the seller wasn't logged in —
   * see claimFlowPay: the first logged-in viewer of an unowned dashboard
   * becomes its owner. */
  userId?: string;
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

/** If the record has no owner yet, the current viewer becomes the owner.
 * Otherwise a no-op. Lets a page created before signup get "claimed" the
 * first time its creator views the dashboard while logged in. */
export async function claimFlowPay(slug: string, userId: string): Promise<FlowPayRecord | null> {
  const record = await getFlowPay(slug);
  if (!record) return null;
  if (!record.userId) {
    record.userId = userId;
    await redis.set(key(slug), record);
  }
  return record;
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
