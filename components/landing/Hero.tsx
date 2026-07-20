import { ProductPreview } from "./ProductPreview";
import { HeroParticles } from "./HeroParticles";

export function Hero() {
  return (
    <section id="top" className="relative z-0 overflow-hidden">
      <HeroParticles />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-14 pb-20 sm:pt-16">
        <div>
          <div className="mb-7 flex flex-wrap items-center gap-2 text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
            built live for apiconf 2026
            <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-[12px] normal-case tracking-normal text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              live demo, not a mock
            </span>
          </div>

          <h1 className="font-heading text-balance text-[2rem] font-medium leading-[1.05] tracking-[-0.02em] text-ink sm:text-[2.75rem] lg:text-[3.25rem]">
            Any API. Every AI agent. One gateway.
          </h1>

          <p data-hero-copy className="mt-6 max-w-xl text-pretty text-[17px] leading-relaxed">
            <span className="font-medium text-ink">
              Wire turns any REST API into real MCP tools — automatically.
            </span>{" "}
            <span className="text-muted">
              Monnify moves the money. Wire builds what sits on top of it —
              an agent that turns those tools into a working checkout, from
              a single sentence.
            </span>
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface py-1.5 pl-5 pr-1.5">
              <span className="flex-1 whitespace-nowrap text-[13.5px] text-muted">
                https://api.monnify.com/v2 &rarr;
              </span>
              <a
                href="#cta"
                className="whitespace-nowrap rounded-md bg-accent px-5 py-2.5 text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98]"
              >
                See it work
              </a>
            </div>
            <a
              href="#how-it-works"
              className="text-[14.5px] font-medium text-ink underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-ink"
            >
              How it works
            </a>
          </div>
        </div>

        <div className="relative z-10 mt-16 overflow-hidden rounded-xl border border-panel-line bg-panel/75 p-4 sm:p-10">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
