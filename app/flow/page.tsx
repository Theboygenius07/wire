import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Nav } from "@/components/landing/Nav";
import { RepelDotGrid } from "@/components/landing/RepelDotGrid";
import { FlowCreator } from "@/components/customer/FlowCreator";
import { AccountBar } from "@/components/customer/AccountBar";
import { Footer } from "@/components/landing/Footer";
import { getCurrentSession } from "@/lib/auth/session";
import { getFlowsByUser, claimFlowsBySeller } from "@/lib/store/flow";
import { getPayoutAccount } from "@/lib/store/payout";
import { withSocial } from "@/lib/metadata";
import { getWhatsAppLink } from "@/lib/whatsapp/link";

export const metadata: Metadata = withSocial({
  title: "Flow — Turn a sentence into a payment page.",
  description:
    "Describe what you're selling, get a shareable link, a QR code, and a live dashboard — powered by Monnify. Built by Wire.",
});

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

export default async function FlowLanding() {
  const session = await getCurrentSession();
  const whatsapp = getWhatsAppLink();

  if (session) {
    const sellerId = (await cookies()).get("wire_seller_id")?.value;
    if (sellerId) await claimFlowsBySeller(sellerId, session.userId);
  }

  const flows = session ? await getFlowsByUser(session.userId) : [];
  const payoutAccount = session ? await getPayoutAccount(session.userId) : null;

  return (
    <>
      <Nav />
      <main className="flex-1">
        <section
          id="top-form"
          className="relative z-0 flex min-h-[calc(100vh-4rem)] items-center overflow-hidden"
        >
          <RepelDotGrid />
          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
            <AccountBar
              initialEmail={session?.email ?? null}
              initialFlows={flows}
              initialPayoutAccount={payoutAccount}
            />
            <div className="mx-auto max-w-lg text-center">
              <h1 className="font-heading text-balance text-[2.25rem] font-medium leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl">
                Turn a sentence into a payment page.
              </h1>
              <p className="mx-auto mt-5 max-w-md text-pretty text-[16px] leading-relaxed text-muted">
                Describe what you&rsquo;re selling — get a shareable link, a QR code, and a live
                dashboard. Powered by Monnify. Wire never holds your money.
              </p>

              <FlowCreator className="mt-8 text-left" />

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
              {whatsapp && (
                <p className="mt-2 text-[12.5px] text-muted">
                  Prefer WhatsApp?{" "}
                  <a
                    href={whatsapp.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
                  >
                    Message Flow on WhatsApp
                  </a>
                  {whatsapp.isSandbox &&
                    " — send the join code that's prefilled, then just tell it what you're selling."}
                </p>
              )}
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
