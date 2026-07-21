"use client";

import { useEffect, useRef, useState } from "react";
import { ProductHeader } from "@/components/product/ProductHeader";
import { SECTIONS, TYPES, type Endpoint } from "@/lib/apidocs/data";

function slugify(method: string, path: string): string {
  return `${method}-${path}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function MethodBadge({ method }: { method: string }) {
  const isDelete = method.includes("DELETE") && !method.includes("/");
  const isPost = method.startsWith("POST");
  const cls = isDelete
    ? "bg-ink text-background border-ink"
    : isPost
      ? "bg-accent-soft text-ink border-panel-line"
      : "bg-panel text-ink border-line";
  return (
    <span className={`rounded-md border px-2 py-1 font-mono text-[11px] font-medium tracking-[0.02em] ${cls}`}>
      {method}
    </span>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const id = slugify(ep.method, ep.path);
  return (
    <div id={id} className="scroll-mt-20 overflow-hidden rounded-2xl border border-line">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <MethodBadge method={ep.method} />
        <span className="font-mono text-[13.5px] text-ink">{ep.path}</span>
        {ep.internal && (
          <span className="rounded-full border border-dashed border-panel-line px-2.5 py-1 font-mono text-[10.5px] text-muted">
            inbound only
          </span>
        )}
        <span className="ml-auto rounded-full border border-line px-2.5 py-1 font-mono text-[10.5px] text-muted">
          {ep.auth}
        </span>
      </div>

      <div className="flex flex-col gap-5 p-5">
        <p className="text-[13.5px] text-ink">{ep.summary}</p>

        {ep.body && ep.body.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted">Body</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    <th className="border-b border-line pb-2 text-left font-mono text-[10.5px] font-normal uppercase tracking-[0.05em] text-muted">
                      Field
                    </th>
                    <th className="border-b border-line pb-2 text-left font-mono text-[10.5px] font-normal uppercase tracking-[0.05em] text-muted">
                      Type
                    </th>
                    <th className="border-b border-line pb-2 text-left font-mono text-[10.5px] font-normal uppercase tracking-[0.05em] text-muted" />
                    <th className="border-b border-line pb-2 text-left font-mono text-[10.5px] font-normal uppercase tracking-[0.05em] text-muted">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ep.body.map(([field, type, req, desc]) => (
                    <tr key={field}>
                      <td className="whitespace-nowrap border-b border-line py-2 pr-4 font-mono text-ink">{field}</td>
                      <td className="whitespace-nowrap border-b border-line py-2 pr-4 font-mono text-[11.5px] text-[#7a7a30]">
                        {type}
                      </td>
                      <td className="whitespace-nowrap border-b border-line py-2 pr-4 font-mono text-[10.5px] text-muted">
                        {req}
                      </td>
                      <td className="border-b border-line py-2 text-muted">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted">Response</p>
          <pre className="overflow-x-auto rounded-lg border border-panel-line bg-panel p-4 font-mono text-[12px] leading-relaxed text-ink">
            {ep.response}
          </pre>
        </div>

        <div>
          <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted">Status</p>
          <div className="flex flex-wrap gap-2">
            {ep.status.map(([code, meaning]) => (
              <span key={code} className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-muted">
                <b className="font-medium text-ink">{code}</b> {meaning}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  // Build-time constant, not read from window.location — same value on the
  // server-rendered HTML and the client, so no hydration mismatch and no
  // need for an effect just to display it.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const targets = Array.from(sectionRefs.current.values());
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  const navGroups = [
    ...SECTIONS.map((sec) => ({
      title: sec.title,
      links: sec.endpoints.map((ep) => ({ id: slugify(ep.method, ep.path), method: ep.method.split(" ")[0], path: ep.path })),
    })),
    { title: "Data types", links: [{ id: "data-types", method: "", path: "Response objects" }] },
  ];

  return (
    <>
      <ProductHeader label="API Reference" />
      <div className="mx-auto flex max-w-6xl items-start">
        <nav className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[230px] shrink-0 overflow-y-auto border-r border-line px-5 py-8 lg:block">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-6">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{group.title}</p>
              <div className="flex flex-col">
                {group.links.map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    className={`flex items-baseline gap-2 rounded-md py-1 text-[13px] transition-colors ${
                      activeId === link.id ? "font-medium text-ink" : "text-muted hover:text-ink"
                    }`}
                  >
                    {link.method && <span className="w-12 shrink-0 font-mono text-[10px] text-muted">{link.method}</span>}
                    <span className="truncate">{link.path}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <main className="min-w-0 flex-1 px-6 py-12 sm:px-10">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Reference
            </p>
            <h1 className="font-heading text-balance text-[2rem] font-medium tracking-tight text-ink sm:text-[2.5rem]">
              Every route Wire exposes.
            </h1>
            <p className="mt-4 text-[14.5px] leading-relaxed text-muted">
              Flow (prompt-to-payment pages), Relay (any API &rarr; MCP tools), and the account/payout
              endpoints underneath both. Generated directly from the route handlers in{" "}
              <code className="font-mono text-ink">app/api/</code> — every request/response shape below
              reflects what the code actually does, not an aspirational spec.
            </p>
            {baseUrl && (
              <p className="mt-4 inline-block rounded-full border border-line px-3 py-1.5 font-mono text-[12px] text-muted">
                {baseUrl}
              </p>
            )}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-line p-4">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.05em] text-muted">Session auth</p>
                <p className="mt-2 text-[13px] text-ink">
                  An <code className="font-mono">httpOnly</code> cookie (<code className="font-mono">wire_session</code>) set
                  by <code className="font-mono">/api/auth/login</code> or <code className="font-mono">/api/auth/signup</code>.
                  Required for anything scoped to an account.
                </p>
              </div>
              <div className="rounded-2xl border border-line p-4">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.05em] text-muted">Public</p>
                <p className="mt-2 text-[13px] text-ink">
                  No auth — either genuinely public reference data, or intentionally open (Flow creation
                  itself needs no account).
                </p>
              </div>
              <div className="rounded-2xl border border-line p-4">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.05em] text-muted">Signed webhook</p>
                <p className="mt-2 text-[13px] text-ink">
                  Verified via an HMAC signature header from the sender (Monnify, Twilio) — not something
                  you call directly.
                </p>
              </div>
              <div className="rounded-2xl border border-line p-4">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.05em] text-muted">Cron secret</p>
                <p className="mt-2 text-[13px] text-ink">
                  Guarded by an <code className="font-mono">Authorization: Bearer $CRON_SECRET</code> header
                  Vercel sends automatically on schedule.
                </p>
              </div>
            </div>
          </div>

          {SECTIONS.map((sec) => (
            <section
              key={sec.id}
              id={sec.id}
              ref={(el) => {
                if (el) sectionRefs.current.set(sec.id, el);
              }}
              className="mb-14 scroll-mt-20"
            >
              <div className="mb-2 flex items-baseline gap-3 border-b border-line pb-3">
                <h2 className="font-heading text-[22px] font-medium tracking-tight text-ink">{sec.title}</h2>
              </div>
              <p className="mb-6 max-w-2xl text-[13.5px] text-muted">{sec.intro}</p>
              <div className="flex flex-col gap-4">
                {sec.endpoints.map((ep) => (
                  <EndpointCard key={slugify(ep.method, ep.path)} ep={ep} />
                ))}
              </div>
            </section>
          ))}

          <section
            id="data-types"
            ref={(el) => {
              if (el) sectionRefs.current.set("data-types", el);
            }}
            className="scroll-mt-20"
          >
            <div className="mb-2 border-b border-line pb-3">
              <h2 className="font-heading text-[22px] font-medium tracking-tight text-ink">Data types</h2>
            </div>
            <p className="mb-6 max-w-2xl text-[13.5px] text-muted">
              The shapes referenced above, as they&rsquo;re actually stored — every optional field is
              genuinely optional depending on which kind of Flow it is.
            </p>
            <div className="flex flex-col gap-3">
              {TYPES.map((t) => (
                <div key={t.name} className="rounded-2xl border border-line p-5">
                  <h3 className="font-mono text-[14.5px] font-medium text-ink">{t.name}</h3>
                  <pre className="mt-3 overflow-x-auto rounded-lg border border-panel-line bg-panel p-4 font-mono text-[12px] leading-relaxed text-ink">
                    {t.fields}
                  </pre>
                  <p className="mt-2 text-[12.5px] text-muted">{t.note}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
