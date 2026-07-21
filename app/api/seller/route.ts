import { saveSeller, getSeller } from "@/lib/store/seller";

export async function POST(request: Request) {
  let body: { sellerId?: string; gatewayId?: string; sourceLabel?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }
  if (!body.sellerId || !body.gatewayId) {
    return Response.json({ error: 'Expected "sellerId" and "gatewayId".' }, { status: 400 });
  }
  const record = await saveSeller(body.sellerId, body.gatewayId, body.sourceLabel ?? "Connected system");
  return Response.json(record);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get("sellerId");
  if (!sellerId) {
    return Response.json({ error: 'Missing "sellerId" query param.' }, { status: 400 });
  }
  const record = await getSeller(sellerId);
  if (!record) {
    return Response.json({ error: "Not connected." }, { status: 404 });
  }
  return Response.json(record);
}
