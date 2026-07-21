import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const products = [
  { tag: "FOR SELLING", name: "Flow", tagline: "Turn a sentence into a payment page." },
  { tag: "FOR BUILDING", name: "Relay", tagline: "Turn any REST API into real MCP tools." },
];

// Mirrors the actual homepage (app/page.tsx) — same headline, same
// highlighted phrase, same two product cards — so the link preview shows
// what the page shows instead of copy written specifically for the image.
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
          background: "#ffffff",
          padding: "70px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            background: "#0b0b0c",
          }}
        >
          <span style={{ fontSize: 19, fontWeight: 700, color: "#ffffff" }}>W</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              fontSize: 52,
              fontWeight: 500,
              color: "#0b0b0c",
              lineHeight: 1.2,
              letterSpacing: -1.5,
              maxWidth: 1000,
            }}
          >
            <span style={{ display: "flex" }}>We&nbsp;build&nbsp;</span>
            <span style={{ display: "flex", background: "#e4f222", padding: "0 6px" }}>
              developer&nbsp;and&nbsp;consumer
            </span>
            <span style={{ display: "flex" }}>&nbsp;infrastructure, powered by AI.</span>
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            {products.map((p) => (
              <div
                key={p.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  flex: 1,
                  padding: "26px 30px",
                  borderRadius: 18,
                  border: "1px solid #dadad8",
                  background: "#eaeaea",
                }}
              >
                <span style={{ display: "flex", fontSize: 14, fontWeight: 600, letterSpacing: 1.5, color: "#6b6b6f" }}>
                  {p.tag}
                </span>
                <span style={{ display: "flex", fontSize: 30, fontWeight: 600, color: "#0b0b0c", letterSpacing: -1 }}>
                  {p.name}
                </span>
                <span style={{ display: "flex", fontSize: 17, color: "#6b6b6f" }}>{p.tagline}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
