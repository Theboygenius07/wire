import { Redis } from "@upstash/redis";

// Backed by Upstash Redis instead of a JSON file on disk: Vercel's
// serverless functions have an ephemeral, per-instance filesystem, so a file
// written by one request isn't guaranteed to exist for the next — exactly
// the bug that made lib/gateway/registry.ts unreliable, just less obvious
// here since local dev never hits it. Unlike generated gateways, Flow
// records are real payment pages and get no TTL — they live indefinitely.

const redis = Redis.fromEnv();

export type FlowTier = {
  id: string;
  name: string;
  priceNaira: number;
  cap: number;
  sold: number;
};

export type FlowRecord = {
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
  /** Present only for multi-tier events (e.g. "VIP" vs "Regular"). When set,
   * there's no single fixed price/checkoutUrl for the event — a buyer picks
   * a tier on the checkout page, which creates a one-off invoice for that
   * tier's price (see app/api/flow/[slug]/purchase). ticketsSold/revenueNaira
   * above still track the event-wide totals, kept in sync by recordTierSale. */
  tiers?: FlowTier[];
  /** Present only for subscription/recurring Flows — mutually exclusive with
   * tiers. When set, priceNaira is the per-cycle amount and there's no
   * reserved account (card tokenization, which recurring billing needs,
   * only works off a card payment — see app/api/flow/route.ts). Each
   * subscriber's own record lives in lib/store/subscription.ts, keyed off
   * this Flow's slug; ticketsSold/revenueNaira here track cumulative
   * charges across every subscriber, kept in sync by recordSale. */
  recurring?: { frequency: "daily" | "weekly" | "monthly" };
  /** Monnify transactionReferences already applied — Monnify retries webhook
   * delivery, so this is how recordSale avoids double-counting a retry. */
  processedTransactionRefs?: string[];
  /** Owning account. Unset if created while the seller wasn't logged in —
   * see claimFlow: the first logged-in viewer of an unowned dashboard
   * becomes its owner. */
  userId?: string;
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
  // Kept as the old "flowpay:" prefix, not renamed alongside the product —
  // it's an internal Redis key invisible to users, and changing it would
  // orphan every record already written under it.
  return `flowpay:${slug}`;
}

function userFlowsKey(userId: string): string {
  return `user-flows:${userId}`;
}

function sellerFlowsKey(sellerId: string): string {
  return `seller-flows:${sellerId}`;
}

export async function saveFlow(record: FlowRecord) {
  await redis.set(key(record.slug), record);
  if (record.userId) await redis.sadd(userFlowsKey(record.userId), record.slug);
  if (record.sellerId) await redis.sadd(sellerFlowsKey(record.sellerId), record.slug);
  return record;
}

/** All Flow pages owned by a user, newest first. Backed by a Redis set kept
 * in sync by saveFlow and claimFlow — records themselves only carry userId,
 * not a reverse index, so this is the only way to list "my sales pages". */
export async function getFlowsByUser(userId: string): Promise<FlowRecord[]> {
  const slugs = await redis.smembers(userFlowsKey(userId));
  if (!slugs.length) return [];
  const records = await Promise.all(slugs.map((slug) => getFlow(slug)));
  return records
    .filter((r): r is FlowRecord => r !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getFlow(slug: string) {
  return (await redis.get<FlowRecord>(key(slug))) ?? null;
}

/** Same as getFlowsByUser, but keyed by sellerId — the only identity a Flow
 * created over WhatsApp has, since there's no browser session/cookie there. */
export async function getFlowsBySeller(sellerId: string): Promise<FlowRecord[]> {
  const slugs = await redis.smembers(sellerFlowsKey(sellerId));
  if (!slugs.length) return [];
  const records = await Promise.all(slugs.map((slug) => getFlow(slug)));
  return records
    .filter((r): r is FlowRecord => r !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** If the record has no owner yet, the current viewer becomes the owner.
 * Otherwise a no-op. Lets a page created before signup get "claimed" the
 * first time its creator views the dashboard while logged in. */
export async function claimFlow(slug: string, userId: string): Promise<FlowRecord | null> {
  const record = await getFlow(slug);
  if (!record) return null;
  if (!record.userId) {
    record.userId = userId;
    await redis.set(key(slug), record);
    await redis.sadd(userFlowsKey(userId), slug);
  }
  return record;
}

/** Claims every unowned Flow page created from this browser (tracked via the
 * wire_seller_id cookie — see lib/seller/token.ts) for the given account.
 * Most Flow pages are created without signing up first, so a page's only
 * link back to "whoever made it" is that cookie, not a userId — claimFlow
 * only catches a page once its own dashboard is viewed, which is why users
 * who created several pages anonymously and later logged in wouldn't see
 * all of them on /flow without this broader sweep. */
export async function claimFlowsBySeller(sellerId: string, userId: string): Promise<void> {
  const slugs = await redis.smembers(sellerFlowsKey(sellerId));
  for (const slug of slugs) {
    const record = await getFlow(slug);
    if (record && !record.userId) {
      record.userId = userId;
      await redis.set(key(slug), record);
      await redis.sadd(userFlowsKey(userId), slug);
    }
  }
}

export async function recordSale(slug: string, amountNaira: number, transactionReference: string) {
  const record = await getFlow(slug);
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

/** Same bookkeeping as recordSale, but for a specific ticket tier — bumps
 * that tier's own sold count in addition to the event-wide totals. */
export async function recordTierSale(
  slug: string,
  tierId: string,
  amountNaira: number,
  transactionReference: string
) {
  const record = await getFlow(slug);
  if (!record?.tiers) return null;

  record.processedTransactionRefs ??= [];
  if (record.processedTransactionRefs.includes(transactionReference)) {
    return record; // Already applied — Monnify retried this notification.
  }

  const tier = record.tiers.find((t) => t.id === tierId);
  if (!tier) return null;

  record.processedTransactionRefs.push(transactionReference);
  tier.sold += 1;
  record.ticketsSold += 1;
  record.revenueNaira += amountNaira;
  await redis.set(key(slug), record);
  return record;
}

export async function saveConnectedAction(slug: string, summary: string) {
  const record = await getFlow(slug);
  if (!record) return null;
  record.lastConnectedAction = summary;
  await redis.set(key(slug), record);
  return record;
}
