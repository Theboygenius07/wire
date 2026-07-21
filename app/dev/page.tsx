import type { Metadata } from "next";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { LogoBar } from "@/components/landing/LogoBar";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Stats } from "@/components/landing/Stats";
import { CallToAction } from "@/components/landing/CallToAction";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Wire for developers — Any API. Every AI agent. One gateway.",
  description:
    "Wire turns REST APIs into MCP tools automatically — proven live on Monnify's payments API.",
};

export default function DevLanding() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <LogoBar />
        <Features />
        <HowItWorks />
        <Stats />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
