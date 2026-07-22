import type { FlowRecord } from "@/lib/store/flow";

// Shared by anything that hands a Flow's current state to an agent as
// context — the WhatsApp agent (status checks, edits) and the dashboard
// edit chat both need the same "here's what this Flow looks like right now"
// summary.
export function summarizeFlow(flow: FlowRecord): string {
  const lines = [
    `- slug: ${flow.slug} — "${flow.title}"`,
    flow.tiers
      ? `  tiers: ${flow.tiers.map((t) => `${t.name} (id: ${t.id}) ₦${t.priceNaira} (${t.sold}/${t.cap} sold)`).join(", ")}`
      : `  price: ₦${flow.priceNaira}, ${flow.ticketsSold}/${flow.ticketCap} sold`,
    `  revenue so far: ₦${flow.revenueNaira}`,
  ];
  if (flow.lastConnectedAction) lines.push(`  last connected-system action: ${flow.lastConnectedAction}`);
  const recentRefs = flow.processedTransactionRefs?.slice(-3);
  if (recentRefs?.length) lines.push(`  recent transactionReferences (most recent last): ${recentRefs.join(", ")}`);
  return lines.join("\n");
}
