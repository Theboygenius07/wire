import { runAgent } from "./agent";
import type { GatewayTool } from "../gateway/types";

// Runs after a sale is confirmed, against whatever tools a seller connected
// via /connect — NOT Monnify's tools, the payment is already handled by the
// time this runs. Deliberately generic: we don't know ahead of time what a
// seller's own system exposes, so the model has to decide whether anything
// here is actually relevant, and it's explicitly fine if nothing is.

const SYSTEM_PROMPT = `A sale just happened on a seller's payment page. You have tools from a system the seller connected themselves — their own inventory, bookkeeping, or similar tool. This is NOT a payment system; the money has already been handled separately and none of these tools should be used to move money.

Look at the sale and the available tools. If one clearly reflects this sale — reducing a stock count, logging an income entry, anything in that spirit — call it. If nothing in the tool list is actually relevant, don't force a call: doing nothing is a correct outcome.

When you're done, respond with ONLY a short plain-English sentence describing what you did or didn't do — no JSON, no markdown, under 15 words. Examples: "Reduced stock count by 1." or "No relevant action found in the connected tools."`;

export async function runSellerAction(saleDescription: string, tools: GatewayTool[]): Promise<string> {
  if (tools.length === 0) return "No action taken — connected system has no usable tools.";

  const trace = await runAgent(SYSTEM_PROMPT, saleDescription, tools, 4);
  const lastText = [...trace].reverse().find((step) => step.type === "text");
  return lastText?.text?.trim() || "No action taken.";
}
