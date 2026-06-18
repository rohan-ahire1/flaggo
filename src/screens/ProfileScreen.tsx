import Icon, { type IconName } from "../components/Icon";
import type { AppProgress } from "../types/progress";

type Props = {
  progress: AppProgress;
  onReset: () => void;
  userEmail: string | null;
  adsRemoved: boolean;
  syncState: string;
  syncError: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onUpgrade: () => void;
  onDeleteAccount: () => void;
};

export default function ProfileScreen({ progress, onReset, userEmail, adsRemoved, syncState, syncError, onSignIn, onSignOut, onUpgrade, onDeleteAccount }: Props) {
  const stats: { label: string; value: number; icon: IconName; color: string }[] = [
    { label: "XP", value: progress.xp, icon: "bolt", color: "text-flaggo-blue" },
    { label: "Streak", value: progress.streak, icon: "flame", color: "text-flaggo-orange" },
    { label: "Coins", value: progress.coins, icon: "coin", color: "text-flaggo-yellow" },
    { label: "Flags seen", value: Object.keys(progress.review).length, icon: "globe", color: "text-flaggo-green" }
  ];
  return (
    <main className="p-5 pb-24">
      <section className="relative overflow-hidden rounded-[28px] bg-white p-6 text-center shadow-card-lg">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-green-grad" />
        <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-green-grad text-white shadow-[0_6px_0_#46A302] ring-4 ring-white">
          <Icon name="profile" size={48} />
        </div>
        <h1 className="mt-4 font-display text-3xl font-black">Flaggo learner</h1>
        <p className="font-bold text-flaggo-muted">{userEmail ?? "Sign in to sync progress"}</p>
        {adsRemoved && <span className="mt-3 inline-flex rounded-full bg-green-50 px-3 py-1 font-display text-sm font-black text-flaggo-green">Flaggo Pro</span>}
      </section>

      <section className="mt-5 rounded-[22px] border border-flaggo-border bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-black">Account</h2>
            <p className="text-sm font-bold text-flaggo-muted">
              {syncError ? `Sync error: ${syncError}` : userEmail ? `Sync status: ${syncState}` : "Local progress only"}
            </p>
          </div>
          {userEmail ? (
            <button onClick={onSignOut} className="rounded-2xl bg-slate-100 px-4 py-2 font-display font-black text-flaggo-text">Sign out</button>
          ) : (
            <button onClick={onSignIn} className="rounded-2xl bg-flaggo-blue px-4 py-2 font-display font-black text-white">Sign in</button>
          )}
        </div>
      </section>

      <section className="mt-5 rounded-[22px] border border-flaggo-border bg-white p-4 shadow-card">
        <h2 className="font-display text-lg font-black">Flaggo Pro</h2>
        <p className="mt-1 text-sm font-bold text-flaggo-muted">Remove ads forever for one $1 payment. Signing in restores Pro on any device.</p>
        <button disabled={adsRemoved} onClick={onUpgrade} className="flaggo-button mt-4 w-full bg-green-grad text-white shadow-button-green">
          {adsRemoved ? "Ads removed" : "Remove ads - $1"}
        </button>
      </section>

      <section className="mt-5 rounded-[22px] border border-flaggo-border bg-white p-4 shadow-card">
        <h2 className="font-display text-lg font-black">Install Flaggo</h2>
        <p className="mt-1 text-sm font-bold text-flaggo-muted">Use your browser&apos;s install or add-to-home-screen button for quick offline practice.</p>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[22px] border border-flaggo-border bg-white p-4 shadow-card">
            <div className={`flex items-center gap-1.5 ${stat.color}`}>
              <Icon name={stat.icon} size={18} />
              <span className="font-display text-2xl font-black">{stat.value}</span>
            </div>
            <div className="mt-0.5 font-bold text-flaggo-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          if (window.confirm("Reset all Flaggo progress?")) onReset();
        }}
        className="flaggo-button mt-8 w-full bg-flaggo-red text-white shadow-button-red"
      >
        Reset progress
      </button>

      {userEmail && (
        <button onClick={onDeleteAccount} className="mt-3 w-full rounded-2xl px-5 py-4 font-display font-extrabold text-flaggo-red">
          Delete my account & data
        </button>
      )}
    </main>
  );
}
