import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { monnifyTools } from "../monnify/tools";

// A real MCP server: any MCP client (Claude Desktop, Cursor, this app's own
// Playground) that connects here sees these six tools and can call them.
export function createMonnifyMcpServer() {
  const server = new McpServer({ name: "monnify-gateway", version: "0.1.0" });

  for (const tool of monnifyTools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.schema },
      (async (args: Record<string, unknown>) => {
        try {
          const result = await (tool.handler as (a: typeof args) => Promise<unknown>)(args);
          return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          return {
            content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }) as Parameters<typeof server.registerTool>[2]
    );
  }

  return server;
}
