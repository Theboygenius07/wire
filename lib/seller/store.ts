import { Redis } from "@upstash/redis";

// Ties a seller's cookie token (lib/seller/identity.ts) to the gateway they
// connected via "connect your system" — separate namespace from
// lib/gateway/registry.ts's disposable Playground gateways, since a
// seller's connected system should persist indefinitely, not expire.

const redis = Redis.fromEnv();

function key(sellerId: string): string {
  return `seller:${sellerId}`;
}

export async function getConnectedGatewayId(sellerId: string): Promise<string | null> {
  return (await redis.get<string>(key(sellerId))) ?? null;
}

export async function setConnectedGatewayId(sellerId: string, gatewayId: string): Promise<void> {
  await redis.set(key(sellerId), gatewayId);
}
