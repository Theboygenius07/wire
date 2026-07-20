import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { GatewayTool } from "../gateway/types";

// Shared Gemini tool-use loop. Both the Playground "live test chat" and the
// FlowPay orchestrator run through here, bound to whatever tool list the
// caller passes in — the Monnify preset, or a gateway generated from a pasted
// API. Same tools lib/mcp/server.ts exposes over MCP — one gateway, many
// consumers. Reads GEMINI_API_KEY (or GOOGLE_API_KEY) from the environment.

const genai = new GoogleGenAI({});
const MODEL = "gemini-3.1-flash-lite";

export type TraceStep =
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | { type: "tool_call"; tool: string; input: unknown }
  | { type: "tool_result"; tool: string; output: unknown; isError?: boolean };

type Part = {
  text?: string;
  thought?: boolean;
  functionCall?: { id?: string; name?: string; args?: Record<string, unknown> };
  functionResponse?: { id?: string; name?: string; response?: Record<string, unknown> };
};
type Content = { role: "user" | "model"; parts: Part[] };

export async function runAgent(
  systemPrompt: string,
  userMessage: string,
  tools: GatewayTool[],
  maxTurns = 6,
  onStep?: (step: TraceStep) => void
): Promise<TraceStep[]> {
  const functionDeclarations = tools.map((t) => ({
    name: t.name,
    description: t.description,
    parametersJsonSchema: z.toJSONSchema(z.object(t.schema)),
  }));
  const toolByName = new Map(tools.map((t) => [t.name, t]));

  const trace: TraceStep[] = [];
  const push = (step: TraceStep) => {
    trace.push(step);
    onStep?.(step);
  };

  const contents: Content[] = [{ role: "user", parts: [{ text: userMessage }] }];

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await genai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations }],
        thinkingConfig: { includeThoughts: true },
      },
    });

    const parts = (response.candidates?.[0]?.content?.parts ?? []) as Part[];
    let sawToolUse = false;

    for (const part of parts) {
      if (part.functionCall) {
        sawToolUse = true;
        push({ type: "tool_call", tool: part.functionCall.name ?? "", input: part.functionCall.args ?? {} });
      } else if (part.text) {
        push({ type: part.thought ? "thinking" : "text", text: part.text });
      }
    }

    contents.push({ role: "model", parts });
    if (!sawToolUse) break;

    const responseParts: Part[] = [];
    for (const part of parts) {
      if (!part.functionCall) continue;
      const name = part.functionCall.name ?? "";
      const tool = toolByName.get(name);
      let output: unknown;
      let isError = false;
      try {
        if (!tool) throw new Error(`Unknown tool ${name}`);
        output = await tool.handler(part.functionCall.args ?? {});
      } catch (err) {
        isError = true;
        output = { error: err instanceof Error ? err.message : String(err) };
      }
      push({ type: "tool_result", tool: name, output, isError });
      responseParts.push({
        functionResponse: {
          id: part.functionCall.id,
          name,
          response: isError ? { error: output } : { output },
        },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return trace;
}
