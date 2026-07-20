import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMonnifyMcpServer } from "@/lib/mcp/server";

// Exposes the Monnify MCP server at /api/mcp. Point a remote-MCP-capable
// client (Claude, Cursor, etc.) at this URL and it sees the six tools from
// lib/monnify/tools.ts. Stateless mode: every request gets a fresh transport
// bound to a fresh server instance, which is the simplest thing that's
// correct for a hackathon demo (no session state to lose between requests).

export const runtime = "nodejs";

async function handle(request: Request) {
  const server = createMonnifyMcpServer();
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
