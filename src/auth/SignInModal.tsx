import { useState } from "react";
import type { FormEvent } from "react";
import { env } from "../config/env";
import { supabase } from "../lib/supabase";
import { trackEvent } from "../lib/analytics";

export default function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function signInWithGoogle() {
    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${env.siteUrl}/auth/callback` }
    });
    if (error) {
      setStatus(error.message);
      setBusy(false);
    } else {
      trackEvent("sign-in", { method: "google" });
    }
  }

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${env.siteUrl}/auth/callback` }
    });
    setBusy(false);
    if (error) {
      setStatus(error.message);
    } else {
      trackEvent("sign-in", { method: "magic-link" });
      setStatus("Check your email for the sign-in link.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <section className="w-full max-w-sm rounded-[24px] border border-flaggo-border bg-white p-5 shadow-soft animate-pop-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-black">Sign in</h2>
            <p className="mt-1 text-sm font-bold text-flaggo-muted">Sync progress and keep Pro across devices.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 font-display font-black text-flaggo-muted hover:bg-slate-100" aria-label="Close">
            x
          </button>
        </div>

        <button disabled={busy} onClick={signInWithGoogle} className="flaggo-button mt-5 w-full bg-white text-flaggo-text shadow-card">
          Continue with Google
        </button>

        <form onSubmit={sendMagicLink} className="mt-4">
          <label className="text-sm font-display font-extrabold text-flaggo-muted" htmlFor="signin-email">
            Email magic link
          </label>
          <input
            id="signin-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-2xl border-2 border-flaggo-border bg-white px-4 py-3 font-bold outline-none transition focus:border-flaggo-green"
          />
          <button disabled={busy} className="flaggo-button mt-3 w-full bg-green-grad text-white shadow-button-green">
            Send link
          </button>
        </form>

        {status && <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-flaggo-muted">{status}</p>}
      </section>
    </div>
  );
}
