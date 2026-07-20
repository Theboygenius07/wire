"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductHeader } from "@/components/product/ProductHeader";
import { RepelDotGrid } from "@/components/landing/RepelDotGrid";
import type { FlowPayRecord } from "@/lib/store/flowpay";

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [record, setRecord] = useState<FlowPayRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/flowpay/${slug}`);
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        setRecord(await res.json());
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

  if (notFound) {
    return (
      <>
        <ProductHeader label="Dashboard" />
        <main className="mx-auto flex max-w-6xl flex-1 items-center justify-center px-6 py-16">
          <p className="text-[14.5px] text-muted">No FlowPay page found for &ldquo;{slug}&rdquo;.</p>
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
          {record && (
            <span className="text-[12.5px] text-muted">Created {formatDate(record.createdAt)}</span>
          )}
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
