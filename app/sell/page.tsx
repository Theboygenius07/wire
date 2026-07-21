import { ProductHeader } from "@/components/product/ProductHeader";
import { RepelDotGrid } from "@/components/landing/RepelDotGrid";
import { FlowPayCreator } from "@/components/customer/FlowPayCreator";
import Link from "next/link";

export default function SellPage() {
  return (
    <div className="relative flex flex-1 flex-col">
      <RepelDotGrid />
      <div className="relative z-10 flex flex-1 flex-col">
        <ProductHeader label="Sell something" />
        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-lg">
            <div className="text-center">
              <p className="text-[11px] font-semibold tracking-[0.1em] text-muted">FLOWPAY</p>
              <h1 className="font-heading mt-3 text-balance text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                Turn a sentence into a payment page.
              </h1>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
                Describe what you&rsquo;re selling. Get a shareable link, a QR code, and a live
                dashboard — powered by Monnify. Wire never holds your money.
              </p>
            </div>

            <FlowPayCreator className="mt-8" />

            <p className="mt-6 text-center text-[12.5px] text-muted">
              Prefer to work with APIs directly?{" "}
              <Link
                href="/dev"
                className="font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
              >
                Open the developer platform
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
