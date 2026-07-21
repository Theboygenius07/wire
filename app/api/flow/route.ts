import { runAgent } from "@/lib/openai/agent";
import { monnifyGatewayTools } from "@/lib/monnify/tools";
import { saveFlow, type FlowRecord } from "@/lib/store/flow";
import { getCurrentSession } from "@/lib/auth/session";

// Flow: "Create a payment page for hackathon tickets, ₦5,000, cap 100" in,
// a live checkout link + dashboard out. Runs the same agent loop as
// /api/chat, but with a fixed system prompt that forces the create-account +
// create-invoice sequence and demands a single JSON answer at the end.

export const runtime = "nodejs";

// Monnify's sandbox rejects create_reserved_account with "cannot reserve more
// than 1 account(s) for a customer" if the same customerEmail is reused, so
// the reference/email must be unique per call — generated here, not invented
// by the model, since an LLM is not a reliable source of uniqueness.
function buildSystemPrompt(reference: string): string {
  const email = `flow+${reference}@wire.dev`;
  return `You are Flow, an agent that turns one plain-English sales request into a live Monnify payment page.

Given the user's request:
1. Extract a short title, the price in NGN, and the sales cap (if the user doesn't give a cap, use 100).
2. Call create_reserved_account with accountReference = "${reference}", accountName = the title, customerEmail = "${email}", customerName = the title.
3. Call create_invoice with invoiceReference = "${reference}", description = the title, amount = the price, customerEmail = "${email}", customerName = the title, expiryDate 30 days from now formatted "yyyy-MM-dd HH:mm:ss".
4. Once both calls succeed, respond with ONLY a JSON object — no prose, no markdown code fences — with exactly these keys:
{"title": string, "priceNaira": number, "ticketCap": number, "accountReference": string, "accountNumber": string or null, "bankName": string or null, "checkoutUrl": string or null}
Use null for any field a tool response didn't include.`;
}

function extractJson(text: string): Record<string, unknown> {
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(stripped);
}

function randomSlug(len = 8): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, len);
}

export async function POST(request: Request) {
  let body: { prompt?: string; sellerId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Expected a JSON body with a "prompt" field.' }, { status: 400 });
  }
  if (!body.prompt || typeof body.prompt !== "string") {
    return Response.json({ error: 'Missing "prompt".' }, { status: 400 });
  }

  const slug = randomSlug();
  const trace = await runAgent(buildSystemPrompt(slug), body.prompt, monnifyGatewayTools, 6);
  const lastText = [...trace].reverse().find((step) => step.type === "text");

  if (!lastText) {
    return Response.json({ error: "The agent didn't produce a final answer. Check the trace for tool errors." }, { status: 502 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = extractJson(lastText.text);
  } catch {
    return Response.json({ error: "The agent's final answer wasn't valid JSON.", raw: lastText.text }, { status: 502 });
  }

  // Creation stays account-free — but if the creator happens to already be
  // logged in, stamp ownership immediately instead of waiting for the
  // claim-on-first-view fallback in GET /api/flow/[slug].
  const session = await getCurrentSession();

  const record: FlowRecord = {
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
    userId: session?.userId,
    sellerId: typeof body.sellerId === "string" ? body.sellerId : undefined,
  };

  await saveFlow(record);

  return Response.json({
    slug,
    checkoutUrl: `/checkout/${slug}`,
    dashboardUrl: `/dashboard/${slug}`,
    record,
  });
}
