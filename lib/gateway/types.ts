import type { z } from "zod";

// The gateway's job: turn raw API input (an OpenAPI spec, a curl command, a
// plain-English description) into this — a compiled, executable operation
// list. lib/mcp/server.ts and lib/anthropic/agent.ts are consumers on top;
// neither knows or cares whether a GatewayTool came from here or was
// hand-curated like lib/monnify/tools.ts.

export type ParamLocation = "path" | "query" | "header" | "body";
export type ParamType = "string" | "number" | "boolean";

export interface GatewayParam {
  name: string;
  location: ParamLocation;
  type: ParamType;
  required: boolean;
  description: string;
}

export interface GatewayOperation {
  name: string;
  description: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Relative to GatewaySpec.baseUrl. Path params written as {paramName}. */
  path: string;
  params: GatewayParam[];
}

export type GatewayAuth =
  | { type: "none" }
  | { type: "bearer" }
  | { type: "basic" }
  | { type: "apiKey"; headerName: string };

export interface GatewaySpec {
  sourceLabel: string;
  baseUrl: string;
  auth: GatewayAuth;
  operations: GatewayOperation[];
}

/** The shape every consumer actually wants — same shape lib/monnify/tools.ts hand-writes. */
export interface GatewayTool {
  name: string;
  description: string;
  schema: Record<string, z.ZodTypeAny>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}
