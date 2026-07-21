import Link from "next/link";

// Shared header for the product surfaces (Playground, Checkout, Dashboard) —
// same wordmark as the landing Nav, but without the marketing section links
// that only make sense on "/".
export function ProductHeader({
  label,
  back,
}: {
  label: string;
  back?: { href: string; label: string };
}) {
  return (
    <header className="border-b border-line bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-ink text-background transition-transform duration-200 group-hover:-rotate-6">
            <span className="text-[13px] font-semibold leading-none">W</span>
          </span>
          <span className="font-heading text-[17px] font-medium tracking-tight text-ink">wire</span>
        </Link>
        <div className="flex items-center gap-4">
          {back && (
            <Link
              href={back.href}
              className="text-[13px] font-medium text-muted underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink/40"
            >
              &larr; {back.label}
            </Link>
          )}
          <span className="text-[13px] font-medium text-muted">{label}</span>
        </div>
      </div>
    </header>
  );
}
