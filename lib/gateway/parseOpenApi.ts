import type { GatewayAuth, GatewayOperation, GatewayParam, GatewaySpec } from "./types";

// Turns a pasted OpenAPI 3.x JSON document into a GatewaySpec: one GatewayOperation
// per path+method, with parameters from `parameters` and flattened top-level
// properties from the JSON request body. Deliberately doesn't attempt full JSON
// Schema support (nested objects, oneOf/allOf, etc.) — one level of properties is
// what an MCP tool's flat input schema needs anyway.

const METHODS = ["get", "post", "put", "patch", "delete"] as const;

type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  $ref?: string;
};

function resolveRef(doc: Record<string, unknown>, ref: string): JsonSchema {
  const match = /^#\/components\/schemas\/(.+)$/.exec(ref);
  if (!match) return {};
  const schemas = (doc.components as Record<string, unknown> | undefined)?.schemas as
    | Record<string, JsonSchema>
    | undefined;
  return schemas?.[match[1]] ?? {};
}

function schemaTypeToParamType(type: string | undefined): GatewayParam["type"] {
  if (type === "integer" || type === "number") return "number";
  if (type === "boolean") return "boolean";
  return "string";
}

function sanitizeName(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
}

function resolveAuth(doc: Record<string, unknown>): GatewayAuth {
  const schemes = (doc.components as Record<string, unknown> | undefined)?.securitySchemes as
    | Record<string, { type?: string; scheme?: string; in?: string; name?: string }>
    | undefined;
  if (!schemes) return { type: "none" };
  const first = Object.values(schemes)[0];
  if (!first) return { type: "none" };
  if (first.type === "http" && first.scheme === "bearer") return { type: "bearer" };
  if (first.type === "http" && first.scheme === "basic") return { type: "basic" };
  if (first.type === "apiKey" && first.in === "header" && first.name) {
    return { type: "apiKey", headerName: first.name };
  }
  return { type: "none" };
}

export function parseOpenApi(input: string): GatewaySpec {
  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(input);
  } catch {
    throw new Error("That's not valid JSON — paste the OpenAPI spec as JSON, not YAML.");
  }

  const paths = doc.paths as
    | Record<string, Record<string, Record<string, unknown>>>
    | undefined;
  if (!paths || typeof paths !== "object") {
    throw new Error("This doesn't look like an OpenAPI spec — no top-level \"paths\" object.");
  }

  const servers = doc.servers as Array<{ url?: string }> | undefined;
  const baseUrl = servers?.[0]?.url;
  if (!baseUrl) {
    throw new Error('OpenAPI spec has no "servers[0].url" — add one so Wire knows where to send requests.');
  }

  const auth = resolveAuth(doc);
  const operations: GatewayOperation[] = [];

  for (const [path, methods] of Object.entries(paths)) {
    for (const method of METHODS) {
      const op = methods[method] as
        | {
            operationId?: string;
            summary?: string;
            description?: string;
            parameters?: Array<{
              name: string;
              in: string;
              required?: boolean;
              description?: string;
              schema?: { type?: string };
            }>;
            requestBody?: {
              content?: Record<string, { schema?: JsonSchema }>;
            };
          }
        | undefined;
      if (!op) continue;

      const params: GatewayParam[] = [];

      for (const p of op.parameters ?? []) {
        if (p.in !== "path" && p.in !== "query" && p.in !== "header") continue;
        params.push({
          name: p.name,
          location: p.in,
          type: schemaTypeToParamType(p.schema?.type),
          required: p.in === "path" ? true : Boolean(p.required),
          description: p.description ?? p.name,
        });
      }

      let bodySchema = op.requestBody?.content?.["application/json"]?.schema;
      if (bodySchema?.$ref) bodySchema = resolveRef(doc, bodySchema.$ref);
      if (bodySchema?.properties) {
        const required = new Set(bodySchema.required ?? []);
        for (const [propName, propSchema] of Object.entries(bodySchema.properties)) {
          params.push({
            name: propName,
            location: "body",
            type: schemaTypeToParamType(propSchema.type),
            required: required.has(propName),
            description: propName,
          });
        }
      }

      const name = op.operationId
        ? sanitizeName(op.operationId)
        : `${method}_${sanitizeName(path)}`;

      operations.push({
        name,
        description: op.summary || op.description || `${method.toUpperCase()} ${path}`,
        method: method.toUpperCase() as GatewayOperation["method"],
        path,
        params,
      });
    }
  }

  if (operations.length === 0) {
    throw new Error("No operations found under \"paths\" in this OpenAPI spec.");
  }

  return {
    sourceLabel: (doc.info as { title?: string } | undefined)?.title ?? "OpenAPI spec",
    baseUrl,
    auth,
    operations,
  };
}
