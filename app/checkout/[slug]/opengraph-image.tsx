import { ImageResponse } from "next/og";
import { getFlow } from "@/lib/store/flow";
import { flowPriceLabel } from "@/lib/flow/priceLabel";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = await getFlow(slug);
  const title = record?.title ?? "Payment page";
  const priceLabel = record ? flowPriceLabel(record) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b0c",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 20, height: 20, borderRadius: 999, background: "#e4f222", display: "flex" }} />
          <span style={{ fontSize: 28, fontWeight: 600, color: "#ffffff", letterSpacing: -1 }}>Wire</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              fontSize: 58,
              fontWeight: 600,
              color: "#ffffff",
              lineHeight: 1.15,
              letterSpacing: -2,
              maxWidth: 960,
            }}
          >
            {title}
          </div>
          {priceLabel && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                alignSelf: "flex-start",
                padding: "14px 28px",
                borderRadius: 999,
                background: "#e4f222",
                fontSize: 30,
                fontWeight: 600,
                color: "#0b0b0c",
              }}
            >
              {priceLabel}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
