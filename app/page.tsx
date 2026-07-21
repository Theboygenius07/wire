import Link from "next/link";
import { RepelDotGrid } from "@/components/landing/RepelDotGrid";
import { FlowPayCreator } from "@/components/customer/FlowPayCreator";
import { Footer } from "@/components/landing/Footer";

const steps = [
  {
    n: "01",
    title: "Describe it",
    body: "Type what you're selling and the price, in plain English.",
  },
  {
    n: "02",
    title: "We set it up",
    body: "A payment page, a QR code, and a dashboard — created automatically through Monnify.",
  },
  {
    n: "03",
    title: "Share and watch",
    body: "Post the link anywhere. Watch sales come in on your live dashboard.",
  },
];

function CustomerNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="/" className="group flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-ink text-background transition-transform duration-200 group-hover:-rotate-6">
            <span className="text-[13px] font-semibold leading-none">W</span>
          </span>
          <span className="font-heading text-[17px] font-medium tracking-tight text-ink">wire</span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          <a
            href="#how-it-works"
            className="group relative text-[14.5px] font-medium text-ink/70 transition-colors hover:text-ink"
          >
            How it works
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink transition-all duration-200 group-hover:w-full" />
          </a>
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/dev"
            className="hidden text-[14.5px] font-medium text-ink/70 transition-colors hover:text-ink sm:block"
          >
            For developers
          </Link>
          <a
            href="#top-form"
            className="rounded-lg bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98]"
          >
            Sell something
          </a>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <>
      <CustomerNav />
      <main className="flex-1">
        <section
          id="top-form"
          className="relative z-0 flex min-h-[calc(100vh-4rem)] items-center overflow-hidden"
        >
          <RepelDotGrid />
          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
            <div className="mx-auto max-w-lg text-center">
              <h1 className="font-heading text-balance text-[2.25rem] font-medium leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl">
                Turn a sentence into a payment page.
              </h1>
              <p className="mx-auto mt-5 max-w-md text-pretty text-[16px] leading-relaxed text-muted">
                Describe what you&rsquo;re selling — get a shareable link, a QR code, and a live
                dashboard. Powered by Monnify. Wire never holds your money.
              </p>

              <FlowPayCreator className="mt-8 text-left" />

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" /> No new account
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" /> No code
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Live in seconds
                </span>
              </div>

              <p className="mt-6 text-[12.5px] text-muted">
                Already track stock or bookkeeping somewhere?{" "}
                <Link
                  href="/connect"
                  className="font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
                >
                  Connect it
                </Link>
              </p>
              <p className="mt-2 text-[12.5px] text-muted">
                Prefer to work with APIs directly?{" "}
                <Link
                  href="/dev"
                  className="font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
                >
                  Open the developer platform
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="text-center text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
              How it works
            </p>
            <h2 className="font-heading mt-3 text-center text-balance text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              Three steps. No logins, no manual setup.
            </h2>

            <ol className="mt-14 grid gap-8 sm:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="border-t-2 border-ink/10 pt-5 text-center sm:text-left">
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
              More than a checkout link
            </p>
            <h2 className="font-heading mt-3 text-center text-balance text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              Everything else Wire can do
            </h2>

            <div className="mt-14 grid gap-5 sm:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-panel-line bg-panel/60 p-8">
                <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">
                  KEEP YOUR RECORDS IN SYNC
                </span>
                <h3 className="font-heading mt-3 text-[22px] font-medium leading-snug tracking-tight text-ink">
                  Already track stock or bookkeeping somewhere?
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
                  Connect the tool you already use — inventory, bookkeeping, whatever — and every
                  confirmed sale updates it automatically. Monnify still moves 100% of the money,
                  exactly as it does today.
                </p>
                <Link
                  href="/connect"
                  className="mt-6 inline-block rounded-md border border-ink/15 bg-white px-6 py-3 text-[14px] font-medium text-ink transition-all duration-150 hover:border-ink/30 active:scale-[0.98]"
                >
                  Connect your system &rarr;
                </Link>
              </div>

              <div className="overflow-hidden rounded-2xl border border-panel-line bg-panel/60 p-8">
                <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">
                  BUILDING SOMETHING, NOT SELLING?
                </span>
                <h3 className="font-heading mt-3 text-[22px] font-medium leading-snug tracking-tight text-ink">
                  Any REST API becomes real MCP tools.
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
                  Paste an OpenAPI spec or a curl command, get a working MCP server in seconds,
                  and watch an agent use it — live trace included.
                </p>
                <Link
                  href="/dev"
                  className="mt-6 inline-block rounded-md border border-ink/15 bg-white px-6 py-3 text-[14px] font-medium text-ink transition-all duration-150 hover:border-ink/30 active:scale-[0.98]"
                >
                  Explore the developer platform &rarr;
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
