import { z } from "zod";
import { runAgent, type TraceStep } from "@/lib/openai/agent";
import { getFlow } from "@/lib/store/flow";
import { getCurrentSession } from "@/lib/auth/session";
import { applyFlowEdit, type FlowEditPatch } from "@/lib/flow/edit";
import { summarizeFlow } from "@/lib/flow/summarize";
import type { GatewayTool } from "@/lib/gateway/types";

// The dashboard's "edit by chatting" box — same idea as the WhatsApp agent's
// edit_flow tool (lib/whatsapp/agent.ts), simplified since the slug is
// already fixed by the route: no "which Flow do you mean" disambiguation,
// and the tool doesn't need a slug argument at all.

export const runtime = "nodejs";

function buildSystemPrompt(record: NonNullable<Awaited<ReturnType<typeof getFlow>>>): string {
  return `You are Flow, helping a seller edit their payment page through a chat box on their dashboard. Here's the Flow's current state:

${summarizeFlow(record)}

If their message asks to change the title, price, ticket cap, or (for a tiered Flow) a specific tier's price/cap/name — call edit_flow with only the fields that are changing. For a tiered Flow, match the tier by name to find its id from the list above, and set tierId/tierPriceNaira/tierCap/tierName instead of the top-level priceNaira/ticketCap fields (those don't apply to a tiered Flow).

If the message isn't actually an edit request (a question, small talk, something unrelated), just answer briefly — don't call edit_flow unless something should actually change.

Reply with ONLY the plain-text message to show back in the chat — no JSON, no markdown code fences. Keep it short. When an edit succeeds, confirm briefly what changed; if it fails, say why in plain terms.`;
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const record = await getFlow(slug);
  if (!record) return Response.json({ error: `No Flow record for slug "${slug}".` }, { status: 404 });

  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Log in to edit this Flow." }, { status: 401 });
  if (record.userId !== session.userId) {
    return Response.json({ error: "This Flow belongs to another account." }, { status: 403 });
  }

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }
  if (!body.message || typeof body.message !== "string") {
    return Response.json({ error: 'Missing "message".' }, { status: 400 });
  }

  const editFlowTool: GatewayTool = {
    name: "edit_flow",
    description:
      "Change this Flow's title, price, or ticket cap — or a specific tier's price/cap/name for a tiered Flow.",
    schema: {
      title: z.string().optional().describe("New title"),
      priceNaira: z.number().positive().optional().describe("New price in NGN — only for a Flow without tiers"),
      ticketCap: z.number().int().positive().optional().describe("New sales cap — only for a Flow without tiers"),
      tierId: z.string().optional().describe("For a tiered Flow: which tier (id, shown above) to edit"),
      tierPriceNaira: z.number().positive().optional().describe("New price for that tier"),
      tierCap: z.number().int().positive().optional().describe("New cap for that tier"),
      tierName: z.string().optional().describe("New name for that tier"),
    },
    handler: (args) => {
      const patch: FlowEditPatch = {
        title: typeof args.title === "string" ? args.title : undefined,
        priceNaira: typeof args.priceNaira === "number" ? args.priceNaira : undefined,
        ticketCap: typeof args.ticketCap === "number" ? args.ticketCap : undefined,
        tiers:
          typeof args.tierId === "string"
            ? [
                {
                  id: args.tierId,
                  priceNaira: typeof args.tierPriceNaira === "number" ? args.tierPriceNaira : undefined,
                  cap: typeof args.tierCap === "number" ? args.tierCap : undefined,
                  name: typeof args.tierName === "string" ? args.tierName : undefined,
                },
              ]
            : undefined,
      };
      return applyFlowEdit(slug, patch);
    },
  };

  const trace = await runAgent(buildSystemPrompt(record), body.message, [editFlowTool], 4);
  const lastText = [...trace].reverse().find((step): step is Extract<TraceStep, { type: "text" }> => step.type === "text");
  const edited = trace.some(
    (step) => step.type === "tool_result" && step.tool === "edit_flow" && !step.isError
  );

  return Response.json({
    reply: lastText?.text ?? "Sorry, something went wrong on my end — try again in a moment.",
    edited,
  });
}
