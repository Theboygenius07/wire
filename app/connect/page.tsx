"use client";

import { useEffect, useRef, useState } from "react";
import { ProductHeader } from "@/components/product/ProductHeader";
import { RepelDotGrid } from "@/components/landing/RepelDotGrid";
import { getOrCreateSellerId } from "@/lib/seller/token";

type ConnectedState = { gatewayId: string; sourceLabel: string };
type GuideKey = "airtable" | "notion";

const guides: Record<GuideKey, { label: string; tokenUrl: string; tokenLabel: string; steps: string[]; note?: string }> = {
  airtable: {
    label: "Airtable",
    tokenUrl: "https://airtable.com/create/tokens",
    tokenLabel: "airtable.com/create/tokens",
    steps: [
      "Open the link above (you'll need to be logged into Airtable) and click \"Create new token.\"",
      "Give it a name, then add the scopes data.records:read and data.records:write.",
      "Pick the base you want connected, then click \"Create token\" — copy it immediately, it's only shown once.",
      "Open your base, go to Help → API documentation, and copy the web address shown near the top.",
    ],
  },
  notion: {
    label: "Notion",
    tokenUrl: "https://www.notion.so/my-integrations",
    tokenLabel: "notion.so/my-integrations",
    steps: [
      "Open the link above and click \"+ New integration.\" Name it, pick your workspace, and choose \"Internal.\"",
      "Click Submit, then click \"Show\" next to Internal Integration Token and copy it (starts with secret_).",
      "Important: open the actual Notion page or database you want connected, click Share → Invite, and add your integration by name — without this step it can't see anything.",
    ],
    note: "Notion's setup is a bit more involved than Airtable's — if this feels like too much, it's fine to skip and connect something simpler instead.",
  },
};

export default function ConnectPage() {
  // Not render state — read once from the cookie and only touched inside
  // event handlers, so a ref avoids the extra render a useState would cause.
  const sellerIdRef = useRef<string | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [connected, setConnected] = useState<ConnectedState | null>(null);

  const [input, setInput] = useState("");
  const [authValue, setAuthValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGuide, setActiveGuide] = useState<GuideKey | null>(null);

  useEffect(() => {
    const id = getOrCreateSellerId();
    sellerIdRef.current = id;
    fetch(`/api/seller?sellerId=${encodeURIComponent(id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((record) => {
        if (record) setConnected({ gatewayId: record.gatewayId, sourceLabel: record.sourceLabel });
      })
      .finally(() => setCheckingExisting(false));
  }, []);

  async function handleConnect() {
    const sellerId = sellerIdRef.current;
    if (!input.trim() || !sellerId) return;
    setLoading(true);
    setError(null);
    try {
      const gatewayRes = await fetch("/api/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, authValue: authValue || undefined, persist: true }),
      });
      const gatewayData = await gatewayRes.json();
      if (!gatewayRes.ok) throw new Error(gatewayData.error ?? "Couldn't read that API.");

      const sellerRes = await fetch("/api/seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          gatewayId: gatewayData.id,
          sourceLabel: gatewayData.sourceLabel,
        }),
      });
      if (!sellerRes.ok) throw new Error("Couldn't save the connection — try again.");

      setConnected({ gatewayId: gatewayData.id, sourceLabel: gatewayData.sourceLabel });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <RepelDotGrid />
      <div className="relative z-10 flex flex-1 flex-col">
        <ProductHeader label="Connect your system" />
        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-lg">
            <div className="text-center">
              <p className="text-[11px] font-semibold tracking-[0.1em] text-muted">OPTIONAL</p>
              <h1 className="font-heading mt-3 text-balance text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                Connect the system you already use.
              </h1>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
                Connect the tool you already use for stock or bookkeeping, and sales update it
                automatically. Monnify still moves your money exactly as it does today — this
                doesn&rsquo;t change that.
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-panel-line bg-white p-6 sm:p-8">
              {checkingExisting ? (
                <p className="text-center text-[13px] text-muted">Checking…</p>
              ) : connected ? (
                <div className="text-center">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  </span>
                  <p className="mt-4 text-[15px] font-medium text-ink">Connected.</p>
                  <p className="mt-1 text-[13px] text-muted">
                    {connected.sourceLabel} is linked to this browser.
                  </p>
                  <button
                    onClick={() => setConnected(null)}
                    className="mt-5 text-[13px] font-medium text-muted underline decoration-ink/20 underline-offset-4 hover:text-ink"
                  >
                    Connect a different system
                  </button>
                </div>
              ) : (
                <>
                  <label className="text-[13px] font-medium text-ink">
                    Paste the web address your tool gives you
                  </label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`https://api.yourtool.com/v1/stock`}
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-line bg-white p-3 font-mono text-[12.5px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
                  />

                  <div className="mt-2 text-[12.5px] text-muted">
                    <p>
                      This works with pretty much any tool that has an API — not just the two
                      below. We&rsquo;ve just written out the exact clicks for these two since
                      they&rsquo;re common:
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {(Object.keys(guides) as GuideKey[]).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setActiveGuide(activeGuide === k ? null : k)}
                          className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                            activeGuide === k
                              ? "border-ink bg-ink text-background"
                              : "border-line text-ink hover:border-ink/30"
                          }`}
                        >
                          {guides[k].label}
                        </button>
                      ))}
                    </div>

                    {activeGuide && (
                      <div className="mt-3 rounded-lg border border-line bg-panel/40 p-3">
                        <p>
                          Get your key at{" "}
                          <a
                            href={guides[activeGuide].tokenUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
                          >
                            {guides[activeGuide].tokenLabel}
                          </a>
                          :
                        </p>
                        <ol className="mt-1.5 list-decimal space-y-1 pl-4 leading-relaxed">
                          {guides[activeGuide].steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                        {guides[activeGuide].note && (
                          <p className="mt-2 italic">{guides[activeGuide].note}</p>
                        )}
                        <p className="mt-2">
                          Paste the key you copied into the box below, and the web address into the
                          one above.
                        </p>
                      </div>
                    )}

                    <p className="mt-2">
                      Using something other than these two? Same idea — check its settings for a
                      section called API, Developer, or Integrations, or ask whoever set it up for
                      you. Most business tools have one. If yours doesn&rsquo;t, that&rsquo;s fine,
                      this step is optional.
                    </p>
                  </div>
                  <input
                    value={authValue}
                    onChange={(e) => setAuthValue(e.target.value)}
                    placeholder="Got a password or key for it? Paste it here (optional)"
                    className="mt-3 w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
                  />
                  <button
                    onClick={handleConnect}
                    disabled={loading || !input.trim()}
                    className="mt-4 w-full rounded-md bg-accent px-5 py-3 text-[14.5px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.01] hover:brightness-95 active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100"
                  >
                    {loading ? "Connecting…" : "Connect this system"}
                  </button>
                  {error && <p className="mt-3 text-[13px] text-ink/70">{error}</p>}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
