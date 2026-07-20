import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "@/lib/mcp/server";
import { compileSpec, getGateway } from "@/lib/gateway";

// Same stateless Streamable HTTP pattern as /api/mcp, but for a gateway
// generated from a pasted API instead of the fixed Monnify preset. Looks the
// spec up by id every request — no session state to lose between requests.

export const runtime = "nodejs";

async function handle(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const entry = getGateway(id);
  if (!entry) {
    return Response.json({ error: `No gateway found for id "${id}" — it may have been generated before a server restart.` }, { status: 404 });
  }

  const tools = compileSpec(entry.spec, entry.authValue);
  const server = createMcpServer(`gateway-${id}`, tools);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
