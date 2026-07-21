"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductHeader } from "@/components/product/ProductHeader";
import { RepelDotGrid } from "@/components/landing/RepelDotGrid";
import type { FlowRecord } from "@/lib/store/flow";

type Status = "loading" | "needsLogin" | "forbidden" | "notFound" | "ready";

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function LoginGate({ onAuthed }: { onAuthed: (email: string) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      onAuthed(data.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-panel-line bg-dot-grid p-8">
        <p className="text-[11px] font-semibold tracking-[0.1em] text-muted">DASHBOARD ACCESS</p>
        <h1 className="font-heading mt-3 text-[22px] font-medium leading-snug tracking-tight text-ink">
          {mode === "login" ? "Log in to view this dashboard." : "Create an account to view this dashboard."}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          Anyone can create a payment link — you just need an account to see the sales dashboard for one.
        </p>

        <div className="mt-6 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={mode === "signup" ? "At least 8 characters" : "Password"}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
          />
        </div>

        {error && <p className="mt-3 text-[13px] text-ink/70">{error}</p>}

        <button
          onClick={submit}
          disabled={loading || !email || !password}
          className="mt-5 w-full rounded-md bg-accent px-5 py-2.5 text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
        >
          {loading ? "Working…" : mode === "login" ? "Log in" : "Create account"}
        </button>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="mt-4 block w-full text-center text-[13px] font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [record, setRecord] = useState<FlowRecord | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setEmail(d.email))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/flow/${slug}`);
        if (cancelled) return;
        if (res.status === 404) return setStatus("notFound");
        if (res.status === 401) return setStatus("needsLogin");
        if (res.status === 403) return setStatus("forbidden");
        setRecord(await res.json());
        setStatus("ready");
      } catch {
        // Transient network error — next poll will retry.
      }
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [slug]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setEmail(null);
    setRecord(null);
    setStatus("needsLogin");
  }

  if (status === "loading") {
    return (
      <>
        <ProductHeader label="Dashboard" />
        <main className="mx-auto flex max-w-6xl flex-1 items-center justify-center px-6 py-16">
          <p className="text-[14.5px] text-muted">Loading…</p>
        </main>
      </>
    );
  }

  if (status === "notFound") {
    return (
      <>
        <ProductHeader label="Dashboard" />
        <main className="mx-auto flex max-w-6xl flex-1 items-center justify-center px-6 py-16">
          <p className="text-[14.5px] text-muted">No Flow page found for &ldquo;{slug}&rdquo;.</p>
        </main>
      </>
    );
  }

  if (status === "needsLogin") {
    return (
      <>
        <ProductHeader label="Dashboard" />
        <LoginGate
          onAuthed={(loggedInEmail) => {
            setEmail(loggedInEmail);
            setStatus("loading");
          }}
        />
      </>
    );
  }

  if (status === "forbidden") {
    return (
      <>
        <ProductHeader label="Dashboard" />
        <main className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <p className="text-[14.5px] text-muted">This dashboard belongs to another account{email ? ` (you're logged in as ${email})` : ""}.</p>
          <button
            onClick={logout}
            className="text-[13.5px] font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
          >
            Log out and try a different account
          </button>
        </main>
      </>
    );
  }

  const pct = record && record.ticketCap > 0 ? Math.min(100, (record.ticketsSold / record.ticketCap) * 100) : 0;

  async function copyLink() {
    if (!record?.checkoutUrl) return;
    await navigator.clipboard.writeText(record.checkoutUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <ProductHeader label="Dashboard" />
      <main className="relative z-0 flex-1 overflow-hidden">
        <RepelDotGrid />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
              Live &mdash; updates every 3s
            </span>
          </div>
          <div className="flex items-center gap-3">
            {record && <span className="text-[12.5px] text-muted">Created {formatDate(record.createdAt)}</span>}
            {email && (
              <>
                <span className="text-[12.5px] text-muted">·</span>
                <span className="text-[12.5px] text-muted">{email}</span>
                <button
                  onClick={logout}
                  className="text-[12.5px] font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>

        <h1 className="font-heading text-balance text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          {record ? record.title : "Loading…"}
        </h1>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="relative z-0 overflow-hidden rounded-2xl border border-panel-line bg-panel/60 p-8">
            <div className="relative z-10 grid gap-8 sm:grid-cols-3">
              <div>
                <p className="font-heading tabular-nums text-5xl font-medium text-ink">
                  {record ? `${record.ticketsSold}/${record.ticketCap}` : "—"}
                </p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">sold</p>
              </div>
              <div>
                <p className="font-heading tabular-nums text-5xl font-medium text-ink">
                  {record ? formatNaira(record.revenueNaira) : "—"}
                </p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">revenue</p>
              </div>
              <div>
                <p className="font-heading tabular-nums text-5xl font-medium text-ink">{Math.round(pct)}%</p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">of cap</p>
              </div>
            </div>

            <div className="relative z-10 mt-10">
              <div className="h-2.5 w-full overflow-hidden rounded-full border border-line bg-white">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between font-mono text-[11.5px] text-muted">
                <span>0</span>
                <span>{record?.ticketCap ?? "—"}</span>
              </div>
              {record && record.ticketsSold === 0 && (
                <p className="mt-4 text-[13px] text-muted">
                  No sales yet &mdash; share the checkout link to get started.
                </p>
              )}
              {record?.lastConnectedAction && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <p className="text-[13px] text-ink">
                    Last sale, in your connected system: {record.lastConnectedAction}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">PRODUCT</span>
              <p className="mt-2 font-heading tabular-nums text-2xl font-medium text-ink">
                {record ? formatNaira(record.priceNaira) : "—"}
              </p>
              <p className="mt-1 text-[13px] text-muted">per ticket</p>
            </div>

            {record?.accountNumber && (
              <div className="flex items-center justify-between border-t border-line pt-5">
                <div>
                  <p className="text-[12px] text-muted">{record.bankName ?? "Bank transfer"}</p>
                  <p className="font-mono text-[14.5px] text-ink">{record.accountNumber}</p>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </div>
            )}

            {record?.checkoutUrl && (
              <div className="border-t border-line pt-5">
                <p className="text-[12px] text-muted">Checkout link</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="flex-1 truncate font-mono text-[12.5px] text-ink">
                    {record.checkoutUrl}
                  </p>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="shrink-0 rounded-md border border-line bg-panel px-2.5 py-1 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/20"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </main>
    </>
  );
}
