import type { GatewaySpec } from "./types";

// Deliberately in-memory, not the JSON-file pattern lib/store/flowpay.ts uses: a
// pasted custom API is disposable and session-scoped, unlike a live payment
// record. Known limitation: a server restart forgets every generated gateway
// (the Monnify preset at /api/mcp is unaffected — it's built straight from
// lib/monnify/tools.ts, not the registry).

interface GatewayEntry {
  spec: GatewaySpec;
  authValue?: string;
}

const registry = new Map<string, GatewayEntry>();

function randomId(len = 8): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, len);
}

export function saveGateway(spec: GatewaySpec, authValue?: string): string {
  const id = randomId();
  registry.set(id, { spec, authValue });
  return id;
}

export function getGateway(id: string): GatewayEntry | undefined {
  return registry.get(id);
}
