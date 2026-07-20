"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductHeader } from "@/components/product/ProductHeader";
import type { FlowPayRecord } from "@/lib/store/flowpay";

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export default function DashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [record, setRecord] = useState<FlowPayRecord | null>(null);
  const [notFound, setNotFound] = useState(false);

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

  return (
    <>
      <ProductHeader label="Dashboard" />
      <main className="mx-auto max-w-6xl flex-1 px-6 py-16">
        <div className="mb-10 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
            Live &mdash; updates every 3s
          </span>
        </div>

        <h1 className="font-heading text-balance text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          {record ? record.title : "Loading…"}
        </h1>

        <div className="mt-12 grid gap-10 border-t border-line pt-10 sm:grid-cols-3">
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

        <div className="mt-10 h-2 w-full overflow-hidden rounded-full border border-line bg-panel">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </main>
    </>
  );
}
