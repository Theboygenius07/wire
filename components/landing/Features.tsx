import { RepelDotGrid } from "./RepelDotGrid";

const features = [
  {
    tag: "GATEWAY",
    title: "Paste an API.",
    titleMuted: "Get real MCP tools.",
    body: "Wire parses an OpenAPI spec or a raw curl command and generates a working MCP server — typed schemas, real handlers, downloadable mcp.json. Point any MCP-compatible agent at it directly.",
    chip: "mcp.json →",
  },
  {
    tag: "PLAYGROUND",
    title: "Watch an agent",
    titleMuted: "actually use them.",
    body: "Type a request in plain English. See the exact trace: reasoning, the tool it picked, the call it made, and the real response from the live API behind it — not a simulation.",
    chip: "trace: live",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-14 max-w-xl">
        <p className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted">
          Three parts, one gateway
        </p>
        <h2 className="font-heading mt-3 text-balance text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          Infra a developer can test. A product a founder can use.
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.tag}
            className="group relative z-0 overflow-hidden rounded-2xl border border-panel-line bg-panel p-8 transition-colors duration-200 hover:border-ink/20"
          >
            <RepelDotGrid />
            <div className="relative z-10 flex h-full flex-col gap-5">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">
                  {f.tag}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink transition-transform duration-200 group-hover:rotate-45">
                  &rarr;
                </span>
              </div>

              <h3 className="font-heading text-[22px] font-medium leading-snug tracking-tight">
                <span className="text-ink">{f.title}</span>{" "}
                <span className="text-ink/40">{f.titleMuted}</span>
              </h3>

              <p className="max-w-md text-[14.5px] leading-relaxed text-muted">{f.body}</p>

              <div className="mt-auto inline-flex w-fit items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 font-mono text-[11.5px] text-ink">
                {f.chip}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-0 mt-5 overflow-hidden rounded-2xl border border-panel-line bg-panel p-8 transition-colors duration-200 hover:border-ink/20 sm:p-10">
        <RepelDotGrid />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <span className="text-[11px] font-semibold tracking-[0.1em] text-muted">FLOWPAY</span>
            <h3 className="font-heading mt-3 text-[22px] font-medium leading-snug tracking-tight text-ink">
              One sentence, <span className="text-ink/40">one working product.</span>
            </h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
              &ldquo;Create a payment page for hackathon tickets, ₦5,000, cap 100&rdquo; becomes a
              live checkout link, a QR code, and a dashboard. Monnify moves the money —
              Wire connects the sale to whatever else runs your business.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 sm:w-64">
            <div
              aria-hidden
              className="grid h-12 w-12 shrink-0 grid-cols-4 grid-rows-4 gap-[2px] rounded-md bg-ink p-1.5"
            >
              {[1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0].map((on, i) => (
                <span
                  key={i}
                  className={on ? "rounded-[1px] bg-background" : "rounded-[1px] bg-transparent"}
                />
              ))}
            </div>
            <div className="text-[12px] leading-snug">
              <p className="font-medium text-ink">checkout.wire.dev/tix-a91f</p>
              <p className="text-muted">live in one turn</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
