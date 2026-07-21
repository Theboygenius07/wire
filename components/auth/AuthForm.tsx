"use client";

import { useState } from "react";

export function AuthForm({
  title,
  subtitle,
  onAuthed,
}: {
  title?: string;
  subtitle?: string;
  onAuthed: (email: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      onAuthed(data.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-panel-line bg-dot-grid p-8">
      <p className="text-[11px] font-semibold tracking-[0.1em] text-muted">ACCOUNT</p>
      <h1 className="font-heading mt-3 text-[22px] font-medium leading-snug tracking-tight text-ink">
        {title ?? (mode === "login" ? "Log in." : "Create an account.")}
      </h1>
      {subtitle && <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{subtitle}</p>}

      <div className="mt-6 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={mode === "signup" ? "At least 8 characters" : "Password"}
          className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
        />
      </div>

      {error && <p className="mt-3 text-[13px] text-ink/70">{error}</p>}

      <button
        onClick={submit}
        disabled={loading || !email || !password}
        className="mt-5 w-full rounded-md bg-accent px-5 py-2.5 text-[14px] font-semibold text-accent-ink transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
      >
        {loading ? "Working…" : mode === "login" ? "Log in" : "Create account"}
      </button>

      <button
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError(null);
        }}
        className="mt-4 block w-full text-center text-[13px] font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
      >
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
    </div>
  );
}
