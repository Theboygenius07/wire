import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { HeroParticles } from "@/components/landing/HeroParticles";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { RepelDotGrid } from "@/components/landing/RepelDotGrid";

export const metadata: Metadata = {
  title: "Relay — Any API. Every AI agent. One gateway.",
  description:
    "Paste an OpenAPI spec or a raw curl command — get a working MCP server in seconds. Built by Wire.",
};

const steps = [
  {
    n: "01",
    title: "Paste your API",
    body: "A spec, a curl command, or the pre-loaded Monnify preset — no setup required to try it.",
  },
  {
    n: "02",
    title: "Get MCP tools",
    body: "A real MCP server generates in seconds — typed tools, real handlers, ready for any agent.",
  },
  {
    n: "03",
    title: "Watch it work",
    body: "Send a request in the playground and see the exact trace — reasoning, tool call, real response.",
  },
];

export default function RelayLanding() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <section className="relative z-0 overflow-hidden">
          <HeroParticles />
          <div className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-24">
            <p className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
              Relay
            </p>
            <h1
              data-hero-copy
              className="font-heading mt-4 max-w-2xl text-balance text-[2.1rem] font-medium leading-[1.15] tracking-[-0.02em] sm:text-[2.75rem] lg:text-[3.25rem]"
            >
              <span className="text-ink">Any API. Every AI agent.</span>
              <br />
              <span className="text-ink/40">One gateway.</span>
            </h1>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/playground"
                className="rounded-md bg-accent px-7 py-3 text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98]"
              >
                Open the playground
              </Link>
              <Link
                href="#how-it-works"
                className="rounded-md bg-panel px-7 py-3 text-[14px] font-medium text-ink transition-all duration-150 hover:bg-panel-line active:scale-[0.98]"
              >
                See how it works
              </Link>
            </div>

            <div className="mt-16 grid gap-5 lg:grid-cols-2">
              <div className="group relative z-0 overflow-hidden rounded-2xl border border-panel-line bg-panel p-6 transition-colors duration-200 hover:border-ink/20 sm:p-8">
                <RepelDotGrid />
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <h2 className="font-heading text-[19px] font-medium leading-snug tracking-tight">
                    <span className="text-ink">Paste an API.</span>{" "}
                    <span className="text-ink/40">Get real MCP tools.</span>
                  </h2>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink transition-transform duration-200 group-hover:rotate-45">
                    &rarr;
                  </span>
                </div>
                <div className="relative z-10 mt-6 overflow-hidden rounded-xl border border-panel-line bg-white/90 p-3">
                  <ProductPreview />
                </div>
              </div>

              <div className="group relative z-0 overflow-hidden rounded-2xl border border-panel-line bg-panel p-6 transition-colors duration-200 hover:border-ink/20 sm:p-8">
                <RepelDotGrid />
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <h2 className="font-heading text-[19px] font-medium leading-snug tracking-tight">
                    <span className="text-ink">Watch an agent</span>{" "}
                    <span className="text-ink/40">actually use them.</span>
                  </h2>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink transition-transform duration-200 group-hover:rotate-45">
                    &rarr;
                  </span>
                </div>
                <div className="relative z-10 mt-6 overflow-hidden rounded-xl border border-panel-line bg-white">
                  <div className="flex items-center gap-2 border-b border-line bg-[#F7F7F5] px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#E4E2DA]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#E4E2DA]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#E4E2DA]" />
                    </div>
                    <div className="mx-auto flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11.5px] text-muted">
                      <span className="text-accent">●</span> live trace
                    </div>
                  </div>
                  <div className="space-y-2.5 p-5 font-mono text-[11.5px]">
                    <p className="italic text-muted">
                      reasoning → create_reserved_account → create_invoice
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-[#FBFBF9] px-3 py-2 text-ink">
                      <span className="rounded bg-accent-soft px-1.5 py-0.5 text-accent-ink">
                        tool_call
                      </span>
                      create_invoice({"{"} amount: 5000 {"}"})
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-line bg-[#FBFBF9] px-3 py-2 text-ink">
                      <span className="rounded bg-accent px-1.5 py-0.5 text-accent-ink">
                        200 OK
                      </span>
                      real Monnify sandbox response
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="text-center text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
              How it works
            </p>
            <h2 className="font-heading mt-3 text-center text-balance text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              Three steps. No hand-written glue.
            </h2>

            <ol className="mt-14 grid gap-8 sm:grid-cols-3">
              {steps.map((s) => (
                <li
                  key={s.n}
                  className="border-t-2 border-ink/10 pt-5 text-center transition-colors duration-200 hover:border-accent sm:text-left"
                >
                  <span className="tabular-nums text-[13px] font-medium text-muted">{s.n}</span>
                  <h3 className="font-heading mt-3 text-[17px] font-medium text-ink">{s.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="text-center text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
              More than a gateway
            </p>
            <h2 className="font-heading mt-3 text-center text-balance text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              Everything else Wire can do
            </h2>

            <div className="mt-14 grid gap-5 sm:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-panel-line bg-panel/60 p-8">
                <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">
                  SELLING SOMETHING?
                </span>
                <h3 className="font-heading mt-3 text-[22px] font-medium leading-snug tracking-tight text-ink">
                  One sentence, one payment page.
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
                  Flow turns a plain-English request into a live checkout link, a QR code, and
                  a dashboard — built on the same tool-generation core as Relay.
                </p>
                <Link
                  href="/flow"
                  className="mt-6 inline-block rounded-md border border-ink/15 bg-white px-6 py-3 text-[14px] font-medium text-ink transition-all duration-150 hover:border-ink/30 active:scale-[0.98]"
                >
                  Explore Flow &rarr;
                </Link>
              </div>

              <div className="overflow-hidden rounded-2xl border border-panel-line bg-panel/60 p-8">
                <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">
                  WANT THE DEEP DIVE?
                </span>
                <h3 className="font-heading mt-3 text-[22px] font-medium leading-snug tracking-tight text-ink">
                  See what&rsquo;s actually running.
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
                  Real Monnify endpoints wired end-to-end, not a demo stub — the proof, the
                  stack, and the full pitch live on the developer hub.
                </p>
                <Link
                  href="/dev"
                  className="mt-6 inline-block rounded-md border border-ink/15 bg-white px-6 py-3 text-[14px] font-medium text-ink transition-all duration-150 hover:border-ink/30 active:scale-[0.98]"
                >
                  Open the developer hub &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
