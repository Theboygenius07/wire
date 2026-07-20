import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { monnifyGatewayTools } from "../monnify/tools";
import type { GatewayTool } from "../gateway/types";

// A real MCP server: any MCP client (Claude Desktop, Cursor, this app's own
// Playground) that connects here sees `tools` and can call them. Generic over
// GatewayTool[] so both the fixed Monnify preset and any gateway generated from
// a pasted API register through the same code path.
export function createMcpServer(name: string, tools: GatewayTool[]) {
  const server = new McpServer({ name, version: "0.1.0" });

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.schema },
      (async (args: Record<string, unknown>) => {
        try {
          const result = await tool.handler(args);
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

export function createMonnifyMcpServer() {
  return createMcpServer("monnify-gateway", monnifyGatewayTools);
}
