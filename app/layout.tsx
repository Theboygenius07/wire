import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const saans = localFont({
  variable: "--font-saans",
  display: "swap",
  src: [
    { path: "../saans-font-family/Saans-TRIAL-Light.otf", weight: "300", style: "normal" },
    { path: "../saans-font-family/Saans-TRIAL-Regular.otf", weight: "400", style: "normal" },
    { path: "../saans-font-family/Saans-TRIAL-Medium.otf", weight: "500", style: "normal" },
    { path: "../saans-font-family/Saans-TRIAL-SemiBold.otf", weight: "600", style: "normal" },
    { path: "../saans-font-family/Saans-TRIAL-Bold.otf", weight: "700", style: "normal" },
    { path: "../saans-font-family/Saans-TRIAL-Heavy.otf", weight: "800", style: "normal" },
  ],
});

const saansMono = localFont({
  variable: "--font-saans-mono",
  display: "swap",
  src: [
    { path: "../saans-font-family/SaansMono-TRIAL-Regular.otf", weight: "400", style: "normal" },
    { path: "../saans-font-family/SaansMono-TRIAL-Medium.otf", weight: "500", style: "normal" },
    { path: "../saans-font-family/SaansMono-TRIAL-SemiBold.otf", weight: "600", style: "normal" },
  ],
});

const ppNeueMontreal = localFont({
  variable: "--font-pp-neue-montreal",
  display: "swap",
  src: [{ path: "../ppneuemontreal-medium.otf", weight: "500", style: "normal" }],
});

export const metadata: Metadata = {
  title: "Wire — Any API. Every AI agent. One gateway.",
  description:
    "Wire turns REST APIs into MCP tools automatically — proven live on Monnify's payments API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${saans.variable} ${saansMono.variable} ${ppNeueMontreal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
