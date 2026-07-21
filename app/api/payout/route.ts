import { getCurrentSession } from "@/lib/auth/session";
import { getPayoutAccount, savePayoutAccount } from "@/lib/store/payout";
import * as monnify from "@/lib/monnify/client";

export const runtime = "nodejs";

// GET — the logged-in user's payout account, if they've set one up.
export async function GET() {
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Not logged in." }, { status: 401 });

  const account = await getPayoutAccount(session.userId);
  return Response.json({ account });
}

// POST { bankCode, accountNumber, bankName? } — creates a Monnify sub-account
// for this user (once) so future sales can split straight to their bank
// account instead of pooling in the platform's wallet. Defaults to a 100%
// split (the seller keeps everything) since no platform fee has been decided.
export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Not logged in." }, { status: 401 });

  let body: { bankCode?: string; bankName?: string; accountNumber?: string; splitPercentage?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }
  if (!body.bankCode || !body.accountNumber) {
    return Response.json({ error: 'Missing "bankCode" or "accountNumber".' }, { status: 400 });
  }

  const splitPercentage = typeof body.splitPercentage === "number" ? body.splitPercentage : 100;

  try {
    const [created] = await monnify.createSubAccount({
      bankCode: body.bankCode,
      accountNumber: body.accountNumber,
      email: session.email,
      defaultSplitPercentage: splitPercentage,
    });
    if (!created?.subAccountCode) {
      throw new Error("Monnify didn't return a sub-account code.");
    }

    const account = await savePayoutAccount(session.userId, {
      subAccountCode: created.subAccountCode,
      bankCode: body.bankCode,
      bankName: created.bankName ?? (typeof body.bankName === "string" ? body.bankName : ""),
      accountNumber: body.accountNumber,
      accountName: created.accountName,
      splitPercentage,
      createdAt: new Date().toISOString(),
    });

    return Response.json({ account });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
