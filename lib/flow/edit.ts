import * as monnify from "@/lib/monnify/client";
import { getFlow, updateFlow, type FlowRecord, type FlowTier } from "@/lib/store/flow";
import { getPayoutAccount } from "@/lib/store/payout";

// Applies an already-parsed edit request (from the dashboard chat or the
// WhatsApp agent — see their edit_flow tools) to a Flow. Deliberately no LLM
// involvement here, same split as lib/flow/create.ts: the model's job is
// turning "change the price to ₦7,000" into structured fields, this file's
// job is making that change real.
//
// The tricky part is the checkoutUrl: it's a Monnify invoice, a fixed-amount
// object created once. Changing priceNaira in Redis alone wouldn't change
// what a buyer sees on "Pay with Monnify", so a price change on a
// single-price/recurring Flow regenerates that invoice. Tiers don't need
// this at all — app/api/flow/[slug]/purchase creates their invoice lazily,
// per purchase, already reading tier.priceNaira live. The reserved account
// (bank transfer) is untouched either way — it's a permanent account, not
// price-locked to begin with.

export type FlowEditPatch = {
  title?: string;
  priceNaira?: number;
  ticketCap?: number;
  tiers?: { id: string; priceNaira?: number; cap?: number; name?: string }[];
};

export type FlowEditResult = { ok: true; record: FlowRecord } | { ok: false; error: string };

function randomSuffix(len = 6): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, len);
}

async function regenerateInvoice(record: FlowRecord, newPrice: number, newTitle: string): Promise<string | null> {
  // "~" is deliberate — the Monnify webhook only treats a "--"-containing
  // reference as a tier sale (see app/api/webhook/monnify/route.ts), so this
  // has to avoid that substring to route back to recordSale correctly.
  const reference = `${record.slug}~${randomSuffix()}`;
  const payout = record.userId ? await getPayoutAccount(record.userId) : null;
  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  const invoice = await monnify.createInvoice({
    amount: newPrice,
    invoiceReference: reference,
    description: newTitle,
    customerEmail: `flow+${reference}@wire.dev`,
    customerName: newTitle,
    expiryDate,
    incomeSplitConfig: payout
      ? [{ subAccountCode: payout.subAccountCode, splitPercentage: payout.splitPercentage }]
      : undefined,
  });
  return invoice.checkoutUrl ?? null;
}

export async function applyFlowEdit(slug: string, patch: FlowEditPatch): Promise<FlowEditResult> {
  const record = await getFlow(slug);
  if (!record) return { ok: false, error: "Flow not found." };

  if (patch.tiers?.length) {
    if (!record.tiers?.length) return { ok: false, error: "This Flow doesn't use ticket tiers." };

    const updatedTiers: FlowTier[] = record.tiers.map((tier) => ({ ...tier }));
    for (const patchTier of patch.tiers) {
      const tier = updatedTiers.find((t) => t.id === patchTier.id);
      if (!tier) return { ok: false, error: `Unknown ticket tier "${patchTier.id}".` };
      if (patchTier.priceNaira !== undefined) {
        if (patchTier.priceNaira <= 0) return { ok: false, error: "Tier price must be greater than zero." };
        tier.priceNaira = patchTier.priceNaira;
      }
      if (patchTier.cap !== undefined) {
        if (patchTier.cap < tier.sold) {
          return { ok: false, error: `Can't set "${tier.name}"'s cap below tickets already sold (${tier.sold}).` };
        }
        tier.cap = patchTier.cap;
      }
      if (patchTier.name !== undefined) tier.name = patchTier.name;
    }

    const updated = await updateFlow(slug, {
      tiers: updatedTiers,
      ticketCap: updatedTiers.reduce((sum, t) => sum + t.cap, 0),
      ...(patch.title !== undefined ? { title: patch.title } : {}),
    });
    return updated ? { ok: true, record: updated } : { ok: false, error: "Flow not found." };
  }

  if (record.tiers?.length && (patch.priceNaira !== undefined || patch.ticketCap !== undefined)) {
    return { ok: false, error: "This Flow uses ticket tiers — edit a specific tier's price or cap instead." };
  }

  if (patch.ticketCap !== undefined && patch.ticketCap < record.ticketsSold) {
    return { ok: false, error: `Can't set the cap below tickets already sold (${record.ticketsSold}).` };
  }
  if (patch.priceNaira !== undefined && patch.priceNaira <= 0) {
    return { ok: false, error: "Price must be greater than zero." };
  }
  if (patch.title === undefined && patch.priceNaira === undefined && patch.ticketCap === undefined) {
    return { ok: false, error: "Nothing to change." };
  }

  const newTitle = patch.title ?? record.title;
  let checkoutUrl = record.checkoutUrl;
  if (patch.priceNaira !== undefined && patch.priceNaira !== record.priceNaira) {
    try {
      checkoutUrl = (await regenerateInvoice(record, patch.priceNaira, newTitle)) ?? undefined;
    } catch (err) {
      return { ok: false, error: `Couldn't update the payment link: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  const updated = await updateFlow(slug, {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.priceNaira !== undefined ? { priceNaira: patch.priceNaira } : {}),
    ...(patch.ticketCap !== undefined ? { ticketCap: patch.ticketCap } : {}),
    checkoutUrl,
  });
  return updated ? { ok: true, record: updated } : { ok: false, error: "Flow not found." };
}
