export function CallToAction() {
  return (
    <section id="cta" className="mx-auto max-w-6xl px-6 py-24">
      <div className="overflow-hidden rounded-2xl bg-dot-grid-dark px-6 py-20 text-center sm:py-24">
        <h2 className="font-heading text-balance text-3xl font-medium tracking-tight text-background sm:text-5xl">
          Built in one hackathon sprint.
          <br />
          Try it live.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] text-background/60">
          The Monnify preset works with zero setup — paste your own API if you want to see it generalize.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
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
      </div>
    </section>
  );
}
