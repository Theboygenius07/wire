import OpenAI from "openai";
import { z } from "zod";
import type { GatewayTool } from "../gateway/types";

// Shared OpenAI (Responses API) tool-use loop. Both the Playground "live test
// chat" and the FlowPay orchestrator run through here, bound to whatever tool
// list the caller passes in — the Monnify preset, or a gateway generated from
// a pasted API. Same tools lib/mcp/server.ts exposes over MCP — one gateway,
// many consumers. Reads OPENAI_API_KEY from the environment.

const openai = new OpenAI();
const MODEL = "gpt-5-mini";

export type TraceStep =
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | { type: "tool_call"; tool: string; input: unknown }
  | { type: "tool_result"; tool: string; output: unknown; isError?: boolean };

// Minimal shapes for what we actually read off Responses API output items —
// verified directly against the live API rather than the full SDK types,
// which are large and mostly irrelevant here.
type ResponseItem =
  | { type: "reasoning"; summary?: Array<{ type: string; text: string }> }
  | { type: "message"; role: string; content?: Array<{ type: string; text?: string }> }
  | { type: "function_call"; name: string; arguments: string; call_id: string }
  | { type: string; [key: string]: unknown };

export async function runAgent(
  systemPrompt: string,
  userMessage: string,
  tools: GatewayTool[],
  maxTurns = 6,
  onStep?: (step: TraceStep) => void
): Promise<TraceStep[]> {
  // strict:false — some tool schemas have optional fields (e.g. `page` on
  // list_transactions), which OpenAI's strict:true function-calling mode
  // rejects.
  const openaiTools = tools.map((t) => ({
    type: "function" as const,
    name: t.name,
    description: t.description,
    parameters: z.toJSONSchema(z.object(t.schema)),
    strict: false,
  }));
  const toolByName = new Map(tools.map((t) => [t.name, t]));

  const trace: TraceStep[] = [];
  const push = (step: TraceStep) => {
    trace.push(step);
    onStep?.(step);
  };

  let input: unknown[] = [{ role: "user", content: userMessage }];

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await openai.responses.create({
      model: MODEL,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input: input as any,
      instructions: systemPrompt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: openaiTools as any,
      reasoning: { summary: "auto" },
    });

    const output = (response.output ?? []) as unknown as ResponseItem[];
    let sawToolUse = false;
    const functionCalls: Extract<ResponseItem, { type: "function_call" }>[] = [];

    for (const item of output) {
      if (item.type === "reasoning") {
        const text = item.summary?.map((s) => s.text).join("\n\n");
        if (text) push({ type: "thinking", text });
      } else if (item.type === "message") {
        const text = item.content
          ?.filter((c) => c.type === "output_text" && c.text)
          .map((c) => c.text)
          .join("");
        if (text) push({ type: "text", text });
      } else if (item.type === "function_call") {
        sawToolUse = true;
        functionCalls.push(item as Extract<ResponseItem, { type: "function_call" }>);
        let parsedInput: unknown = {};
        try {
          parsedInput = JSON.parse(item.arguments || "{}");
        } catch {
          // Leave as {} — the tool handler below will fail loudly with a clearer error.
        }
        push({ type: "tool_call", tool: item.name, input: parsedInput });
      }
    }

    input = input.concat(output as unknown[]);
    if (!sawToolUse) break;

    for (const fc of functionCalls) {
      const tool = toolByName.get(fc.name);
      let outputResult: unknown;
      let isError = false;
      try {
        if (!tool) throw new Error(`Unknown tool ${fc.name}`);
        outputResult = await tool.handler(JSON.parse(fc.arguments || "{}"));
      } catch (err) {
        isError = true;
        outputResult = { error: err instanceof Error ? err.message : String(err) };
      }
      push({ type: "tool_result", tool: fc.name, output: outputResult, isError });
      input.push({
        type: "function_call_output",
        call_id: fc.call_id,
        output: JSON.stringify(outputResult),
      });
    }
  }

  return trace;
}
