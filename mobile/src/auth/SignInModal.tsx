import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { trackEvent } from "../lib/analytics";

export default function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      return;
    }
    if (!email.trim() || !password) {
      setStatus("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setStatus("Use a password with at least 6 characters.");
      return;
    }

    setBusy(true);
    setStatus("");

    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { full_name: displayName.trim() || null } }
          });

    setBusy(false);
    if (error) {
      setStatus(error.message);
    } else {
      trackEvent(mode === "signin" ? "sign-in" : "sign-up", { method: "password" });
      setStatus(mode === "signin" ? "Signed in." : "Account created. Check your email if confirmation is required.");
    }
  }

  function switchMode(nextMode: "signin" | "signup") {
    setMode(nextMode);
    setStatus("");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <section className="w-full max-w-sm rounded-[24px] border border-flaggo-border bg-white p-5 shadow-soft animate-pop-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-black">Sign in</h2>
            <p className="mt-1 text-sm font-bold text-flaggo-muted">Sync progress across devices.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 font-display font-black text-flaggo-muted hover:bg-slate-100" aria-label="Close">
            x
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={`rounded-xl px-3 py-2 font-display text-sm font-black ${mode === "signin" ? "bg-white text-flaggo-text shadow-sm" : "text-flaggo-muted"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`rounded-xl px-3 py-2 font-display text-sm font-black ${mode === "signup" ? "bg-white text-flaggo-text shadow-sm" : "text-flaggo-muted"}`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === "signup" && (
            <div>
              <label className="text-sm font-display font-extrabold text-flaggo-muted" htmlFor="signin-display-name">
                Username
              </label>
              <input
                id="signin-display-name"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="flag explorer"
                maxLength={32}
                className="mt-2 w-full rounded-2xl border-2 border-flaggo-border bg-white px-4 py-3 font-bold outline-none transition focus:border-flaggo-green"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-display font-extrabold text-flaggo-muted" htmlFor="signin-email">
              Email
            </label>
            <input
              id="signin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border-2 border-flaggo-border bg-white px-4 py-3 font-bold outline-none transition focus:border-flaggo-green"
            />
          </div>
          <div>
            <label className="text-sm font-display font-extrabold text-flaggo-muted" htmlFor="signin-password">
              Password
            </label>
            <input
              id="signin-password"
              type="password"
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "signin" ? "Your password" : "At least 6 characters"}
              minLength={mode === "signup" ? 6 : undefined}
              className="mt-2 w-full rounded-2xl border-2 border-flaggo-border bg-white px-4 py-3 font-bold outline-none transition focus:border-flaggo-green"
            />
          </div>
          <button disabled={busy} className="flaggo-button mt-3 w-full bg-green-grad text-white shadow-button-green">
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {status && <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-flaggo-muted">{status}</p>}
      </section>
    </div>
  );
}
