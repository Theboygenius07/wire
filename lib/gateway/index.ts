import type { GatewaySpec } from "./types";
import { parseCurl } from "./parseCurl";
import { parseOpenApi } from "./parseOpenApi";

export * from "./types";
export { compileSpec } from "./compile";
export { saveGateway, getGateway } from "./registry";

// Single entry point for "turn whatever was pasted into a GatewaySpec" — sniffs
// curl vs. JSON so the Playground doesn't need a mode toggle.
export function parseInput(input: string): { spec: GatewaySpec; authValue?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Paste an OpenAPI spec (JSON) or a curl command first.");
  }
  if (/^curl\s/i.test(trimmed)) {
    return parseCurl(trimmed);
  }
  try {
    JSON.parse(trimmed);
  } catch {
    throw new Error('Input isn\'t a curl command (must start with "curl") or valid JSON OpenAPI spec.');
  }
  return { spec: parseOpenApi(trimmed) };
}
