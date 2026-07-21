const steps = [
  {
    n: "01",
    title: "Paste your API",
    body: "A spec, a curl command, or the pre-loaded Monnify preset — no setup required to try it.",
  },
  {
    n: "02",
    title: "Get MCP tools",
    body: "A real MCP server generates in seconds — one typed tool per endpoint, auth handled.",
  },
  {
    n: "03",
    title: "Watch an agent use them",
    body: "A live trace of reasoning, tool calls, and real responses — side by side, nothing hidden.",
  },
  {
    n: "04",
    title: "Ship the result",
    body: "A checkout page, a QR code, a live dashboard — built from the same tools, and wired to update whatever else runs your business.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
          The actual sequence
        </p>
        <h2 className="font-heading mt-3 max-w-lg text-balance text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          How it works, in order
        </h2>

        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li
              key={s.n}
              className="group border-t-2 border-ink/10 pt-5 transition-colors duration-200 hover:border-accent"
            >
              <span className="tabular-nums text-[13px] font-medium text-muted">{s.n}</span>
              <h3 className="font-heading mt-3 text-[16px] font-medium text-ink">{s.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
