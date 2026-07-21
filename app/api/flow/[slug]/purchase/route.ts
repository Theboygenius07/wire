import * as monnify from "@/lib/monnify/client";
import { getFlow } from "@/lib/store/flow";
import { getPayoutAccount } from "@/lib/store/payout";

// POST { tierId } — for multi-tier Flow pages only. There's no fixed invoice
// created up front (see app/api/flow/route.ts): a buyer picks a tier on the
// checkout page, and this creates a one-off Monnify invoice for that tier's
// price. The invoiceReference embeds slug + tierId so the webhook can route
// the eventual payment back to the right tier without a separate lookup.

export const runtime = "nodejs";

function randomSuffix(len = 6): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, len);
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let body: { tierId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Expected a JSON body with a "tierId" field.' }, { status: 400 });
  }
  if (!body.tierId) {
    return Response.json({ error: 'Missing "tierId".' }, { status: 400 });
  }

  const record = await getFlow(slug);
  if (!record) return Response.json({ error: "Not found." }, { status: 404 });
  if (!record.tiers?.length) {
    return Response.json({ error: "This Flow page doesn't use ticket tiers." }, { status: 400 });
  }

  const tier = record.tiers.find((t) => t.id === body.tierId);
  if (!tier) return Response.json({ error: "Unknown ticket tier." }, { status: 404 });
  if (tier.sold >= tier.cap) return Response.json({ error: "This tier is sold out." }, { status: 409 });

  // Double-dash delimited: slugs are hex-only and tier ids are
  // name-then-hex, so neither can contain "--" and the webhook can split on
  // it unambiguously.
  const purchaseReference = `${slug}--${tier.id}--${randomSuffix()}`;
  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  const payout = record.userId ? await getPayoutAccount(record.userId) : null;

  try {
    const invoice = await monnify.createInvoice({
      amount: tier.priceNaira,
      invoiceReference: purchaseReference,
      description: `${record.title} — ${tier.name}`,
      customerEmail: `flow+${purchaseReference}@wire.dev`,
      customerName: record.title,
      expiryDate,
      incomeSplitConfig: payout
        ? [{ subAccountCode: payout.subAccountCode, splitPercentage: payout.splitPercentage }]
        : undefined,
    });
    return Response.json({ checkoutUrl: invoice.checkoutUrl ?? null });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
