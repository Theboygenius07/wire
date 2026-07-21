import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          <span style={{ fontSize: 32, fontWeight: 600, color: "#ffffff", letterSpacing: -1 }}>Wire</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 62,
              fontWeight: 600,
              color: "#ffffff",
              lineHeight: 1.12,
              letterSpacing: -2,
              maxWidth: 920,
            }}
          >
            Turn a sentence into a payment page.
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#9c9c9c", maxWidth: 760 }}>
            Checkout link, QR code, and a live dashboard — powered by Monnify.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
