"use client";

import { useState } from "react";

type ChatMessage = { role: "user" | "assistant"; text: string };

export function FlowEditChat({ slug, onEdited }: { slug: string; onEdited?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch(`/api/flow/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = res.ok ? data.reply : (data.error ?? "Something went wrong — try again.");
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
      if (res.ok && data.edited) onEdited?.();
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Something went wrong — try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6">
      <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">EDIT THIS FLOW</span>
      <p className="text-[13px] leading-relaxed text-muted">
        Tell it what to change — &ldquo;change the price to ₦7,000&rdquo;, &ldquo;bump the cap to 200&rdquo;.
      </p>

      {messages.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-line pt-3">
          {messages.map((m, i) => (
            <p
              key={i}
              className={`text-[13.5px] leading-relaxed ${
                m.role === "user" ? "text-ink" : "text-muted"
              }`}
            >
              <span className="font-medium">{m.role === "user" ? "You: " : "Flow: "}</span>
              {m.text}
            </p>
          ))}
        </div>
      )}

      <div className="mt-1 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="e.g. change the price to ₦7,000"
          disabled={loading}
          className="flex-1 rounded-lg border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none disabled:opacity-60"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-md bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
        >
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
