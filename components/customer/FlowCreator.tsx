"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrCreateSellerId } from "@/lib/seller/token";

type FlowResult = { slug: string; checkoutUrl: string; dashboardUrl: string };

const EXAMPLE_PROMPTS = [
  "Sell tickets to my Saturday event — VIP ₦10,000 (cap 20), Regular ₦4,000 (cap 100)",
  "Create a payment page for hackathon tickets, ₦5,000, cap 100",
  "Sell my ebook for ₦2,500",
  "Workshop seats at ₦7,500 each, 40 spots",
  "Pre-order my sneakers, ₦15,000, limited to 50 pairs",
];

// Types each example out, pauses, deletes it, then moves to the next — pure
// state-driven (no real DOM placeholder swap, which can't animate) so it
// works with a plain <textarea placeholder>. Stops as soon as the visitor
// starts typing their own prompt, since the placeholder isn't visible then
// anyway and there's no reason to keep ticking.
function useTypewriterPlaceholder(examples: string[], enabled: boolean): string {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!enabled) return;

    let exampleIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    function tick() {
      const current = examples[exampleIndex];
      if (!deleting) {
        charIndex++;
        setText(current.slice(0, charIndex));
        timeoutId = setTimeout(tick, charIndex === current.length ? 1800 : 35);
        if (charIndex === current.length) deleting = true;
      } else {
        charIndex--;
        setText(current.slice(0, charIndex));
        if (charIndex === 0) {
          deleting = false;
          exampleIndex = (exampleIndex + 1) % examples.length;
          timeoutId = setTimeout(tick, 400);
        } else {
          timeoutId = setTimeout(tick, 18);
        }
      }
    }

    timeoutId = setTimeout(tick, 35);
    return () => clearTimeout(timeoutId);
  }, [enabled, examples]);

  return text;
}

export function FlowCreator({ className }: { className?: string }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FlowResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPayoutWarning, setShowPayoutWarning] = useState(false);
  const animatedPlaceholder = useTypewriterPlaceholder(EXAMPLE_PROMPTS, !prompt);

  // Sales from a page created while logged in but without a payout account
  // go straight to the platform's own Monnify wallet, with no way to
  // retroactively fix that specific page once it exists (see
  // app/api/flow/route.ts) — warn before creation rather than let it happen
  // silently.
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (!me) return;
        return fetch("/api/payout")
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => setShowPayoutWarning(!d?.account));
      })
      .catch(() => {});
  }, []);

  async function handleCreate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, sellerId: getOrCreateSellerId() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong — try describing what you're selling differently.");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(`${window.location.origin}${result.checkoutUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-panel-line bg-white p-6 sm:p-8 ${className ?? ""}`}
    >
      {!result ? (
        <>
          {showPayoutWarning && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-line bg-panel/60 px-3 py-2.5">
              <p className="text-[12.5px] leading-relaxed text-ink">
                You haven&rsquo;t set up a payout account yet — sales from a page you create now go to
                the platform account, not to you.{" "}
                <a
                  href="#account-bar"
                  className="font-medium underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
                >
                  Set up now
                </a>
              </p>
              <button
                onClick={() => setShowPayoutWarning(false)}
                aria-label="Dismiss"
                className="shrink-0 text-[13px] text-muted hover:text-ink"
              >
                &times;
              </button>
            </div>
          )}
          <label className="text-[13px] font-medium text-ink">What are you selling?</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder={animatedPlaceholder}
            rows={3}
            className="mt-2 w-full rounded-lg border border-line bg-white p-3 text-[14.5px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={loading || !prompt.trim()}
            className="mt-4 w-full rounded-md bg-accent px-5 py-3 text-[14.5px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.01] hover:brightness-95 active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100"
          >
            {loading ? "Setting things up…" : "Create my payment page"}
          </button>
          {error && <p className="mt-3 text-[13px] text-ink/70">{error}</p>}
        </>
      ) : (
        <div className="text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft">
            <span className="h-2 w-2 rounded-full bg-accent" />
          </span>
          <p className="mt-4 text-[15px] font-medium text-ink">Your payment page is live.</p>
          <p className="mt-1 text-[13px] text-muted">
            Share the link below, or open it to see the QR code.
          </p>

          <div className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-panel/40 px-3 py-2.5">
            <p className="flex-1 truncate text-left font-mono text-[12.5px] text-ink">
              {result.checkoutUrl}
            </p>
            <button
              onClick={copyLink}
              className="shrink-0 rounded-md border border-line bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/20"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href={result.checkoutUrl}
              className="flex-1 rounded-md bg-accent px-5 py-3 text-center text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.01] hover:brightness-95 active:scale-[0.99]"
            >
              View payment page
            </Link>
            <Link
              href={result.dashboardUrl}
              className="flex-1 rounded-md border border-line px-5 py-3 text-center text-[14px] font-medium text-ink transition-colors hover:border-ink/20"
            >
              View dashboard
            </Link>
          </div>

          <button
            onClick={() => {
              setResult(null);
              setPrompt("");
            }}
            className="mt-5 text-[13px] font-medium text-muted underline decoration-ink/20 underline-offset-4 hover:text-ink"
          >
            Sell something else
          </button>
        </div>
      )}
    </div>
  );
}
