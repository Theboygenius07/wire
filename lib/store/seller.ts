import { Redis } from "@upstash/redis";

// Ties a seller's browser-cookie token to a connected gateway (their own
// inventory/bookkeeping/whatever system) — separate from FlowPay records,
// since one seller can create multiple FlowPay pages against the same
// connected system.

const redis = Redis.fromEnv();

export type SellerRecord = {
  sellerId: string;
  gatewayId: string;
  sourceLabel: string;
  connectedAt: string;
};

function key(sellerId: string): string {
  return `seller:${sellerId}`;
}

export async function saveSeller(sellerId: string, gatewayId: string, sourceLabel: string) {
  const record: SellerRecord = { sellerId, gatewayId, sourceLabel, connectedAt: new Date().toISOString() };
  await redis.set(key(sellerId), record);
  return record;
}

export async function getSeller(sellerId: string) {
  return (await redis.get<SellerRecord>(key(sellerId))) ?? null;
}
