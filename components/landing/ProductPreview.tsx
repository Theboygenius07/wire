export function ProductPreview() {
  return (
    <div className="relative">
      {/* floating annotation tags, Ramp-style pinned callouts */}
      <div className="absolute -top-3 left-6 z-10 hidden items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[11.5px] font-medium text-ink sm:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        spec &rarr; typed MCP tool, no hand-written glue
      </div>
      <div className="absolute -bottom-3 right-6 z-10 hidden items-center gap-1.5 rounded-lg border border-ink bg-ink px-3 py-1.5 text-[11.5px] font-medium text-background sm:flex">
        real Monnify sandbox response
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-surface">
        {/* chrome */}
        <div className="flex items-center gap-2 border-b border-line bg-[#F7F7F5] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E4E2DA]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E4E2DA]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E4E2DA]" />
          </div>
          <div className="mx-auto flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11.5px] text-muted">
            <span className="text-accent">●</span> wire.dev/playground
          </div>
        </div>

        {/* body */}
        <div className="grid gap-0 p-5 sm:p-7">
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-ink px-4 py-2.5 text-[13.5px] text-background">
              Create a payment page for hackathon tickets. Charge ₦5,000. Stop after 100 tickets.
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3">
            <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-accent-soft" />
            <div className="flex-1 space-y-2.5">
              <p className="font-mono text-[11.5px] italic text-muted">
                reasoning → create_reserved_account → create_invoice
              </p>

              <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-[#FBFBF9] px-3 py-2 font-mono text-[11.5px] text-ink">
                <span className="rounded bg-accent-soft px-1.5 py-0.5 text-accent-ink">tool_call</span>
                create_invoice({"{"} amount: 5000, cap: 100 {"}"})
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-3">
                <div
                  aria-hidden
                  className="grid h-14 w-14 shrink-0 grid-cols-4 grid-rows-4 gap-[2px] rounded-md bg-ink p-1.5"
                >
                  {[1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0].map((on, i) => (
                    <span
                      key={i}
                      className={on ? "rounded-[1px] bg-background" : "rounded-[1px] bg-transparent"}
                    />
                  ))}
                </div>
                <div className="text-[12.5px] leading-snug">
                  <p className="font-medium text-ink">checkout.wire.dev/tix-a91f</p>
                  <p className="text-muted">reserved account · live dashboard wired</p>
                </div>
              </div>

              <p className="text-[13.5px] text-ink">
                Done — checkout page, QR code, and dashboard are live.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
