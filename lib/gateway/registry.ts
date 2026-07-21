import { Redis } from "@upstash/redis";
import type { GatewaySpec } from "./types";

// Backed by Upstash Redis instead of an in-memory Map: Vercel runs API
// routes as separate serverless instances with no shared memory, so a
// gateway generated on one instance would be invisible to a request that
// lands on another. Redis is the one place every instance can reach.
// Generated gateways are still disposable (unlike Flow records), so they
// carry a TTL rather than living forever.

const redis = Redis.fromEnv();
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface GatewayEntry {
  spec: GatewaySpec;
  authValue?: string;
}

function randomId(len = 8): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, len);
}

function key(id: string): string {
  return `gateway:${id}`;
}

export async function saveGateway(spec: GatewaySpec, authValue?: string): Promise<string> {
  const id = randomId();
  await redis.set(key(id), { spec, authValue }, { ex: TTL_SECONDS });
  return id;
}

export async function getGateway(id: string): Promise<GatewayEntry | undefined> {
  const entry = await redis.get<GatewayEntry>(key(id));
  return entry ?? undefined;
}
