import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import Icon from "../components/Icon";
import { getFriendsLeaderboard, type FriendsLeaderboardRow } from "../lib/matches";

export default function FriendsScreen({
  onBack,
  onChallenge,
  onSignIn
}: {
  onBack: () => void;
  onChallenge: () => void;
  onSignIn: () => void;
}) {
  const { user } = useAuth();
  const [rows, setRows] = useState<FriendsLeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    getFriendsLeaderboard()
      .then((next) => {
        if (active) setRows(next);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="p-5 pb-24">
      <button onClick={onBack} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black">Friends</h1>
          <p className="mt-1 font-bold text-flaggo-muted">Friends are added automatically after a completed match.</p>
        </div>
        <button onClick={user ? onChallenge : onSignIn} className="rounded-2xl bg-flaggo-green px-4 py-3 font-display font-black text-white shadow-card">Challenge</button>
      </div>
      {!user && <button onClick={onSignIn} className="mt-4 w-full rounded-2xl bg-flaggo-green p-3 font-display font-black text-white">Sign in to challenge friends</button>}
      {error && <div className="mt-4 rounded-2xl bg-red-50 p-4 font-bold text-flaggo-red">{error}</div>}
      <section className="mt-5 grid gap-2">
        {rows.map((row) => (
          <div key={`${row.rank}-${row.handle}`} className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-2xl border border-flaggo-border bg-white p-3 shadow-card">
            <span className="font-display text-xl font-black text-flaggo-muted">#{row.rank}</span>
            <span className="min-w-0">
              <span className="block truncate font-display font-black">{row.handle}</span>
              <span className="block text-sm font-bold text-flaggo-muted">{row.matches_played} matches · {row.total_score} total</span>
            </span>
            <span className="font-display text-xl font-black text-flaggo-green">{row.wins}W</span>
          </div>
        ))}
        {!rows.length && !error && <div className="rounded-[24px] bg-white p-6 text-center font-bold text-flaggo-muted shadow-card">No friend matches yet.</div>}
      </section>
    </main>
  );
}
