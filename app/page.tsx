import type { Metadata } from "next";
import Link from "next/link";
import { RepelDotGrid } from "@/components/landing/RepelDotGrid";
import { withSocial } from "@/lib/metadata";

export const metadata: Metadata = withSocial({
  title: "Wire",
  description: "We build developer and consumer infrastructure, powered by AI.",
});

const products = [
  {
    tag: "FOR SELLING",
    name: "Flow",
    tagline: "Turn a sentence into a payment page.",
    href: "/flow",
  },
  {
    tag: "FOR BUILDING",
    name: "Relay",
    tagline: "Turn any REST API into real MCP tools.",
    href: "/relay",
  },
];

export default function WireHome() {
  return (
    <div className="relative z-0 flex flex-1 flex-col overflow-hidden">
      <RepelDotGrid />
      <header className="relative z-10 px-6 py-8 sm:px-10">
        <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-ink text-background">
          <span className="text-[14px] font-semibold leading-none">W</span>
        </span>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full max-w-3xl">
          <p className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
            Wire
          </p>
          <h1 className="font-heading mt-4 text-balance text-[2.1rem] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[2.75rem] lg:text-[3.25rem]">
            We build{" "}
            <mark className="box-decoration-clone bg-accent px-1 text-ink">
              developer and consumer
            </mark>{" "}
            infrastructure, powered by AI.
          </h1>

          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {products.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="group relative z-0 overflow-hidden rounded-2xl border border-panel-line bg-panel p-7 transition-colors duration-200 hover:border-ink/20 sm:p-8"
              >
                <RepelDotGrid />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">
                      {p.tag}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink transition-transform duration-200 group-hover:rotate-45">
                      &rarr;
                    </span>
                  </div>
                  <p className="font-heading mt-8 text-[28px] font-medium tracking-tight text-ink">
                    {p.name}
                  </p>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{p.tagline}</p>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/dev"
            className="mt-8 inline-block text-[13.5px] font-medium text-muted underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink/40"
          >
            Building on top of Wire? Start here &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
