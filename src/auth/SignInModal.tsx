import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Icon from "../components/Icon";
import { useDialogFocus } from "../components/useDialogFocus";
import { env } from "../config/env";
import { supabase } from "../lib/supabase";
import { trackEvent } from "../lib/analytics";
import { checkUsernameAvailable, isValidUsername, usernameToEmail } from "../lib/username";
import { useGame } from "../state/GameProvider";

type Availability = "idle" | "invalid" | "checking" | "yes" | "no";

export default function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [resetMode, setResetMode] = useState(false);
  const [signupMethod, setSignupMethod] = useState<"email" | "username">("email");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [avail, setAvail] = useState<Availability>("idle");
  const [showPassword, setShowPassword] = useState(false);
  const { setToast } = useGame();
  const close = useCallback(() => onClose(), [onClose]);
  const { shellRef, initialFocusRef } = useDialogFocus(open, close);

  const usernameOnly = mode === "signup" && signupMethod === "username";

  // Debounced username-availability check (username-only signup only).
  useEffect(() => {
    if (!usernameOnly) {
      setAvail("idle");
      return;
    }
    const name = displayName.trim();
    if (!name) {
      setAvail("idle");
      return;
    }
    if (!isValidUsername(name)) {
      setAvail("invalid");
      return;
    }
    setAvail("checking");
    const id = window.setTimeout(async () => {
      try {
        setAvail((await checkUsernameAvailable(name)) ? "yes" : "no");
      } catch {
        setAvail("idle");
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [displayName, usernameOnly]);

  if (!open) return null;

  async function submitReset(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      return;
    }
    if (!email.trim()) {
      setStatus("Enter your email.");
      return;
    }
    setBusy(true);
    setStatus("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${env.siteUrl}/auth/callback?type=recovery`
    });
    setBusy(false);
    setStatus(error ? error.message : "Check your email.");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      return;
    }
    if (!password) {
      setStatus("Enter a password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setStatus("Use a password with at least 6 characters.");
      return;
    }

    if (usernameOnly) {
      const name = displayName.trim();
      if (!isValidUsername(name)) {
        setStatus("Usernames are 3–20 letters, numbers, or underscores.");
        return;
      }
      if (avail !== "yes") {
        setStatus("Pick an available username first.");
        return;
      }
    } else if (!email.trim()) {
      setStatus("Enter your email and password.");
      return;
    }

    setBusy(true);
    setStatus("");

    let error;
    if (mode === "signin") {
      ({ error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }));
    } else if (usernameOnly) {
      const name = displayName.trim();
      const createError = await createUsernameAccount(name, password);
      if (createError) {
        setBusy(false);
        setStatus(createError);
        return;
      }
      ({ error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(name), password }));
    } else {
      ({ error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: displayName.trim() || null } }
      }));
    }

    setBusy(false);
    if (error) {
      setStatus(error.message);
    } else {
      trackEvent(mode === "signin" ? "sign-in" : "sign-up", {
        method: mode === "signup" ? signupMethod : "password"
      });
      setToast(mode === "signin" ? "Signed in" : "Account created");
      window.setTimeout(() => setToast(null), 1800);
      onClose();
    }
  }

  function switchMode(nextMode: "signin" | "signup") {
    setMode(nextMode);
    setResetMode(false);
    setStatus("");
  }

  // Create a username-only (synthetic-email, auto-confirmed) account via the
  // Netlify function. This must stay server-side because Supabase Auth may
  // reject synthetic emails on direct client signup and because auto-confirming
  // requires the service-role key. Returns an error message, or null on success.
  async function createUsernameAccount(name: string, pw: string): Promise<string | null> {
    try {
      const res = await fetch("/.netlify/functions/username-signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: name, password: pw })
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 404) return "Username signup is not available in this environment. Run with Netlify Dev or deploy the server function.";
      return res.ok ? null : body.error ?? "Could not create account.";
    } catch {
      return "Username signup is not available right now. Please try again in a moment.";
    }
  }

  const createDisabled = busy || (usernameOnly && avail !== "yes");

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section ref={shellRef} role="dialog" aria-modal="true" aria-labelledby="signin-title" className="w-full max-w-sm rounded-[24px] border border-line bg-paper p-5 shadow-soft animate-pop-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="signin-title" className="font-display text-2xl font-semibold">{resetMode ? "Reset password" : mode === "signin" ? "Sign in" : "Create account"}</h2>
            <p className="mt-1 text-sm font-bold text-muted">{resetMode ? "We'll send a reset link to your email." : "Sync progress across devices."}</p>
          </div>
          <button onClick={onClose} className="icon-btn" aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>

        {!resetMode && <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1">
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={`chip w-full ${mode === "signin" ? "chip-on" : ""}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`chip w-full ${mode === "signup" ? "chip-on" : ""}`}
          >
            Create account
          </button>
        </div>}

        {resetMode ? (
          <form onSubmit={submitReset} className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-display font-semibold text-muted" htmlFor="reset-email">Email</label>
              <input
                ref={initialFocusRef}
                id="reset-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border-2 border-line bg-paper px-4 py-3 font-bold outline-none transition focus:border-primary"
              />
            </div>
            <button disabled={busy} className="btn-primary mt-3 w-full">{busy ? "Sending..." : "Send reset link"}</button>
            <button type="button" onClick={() => { setResetMode(false); setStatus(""); }} className="btn-ghost w-full">
              Back to sign in
            </button>
            {status && <p className="mt-4 rounded-2xl bg-surface p-3 text-sm font-bold text-muted">{status}</p>}
          </form>
        ) : (
          <>

        {mode === "signup" && (
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-line p-1">
            <button
              type="button"
              onClick={() => setSignupMethod("email")}
              className={`chip w-full ${signupMethod === "email" ? "chip-on" : ""}`}
            >
              With email
            </button>
            <button
              type="button"
              onClick={() => setSignupMethod("username")}
              className={`chip w-full ${signupMethod === "username" ? "chip-on" : ""}`}
            >
              Username only
            </button>
          </div>
        )}

        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === "signup" && (
            <div>
              <label className="text-sm font-display font-semibold text-muted" htmlFor="signin-display-name">
                Username{usernameOnly ? "" : " (optional)"}
              </label>
              <div className="relative">
                <input
                  id="signin-display-name"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="flag_explorer"
                  maxLength={usernameOnly ? 20 : 32}
                  autoComplete="username"
                  className={`mt-2 w-full rounded-2xl border-2 bg-paper px-4 py-3 pr-11 font-bold outline-none transition focus:border-primary ${
                    usernameOnly && avail === "no" ? "border-error" : "border-line"
                  }`}
                />
                {usernameOnly && avail === "yes" && (
                  <span className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-success" aria-label="Username available">
                    <Icon name="check" size={22} />
                  </span>
                )}
                {usernameOnly && avail === "no" && (
                  <span className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-error" aria-label="Username taken">
                    <Icon name="x" size={22} />
                  </span>
                )}
              </div>
              {usernameOnly && (
                <p className={`mt-1.5 text-xs font-bold ${avail === "no" ? "text-error" : "text-muted"}`}>
                  {avail === "checking"
                    ? "Checking availability…"
                    : avail === "yes"
                      ? "Available!"
                      : avail === "no"
                        ? "That username is taken."
                        : "3–20 letters, numbers, or underscores. No email needed."}
                </p>
              )}
            </div>
          )}

          {!usernameOnly && (
            <div>
              <label className="text-sm font-display font-semibold text-muted" htmlFor="signin-email">
                Email
              </label>
              <input
                id="signin-email"
                ref={initialFocusRef}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border-2 border-line bg-paper px-4 py-3 font-bold outline-none transition focus:border-primary"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-display font-semibold text-muted" htmlFor="signin-password">
              Password
            </label>
            <div className="relative">
              <input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "signin" ? "Your password" : "At least 6 characters"}
                minLength={mode === "signup" ? 6 : undefined}
                className="mt-2 w-full rounded-2xl border-2 border-line bg-paper px-4 py-3 pr-14 font-bold outline-none transition focus:border-primary"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 mt-1 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-bold text-muted">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {mode === "signin" && (
            <button type="button" onClick={() => { setResetMode(true); setStatus(""); }} className="btn-ghost">
              Forgot password?
            </button>
          )}

          {usernameOnly && (
            <p className="rounded-2xl bg-surface p-3 text-xs font-bold text-muted">
              No email means we can&apos;t help you reset your password. You can add a recovery email anytime from your profile.
            </p>
          )}

          <button disabled={createDisabled} className="btn-primary mt-3 w-full">
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {status && <p className="mt-4 rounded-2xl bg-surface p-3 text-sm font-bold text-muted">{status}</p>}
          </>
        )}
      </section>
    </div>
  );
}
