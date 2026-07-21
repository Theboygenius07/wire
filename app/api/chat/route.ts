import { runAgent, type TraceStep } from "@/lib/gemini/agent";
import { monnifyGatewayTools } from "@/lib/monnify/tools";
import { compileSpec, getGateway } from "@/lib/gateway";

// Playground "live test chat" backend. Streams SSE events (reasoning, tool_call,
// tool_result, error, done) as the Gemini tool-use loop in lib/gemini/agent.ts
// progresses — bound to either the Monnify preset or a gateway generated from a
// pasted API, selected by gatewayId.

export const runtime = "nodejs";

const SYSTEM_PROMPT =
  "You are Wire's Playground assistant. You have tools available — use them to answer the user's request, then summarize what happened in plain English.";

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  let body: { message?: string; gatewayId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body with a \"message\" field." }, { status: 400 });
  }

  if (!body.message || typeof body.message !== "string") {
    return Response.json({ error: 'Missing "message".' }, { status: 400 });
  }

  let tools = monnifyGatewayTools;
  if (body.gatewayId) {
    const entry = await getGateway(body.gatewayId);
    if (!entry) {
      return Response.json({ error: `No gateway found for id "${body.gatewayId}".` }, { status: 404 });
    }
    tools = compileSpec(entry.spec, entry.authValue);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sseEvent(event, data)));

      try {
        await runAgent(SYSTEM_PROMPT, body.message!, tools, 6, (step: TraceStep) => {
          if (step.type === "thinking" || step.type === "text") {
            send("reasoning", { text: step.text });
          } else if (step.type === "tool_call") {
            send("tool_call", { tool: step.tool, input: step.input });
          } else if (step.type === "tool_result") {
            send("tool_result", { tool: step.tool, output: step.output, isError: step.isError });
          }
        });
        send("done", {});
      } catch (err) {
        send("error", { message: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
