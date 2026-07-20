"use client";

import { useEffect, useState } from "react";
import { ProductHeader } from "@/components/product/ProductHeader";

type FlowPayPage = { slug: string; title: string; checkoutUrl: string; dashboardUrl: string };

const FLOWPAY_HISTORY_KEY = "wire.flowpayHistory";

type Operation = {
  name: string;
  description: string;
  method?: string;
  path?: string;
  params?: { name: string; location: string; type: string; required: boolean }[];
};

type GatewayResult = {
  id: string;
  sourceLabel: string;
  baseUrl: string;
  operations: Operation[];
};

type TraceItem =
  | { type: "reasoning"; text: string }
  | { type: "tool_call"; tool: string; input: unknown }
  | { type: "tool_result"; tool: string; output: unknown; isError?: boolean }
  | { type: "error"; message: string };

// Display-only — mirrors lib/monnify/tools.ts's names/descriptions for the
// preset cards. Not imported directly since that module pulls in server-side
// Monnify client code that has no business in a client bundle.
const MONNIFY_PRESET_OPS: Operation[] = [
  { name: "create_invoice", description: "Create a Monnify invoice — returns a checkoutUrl and a virtual account." },
  { name: "create_reserved_account", description: "Reserve a permanent virtual bank account for a customer." },
  { name: "verify_transaction", description: "Look up the status of a transaction by reference." },
  { name: "get_wallet_balance", description: "Get the merchant's available Monnify wallet balance." },
  { name: "initiate_refund", description: "Refund all or part of a transaction." },
  { name: "list_transactions", description: "Search/list transactions." },
];

async function streamChat(
  message: string,
  gatewayId: string | undefined,
  onEvent: (event: string, data: Record<string, unknown>) => void
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, gatewayId }),
  });
  if (!res.body) throw new Error("No response stream from /api/chat.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const eventLine = chunk.split("\n").find((l) => l.startsWith("event:"));
      const dataLine = chunk.split("\n").find((l) => l.startsWith("data:"));
      if (!eventLine || !dataLine) continue;
      onEvent(eventLine.slice(6).trim(), JSON.parse(dataLine.slice(5).trim()));
    }
  }
}

function OperationCard({ op }: { op: Operation }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[12.5px] font-medium text-ink">{op.name}</span>
        {op.method && (
          <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10.5px] text-accent-ink">
            {op.method}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{op.description}</p>
      {op.path && <p className="mt-1.5 font-mono text-[11px] text-muted">{op.path}</p>}
    </div>
  );
}

export default function PlaygroundPage() {
  const [gatewayInput, setGatewayInput] = useState("");
  const [authValue, setAuthValue] = useState("");
  const [gatewayResult, setGatewayResult] = useState<GatewayResult | null>(null);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [activeGatewayId, setActiveGatewayId] = useState<string | null>(null);

  const [chatMessage, setChatMessage] = useState("");
  const [trace, setTrace] = useState<TraceItem[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [flowpayPrompt, setFlowpayPrompt] = useState("");
  const [flowpayPages, setFlowpayPages] = useState<FlowPayPage[]>([]);
  const [flowpayError, setFlowpayError] = useState<string | null>(null);
  const [flowpayLoading, setFlowpayLoading] = useState(false);

  // Every FlowPay page created this browser keeps showing up here — checkout/
  // dashboard links open in a new tab specifically so navigating to one
  // doesn't unmount this page and lose this list (or the gateway/chat state
  // above it).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FLOWPAY_HISTORY_KEY);
      if (raw) setFlowpayPages(JSON.parse(raw));
    } catch {
      // Corrupt/unavailable localStorage — start with an empty history.
    }
  }, []);

  async function handleGenerateGateway() {
    setGatewayLoading(true);
    setGatewayError(null);
    setGatewayResult(null);
    try {
      const res = await fetch("/api/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: gatewayInput, authValue: authValue || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate MCP tools.");
      setGatewayResult(data);
      setActiveGatewayId(data.id);
    } catch (err) {
      setGatewayError(err instanceof Error ? err.message : String(err));
    } finally {
      setGatewayLoading(false);
    }
  }

  async function handleSendChat() {
    if (!chatMessage.trim()) return;
    setChatLoading(true);
    setTrace([]);
    const message = chatMessage;
    try {
      await streamChat(message, activeGatewayId ?? undefined, (event, data) => {
        if (event === "reasoning") {
          setTrace((t) => [...t, { type: "reasoning", text: String(data.text) }]);
        } else if (event === "tool_call") {
          setTrace((t) => [...t, { type: "tool_call", tool: String(data.tool), input: data.input }]);
        } else if (event === "tool_result") {
          setTrace((t) => [
            ...t,
            { type: "tool_result", tool: String(data.tool), output: data.output, isError: Boolean(data.isError) },
          ]);
        } else if (event === "error") {
          setTrace((t) => [...t, { type: "error", message: String(data.message) }]);
        }
      });
    } catch (err) {
      setTrace((t) => [...t, { type: "error", message: err instanceof Error ? err.message : String(err) }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleCreateFlowPay() {
    if (!flowpayPrompt.trim()) return;
    setFlowpayLoading(true);
    setFlowpayError(null);
    try {
      const res = await fetch("/api/flowpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: flowpayPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create the payment page.");
      const page: FlowPayPage = {
        slug: data.slug,
        title: data.record?.title ?? data.slug,
        checkoutUrl: data.checkoutUrl,
        dashboardUrl: data.dashboardUrl,
      };
      setFlowpayPages((pages) => {
        const next = [page, ...pages];
        localStorage.setItem(FLOWPAY_HISTORY_KEY, JSON.stringify(next));
        return next;
      });
      setFlowpayPrompt("");
    } catch (err) {
      setFlowpayError(err instanceof Error ? err.message : String(err));
    } finally {
      setFlowpayLoading(false);
    }
  }

  return (
    <>
      <ProductHeader label="Playground" />
      <main className="mx-auto max-w-6xl flex-1 px-6 py-16">
        <div className="mb-14 max-w-xl">
          <p className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">Playground</p>
          <h1 className="font-heading mt-3 text-balance text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Paste an API. Watch an agent use it.
          </h1>
        </div>

        {/* 1. Gateway generator */}
        <section className="mb-16">
          <h2 className="font-heading text-[22px] font-medium leading-snug tracking-tight text-ink">
            Paste an API <span className="text-ink/40">— curl command or OpenAPI JSON</span>
          </h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-panel-line bg-dot-grid p-6">
              <textarea
                value={gatewayInput}
                onChange={(e) => setGatewayInput(e.target.value)}
                placeholder={`curl https://api.example.com/v1/things\n\nor paste an OpenAPI JSON spec`}
                rows={8}
                className="w-full rounded-lg border border-line bg-white p-3 font-mono text-[12.5px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
              />
              <input
                value={authValue}
                onChange={(e) => setAuthValue(e.target.value)}
                placeholder="Optional auth value (bearer token / API key)"
                className="mt-3 w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
              />
              <button
                onClick={handleGenerateGateway}
                disabled={gatewayLoading || !gatewayInput.trim()}
                className="mt-4 rounded-md bg-accent px-5 py-2.5 text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
              >
                {gatewayLoading ? "Generating…" : "Generate MCP tools"}
              </button>
              {gatewayError && <p className="mt-3 text-[13px] text-ink/70">{gatewayError}</p>}
            </div>

            <div className="space-y-3">
              {gatewayResult ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-ink">{gatewayResult.sourceLabel}</p>
                    <a
                      href={`/api/gateway/${gatewayResult.id}/mcp.json`}
                      className="rounded-lg border border-line bg-white px-3 py-1.5 font-mono text-[11.5px] text-ink transition-colors hover:border-ink/20"
                    >
                      mcp.json &darr;
                    </a>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {gatewayResult.operations.map((op) => (
                      <OperationCard key={op.name} op={op} />
                    ))}
                  </div>
                </>
              ) : (
                <p className="rounded-lg border border-dashed border-line p-6 text-center text-[13px] text-muted">
                  Generated tools will show up here.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="text-muted">Active tool set for the chat panel below:</span>
            <button
              onClick={() => setActiveGatewayId(null)}
              className={`rounded-md border px-3 py-1.5 font-medium transition-colors ${
                activeGatewayId === null ? "border-ink bg-ink text-background" : "border-line text-ink hover:border-ink/20"
              }`}
            >
              Monnify preset
            </button>
            {gatewayResult && (
              <button
                onClick={() => setActiveGatewayId(gatewayResult.id)}
                className={`rounded-md border px-3 py-1.5 font-medium transition-colors ${
                  activeGatewayId === gatewayResult.id
                    ? "border-ink bg-ink text-background"
                    : "border-line text-ink hover:border-ink/20"
                }`}
              >
                {gatewayResult.sourceLabel}
              </button>
            )}
          </div>

          {activeGatewayId === null && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MONNIFY_PRESET_OPS.map((op) => (
                <OperationCard key={op.name} op={op} />
              ))}
            </div>
          )}
        </section>

        {/* 2. Live chat / trace */}
        <section className="mb-16 border-t border-line pt-14">
          <h2 className="font-heading text-[22px] font-medium leading-snug tracking-tight text-ink">
            Watch an agent <span className="text-ink/40">actually use them.</span>
          </h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-panel-line bg-dot-grid p-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="e.g. check my Monnify wallet balance"
                className="flex-1 rounded-lg border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
              />
              <button
                onClick={handleSendChat}
                disabled={chatLoading || !chatMessage.trim()}
                className="whitespace-nowrap rounded-md bg-accent px-5 py-2.5 text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
              >
                {chatLoading ? "Thinking…" : "Send"}
              </button>
            </div>

            <div className="mt-5 space-y-2.5">
              {trace.length === 0 && (
                <p className="text-[13px] text-muted">The reasoning → tool call → real response trace shows up here.</p>
              )}
              {trace.map((item, i) => {
                if (item.type === "reasoning") {
                  return (
                    <p key={i} className="font-mono text-[12px] italic text-muted">
                      {item.text}
                    </p>
                  );
                }
                if (item.type === "tool_call") {
                  return (
                    <div
                      key={i}
                      className="inline-flex w-full items-start gap-2 rounded-lg border border-line bg-white px-3 py-2 font-mono text-[11.5px] text-ink"
                    >
                      <span className="shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-accent-ink">tool_call</span>
                      <span className="break-all">
                        {item.tool}({JSON.stringify(item.input)})
                      </span>
                    </div>
                  );
                }
                if (item.type === "tool_result") {
                  return (
                    <div
                      key={i}
                      className={`inline-flex w-full items-start gap-2 rounded-lg border px-3 py-2 font-mono text-[11.5px] ${
                        item.isError ? "border-line bg-white text-ink/70" : "border-line bg-white text-ink"
                      }`}
                    >
                      <span className="shrink-0 rounded bg-ink px-1.5 py-0.5 text-background">
                        {item.isError ? "error" : "tool_result"}
                      </span>
                      <span className="break-all">
                        {item.tool}: {JSON.stringify(item.output)}
                      </span>
                    </div>
                  );
                }
                return (
                  <p key={i} className="text-[13px] text-ink/70">
                    {item.message}
                  </p>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. FlowPay */}
        <section className="border-t border-line pt-14">
          <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">FLOWPAY</span>
          <h2 className="font-heading mt-3 text-[22px] font-medium leading-snug tracking-tight text-ink">
            One sentence, <span className="text-ink/40">one working product.</span>
          </h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-panel-line bg-dot-grid p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={flowpayPrompt}
                onChange={(e) => setFlowpayPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFlowPay()}
                placeholder="Create a payment page for hackathon tickets, ₦5,000, cap 100"
                className="flex-1 rounded-lg border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
              />
              <button
                onClick={handleCreateFlowPay}
                disabled={flowpayLoading || !flowpayPrompt.trim()}
                className="whitespace-nowrap rounded-md bg-accent px-5 py-2.5 text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
              >
                {flowpayLoading ? "Building…" : "Create payment page"}
              </button>
            </div>

            {flowpayError && <p className="mt-4 text-[13px] text-ink/70">{flowpayError}</p>}

            {flowpayPages.length > 0 && (
              <div className="mt-5 space-y-2">
                {flowpayPages.map((page) => (
                  <div
                    key={page.slug}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-4"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <p className="text-[13.5px] text-ink">{page.title}</p>
                    <div className="ml-auto flex gap-3">
                      <a
                        href={page.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13.5px] font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
                      >
                        Checkout
                      </a>
                      <a
                        href={page.dashboardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13.5px] font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
                      >
                        Dashboard
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
