import { CtaParticles } from "./CtaParticles";

export function CallToAction() {
  return (
    <section id="cta" className="mx-auto max-w-6xl px-6 py-24">
      <div className="relative z-0 overflow-hidden rounded-2xl bg-ink px-6 py-20 text-center sm:py-24">
        <CtaParticles />
        <h2 className="font-heading relative z-10 text-balance text-3xl font-medium tracking-tight text-background sm:text-5xl">
          Built in one hackathon sprint.
          <br />
          Try it live.
        </h2>
        <p className="relative z-10 mx-auto mt-5 max-w-md text-[15px] text-background/60">
          The Monnify preset works with zero setup — paste your own API if you want to see it
          generalize.
        </p>
        <div className="relative z-10 mt-9 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/playground"
            className="rounded-md bg-accent px-7 py-3 text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98]"
          >
            Open the playground
          </a>
          <a
            href="#" // TODO: point at the repo once it's pushed
            className="rounded-md border border-background/25 px-7 py-3 text-[14px] font-medium text-background transition-all duration-150 hover:border-background/60 hover:bg-background/5 active:scale-[0.98]"
          >
            View source
          </a>
        </div>
        <a
          href="/"
          className="relative z-10 mt-8 inline-block text-[13.5px] font-medium text-background/50 underline decoration-background/25 underline-offset-4 transition-colors hover:text-background/80 hover:decoration-background/60"
        >
          Looking to sell something instead? &rarr;
        </a>
      </div>
    </section>
  );
}
