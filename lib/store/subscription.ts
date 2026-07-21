import { Redis } from "@upstash/redis";

// One record per subscriber to a recurring Flow page — created the moment
// their first card payment succeeds (see app/api/webhook/monnify/route.ts,
// which pulls a cardToken out of the transaction and calls saveSubscription),
// then auto-charged going forward by app/api/cron/charge-subscriptions.

const redis = Redis.fromEnv();

export type Frequency = "daily" | "weekly" | "monthly";

export function addCycle(date: Date, frequency: Frequency): Date {
  const next = new Date(date);
  if (frequency === "daily") next.setDate(next.getDate() + 1);
  else if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

export type Subscription = {
  id: string;
  flowSlug: string;
  cardToken: string;
  customerEmail: string;
  customerName: string;
  amountNaira: number;
  frequency: Frequency;
  nextChargeAt: string; // ISO
  status: "active" | "past_due" | "canceled";
  failedAttempts: number;
  createdAt: string;
  lastChargedAt?: string;
};

function key(id: string): string {
  return `subscription:${id}`;
}

function flowSubscriptionsKey(flowSlug: string): string {
  return `flow-subscriptions:${flowSlug}`;
}

// A sorted set of every active subscription id, scored by its nextChargeAt
// (epoch ms) — lets the cron job ask "what's due right now" in one query
// instead of scanning every subscription that's ever existed.
const DUE_SET_KEY = "subscriptions-due";

export async function saveSubscription(sub: Subscription): Promise<Subscription> {
  await redis.set(key(sub.id), sub);
  await redis.sadd(flowSubscriptionsKey(sub.flowSlug), sub.id);
  if (sub.status === "active") {
    await redis.zadd(DUE_SET_KEY, { score: new Date(sub.nextChargeAt).getTime(), member: sub.id });
  }
  return sub;
}

export async function getSubscription(id: string): Promise<Subscription | null> {
  return (await redis.get<Subscription>(key(id))) ?? null;
}

export async function getSubscriptionsForFlow(flowSlug: string): Promise<Subscription[]> {
  const ids = await redis.smembers(flowSubscriptionsKey(flowSlug));
  if (!ids.length) return [];
  const subs = await Promise.all(ids.map((id) => getSubscription(id)));
  return subs.filter((s): s is Subscription => s !== null);
}

/** Every subscription whose nextChargeAt has passed, for the cron job. */
export async function getDueSubscriptions(nowMs: number): Promise<Subscription[]> {
  const ids = await redis.zrange<string[]>(DUE_SET_KEY, 0, nowMs, { byScore: true });
  if (!ids.length) return [];
  const subs = await Promise.all(ids.map((id) => getSubscription(id)));
  return subs.filter((s): s is Subscription => s !== null);
}

export async function markSubscriptionCharged(id: string, nextChargeAt: string): Promise<void> {
  const sub = await getSubscription(id);
  if (!sub) return;
  sub.status = "active";
  sub.failedAttempts = 0;
  sub.lastChargedAt = new Date().toISOString();
  sub.nextChargeAt = nextChargeAt;
  await redis.set(key(id), sub);
  await redis.zadd(DUE_SET_KEY, { score: new Date(nextChargeAt).getTime(), member: id });
}

// Three strikes and the subscription stops retrying automatically — it's
// left in "past_due" and out of the due-set rather than canceled outright,
// so a manual retry/support flow could still revive it later.
const MAX_FAILED_ATTEMPTS = 3;

export async function markSubscriptionFailed(id: string): Promise<void> {
  const sub = await getSubscription(id);
  if (!sub) return;
  sub.failedAttempts += 1;
  if (sub.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    sub.status = "past_due";
    await redis.zrem(DUE_SET_KEY, id);
  } else {
    // Retry tomorrow rather than immediately hammering a failing card.
    const retryAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    sub.nextChargeAt = retryAt;
    await redis.zadd(DUE_SET_KEY, { score: new Date(retryAt).getTime(), member: id });
  }
  await redis.set(key(id), sub);
}
