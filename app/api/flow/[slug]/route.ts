import { getFlow } from "@/lib/store/flow";

// Polled by app/dashboard/[slug]/page.tsx every 3s.
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const record = await getFlow(slug);
  if (!record) {
    return Response.json({ error: `No Flow record for slug "${slug}".` }, { status: 404 });
  }
  return Response.json(record);
}
