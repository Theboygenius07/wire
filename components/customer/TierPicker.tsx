"use client";

import { useState } from "react";
import QRCode from "qrcode";
import type { FlowTier } from "@/lib/store/flow";

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function TierPicker({ slug, tiers }: { slug: string; tiers: FlowTier[] }) {
  const [loadingTierId, setLoadingTierId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<{ tier: FlowTier; checkoutUrl: string; qrDataUrl: string } | null>(null);

  async function buy(tier: FlowTier) {
    setLoadingTierId(tier.id);
    setError(null);
    try {
      const res = await fetch(`/api/flow/${slug}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId: tier.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't start that purchase — try again.");
      if (!data.checkoutUrl) throw new Error("No payment link came back — try again.");

      const qrDataUrl = await QRCode.toDataURL(data.checkoutUrl, {
        margin: 1,
        color: { dark: "#0b0b0c", light: "#ffffff" },
      });
      setPaying({ tier, checkoutUrl: data.checkoutUrl, qrDataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingTierId(null);
    }
  }

  if (paying) {
    return (
      <div className="mt-8">
        <p className="text-[13px] text-muted">
          {paying.tier.name} &middot; {formatNaira(paying.tier.priceNaira)}
        </p>
        <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-line bg-white p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={paying.qrDataUrl} alt="Checkout QR code" className="h-44 w-44" />
          <p className="text-center text-[13px] text-muted">Scan to open the payment link</p>
        </div>
        <a
          href={paying.checkoutUrl}
          className="mt-6 block w-full rounded-md bg-accent px-7 py-3 text-center text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98]"
        >
          Pay with Monnify
        </a>
        <button
          onClick={() => setPaying(null)}
          className="mt-4 block w-full text-center text-[13px] font-medium text-muted underline decoration-ink/20 underline-offset-4 hover:text-ink"
        >
          Choose a different tier
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <p className="text-[11px] font-semibold tracking-[0.1em] text-muted">CHOOSE A TIER</p>
      <div className="mt-3 space-y-2.5">
        {tiers.map((tier) => {
          const soldOut = tier.sold >= tier.cap;
          return (
            <div
              key={tier.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-[14.5px] font-medium text-ink">{tier.name}</p>
                <p className="mt-0.5 text-[12.5px] text-muted">
                  {formatNaira(tier.priceNaira)} &middot; {tier.sold}/{tier.cap} sold
                </p>
              </div>
              <button
                onClick={() => buy(tier)}
                disabled={soldOut || loadingTierId !== null}
                className="shrink-0 rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
              >
                {soldOut ? "Sold out" : loadingTierId === tier.id ? "Working…" : "Buy"}
              </button>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-3 text-[13px] text-ink/70">{error}</p>}
    </div>
  );
}
