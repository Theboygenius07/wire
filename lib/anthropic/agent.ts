import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { monnifyTools } from "../monnify/tools";

// Shared Claude tool-use loop. Both the Playground "live test chat" and the
// FlowPay orchestrator run through here, bound to the exact same tool list
// that lib/mcp/server.ts exposes over MCP — one gateway, two consumers.

const anthropic = new Anthropic();
const MODEL = "claude-opus-4-8";

export type TraceStep =
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | { type: "tool_call"; tool: string; input: unknown }
  | { type: "tool_result"; tool: string; output: unknown; isError?: boolean };

const anthropicTools = monnifyTools.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: z.toJSONSchema(z.object(t.schema)),
})) as unknown as Anthropic.Tool[];

const toolByName = new Map(monnifyTools.map((t) => [t.name, t]));

export async function runAgent(systemPrompt: string, userMessage: string, maxTurns = 6): Promise<TraceStep[]> {
  const trace: TraceStep[] = [];
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMessage }];

  for (let turn = 0; turn < maxTurns; turn++) {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive", display: "summarized" },
      system: systemPrompt,
      tools: anthropicTools,
      messages,
    });
    const response = await stream.finalMessage();

    let sawToolUse = false;
    for (const block of response.content) {
      if (block.type === "text") {
        trace.push({ type: "text", text: block.text });
      } else if (block.type === "thinking") {
        trace.push({ type: "thinking", text: block.thinking });
      } else if (block.type === "tool_use") {
        sawToolUse = true;
        trace.push({ type: "tool_call", tool: block.name, input: block.input });
      }
    }

    messages.push({ role: "assistant", content: response.content });
    if (!sawToolUse) break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const tool = toolByName.get(block.name as (typeof monnifyTools)[number]["name"]);
      let output: unknown;
      let isError = false;
      try {
        if (!tool) throw new Error(`Unknown tool ${block.name}`);
        output = await (tool.handler as (a: unknown) => Promise<unknown>)(block.input);
      } catch (err) {
        isError = true;
        output = { error: err instanceof Error ? err.message : String(err) };
      }
      trace.push({ type: "tool_result", tool: block.name, output, isError });
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(output),
        is_error: isError,
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return trace;
}
