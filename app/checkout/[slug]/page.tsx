import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getFlow } from "@/lib/store/flow";
import { ProductHeader } from "@/components/product/ProductHeader";
import { RepelDotGrid } from "@/components/landing/RepelDotGrid";

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = await getFlow(slug);
  if (!record) notFound();

  const qrPayload =
    record.checkoutUrl ??
    (record.accountNumber ? `${record.bankName ?? "Bank transfer"}: ${record.accountNumber}` : slug);
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    color: { dark: "#0b0b0c", light: "#ffffff" },
  });

  return (
    <div className="relative flex flex-1 flex-col">
      <RepelDotGrid />
      <div className="relative z-10 flex flex-1 flex-col">
        <ProductHeader label="Checkout" />
        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-panel-line bg-white p-8">
            <p className="text-[11px] font-semibold tracking-[0.1em] text-muted">FLOW CHECKOUT</p>
            <h1 className="font-heading mt-3 text-balance text-[28px] font-medium leading-snug tracking-tight text-ink">
              {record.title}
            </h1>
            <p className="mt-2 font-heading tabular-nums text-3xl font-medium text-ink">
              {formatNaira(record.priceNaira)}
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-line bg-white p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Checkout QR code" className="h-44 w-44" />
              <p className="text-center text-[13px] text-muted">
                Scan to open the payment link{record.checkoutUrl ? "" : " — or use the transfer details below"}
              </p>
            </div>

            {record.accountNumber && (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3">
                <div>
                  <p className="text-[12px] text-muted">{record.bankName ?? "Bank transfer"}</p>
                  <p className="font-mono text-[15px] text-ink">{record.accountNumber}</p>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </div>
            )}

            {record.checkoutUrl && (
              <a
                href={record.checkoutUrl}
                className="mt-6 block w-full rounded-md bg-accent px-7 py-3 text-center text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98]"
              >
                Pay with Monnify
              </a>
            )}

            <p className="mt-6 text-center font-mono text-[11.5px] text-muted">
              {record.ticketsSold}/{record.ticketCap} sold
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
