import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/landing/Nav";
import { CallToAction } from "@/components/landing/CallToAction";
import { Footer } from "@/components/landing/Footer";
import { RepelDotGrid } from "@/components/landing/RepelDotGrid";

export const metadata: Metadata = {
  title: "Pricing — Wire",
  description: "Flow charges a per-sale fee, nothing up front. Relay's gateway is usage-based for developers building their own agents.",
};

const proof = [
  { value: "0", label: "monthly fee to create a Flow page" },
  { value: "2%", label: "flat platform fee, only on a cleared sale" },
  { value: "6", label: "Monnify endpoints wired end-to-end on Relay" },
];

const tiers = [
  {
    name: "Dev",
    price: "$0",
    unit: "forever",
    blurb: "Build and test against real MCP tools before you ship anything.",
    features: ["1 connected API", "1,000 tool calls / mo", "Full playground access", "Community support"],
    cta: { label: "Start free", href: "/playground" },
    highlight: false,
  },
  {
    name: "Production",
    price: "$0.004",
    unit: "per tool call",
    blurb: "For agents running in front of real users — billed monthly for what they actually use.",
    features: ["Unlimited connected APIs", "First 1,000 calls / mo free", "Usage dashboards + alerts", "Priority support"],
    cta: { label: "Start free", href: "/playground" },
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    unit: "annual contract",
    blurb: "Dedicated infrastructure and support for teams running agents at scale.",
    features: ["Dedicated gateway", "SSO + audit logs", "Custom rate limits", "Dedicated support channel"],
    cta: { label: "Contact sales", href: "#" }, // TODO: point at a real contact channel once it exists
    highlight: false,
  },
];

const details = [
  {
    n: "01",
    title: "Nothing up front",
    body: "Flow pages are free to create. There's no charge until a sale actually clears — the fee comes out of what you sell, never before it.",
  },
  {
    n: "02",
    title: "Flow bills separately",
    body: "Selling through Flow never touches a Relay gateway bill — it's a percentage of what you sell, not a call count.",
  },
  {
    n: "03",
    title: "No seats, ever",
    body: "Wherever you're billed on Wire, pricing scales with usage, not headcount — one agent or twenty behind it costs the same.",
  },
];

export default function PricingPage() {
  return (
    <div className="relative z-0 flex flex-1 flex-col overflow-hidden">
      <RepelDotGrid />
      <div className="relative z-10 flex flex-1 flex-col">
        <Nav />
        <main className="flex-1">
          <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-24">
            <div className="max-w-2xl">
              <p className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
                Pricing
              </p>
              <h1 className="font-heading mt-4 text-balance text-[2.1rem] font-medium leading-[1.15] tracking-[-0.02em] text-ink sm:text-[2.75rem] lg:text-[3.25rem]">
                Flow charges{" "}
                <mark className="box-decoration-clone bg-accent px-1 text-ink">
                  only when you get paid
                </mark>
                .
              </h1>
              <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-muted">
                No monthly fee, no setup cost. Describe what you&rsquo;re selling, get a live
                payment page, and Wire only takes a cut once a sale actually clears.
              </p>
            </div>

            <div className="mt-12 grid gap-8 border-t border-line pt-10 sm:grid-cols-3">
              {proof.map((p) => (
                <div key={p.label}>
                  <p className="font-heading tabular-nums text-4xl font-medium text-ink">
                    {p.value}
                  </p>
                  <p className="mt-2 max-w-[24ch] text-[13.5px] leading-relaxed text-muted">
                    {p.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative z-0 mt-14 overflow-hidden rounded-2xl bg-ink px-6 py-14 sm:px-10 sm:py-16">
              <RepelDotGrid />
              <div className="relative z-10 flex flex-col items-start gap-10 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <span className="text-[11px] font-semibold tracking-[0.1em] text-background/60">
                      FLOW
                    </span>
                  </div>
                  <h2 className="font-heading mt-3 text-balance text-[26px] font-medium leading-snug tracking-tight text-background sm:text-3xl">
                    One flat rate. No surprises.
                  </h2>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-background/60">
                    Wire adds a small platform fee on top of Monnify&rsquo;s own processing fee,
                    taken only from a successful sale. Wire never holds your money.
                  </p>
                  <div className="mt-7 flex flex-wrap items-center gap-4">
                    <Link
                      href="/flow"
                      className="rounded-md bg-accent px-7 py-3 text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98]"
                    >
                      Create a Flow page
                    </Link>
                    <Link
                      href="/sell"
                      className="text-[13.5px] font-medium text-background/70 underline decoration-background/25 underline-offset-4 transition-colors hover:text-background hover:decoration-background/60"
                    >
                      See how it works &rarr;
                    </Link>
                  </div>
                </div>

                <div className="shrink-0 rounded-2xl border border-background/15 bg-background/5 px-8 py-6 text-center">
                  <p className="font-heading tabular-nums text-6xl font-medium text-background">
                    2%
                  </p>
                  <p className="mt-2 text-[13px] text-background/60">+ Monnify&rsquo;s fee, per sale</p>
                </div>
              </div>
            </div>

            <div className="mt-24 border-t border-line pt-14">
              <p className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
                Building your own agent?
              </p>
              <h2 className="font-heading mt-3 max-w-lg text-balance text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                Prefer to work with the APIs directly?
              </h2>
              <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-muted">
                Relay&rsquo;s gateway is usage-based too — pay per tool call once you&rsquo;re past
                the free tier, the same way the agents calling it get billed for tokens.
              </p>

              <div className="mt-10 grid gap-5 lg:grid-cols-3">
                {tiers.map((t) => (
                  <div
                    key={t.name}
                    className={
                      t.highlight
                        ? "relative z-0 flex flex-col overflow-hidden rounded-2xl border border-ink/20 bg-panel p-8"
                        : "relative z-0 flex flex-col overflow-hidden rounded-2xl border border-panel-line bg-panel p-8 transition-colors duration-200 hover:border-ink/20"
                    }
                  >
                    <RepelDotGrid />
                    <div className="relative z-10 flex h-full flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">
                          {t.name.toUpperCase()}
                        </span>
                        {t.highlight && (
                          <span className="rounded-full bg-accent px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.04em] text-accent-ink">
                            MOST AGENTS START HERE
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex items-baseline gap-2">
                        <span className="font-heading tabular-nums text-4xl font-medium text-ink">
                          {t.price}
                        </span>
                        <span className="text-[13px] text-muted">{t.unit}</span>
                      </div>

                      <p className="mt-4 text-[14.5px] leading-relaxed text-muted">{t.blurb}</p>

                      <ul className="mt-6 flex flex-col gap-2.5">
                        {t.features.map((f) => (
                          <li key={f} className="flex items-center gap-2.5 text-[13.5px] text-ink">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto pt-8">
                        {t.highlight ? (
                          <Link
                            href={t.cta.href}
                            className="block w-full rounded-md bg-accent px-7 py-3 text-center text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98]"
                          >
                            {t.cta.label}
                          </Link>
                        ) : (
                          <Link
                            href={t.cta.href}
                            className="block w-full rounded-md border border-line bg-white px-7 py-3 text-center text-[14px] font-medium text-ink transition-all duration-150 hover:border-ink/20 active:scale-[0.98]"
                          >
                            {t.cta.label}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-24 border-t border-line pt-14">
              <p className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
                Billing details
              </p>
              <ol className="mt-8 grid gap-8 sm:grid-cols-3">
                {details.map((d) => (
                  <li
                    key={d.n}
                    className="border-t-2 border-ink/10 pt-5 transition-colors duration-200 hover:border-accent"
                  >
                    <span className="tabular-nums text-[13px] font-medium text-muted">{d.n}</span>
                    <h3 className="font-heading mt-3 text-[16px] font-medium text-ink">{d.title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">{d.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <CallToAction />
        </main>
        <Footer />
      </div>
    </div>
  );
}
