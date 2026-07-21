import { cookies } from "next/headers";
import { getCurrentSession } from "@/lib/auth/session";
import { getFlowsByUser, claimFlowsBySeller } from "@/lib/store/flow";

// GET — the logged-in user's own Flow pages, for the account panel on /flow.
export async function GET() {
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Not logged in." }, { status: 401 });

  const sellerId = (await cookies()).get("wire_seller_id")?.value;
  if (sellerId) await claimFlowsBySeller(sellerId, session.userId);

  const flows = await getFlowsByUser(session.userId);
  return Response.json({ email: session.email, flows });
}
