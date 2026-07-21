"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProductHeader } from "@/components/product/ProductHeader";
import { RepelDotGrid } from "@/components/landing/RepelDotGrid";
import { AuthForm } from "@/components/auth/AuthForm";
import type { FlowRecord } from "@/lib/store/flow";

type Status = "loading" | "needsLogin" | "forbidden" | "notFound" | "ready";
type DashboardRecord = FlowRecord & { subscriberCount?: number };

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const FREQUENCY_LABEL = { daily: "day", weekly: "week", monthly: "month" } as const;

export default function DashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [record, setRecord] = useState<DashboardRecord | null>(null);
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
        <ProductHeader label="Dashboard" back={{ href: "/flow", label: "Back to Flow" }} />
        <main className="mx-auto flex max-w-6xl flex-1 items-center justify-center px-6 py-16">
          <p className="text-[14.5px] text-muted">Loading…</p>
        </main>
      </>
    );
  }

  if (status === "notFound") {
    return (
      <>
        <ProductHeader label="Dashboard" back={{ href: "/flow", label: "Back to Flow" }} />
        <main className="mx-auto flex max-w-6xl flex-1 items-center justify-center px-6 py-16">
          <p className="text-[14.5px] text-muted">No Flow page found for &ldquo;{slug}&rdquo;.</p>
        </main>
      </>
    );
  }

  if (status === "needsLogin") {
    return (
      <>
        <ProductHeader label="Dashboard" back={{ href: "/flow", label: "Back to Flow" }} />
        <main className="mx-auto flex max-w-6xl flex-1 items-center justify-center px-6 py-16">
          <AuthForm
            title="Log in to view this dashboard."
            subtitle="Anyone can create a payment link — you just need an account to see the sales dashboard for one."
            onAuthed={(loggedInEmail) => {
              setEmail(loggedInEmail);
              setStatus("loading");
            }}
          />
        </main>
      </>
    );
  }

  if (status === "forbidden") {
    return (
      <>
        <ProductHeader label="Dashboard" back={{ href: "/flow", label: "Back to Flow" }} />
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

  const primaryCount = record?.recurring ? record.subscriberCount ?? 0 : record?.ticketsSold ?? 0;
  const pct = record && record.ticketCap > 0 ? Math.min(100, (primaryCount / record.ticketCap) * 100) : 0;

  async function copyLink() {
    if (!record?.checkoutUrl) return;
    await navigator.clipboard.writeText(record.checkoutUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <ProductHeader label="Dashboard" back={{ href: "/flow", label: "Back to Flow" }} />
      <main className="relative z-0 flex-1 overflow-hidden">
        <RepelDotGrid />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
              Live &mdash; updates every 3s
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {record && <span className="text-[12.5px] text-muted">Created {formatDate(record.createdAt)}</span>}
            {email && (
              <>
                <span className="hidden text-[12.5px] text-muted sm:inline">·</span>
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-balance text-2xl font-medium tracking-tight text-ink sm:text-3xl lg:text-4xl">
            {record ? record.title : "Loading…"}
          </h1>
          <Link
            href={`/checkout/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13.5px] font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
          >
            View checkout page &rarr;
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:mt-10 lg:grid-cols-[1fr_320px]">
          <div className="relative z-0 overflow-hidden rounded-2xl border border-panel-line bg-panel/60 p-5 sm:p-8">
            <div className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-8">
              <div>
                <p className="font-heading tabular-nums text-3xl font-medium text-ink sm:text-4xl lg:text-5xl">
                  {record ? `${primaryCount}/${record.ticketCap}` : "—"}
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted sm:mt-3 sm:text-[14.5px]">
                  {record?.recurring ? "subscribers" : "sold"}
                </p>
              </div>
              <div>
                <p className="font-heading tabular-nums text-3xl font-medium text-ink sm:text-4xl lg:text-5xl">
                  {record ? formatNaira(record.revenueNaira) : "—"}
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted sm:mt-3 sm:text-[14.5px]">revenue</p>
              </div>
              <div>
                <p className="font-heading tabular-nums text-3xl font-medium text-ink sm:text-4xl lg:text-5xl">{Math.round(pct)}%</p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted sm:mt-3 sm:text-[14.5px]">of cap</p>
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
              {record && primaryCount === 0 && (
                <p className="mt-4 text-[13px] text-muted">
                  {record.recurring
                    ? "No subscribers yet — share the checkout link to get started."
                    : "No sales yet — share the checkout link to get started."}
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

          <div className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-5 sm:p-6">
            {record?.tiers?.length ? (
              <div>
                <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">TIERS</span>
                <ul className="mt-2 space-y-2.5">
                  {record.tiers.map((tier) => (
                    <li key={tier.id} className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13.5px] text-ink">{tier.name}</p>
                      <p className="shrink-0 font-mono text-[12.5px] text-muted">
                        {formatNaira(tier.priceNaira)} · {tier.sold}/{tier.cap}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : record?.recurring ? (
              <div>
                <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">SUBSCRIPTION</span>
                <p className="mt-2 font-heading tabular-nums text-2xl font-medium text-ink">
                  {formatNaira(record.priceNaira)}
                </p>
                <p className="mt-1 text-[13px] text-muted">per {FREQUENCY_LABEL[record.recurring.frequency]}</p>
                <p className="mt-3 border-t border-line pt-3 text-[13px] text-muted">
                  {record.subscriberCount ?? 0} active subscriber{record.subscriberCount === 1 ? "" : "s"}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">PRODUCT</span>
                <p className="mt-2 font-heading tabular-nums text-2xl font-medium text-ink">
                  {record ? formatNaira(record.priceNaira) : "—"}
                </p>
                <p className="mt-1 text-[13px] text-muted">per ticket</p>
              </div>
            )}

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
