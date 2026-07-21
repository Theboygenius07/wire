import { parseInput, saveGateway } from "@/lib/gateway";

// POST { input: string, authValue?: string } — parses a pasted curl command or
// OpenAPI spec, compiles it into a GatewaySpec, and registers it so the
// Playground can point /api/gateway/[id]/mcp and the live chat panel at it.
export async function POST(request: Request) {
  let body: { input?: string; authValue?: string; persist?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body with an \"input\" field." }, { status: 400 });
  }

  if (!body.input || typeof body.input !== "string") {
    return Response.json({ error: 'Missing "input" — paste a curl command or OpenAPI spec.' }, { status: 400 });
  }

  let spec;
  let extractedAuthValue: string | undefined;
  try {
    const parsed = parseInput(body.input);
    spec = parsed.spec;
    extractedAuthValue = parsed.authValue;
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }

  const authValue = body.authValue || extractedAuthValue;
  const id = await saveGateway(spec, authValue, { persist: body.persist === true });

  return Response.json({
    id,
    sourceLabel: spec.sourceLabel,
    baseUrl: spec.baseUrl,
    auth: spec.auth,
    operations: spec.operations.map((op) => ({
      name: op.name,
      description: op.description,
      method: op.method,
      path: op.path,
      params: op.params,
    })),
  });
}
