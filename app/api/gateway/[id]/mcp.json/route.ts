import { getGateway } from "@/lib/gateway";

// Downloadable MCP client config for a gateway generated from a pasted API.
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const entry = await getGateway(id);
  if (!entry) {
    return Response.json({ error: `No gateway found for id "${id}".` }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const manifest = {
    mcpServers: {
      [`wire-gateway-${id}`]: {
        url: `${origin}/api/gateway/${id}/mcp`,
        description: `${entry.spec.sourceLabel} — ${entry.spec.operations.length} tools: ${entry.spec.operations
          .map((op) => op.name)
          .join(", ")}`,
      },
    },
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=mcp.json",
    },
  });
}
