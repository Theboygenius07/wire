// Reference content for /apidocs — mirrors the shipped route handlers in
// app/api/ exactly (method, path, auth model, request/response shapes).
// Update this alongside any route change; nothing here is generated.

export type Endpoint = {
  method: string;
  path: string;
  auth: string;
  summary: string;
  body?: [field: string, type: string, requirement: string, description: string][];
  response: string;
  status: [code: string, meaning: string][];
  internal?: boolean;
};

export type DocSection = {
  id: string;
  title: string;
  intro: string;
  endpoints: Endpoint[];
};

export const SECTIONS: DocSection[] = [
  {
    id: "flow",
    title: "Flow",
    intro:
      "The prompt-to-payment-page pipeline. Creation is account-free; viewing a dashboard requires the owner to be logged in.",
    endpoints: [
      {
        method: "POST",
        path: "/api/flow",
        auth: "Public",
        summary:
          "Turns one plain-English request into a live Flow page — single price, multiple named tiers, or a recurring subscription, decided automatically from the wording.",
        body: [
          ["prompt", "string", "required", "What's being sold, in plain English — price (or per-tier prices, or a recurring frequency) included."],
          ["sellerId", "string", "optional", "The wire_seller_id browser cookie value, so the page can be claimed later by whoever logs in from this browser."],
        ],
        response:
          '{\n  "slug": "a1b2c3d4",\n  "checkoutUrl": "/checkout/a1b2c3d4",\n  "dashboardUrl": "/dashboard/a1b2c3d4",\n  "record": { "...": "see FlowRecord" }\n}',
        status: [
          ["200", "Created"],
          ["422", 'Missing required info — response is { error: "<clarifying question>" }'],
          ["502", "Agent or Monnify call failed"],
        ],
      },
      {
        method: "GET",
        path: "/api/flow/mine",
        auth: "Session",
        summary:
          "Every Flow page the logged-in user owns. Also sweeps in and claims any unowned page created from this same browser first.",
        response: '{\n  "email": "you@example.com",\n  "flows": [ /* FlowRecord[] */ ]\n}',
        status: [
          ["200", "OK"],
          ["401", "Not logged in"],
        ],
      },
      {
        method: "GET",
        path: "/api/flow/{slug}",
        auth: "Session + ownership",
        summary:
          "Polled every 3s by the dashboard. Claims an unowned page for the current viewer on first load; 403s if it's already owned by someone else.",
        response: '// FlowRecord, plus subscriberCount if the Flow is recurring\n{ "...": "see FlowRecord", "subscriberCount": 4 }',
        status: [
          ["200", "OK"],
          ["401", "Not logged in"],
          ["403", "Owned by a different account"],
          ["404", "No Flow for that slug"],
        ],
      },
      {
        method: "POST",
        path: "/api/flow/{slug}/purchase",
        auth: "Public",
        summary:
          "Tiered Flows only. Creates a one-off invoice for the chosen tier's price — there's no single fixed checkout link when a page has tiers.",
        body: [["tierId", "string", "required", "One of the tier ids from the Flow's tiers array."]],
        response: '{ "checkoutUrl": "https://sandbox.monnify.com/checkout/..." }',
        status: [
          ["200", "OK"],
          ["400", "Not a tiered Flow, or missing tierId"],
          ["404", "Flow or tier not found"],
          ["409", "That tier is sold out"],
          ["502", "Monnify call failed"],
        ],
      },
      {
        method: "GET",
        path: "/api/flow/{slug}/qr",
        auth: "Public",
        summary:
          "A standalone PNG QR code pointing at the Flow's checkout page — used to hand WhatsApp a public image URL, but works for anything that needs the raw image.",
        response: "// image/png bytes, not JSON",
        status: [
          ["200", "OK — image/png"],
          ["404", "No Flow for that slug"],
        ],
      },
    ],
  },
  {
    id: "payouts",
    title: "Payouts",
    intro:
      "Lets a seller route their share of every sale straight to their own bank account via a Monnify sub-account, instead of it pooling in the platform wallet.",
    endpoints: [
      {
        method: "GET",
        path: "/api/banks",
        auth: "Public",
        summary: "The full bank list for the payout-setup dropdown.",
        response: '{ "banks": [ { "name": "GTBank", "code": "058" }, ... ] }',
        status: [
          ["200", "OK"],
          ["502", "Monnify call failed"],
        ],
      },
      {
        method: "GET",
        path: "/api/payout",
        auth: "Session",
        summary: "The logged-in user's payout account, if they've set one up.",
        response: '{ "account": /* PayoutAccount */ null }',
        status: [
          ["200", "OK"],
          ["401", "Not logged in"],
        ],
      },
      {
        method: "POST",
        path: "/api/payout",
        auth: "Session",
        summary:
          "Creates a Monnify sub-account for this user (once) and saves it. Defaults to a 100% split — the seller keeps everything unless a platform fee is set explicitly.",
        body: [
          ["bankCode", "string", "required", "From the /api/banks list."],
          ["accountNumber", "string", "required", "The seller's own bank account number."],
          ["bankName", "string", "optional", "Display label only — passed through from the client's bank list lookup."],
          ["splitPercentage", "number", "optional", "Defaults to 100."],
        ],
        response: '{ "account": /* PayoutAccount */ }',
        status: [
          ["200", "OK"],
          ["400", "Missing bankCode or accountNumber"],
          ["401", "Not logged in"],
          ["502", "Monnify rejected the account details"],
        ],
      },
    ],
  },
  {
    id: "relay",
    title: "Relay & MCP",
    intro:
      "Turns a pasted curl command or OpenAPI spec into real MCP tools, plus the fixed Monnify-preset gateway every Flow page is built on.",
    endpoints: [
      {
        method: "POST",
        path: "/api/gateway",
        auth: "Public",
        summary:
          "Parses a curl command or OpenAPI JSON spec into a gateway and registers it, ready to be pointed at by /api/gateway/{id}/mcp.",
        body: [
          ["input", "string", "required", "A curl command, or an OpenAPI spec as JSON text."],
          ["authValue", "string", "optional", "Bearer token / API key / basic-auth credentials for the target API."],
          ["persist", "boolean", "optional", "true keeps the gateway indefinitely (e.g. for /connect); otherwise it expires after 30 days."],
        ],
        response:
          '{\n  "id": "gw_x1y2",\n  "sourceLabel": "curl: api.example.com",\n  "baseUrl": "https://api.example.com",\n  "auth": { "type": "bearer" },\n  "operations": [ /* GatewayOperation[] */ ]\n}',
        status: [
          ["200", "OK"],
          ["400", "Missing input, or it couldn't be parsed"],
        ],
      },
      {
        method: "GET / POST / DELETE",
        path: "/api/gateway/{id}/mcp",
        auth: "Public",
        summary:
          "The live MCP server for a generated gateway — point any MCP-capable client at this URL. Stateless: re-compiled from the stored spec on every request.",
        response: "// Streamable HTTP MCP transport, not a plain JSON body",
        status: [
          ["200", "OK"],
          ["404", "No gateway for that id (may have expired)"],
        ],
      },
      {
        method: "GET",
        path: "/api/gateway/{id}/mcp.json",
        auth: "Public",
        summary: "A downloadable MCP client config file (mcpServers block) pointing at the gateway above.",
        response: '{ "mcpServers": { "wire-gateway-gw_x1y2": { "url": "...", "description": "..." } } }',
        status: [
          ["200", "OK"],
          ["404", "No gateway for that id"],
        ],
      },
      {
        method: "GET / POST / DELETE",
        path: "/api/mcp",
        auth: "Public",
        summary:
          "The fixed Monnify-preset MCP server — six tools (invoice, reserved account, sub-account split, refund, wallet balance, transaction search).",
        response: "// Streamable HTTP MCP transport",
        status: [["200", "OK"]],
      },
      {
        method: "GET",
        path: "/api/mcp.json",
        auth: "Public",
        summary: "Downloadable MCP client config for the Monnify preset above.",
        response: '{ "mcpServers": { "wire-monnify": { "url": "...", "description": "..." } } }',
        status: [["200", "OK"]],
      },
      {
        method: "POST",
        path: "/api/chat",
        auth: "Public",
        summary:
          "The Playground's live test chat — streams Server-Sent Events as the agent reasons, calls tools, and gets results back, against either the Monnify preset or a generated gateway.",
        body: [
          ["message", "string", "required", "What to ask the agent to do."],
          ["gatewayId", "string", "optional", "Use a generated gateway's tools instead of the Monnify preset."],
        ],
        response:
          '// text/event-stream — events: reasoning, tool_call, tool_result, error, done\nevent: tool_call\ndata: {"tool":"get_wallet_balance","input":{}}\n\nevent: tool_result\ndata: {"tool":"get_wallet_balance","output":{...},"isError":false}',
        status: [
          ["200", "OK — SSE stream"],
          ["400", "Missing message"],
          ["404", "gatewayId given but not found"],
        ],
      },
    ],
  },
  {
    id: "auth",
    title: "Auth",
    intro: "The whole account system — email + password, hashed with scrypt, sessions stored in Redis behind a random-token cookie.",
    endpoints: [
      {
        method: "POST",
        path: "/api/auth/signup",
        auth: "Public",
        summary: "Creates an account and starts a session.",
        body: [
          ["email", "string", "required", "Must contain “@”."],
          ["password", "string", "required", "At least 8 characters."],
        ],
        response: '{ "email": "you@example.com" }',
        status: [
          ["200", "OK"],
          ["400", "Invalid email or short password"],
          ["409", "Email already registered"],
        ],
      },
      {
        method: "POST",
        path: "/api/auth/login",
        auth: "Public",
        summary: "Verifies credentials and starts a session.",
        body: [
          ["email", "string", "required", ""],
          ["password", "string", "required", ""],
        ],
        response: '{ "email": "you@example.com" }',
        status: [
          ["200", "OK"],
          ["400", "Missing fields"],
          ["401", "Invalid email or password"],
        ],
      },
      {
        method: "POST",
        path: "/api/auth/logout",
        auth: "Session",
        summary: "Ends the current session and clears the cookie.",
        response: '{ "loggedOut": true }',
        status: [["200", "OK"]],
      },
      {
        method: "GET",
        path: "/api/auth/me",
        auth: "Session",
        summary: "Who's currently logged in.",
        response: '{ "email": "you@example.com" }',
        status: [
          ["200", "OK"],
          ["401", "Not logged in"],
        ],
      },
    ],
  },
  {
    id: "connect",
    title: "Connect",
    intro: "Ties a seller's browser identity to a system they've connected (Airtable, Notion, etc.), so a confirmed sale can trigger an action there.",
    endpoints: [
      {
        method: "POST",
        path: "/api/seller",
        auth: "Public",
        summary: "Saves the link between a sellerId (browser cookie) and a gateway they've connected.",
        body: [
          ["sellerId", "string", "required", ""],
          ["gatewayId", "string", "required", ""],
          ["sourceLabel", "string", "optional", "Defaults to “Connected system.”"],
        ],
        response: '// SellerRecord\n{ "sellerId": "...", "gatewayId": "...", "sourceLabel": "...", "connectedAt": "..." }',
        status: [
          ["200", "OK"],
          ["400", "Missing sellerId or gatewayId"],
        ],
      },
      {
        method: "GET",
        path: "/api/seller?sellerId={id}",
        auth: "Public",
        summary: "Looks up what a given sellerId has connected, if anything.",
        response: "// SellerRecord",
        status: [
          ["200", "OK"],
          ["400", "Missing sellerId"],
          ["404", "Not connected"],
        ],
      },
    ],
  },
  {
    id: "internal",
    title: "Internal & inbound webhooks",
    intro:
      "Not meant to be called directly — documented for completeness. Each is only reachable by the specific external sender its signature/secret is checked against.",
    endpoints: [
      {
        method: "POST",
        path: "/api/webhook/monnify",
        auth: "Signed (Monnify)",
        internal: true,
        summary:
          "Monnify's payment-succeeded notifications. Verifies monnify-signature (HMAC-SHA512 over the raw body, keyed with the merchant secret key), records the sale, sets up recurring-billing card tokens, and fans out to any connected system.",
        response: '{ "received": true }',
        status: [
          ["200", "Always — Monnify retries on non-2xx"],
          ["401", "Invalid signature"],
        ],
      },
      {
        method: "POST",
        path: "/api/webhook/whatsapp",
        auth: "Signed (Twilio)",
        internal: true,
        summary:
          "Inbound WhatsApp messages via Twilio. Verifies X-Twilio-Signature, then runs the same Flow-creation agent a browser request would, replying over WhatsApp.",
        response: "// 200 with an empty body in every case Twilio should not retry",
        status: [
          ["200", "Acknowledged"],
          ["401", "Invalid signature"],
        ],
      },
      {
        method: "GET",
        path: "/api/cron/charge-subscriptions",
        auth: "Cron secret",
        internal: true,
        summary:
          "Fired daily by Vercel Cron (see vercel.json). Charges every recurring subscription whose next cycle is due, via Monnify's card-token charge API.",
        response: '{ "charged": 3, "results": [ { "id": "...", "ok": true }, ... ] }',
        status: [
          ["200", "OK — includes per-subscription failures, doesn't fail the whole request"],
          ["401", "Missing/wrong CRON_SECRET"],
        ],
      },
    ],
  },
];

export const TYPES: { name: string; fields: string; note: string }[] = [
  {
    name: "FlowRecord",
    fields:
      "slug, title, priceNaira, ticketCap, ticketsSold, revenueNaira,\naccountReference, accountNumber?, bankName?, checkoutUrl?,\ncreatedAt, tiers?: FlowTier[], recurring?: { frequency },\nuserId?, sellerId?, lastConnectedAction?",
    note: "accountNumber/bankName/checkoutUrl are only set for single-price Flows — tiered and recurring pages don't have one fixed payment target.",
  },
  {
    name: "FlowTier",
    fields: "id, name, priceNaira, cap, sold",
    note: "One entry per named tier on a multi-tier Flow.",
  },
  {
    name: "PayoutAccount",
    fields: "subAccountCode, bankCode, bankName, accountNumber,\naccountName?, splitPercentage, createdAt",
    note: "One per user — created via POST /api/payout, referenced (not recreated) on every future sale.",
  },
  {
    name: "SellerRecord",
    fields: "sellerId, gatewayId, sourceLabel, connectedAt",
    note: "Links a browser/WhatsApp identity to a connected external system.",
  },
  {
    name: "GatewayOperation",
    fields: "name, description, method, path, params: GatewayParam[]",
    note: "One entry per endpoint a pasted API exposed. GatewayParam: name, location (path/query/header/body), type, required, description.",
  },
];
