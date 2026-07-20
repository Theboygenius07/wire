export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-ink text-background">
            <span className="text-[11px] font-semibold leading-none">W</span>
          </span>
          <span className="text-[13px] font-medium text-muted">wire — APIConf 2026</span>
        </div>
        <p className="font-mono text-[12px] text-muted">
          Any API. Every AI agent. One gateway.
        </p>
      </div>
    </footer>
  );
}
