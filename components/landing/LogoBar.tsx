const stack = ["Monnify", "Gemini", "MCP", "Next.js", "Vercel"];

export function LogoBar() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="mb-6 text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
          What it&rsquo;s actually built on
        </p>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {stack.map((name) => (
            <div
              key={name}
              className="flex h-24 items-center justify-center bg-surface px-4 transition-colors duration-200 hover:bg-panel/40"
            >
              <span className="text-[15px] font-medium text-ink/50 transition-colors duration-200 hover:text-ink">
                {name}
              </span>
            </div>
          ))}
          <div className="flex h-24 flex-col justify-center gap-0.5 bg-ink px-5 text-background">
            <p className="font-heading text-[26px] font-medium tabular-nums">6</p>
            <p className="text-[12px] leading-snug text-background/60">
              Monnify endpoints wired end-to-end
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
