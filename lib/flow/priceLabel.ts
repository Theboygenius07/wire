import type { FlowRecord } from "@/lib/store/flow";

const FREQUENCY_LABEL = { daily: "day", weekly: "week", monthly: "month" } as const;

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/** The one-line price summary shown on link previews for a Flow's checkout
 * page — same branching as the checkout page itself (tiers vs. recurring vs.
 * flat price), condensed to a single string. */
export function flowPriceLabel(record: FlowRecord): string {
  if (record.tiers?.length) {
    return `From ${formatNaira(Math.min(...record.tiers.map((t) => t.priceNaira)))}`;
  }
  if (record.recurring) {
    return `${formatNaira(record.priceNaira)} / ${FREQUENCY_LABEL[record.recurring.frequency]}`;
  }
  return formatNaira(record.priceNaira);
}
