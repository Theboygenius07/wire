# Wire

**Turn a sentence into a payment page — and turn any API into an AI agent's tools.**

Wire is two products sharing one engine:

- **Flow** — describe what you're selling in plain English (on the web, or over WhatsApp) and get back a live checkout link, a QR code, and a real-time sales dashboard. Payments run on [Monnify](https://developers.monnify.com); no code, no manual invoice setup.
- **Relay** — paste a raw `curl` command or an OpenAPI spec and get a working [MCP](https://modelcontextprotocol.io) server back: real, callable tools an AI agent (Claude Desktop, Cursor, your own agent) can use against that API immediately.

Both products are built on the same core idea: **compile an API description into a typed, callable tool**, then let an LLM agent decide when to call it. Flow uses that engine internally (against Monnify) to build payment pages from a sentence; Relay exposes that same engine directly so anyone can point it at their own API.

## How it works

### Flow — sentence to payment page

1. A seller describes a sale — *"sell tickets, ₦5,000, cap 100"* — either through the web app or by messaging Wire on WhatsApp.
2. An OpenAI-powered agent ([`lib/openai/agent.ts`](lib/openai/agent.ts)) parses the request and decides: single price, multiple tiers, or a recurring subscription.
3. The agent calls Monnify's API directly as tools ([`lib/monnify/tools.ts`](lib/monnify/tools.ts): `create_invoice`, `create_reserved_account`, `verify_transaction`, `initiate_refund`, `list_transactions`, `get_wallet_balance`) to actually create the reserved account / invoice.
4. The seller gets back a checkout link + QR code ([`app/checkout/[slug]`](app/checkout/[slug])) and a live dashboard ([`app/dashboard/[slug]`](app/dashboard/[slug])) that polls for new sales every few seconds.
5. Monnify's webhook ([`app/api/webhook/monnify`](app/api/webhook/monnify)) confirms payment (HMAC-verified), records the sale, and — if the seller connected their own system — fires a follow-up action against it (see Connect, below).
6. Recurring Flows are re-charged automatically by a daily cron job ([`app/api/cron/charge-subscriptions`](app/api/cron/charge-subscriptions)) using the card token captured on the subscriber's first payment.

### WhatsApp

The entire Flow experience is also available as a conversation. [`app/api/webhook/whatsapp`](app/api/webhook/whatsapp) receives inbound messages via Twilio, and [`lib/whatsapp/agent.ts`](lib/whatsapp/agent.ts) runs a seller-facing agent that can create a new Flow, answer "how's my sale doing?" from data it already has, or issue a refund — replying in plain conversational text, with the QR code sent back as a follow-up image.

### Connect — bring your own system

A seller can optionally connect a tool they already use (Airtable, Notion, or anything else with an API) at [`/connect`](app/connect/page.tsx). [`lib/gateway/`](lib/gateway) compiles whatever they paste — a curl command ([`parseCurl.ts`](lib/gateway/parseCurl.ts)) or an OpenAPI spec ([`parseOpenApi.ts`](lib/gateway/parseOpenApi.ts)) — into a typed tool list ([`compile.ts`](lib/gateway/compile.ts)), persisted in Redis. When a sale lands, [`lib/openai/sellerAction.ts`](lib/openai/sellerAction.ts) runs a small agent against those tools to do the obvious thing (decrement stock, log a row) — and it's explicitly fine if nothing applies.

### Relay — any API, as MCP tools

The same gateway compiler is exposed directly as a product. Paste an API at [`/relay`](app/relay/page.tsx) or the [`/playground`](app/playground/page.tsx), and Wire spins up a live MCP server ([`lib/mcp/server.ts`](lib/mcp/server.ts), served at `/api/gateway/[id]/mcp`) that any MCP client can connect to and call. [`/apidocs`](app/apidocs/page.tsx) documents Wire's own API in the same style.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, React 19) |
| Language | TypeScript |
| AI | OpenAI (Responses API) — agent loop with tool calling |
| Payments | Monnify (reserved accounts, invoices, card tokenization, refunds, payouts) |
| Messaging | Twilio (WhatsApp Business Platform) |
| Protocol | Model Context Protocol (`@modelcontextprotocol/sdk`) |
| Storage | Upstash Redis (serverless-safe shared state — gateways, Flows, sellers, sessions, subscriptions) |
| Validation | Zod |
| Styling | Tailwind CSS v4 |
| Auth | Cookie-based sessions, hashed passwords (own implementation, no third-party auth provider) |
| Deployment | Vercel (incl. Vercel Cron for recurring billing) |

## Project structure

```
app/
  page.tsx                 Wire home — Flow / Relay overview
  flow/, dev/, relay/, pricing/, connect/, playground/, apidocs/, sell/
  checkout/[slug]/         Public checkout page (+ per-product OG image)
  dashboard/[slug]/        Seller's live sales dashboard
  api/
    flow/                  Create/read Flow pages, tiered purchases, QR codes
    gateway/                Compile + serve a connected system's MCP tools
    seller/                 Seller ↔ connected-gateway link
    webhook/monnify/        Payment confirmation (HMAC-verified)
    webhook/whatsapp/       Inbound WhatsApp messages (Twilio-signed)
    cron/charge-subscriptions/  Daily recurring billing
    auth/                   Signup / login / session
lib/
  openai/                  Agent loop + the seller-action agent
  monnify/                 Monnify API client + its tools
  gateway/                 curl/OpenAPI → compiled MCP tool pipeline
  mcp/                     MCP server construction
  whatsapp/                Twilio client + the WhatsApp-facing agent
  flow/                    Prompt-to-Flow creation pipeline
  auth/                    Sessions, password hashing, users
  store/                   Redis-backed persistence (flow, seller, subscription, payout, ...)
```

## Getting started

```bash
npm install
cp .env.example .env   # fill in the keys below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See [`.env.example`](.env.example) for full context on each — summary:

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Powers every agent (Flow creation, WhatsApp, seller actions, Playground chat) |
| `MONNIFY_API_KEY` / `MONNIFY_SECRET_KEY` / `MONNIFY_CONTRACT_CODE` / `MONNIFY_BASE_URL` | Monnify sandbox/live credentials |
| `MONNIFY_WALLET_ACCOUNT_NUMBER` | Used by the `get_wallet_balance` tool |
| `MONNIFY_WEBHOOK_SECRET` | Optional override — Monnify actually signs with `MONNIFY_SECRET_KEY` |
| `NEXT_PUBLIC_APP_URL` | Base URL used to build checkout/QR links |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_NUMBER` | WhatsApp messaging via Twilio |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Shared state store (required — the app is stateless across serverless instances without it) |
| `CRON_SECRET` | Authenticates Vercel's own call to the recurring-billing cron endpoint |

### Deployment

Deploys as a standard Next.js app on Vercel. [`vercel.json`](vercel.json) wires up the daily recurring-billing cron (`/api/cron/charge-subscriptions`); set `CRON_SECRET` in the Vercel project's environment variables to match your `.env` so Vercel's scheduler is trusted.
