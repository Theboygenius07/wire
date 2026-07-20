import { z } from "zod";
import type { GatewayOperation, GatewaySpec, GatewayTool } from "./types";

// Turns a GatewaySpec's operations into the exact GatewayTool shape
// lib/monnify/tools.ts hand-writes — a typed Zod schema plus a real fetch-backed
// handler. This is what lib/mcp/server.ts registers and lib/anthropic/agent.ts
// calls; neither knows or cares whether a tool came from here or was hand-curated.

function zodForParam(param: GatewayOperation["params"][number]) {
  let type: z.ZodTypeAny =
    param.type === "number" ? z.number() : param.type === "boolean" ? z.boolean() : z.string();
  type = type.describe(param.description || param.name);
  return param.required ? type : type.optional();
}

function buildAuthHeaders(spec: GatewaySpec, authValue: string | undefined): Record<string, string> {
  if (!authValue) return {};
  switch (spec.auth.type) {
    case "bearer":
      return { Authorization: `Bearer ${authValue}` };
    case "basic":
      return { Authorization: `Basic ${authValue}` };
    case "apiKey":
      return { [spec.auth.headerName]: authValue };
    default:
      return {};
  }
}

function buildHandler(spec: GatewaySpec, op: GatewayOperation, authValue: string | undefined) {
  return async (args: Record<string, unknown>) => {
    let path = op.path;
    const query = new URLSearchParams();
    const headers: Record<string, string> = { "Content-Type": "application/json", ...buildAuthHeaders(spec, authValue) };
    const body: Record<string, unknown> = {};

    for (const param of op.params) {
      const value = args[param.name];
      if (value === undefined) continue;
      if (param.location === "path") {
        path = path.replace(`{${param.name}}`, encodeURIComponent(String(value)));
      } else if (param.location === "query") {
        query.set(param.name, String(value));
      } else if (param.location === "header") {
        headers[param.name] = String(value);
      } else {
        body[param.name] = value;
      }
    }

    const url = `${spec.baseUrl}${path}${query.toString() ? `?${query.toString()}` : ""}`;
    const hasBody = Object.keys(body).length > 0 && op.method !== "GET" && op.method !== "DELETE";

    const res = await fetch(url, {
      method: op.method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      // Not JSON — return the raw text.
    }

    if (!res.ok) {
      throw new Error(`${op.method} ${path} failed (${res.status}): ${text.slice(0, 500)}`);
    }
    return parsed;
  };
}

export function compileSpec(spec: GatewaySpec, authValue?: string): GatewayTool[] {
  return spec.operations.map((op) => {
    const schema: Record<string, z.ZodTypeAny> = {};
    for (const param of op.params) schema[param.name] = zodForParam(param);
    return {
      name: op.name,
      description: op.description,
      schema,
      handler: buildHandler(spec, op, authValue),
    };
  });
}
