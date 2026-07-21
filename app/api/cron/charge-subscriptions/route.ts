import * as monnify from "@/lib/monnify/client";
import { recordSale } from "@/lib/store/flow";
import {
  getDueSubscriptions,
  markSubscriptionCharged,
  markSubscriptionFailed,
  addCycle,
} from "@/lib/store/subscription";

// Fired daily by Vercel Cron (see vercel.json) — charges every subscription
// whose nextChargeAt has passed. Auth: Vercel automatically sends
// `Authorization: Bearer $CRON_SECRET` on cron-triggered requests when
// CRON_SECRET is set in the project's env vars, so this route is only ever
// reachable by the scheduler (or anyone who knows that secret).
//
// Bookkeeping is handled directly here from chargeCardToken's own response,
// not via the Monnify webhook — the paymentReference generated below
// doesn't decode to a real Flow slug, so even if Monnify's webhook also
// fires for these transactions, recordSale on that malformed reference is a
// harmless no-op rather than a double-count.

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await getDueSubscriptions(Date.now());
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const sub of due) {
    const paymentReference = `charge-${sub.id}-${Date.now()}`;
    try {
      await monnify.chargeCardToken({
        cardToken: sub.cardToken,
        amount: sub.amountNaira,
        customerName: sub.customerName,
        customerEmail: sub.customerEmail,
        paymentReference,
        paymentDescription: `Recurring charge (${sub.frequency})`,
      });
      await recordSale(sub.flowSlug, sub.amountNaira, paymentReference);
      await markSubscriptionCharged(sub.id, addCycle(new Date(), sub.frequency).toISOString());
      results.push({ id: sub.id, ok: true });
    } catch (err) {
      await markSubscriptionFailed(sub.id);
      results.push({ id: sub.id, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return Response.json({ charged: results.length, results });
}
