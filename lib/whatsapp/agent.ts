import { z } from "zod";
import { runAgent, type TraceStep } from "@/lib/openai/agent";
import { monnifyGatewayTools } from "@/lib/monnify/tools";
import { createFlowFromPrompt } from "@/lib/flow/create";
import { applyFlowEdit, type FlowEditPatch } from "@/lib/flow/edit";
import { summarizeFlow } from "@/lib/flow/summarize";
import type { FlowRecord } from "@/lib/store/flow";
import type { GatewayTool } from "@/lib/gateway/types";

// The per-message WhatsApp agent — one call per incoming message, deciding
// whether the sender is describing a brand new sale ("sell tickets, ₦5,000,
// cap 100") or acting on something they already own ("how's my sale doing",
// "refund the last one"). Unlike app/api/flow/route.ts's agent, the final
// answer here is a plain conversational reply (sent back as-is over
// WhatsApp), not a JSON contract.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function buildSystemPrompt(flows: FlowRecord[]): string {
  const ownedSection = flows.length
    ? `This sender already owns these Flow pages:\n${flows.map(summarizeFlow).join("\n")}`
    : "This sender doesn't own any Flow pages yet.";

  return `You are Flow, replying to a WhatsApp conversation. Someone can message you to create a payment page ("sell tickets, ₦5,000, cap 100"), check on / act on one they already have ("how's my sale doing", "refund the last one"), or edit one ("change the price to ₦7,000", "bump the cap to 200", "raise VIP to ₦12,000").

${ownedSection}

Decide, for this message:
- If it describes a NEW sale (a price and what's being sold, not referring to something above) — call create_flow with the sender's raw request text as the "prompt" argument. Do this even if they already own other Flows; a new request means a new page, not editing an old one.
- If it asks to CHANGE something about a Flow already listed above (price, cap, title, or a tier's price/cap/name) — call edit_flow with that Flow's slug and only the fields that are changing. For a tiered Flow, match the tier by name to find its id (shown above) and set tierId/tierPriceNaira/tierCap/tierName instead of the top-level priceNaira/ticketCap fields.
- If it refers to something already listed above without asking to change it (a status check, a refund, "the last one") — answer directly from the data already given above where possible (ticketsSold/ticketCap/revenueNaira/lastConnectedAction already tell you "how's my sale doing"). Only call initiate_refund when they explicitly ask for a refund, using the most recent transactionReference listed for that Flow.
- Never call create_invoice or create_reserved_account directly — always go through create_flow for anything that creates a new payment page; those two are only for internal use by create_flow itself.
- If the request is ambiguous (e.g. they own several Flows and it's unclear which one they mean), ask a short clarifying question instead of guessing.

Reply with ONLY the plain-text message to send back over WhatsApp — no JSON, no markdown code fences, no headers. Keep it short and conversational, in the same tone as "Sold 12/100 so far, ₦60,000 in." When a new Flow is created, include its checkout link and mention a QR code is coming separately. When an edit succeeds, confirm briefly what changed.`;
}

export type WhatsAppAgentResult = {
  reply: string;
  /** Set only when this message created a new Flow — the webhook route
   * uses it to build a QR image URL (app/api/flow/[slug]/qr) and send it as
   * a follow-up image, since Twilio needs a public image URL rather than
   * uploaded bytes. */
  createdSlug?: string;
};

export async function runWhatsAppAgent(
  message: string,
  flows: FlowRecord[],
  sellerId: string
): Promise<WhatsAppAgentResult> {
  const createFlowTool: GatewayTool = {
    name: "create_flow",
    description: "Create a brand new Flow payment page from a plain-English sales request. Returns the live checkout link.",
    schema: {
      prompt: z.string().describe("The sender's original request, e.g. 'sell tickets, ₦5,000, cap 100'"),
    },
    handler: (args) => createFlowForSeller(args, sellerId),
  };

  const editFlowTool: GatewayTool = {
    name: "edit_flow",
    description:
      "Change an existing Flow's title, price, or ticket cap — or a specific tier's price/cap/name for a tiered Flow.",
    schema: {
      slug: z.string().describe("The slug of the Flow to edit, from the list above"),
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
      return applyFlowEdit(String(args.slug ?? ""), patch);
    },
  };

  const tools: GatewayTool[] = [
    createFlowTool,
    editFlowTool,
    ...monnifyGatewayTools.filter((t) => t.name === "initiate_refund"),
  ];

  const trace = await runAgent(buildSystemPrompt(flows), message, tools, 6);
  const lastText = [...trace].reverse().find((step): step is Extract<TraceStep, { type: "text" }> => step.type === "text");
  const createResult = [...trace]
    .reverse()
    .find(
      (step): step is Extract<TraceStep, { type: "tool_result" }> =>
        step.type === "tool_result" && step.tool === "create_flow" && !step.isError
    );

  const createdSlug =
    createResult && typeof createResult.output === "object" && createResult.output !== null
      ? (createResult.output as { slug?: string }).slug
      : undefined;

  return {
    reply: lastText?.text ?? "Sorry, something went wrong on my end — try again in a moment.",
    createdSlug,
  };
}

async function createFlowForSeller(args: Record<string, unknown>, sellerId: string) {
  const prompt = String(args.prompt ?? "");
  const result = await createFlowFromPrompt(prompt, { sellerId });
  if (result.status === "created") {
    return {
      status: "created",
      title: result.record.title,
      slug: result.slug,
      checkoutUrl: `${APP_URL}${result.checkoutUrl}`,
    };
  }
  return result;
}
