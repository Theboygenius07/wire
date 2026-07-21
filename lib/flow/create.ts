import { runAgent } from "@/lib/openai/agent";
import { monnifyGatewayTools } from "@/lib/monnify/tools";
import { saveFlow, type FlowRecord, type FlowTier } from "@/lib/store/flow";
import { getPayoutAccount } from "@/lib/store/payout";
import type { GatewayTool } from "@/lib/gateway/types";

// The "describe it, get a payment page" pipeline — factored out of
// app/api/flow/route.ts so the WhatsApp webhook (app/api/webhook/whatsapp)
// can drive the exact same agent/Monnify sequence a browser request does,
// instead of re-deriving the reference/email-uniqueness and tiers-vs-single
// logic a second time.

// Monnify's sandbox rejects create_reserved_account with "cannot reserve more
// than 1 account(s) for a customer" if the same customerEmail is reused, so
// the reference/email must be unique per call — generated here, not invented
// by the model, since an LLM is not a reliable source of uniqueness.
function buildSystemPrompt(reference: string): string {
  const email = `flow+${reference}@wire.dev`;
  return `You are Flow, an agent that turns one plain-English sales request into a live Monnify payment page.

First check: does the request give you enough to work with? A price is required — either one overall price, a price for every named tier if there are several, or a per-cycle price if it's a subscription. A missing sales/subscriber cap is fine (default to 100), but a missing price is not. If billing should recur but the frequency isn't one of daily/weekly/monthly and doesn't clearly map to one, that also counts as missing. If anything required is missing or unclear, do NOT guess and do NOT call any tools — use NEEDS INFO mode below instead.

Otherwise, decide which ONE of these the request describes — pick exactly one mode and respond in exactly that shape, never mix modes:
- ONE price — a single one-time price.
- MULTIPLE tiers — several distinct named ticket/price levels (e.g. "VIP" and "Regular").
- RECURRING — the request explicitly wants repeat/subscription billing (words like "subscription", "monthly", "every week", "recurring").

If ONE price:
1. Extract a short title, the price in NGN, and the sales cap (if the user doesn't give a cap, use 100).
2. Call create_reserved_account with accountReference = "${reference}", accountName = the title, customerEmail = "${email}", customerName = the title.
3. Call create_invoice with invoiceReference = "${reference}", description = the title, amount = the price, customerEmail = "${email}", customerName = the title, expiryDate 30 days from now formatted "yyyy-MM-dd HH:mm:ss".
4. Once both calls succeed, respond with ONLY a JSON object — no prose, no markdown code fences — with exactly these keys:
{"title": string, "priceNaira": number, "ticketCap": number, "accountReference": string, "accountNumber": string or null, "bankName": string or null, "checkoutUrl": string or null}
Use null for any field a tool response didn't include.

If MULTIPLE tiers:
1. Extract a short overall title, and a list of tiers, each with a name, price in NGN, and cap (if the user doesn't give a cap for a tier, use 100).
2. Do NOT call any tools — a payment link for each tier is created lazily when a buyer picks one on the checkout page.
3. Respond with ONLY a JSON object — no prose, no markdown code fences — with exactly these keys:
{"title": string, "tiers": [{"name": string, "priceNaira": number, "cap": number}]}

If RECURRING:
1. Extract a short title, the price PER CYCLE in NGN, the frequency (exactly one of "daily", "weekly", or "monthly"), and a subscriber cap (if not given, use 100).
2. Do NOT call create_reserved_account — recurring billing only works off a card payment, which can't go through a bank reserved account.
3. Call create_invoice with invoiceReference = "${reference}", description = the title + " (first payment)", amount = the per-cycle price, customerEmail = "${email}", customerName = the title, expiryDate 7 days from now formatted "yyyy-MM-dd HH:mm:ss".
4. Once the call succeeds, respond with ONLY a JSON object — no prose, no markdown code fences — with exactly these keys:
{"title": string, "priceNaira": number, "ticketCap": number, "frequency": "daily" or "weekly" or "monthly", "accountReference": string, "checkoutUrl": string or null}

If NEEDS INFO (price or frequency missing/unclear):
Do NOT call any tools. Respond with ONLY a JSON object — no prose, no markdown code fences — with exactly these keys:
{"needsInfo": true, "message": string}
"message" is a short, friendly question asking for exactly what's missing — e.g. "What's the price per ticket?", "What should each tier cost?", or "How often should this charge — daily, weekly, or monthly?".`;
}

function slugifyTierName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "tier";
}

function extractJson(text: string): Record<string, unknown> {
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(stripped);
}

function randomSlug(len = 8): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, len);
}

// Neither create_invoice's nor create_reserved_account's schema exposes
// incomeSplitConfig to the model — a seller's payout routing isn't something
// an LLM should decide, it's looked up deterministically from their account
// and spliced onto the call here regardless of what args the model produced.
function withPayoutSplit(
  tools: readonly GatewayTool[],
  split: { subAccountCode: string; splitPercentage: number } | null
): GatewayTool[] {
  if (!split) return tools as GatewayTool[];
  return tools.map((tool) =>
    tool.name === "create_invoice" || tool.name === "create_reserved_account"
      ? { ...tool, handler: (args: Record<string, unknown>) => tool.handler({ ...args, incomeSplitConfig: [split] }) }
      : tool
  );
}

export type CreateFlowResult =
  | { status: "created"; slug: string; checkoutUrl: string; dashboardUrl: string; record: FlowRecord }
  | { status: "needsInfo"; message: string }
  | { status: "error"; message: string; raw?: string };

export async function createFlowFromPrompt(
  prompt: string,
  opts: { userId?: string; sellerId?: string }
): Promise<CreateFlowResult> {
  const payout = opts.userId ? await getPayoutAccount(opts.userId) : null;
  const split = payout ? { subAccountCode: payout.subAccountCode, splitPercentage: payout.splitPercentage } : null;

  const slug = randomSlug();
  const tools = withPayoutSplit(monnifyGatewayTools, split);
  const trace = await runAgent(buildSystemPrompt(slug), prompt, tools, 6);
  const lastText = [...trace].reverse().find((step) => step.type === "text");

  if (!lastText) {
    return { status: "error", message: "The agent didn't produce a final answer. Check the trace for tool errors." };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = extractJson(lastText.text);
  } catch {
    return { status: "error", message: "The agent's final answer wasn't valid JSON.", raw: lastText.text };
  }

  if (parsed.needsInfo === true) {
    return {
      status: "needsInfo",
      message: typeof parsed.message === "string" ? parsed.message : "I need a bit more info — what's the price?",
    };
  }

  const rawTiers = Array.isArray(parsed.tiers) ? parsed.tiers : undefined;
  const tiers: FlowTier[] | undefined = rawTiers?.length
    ? rawTiers.map((t: Record<string, unknown>, i: number): FlowTier => ({
        id: `${slugifyTierName(String(t.name ?? `tier-${i}`))}-${randomSlug(4)}`,
        name: String(t.name ?? `Tier ${i + 1}`),
        priceNaira: Number(t.priceNaira ?? 0),
        cap: Number(t.cap ?? 100),
        sold: 0,
      }))
    : undefined;

  const frequency =
    parsed.frequency === "daily" || parsed.frequency === "weekly" || parsed.frequency === "monthly"
      ? parsed.frequency
      : undefined;

  const record: FlowRecord = tiers
    ? {
        slug,
        title: String(parsed.title ?? "Untitled sale"),
        priceNaira: 0,
        ticketCap: tiers.reduce((sum, t) => sum + t.cap, 0),
        ticketsSold: 0,
        revenueNaira: 0,
        accountReference: slug,
        createdAt: new Date().toISOString(),
        userId: opts.userId,
        sellerId: opts.sellerId,
        tiers,
      }
    : {
        slug,
        title: String(parsed.title ?? "Untitled sale"),
        priceNaira: Number(parsed.priceNaira ?? 0),
        ticketCap: Number(parsed.ticketCap ?? 100),
        ticketsSold: 0,
        revenueNaira: 0,
        accountReference: String(parsed.accountReference ?? slug),
        accountNumber: typeof parsed.accountNumber === "string" ? parsed.accountNumber : undefined,
        bankName: typeof parsed.bankName === "string" ? parsed.bankName : undefined,
        checkoutUrl: typeof parsed.checkoutUrl === "string" ? parsed.checkoutUrl : undefined,
        createdAt: new Date().toISOString(),
        userId: opts.userId,
        sellerId: opts.sellerId,
        recurring: frequency ? { frequency } : undefined,
      };

  await saveFlow(record);

  return {
    status: "created",
    slug,
    checkoutUrl: `/checkout/${slug}`,
    dashboardUrl: `/dashboard/${slug}`,
    record,
  };
}
