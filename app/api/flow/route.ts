import { createFlowFromPrompt } from "@/lib/flow/create";
import { getCurrentSession } from "@/lib/auth/session";

// Flow: "Create a payment page for hackathon tickets, ₦5,000, cap 100" in,
// a live checkout link + dashboard out. The actual agent/Monnify pipeline
// lives in lib/flow/create.ts, shared with the WhatsApp webhook — this
// route just resolves the browser session/cookie identity and translates
// the result into HTTP responses.

export const runtime = "nodejs";

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

  // Creation stays account-free — but if the creator happens to already be
  // logged in, stamp ownership immediately instead of waiting for the
  // claim-on-first-view fallback in GET /api/flow/[slug], and route their
  // payout split into the tool calls below if they've set one up.
  const session = await getCurrentSession();
  const result = await createFlowFromPrompt(body.prompt, {
    userId: session?.userId,
    sellerId: typeof body.sellerId === "string" ? body.sellerId : undefined,
  });

  if (result.status === "needsInfo") {
    return Response.json({ error: result.message }, { status: 422 });
  }
  if (result.status === "error") {
    return Response.json({ error: result.message, raw: result.raw }, { status: 502 });
  }

  return Response.json({
    slug: result.slug,
    checkoutUrl: result.checkoutUrl,
    dashboardUrl: result.dashboardUrl,
    record: result.record,
  });
}
