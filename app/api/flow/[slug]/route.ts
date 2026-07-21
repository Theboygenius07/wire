import { getFlow, claimFlow } from "@/lib/store/flow";
import { getCurrentSession } from "@/lib/auth/session";
import { getSubscriptionsForFlow } from "@/lib/store/subscription";

// Polled by app/dashboard/[slug]/page.tsx every 3s. Requires login — a page
// created anonymously gets claimed by whoever's logged in the first time
// they view its dashboard; after that, only the owner can see it.
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const record = await getFlow(slug);
  if (!record) {
    return Response.json({ error: `No Flow record for slug "${slug}".` }, { status: 404 });
  }

  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Log in to view this dashboard." }, { status: 401 });
  }

  const owned = record.userId ? record : await claimFlow(slug, session.userId);
  if (!owned || owned.userId !== session.userId) {
    return Response.json({ error: "This dashboard belongs to another account." }, { status: 403 });
  }

  if (!owned.recurring) return Response.json(owned);

  const subscriberCount = (await getSubscriptionsForFlow(slug)).filter((s) => s.status === "active").length;
  return Response.json({ ...owned, subscriberCount });
}
