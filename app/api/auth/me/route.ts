import { getCurrentSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }
  return Response.json({ email: session.email });
}
