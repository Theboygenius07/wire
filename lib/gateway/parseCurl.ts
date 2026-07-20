import type { GatewayAuth, GatewayOperation, GatewayParam, GatewaySpec } from "./types";

// Turns a single raw curl command into a one-operation GatewaySpec. Handles the
// flags people actually paste: -X/--request, -H/--header (repeatable), -d/--data/
// --data-raw/--data-binary, -u/--user, and a bare URL. Anything else is ignored
// rather than rejected — the goal is "paste what you copied from devtools", not
// full curl-flag coverage.

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
}

function sanitizeSegment(s: string): string {
  return s.replace(/[{}]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
}

function inferJsonType(value: unknown): GatewayParam["type"] {
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "string";
}

export function parseCurl(input: string): { spec: GatewaySpec; authValue?: string } {
  const withoutLineContinuations = input.replace(/\\\s*\n/g, " ");
  const tokens = tokenize(withoutLineContinuations);

  let method: GatewayOperation["method"] | undefined;
  let url: string | undefined;
  const headers: Record<string, string> = {};
  let data: string | undefined;
  let basicUser: string | undefined;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "curl") continue;
    if (t === "-X" || t === "--request") {
      method = tokens[++i]?.toUpperCase() as GatewayOperation["method"];
    } else if (t === "-H" || t === "--header") {
      const header = tokens[++i] ?? "";
      const idx = header.indexOf(":");
      if (idx > -1) headers[header.slice(0, idx).trim()] = header.slice(idx + 1).trim();
    } else if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-binary" || t === "--data-urlencode") {
      data = tokens[++i];
    } else if (t === "-u" || t === "--user") {
      basicUser = tokens[++i];
    } else if (t === "--url") {
      url = tokens[++i];
    } else if (!t.startsWith("-") && !url) {
      url = t;
    }
  }

  if (!url) throw new Error("Couldn't find a URL in that curl command.");
  if (!method) method = data ? "POST" : "GET";

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`"${url}" isn't a valid URL.`);
  }

  const params: GatewayParam[] = [];

  const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
  const name = `${method.toLowerCase()}_${pathSegments.map(sanitizeSegment).filter(Boolean).join("_") || "root"}`;

  for (const [key, value] of parsedUrl.searchParams.entries()) {
    params.push({
      name: key,
      location: "query",
      type: "string",
      required: false,
      description: `From the example curl command (was "${value}")`,
    });
  }

  let auth: GatewayAuth = { type: "none" };
  let authValue: string | undefined;

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "content-type") continue;
    if (key.toLowerCase() === "authorization") {
      if (/^bearer\s+/i.test(value)) {
        auth = { type: "bearer" };
        authValue = value.replace(/^bearer\s+/i, "");
      } else if (/^basic\s+/i.test(value)) {
        auth = { type: "basic" };
        authValue = value.replace(/^basic\s+/i, "");
      } else {
        auth = { type: "apiKey", headerName: "Authorization" };
        authValue = value;
      }
      continue;
    }
    params.push({
      name: key,
      location: "header",
      type: "string",
      required: true,
      description: `From the example curl command (was "${value}")`,
    });
  }

  if (basicUser) {
    auth = { type: "basic" };
    authValue = Buffer.from(basicUser).toString("base64");
  }

  if (data) {
    try {
      const json = JSON.parse(data);
      if (json && typeof json === "object" && !Array.isArray(json)) {
        for (const [key, value] of Object.entries(json)) {
          params.push({
            name: key,
            location: "body",
            type: inferJsonType(value),
            required: true,
            description: "From the example curl command's JSON body",
          });
        }
      }
    } catch {
      for (const [key, value] of new URLSearchParams(data).entries()) {
        params.push({
          name: key,
          location: "body",
          type: "string",
          required: true,
          description: `From the example curl command's form body (was "${value}")`,
        });
      }
    }
  }

  const operation: GatewayOperation = {
    name,
    description: `${method} ${parsedUrl.pathname} — generated from a pasted curl command`,
    method,
    path: parsedUrl.pathname || "/",
    params,
  };

  return {
    spec: {
      sourceLabel: `curl: ${parsedUrl.hostname}`,
      baseUrl: parsedUrl.origin,
      auth,
      operations: [operation],
    },
    authValue,
  };
}
