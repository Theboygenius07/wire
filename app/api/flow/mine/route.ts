import { getCurrentSession } from "@/lib/auth/session";
import { getFlowsByUser } from "@/lib/store/flow";

// GET — the logged-in user's own Flow pages, for the account panel on /flow.
export async function GET() {
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Not logged in." }, { status: 401 });

  const flows = await getFlowsByUser(session.userId);
  return Response.json({ email: session.email, flows });
}
