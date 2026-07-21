const stats = [
  { value: "6", label: "Monnify operations wired end-to-end — not a demo stub" },
  { value: "2", label: "consumer surfaces on one gateway: a dev playground and a live product" },
  { value: "1", label: "shared tool definition — the MCP server, the playground, and Flow all call the same handlers, so nothing drifts" },
];

export function Stats() {
  return (
    <section id="proof" className="mx-auto max-w-6xl px-6 py-24">
      <p className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
        Under the hood
      </p>
      <h2 className="font-heading mt-3 max-w-lg text-balance text-3xl font-medium tracking-tight text-ink sm:text-4xl">
        What&rsquo;s actually running, not what we claim
      </h2>

      <div className="mt-12 grid gap-10 border-t border-line pt-10 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-heading tabular-nums text-5xl font-medium text-ink">{s.value}</p>
            <p className="mt-3 max-w-[26ch] text-[14.5px] leading-relaxed text-muted">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
