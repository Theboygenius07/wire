export function Nav() {
  const links = [
    { href: "/flow", label: "Flow" },
    { href: "/relay", label: "Relay" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="/" className="group flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-ink text-background transition-transform duration-200 group-hover:-rotate-6">
            <span className="text-[13px] font-semibold leading-none">W</span>
          </span>
          <span className="font-heading text-[17px] font-medium tracking-tight text-ink">wire</span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative text-[14.5px] font-medium text-ink/70 transition-colors hover:text-ink"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink transition-all duration-200 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <a
            href="#" // TODO: point at the repo once it's pushed
            className="hidden text-[14.5px] font-medium text-ink/70 transition-colors hover:text-ink sm:block"
          >
            View source
          </a>
          <a
            href="/playground"
            className="rounded-lg bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98]"
          >
            Open playground
          </a>
        </div>
      </div>
    </header>
  );
}
