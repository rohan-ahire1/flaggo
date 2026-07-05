import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useGame } from "../state/GameProvider";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToast } = useGame();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const recovery = useMemo(() => {
    const query = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    return query.get("type") === "recovery" || hash.get("type") === "recovery";
  }, [location.hash, location.search]);

  useEffect(() => {
    if (recovery) return;
    if (!supabase) {
      navigate("/", { replace: true });
      return;
    }
    supabase.auth.getSession().finally(() => navigate("/", { replace: true }));
  }, [navigate, recovery]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      return;
    }
    if (password.length < 6) {
      setStatus("Use at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }
    setBusy(true);
    setStatus("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    setToast("Password updated");
    window.setTimeout(() => setToast(null), 1800);
    navigate("/", { replace: true });
  }

  if (recovery) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-5">
        <form onSubmit={submit} className="w-full max-w-sm rounded-[24px] border border-line bg-paper p-6 shadow-card">
          <h1 className="font-display text-2xl font-semibold">Set a new password</h1>
          <label className="mt-4 block text-sm font-display font-semibold text-muted" htmlFor="new-password">Password</label>
          <input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} className="mt-2 w-full rounded-2xl border-2 border-line bg-paper px-4 py-3 font-bold outline-none focus:border-primary" />
          <label className="mt-3 block text-sm font-display font-semibold text-muted" htmlFor="confirm-password">Confirm password</label>
          <input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} className="mt-2 w-full rounded-2xl border-2 border-line bg-paper px-4 py-3 font-bold outline-none focus:border-primary" />
          {status ? <p className="mt-3 rounded-2xl bg-surface p-3 text-sm font-bold text-muted">{status}</p> : null}
          <button disabled={busy} className="btn-primary mt-4 w-full">{busy ? "Saving..." : "Save password"}</button>
        </form>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper p-5">
      <section className="rounded-[24px] border border-line bg-paper p-6 text-center shadow-card">
        <h1 className="font-display text-2xl font-semibold">Signing you in...</h1>
        <p className="mt-2 font-bold text-muted">Your progress sync will start in a moment.</p>
      </section>
    </main>
  );
}
