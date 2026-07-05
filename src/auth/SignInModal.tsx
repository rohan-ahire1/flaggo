import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Icon from "../components/Icon";
import { supabase } from "../lib/supabase";
import { trackEvent } from "../lib/analytics";
import { checkUsernameAvailable, isValidUsername, usernameToEmail } from "../lib/username";

type Availability = "idle" | "invalid" | "checking" | "yes" | "no";

export default function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signupMethod, setSignupMethod] = useState<"email" | "username">("email");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [avail, setAvail] = useState<Availability>("idle");

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
      setStatus(
        mode === "signin"
          ? "Signed in."
          : usernameOnly
            ? "Account created. You can add a recovery email later in your profile."
            : "Account created. Check your email if confirmation is required."
      );
    }
  }

  function switchMode(nextMode: "signin" | "signup") {
    setMode(nextMode);
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <section className="w-full max-w-sm rounded-[24px] border border-flaggo-border bg-white p-5 shadow-soft animate-pop-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-black">{mode === "signin" ? "Sign in" : "Create account"}</h2>
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

        {mode === "signup" && (
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-flaggo-border p-1">
            <button
              type="button"
              onClick={() => setSignupMethod("email")}
              className={`rounded-xl px-3 py-1.5 font-display text-xs font-black ${signupMethod === "email" ? "bg-flaggo-green text-white" : "text-flaggo-muted"}`}
            >
              With email
            </button>
            <button
              type="button"
              onClick={() => setSignupMethod("username")}
              className={`rounded-xl px-3 py-1.5 font-display text-xs font-black ${signupMethod === "username" ? "bg-flaggo-green text-white" : "text-flaggo-muted"}`}
            >
              Username only
            </button>
          </div>
        )}

        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === "signup" && (
            <div>
              <label className="text-sm font-display font-extrabold text-flaggo-muted" htmlFor="signin-display-name">
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
                  className={`mt-2 w-full rounded-2xl border-2 bg-white px-4 py-3 pr-11 font-bold outline-none transition focus:border-flaggo-green ${
                    usernameOnly && avail === "no" ? "border-flaggo-red" : "border-flaggo-border"
                  }`}
                />
                {usernameOnly && avail === "yes" && (
                  <span className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-flaggo-green" aria-label="Username available">
                    <Icon name="check" size={22} />
                  </span>
                )}
                {usernameOnly && avail === "no" && (
                  <span className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-flaggo-red" aria-label="Username taken">
                    <Icon name="x" size={22} />
                  </span>
                )}
              </div>
              {usernameOnly && (
                <p className={`mt-1.5 text-xs font-bold ${avail === "no" ? "text-flaggo-red" : "text-flaggo-muted"}`}>
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
          )}

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

          {usernameOnly && (
            <p className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-flaggo-muted">
              No email means we can&apos;t help you reset your password. You can add a recovery email anytime from your profile.
            </p>
          )}

          <button disabled={createDisabled} className="flaggo-button mt-3 w-full bg-green-grad text-white shadow-button-green disabled:opacity-50">
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {status && <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-flaggo-muted">{status}</p>}
      </section>
    </div>
  );
}
