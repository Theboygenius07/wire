import { monnifyTools } from "@/lib/monnify/tools";

// Downloadable MCP client config for the Monnify preset, generated from the
// same tool list /api/mcp registers — so the tool name list can't drift from
// what's actually running.
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  const manifest = {
    mcpServers: {
      "wire-monnify": {
        url: `${origin}/api/mcp`,
        description: `Wire's Monnify gateway — ${monnifyTools.length} tools: ${monnifyTools
          .map((t) => t.name)
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
