"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { PayoutSetup } from "@/components/customer/PayoutSetup";
import type { FlowRecord } from "@/lib/store/flow";
import type { PayoutAccount } from "@/lib/store/payout";

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function AccountBar({
  initialEmail,
  initialFlows,
  initialPayoutAccount,
}: {
  initialEmail: string | null;
  initialFlows: FlowRecord[];
  initialPayoutAccount: PayoutAccount | null;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [flows, setFlows] = useState(initialFlows);
  const [payoutAccount, setPayoutAccount] = useState(initialPayoutAccount);
  const [showAuth, setShowAuth] = useState(false);

  async function refresh() {
    const [flowsRes, payoutRes] = await Promise.all([fetch("/api/flow/mine"), fetch("/api/payout")]);
    if (flowsRes.ok) setFlows((await flowsRes.json()).flows);
    if (payoutRes.ok) setPayoutAccount((await payoutRes.json()).account);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setEmail(null);
    setFlows([]);
    setPayoutAccount(null);
  }

  if (!email) {
    return (
      <div className="mb-8">
        {showAuth ? (
          <div className="flex justify-center">
            <AuthForm
              title="Log in or sign up."
              subtitle="See the sales pages you've already created, and keep new ones tied to your account."
              onAuthed={(loggedInEmail) => {
                setEmail(loggedInEmail);
                setShowAuth(false);
                refresh();
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
            <p className="text-[13px] text-muted">
              Have an account? Log in to see your existing sales pages.
            </p>
            <button
              onClick={() => setShowAuth(true)}
              className="text-[13px] font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
            >
              Log in / Sign up
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="account-bar" className="mb-8 scroll-mt-6">
      <div className="rounded-xl border border-line bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted">
            Signed in as <span className="font-medium text-ink">{email}</span>
          </p>
          <button
            onClick={logout}
            className="text-[13px] font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
          >
            Log out
          </button>
        </div>

        {flows.length > 0 ? (
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {flows.map((f) => (
              <li key={f.slug} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium text-ink">{f.title}</p>
                  <p className="text-[12px] text-muted">
                    {f.ticketsSold}/{f.ticketCap} sold · {formatNaira(f.revenueNaira)}
                  </p>
                </div>
                <Link
                  href={`/dashboard/${f.slug}`}
                  className="shrink-0 text-[12.5px] font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
                >
                  View dashboard &rarr;
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 border-t border-line pt-3 text-[13px] text-muted">
            No sales pages yet — create one below and it&rsquo;ll show up here.
          </p>
        )}

        <PayoutSetup initialAccount={payoutAccount} onSaved={setPayoutAccount} />
      </div>
    </div>
  );
}
