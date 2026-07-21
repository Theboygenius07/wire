"use client";

import { useEffect, useState } from "react";
import type { PayoutAccount } from "@/lib/store/payout";

type Bank = { name: string; code: string };

function maskAccountNumber(accountNumber: string): string {
  return `•••• ${accountNumber.slice(-4)}`;
}

export function PayoutSetup({
  initialAccount,
  onSaved,
}: {
  initialAccount: PayoutAccount | null;
  onSaved: (account: PayoutAccount) => void;
}) {
  const [account, setAccount] = useState(initialAccount);
  const [showForm, setShowForm] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!showForm || banks.length) return;
    fetch("/api/banks")
      .then((r) => r.json())
      .then((d) => setBanks(d.banks ?? []))
      .catch(() => {});
  }, [showForm, banks.length]);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const bank = banks.find((b) => b.code === bankCode);
      const res = await fetch("/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankCode, accountNumber, bankName: bank?.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't verify those account details.");
      setAccount(data.account);
      setShowForm(false);
      onSaved(data.account);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (account) {
    return (
      <p className="mt-3 border-t border-line pt-3 text-[12.5px] text-muted">
        Payouts go to {account.bankName} {maskAccountNumber(account.accountNumber)}
      </p>
    );
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      {showForm ? (
        <div className="space-y-2">
          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink focus:border-ink/30 focus:outline-none"
          >
            <option value="">{banks.length ? "Select your bank" : "Loading banks…"}</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Account number"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={loading || !bankCode || !accountNumber}
              className="flex-1 rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
            >
              {loading ? "Verifying…" : "Save payout account"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md border border-line px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:border-ink/20"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-[12.5px] text-ink/70">{error}</p>}
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-[12.5px] font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
        >
          Set up where your sales money goes &rarr;
        </button>
      )}
    </div>
  );
}
