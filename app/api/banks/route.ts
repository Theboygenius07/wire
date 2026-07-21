import * as monnify from "@/lib/monnify/client";

export const runtime = "nodejs";

// GET — bank list for the payout-setup dropdown. Public: it's just reference
// data (bank names/codes), not tied to any account.
export async function GET() {
  try {
    const banks = await monnify.listBanks();
    return Response.json({ banks: banks.map((b) => ({ name: b.name, code: b.code })) });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
