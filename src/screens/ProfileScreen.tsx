import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Icon, { type IconName } from "../components/Icon";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useConfirm } from "../components/ConfirmDialog";
import { useInstallPrompt } from "../components/InstallPromptProvider";
import { BRAND } from "../config/brand";
import { supabase } from "../lib/supabase";
import { isSfxEnabled, setSfxEnabled } from "../lib/sfx";
import { isSyntheticEmail } from "../lib/username";
import { useGame } from "../state/GameProvider";
import { BADGES } from "@flaggo/core/game/badges";

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  const { installPrompt, isStandalone, promptInstall } = useInstallPrompt();
  const { progress, resetAll, syncState, syncError, openSignIn, signOutUser, deleteAccount } = useGame();
  const userEmail = user?.email ?? null;
  const synthetic = isSyntheticEmail(userEmail);
  const [sfxOn, setSfxOn] = useState(true);
  const earnedBadges = new Map(progress.badges.map((badge) => [badge.id, badge]));
  const earnedCount = BADGES.filter((badge) => earnedBadges.has(badge.id)).length;
  useEffect(() => {
    setSfxOn(isSfxEnabled());
  }, []);
  const stats: { label: string; value: number; icon: IconName; color: string }[] = [
    { label: "XP", value: progress.xp, icon: "bolt", color: "text-primary" },
    { label: "Streak", value: progress.streak, icon: "flame", color: "text-accentDeep" },
    { label: "Coins", value: progress.coins, icon: "coin", color: "text-accentDeep" },
    { label: "Flags seen", value: Object.keys(progress.review).length, icon: "globe", color: "text-success" }
  ];
  return (
    <main className="p-5">
      <section className="relative overflow-hidden rounded-[28px] bg-paper p-6 text-center shadow-card-lg">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-primary" />
        <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-primary text-white shadow-button ring-4 ring-paper">
          <Icon name="user" size={48} />
        </div>
        <h1 className="mt-4 screen-title">{BRAND.name} learner</h1>
        <p className="font-bold text-muted">{synthetic ? "Username account · no email" : userEmail ?? "Sign in to sync progress"}</p>
      </section>

      <section className="mt-5 rounded-[22px] border border-line bg-paper p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Account</h2>
            <p className="text-sm font-bold text-muted">
              {syncError ? `Sync error: ${syncError}` : userEmail ? `Sync status: ${syncState}` : "Local progress only"}
            </p>
          </div>
          {userEmail ? (
            <button onClick={() => void signOutUser()} className="btn-secondary">Sign out</button>
          ) : (
            <button onClick={openSignIn} className="btn-primary">Sign in</button>
          )}
        </div>
        {synthetic && <AddRecoveryEmail />}
      </section>

      <section className="mt-5 rounded-[22px] border border-line bg-paper p-4 shadow-card">
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Appearance — Theme</h2>
        <p className="mb-3 mt-1 text-sm font-medium text-muted">Re-themes every screen instantly.</p>
        <ThemeSwitcher />
        <label className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          <span>
            <span className="block font-display text-[17px] font-semibold text-ink">Sound effects</span>
          </span>
          <input
            type="checkbox"
            checked={sfxOn}
            onChange={(event) => {
              setSfxOn(event.currentTarget.checked);
              setSfxEnabled(event.currentTarget.checked);
            }}
            className="h-5 w-5 accent-primary"
          />
        </label>
      </section>

      <section className="mt-5 rounded-[22px] border border-line bg-paper p-4 shadow-card">
        <h2 className="font-display text-lg font-semibold">Install {BRAND.name}</h2>
        {isStandalone ? (
          <p className="mt-1 text-sm font-bold text-success">Installed ✓</p>
        ) : installPrompt ? (
          <button onClick={() => void promptInstall()} className="btn-primary mt-3 w-full">Install app</button>
        ) : (
          <p className="mt-1 text-sm font-bold text-muted">Use your browser&apos;s install or add-to-home-screen button for quick offline practice.</p>
        )}
      </section>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[22px] border border-line bg-paper p-4 shadow-card">
            <div className={`flex items-center gap-1.5 ${stat.color}`}>
              <Icon name={stat.icon} size={18} />
              <span className="font-display text-2xl font-black">{stat.value}</span>
            </div>
            <div className="mt-0.5 font-bold text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <button onClick={() => navigate("/stats")} className="btn-secondary mt-3 w-full">Full stats & region progress</button>

      <section className="mt-5 rounded-[22px] border border-line bg-paper p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Achievements</h2>
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-muted">{earnedCount} of {BADGES.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-2.5 md:grid-cols-6">
          {BADGES.map((badge) => {
            const earned = earnedBadges.get(badge.id);
            return (
              <div key={badge.id} className={`rounded-2xl border border-line p-2.5 text-center ${earned ? "bg-paper" : "bg-surface"}`}>
                <div className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl ${earned ? "bg-primary/10 text-primary" : "bg-paper text-muted opacity-60"}`}>
                  <Icon name={badge.icon as IconName} size={23} />
                </div>
                <p className={`mt-2 min-h-10 text-sm font-display font-semibold leading-tight ${earned ? "text-ink" : "text-muted"}`}>{badge.name}</p>
                <p className="mt-1 min-h-8 text-[11px] font-bold leading-tight text-muted">
                  {earned ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(earned.earnedAt)) : badge.hint}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <button
        onClick={async () => {
          const ok = await confirm({
            title: "Reset progress?",
            body: `Reset all ${BRAND.name} progress?`,
            confirmLabel: "Reset progress",
            destructive: true
          });
          if (ok) void resetAll();
        }}
        className="btn-danger mt-8 w-full"
      >
        Reset progress
      </button>

      {userEmail && (
        <button onClick={() => void deleteAccount()} className="btn-ghost mt-3 w-full text-error">
          Delete my account & data
        </button>
      )}
    </main>
  );
}

// Username-only accounts have no real email, so no password recovery. This lets
// them attach one later via Supabase's native email-change flow (a confirmation
// link is sent to the new address; the change applies once they click it).
function AddRecoveryEmail() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      return;
    }
    if (!email.trim()) return;
    setBusy(true);
    setStatus("");
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setBusy(false);
    setStatus(error ? error.message : `Confirmation sent to ${email.trim()}. Click the link to finish.`);
    if (!error) setEmail("");
  }

  return (
    <form onSubmit={submit} className="mt-4 border-t border-line pt-4">
      <label className="text-sm font-display font-semibold text-muted" htmlFor="recovery-email">
        Add a recovery email
      </label>
      <p className="mt-0.5 text-xs font-bold text-muted">Optional — enables password reset if you forget it.</p>
      <div className="mt-2 flex gap-2">
        <input
          id="recovery-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="min-w-0 flex-1 rounded-2xl border-2 border-line bg-paper px-4 py-2.5 font-bold outline-none transition focus:border-primary"
        />
        <button disabled={busy || !email.trim()} className="btn-primary">
          Add
        </button>
      </div>
      {status && <p className="mt-2 text-xs font-bold text-muted">{status}</p>}
    </form>
  );
}
