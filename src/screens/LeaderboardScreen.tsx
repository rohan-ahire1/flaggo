import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import { useAuth } from "../auth/AuthProvider";
import { ARCADE_MODES } from "../types/arcade";
import { TOPICS } from "../types/topic";
import { arcadeBoard, dailyBoard, fetchTopScores, type LeaderboardRow, xpBoard } from "../lib/leaderboard";
import { dateKey } from "../utils/dailyChallenge";
import { trackEvent } from "../lib/analytics";

export default function LeaderboardScreen({
  onBack,
  onSignIn,
  onChallenge,
  onOpenFriends
}: {
  onBack: () => void;
  onSignIn: () => void;
  onChallenge: () => void;
  onOpenFriends: () => void;
}) {
  const { user } = useAuth();
  const boards = useMemo(
    () => [
      { id: dailyBoard(dateKey()), label: "Today" },
      ...ARCADE_MODES.flatMap((mode) => TOPICS.map((topic) => ({ id: arcadeBoard(mode, topic), label: `${mode} ${topic}` }))),
      { id: xpBoard(), label: "All-time XP" }
    ],
    []
  );
  const [board, setBoard] = useState(boards[0].id);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    trackEvent("leaderboard_open", { board });
    fetchTopScores(board)
      .then((next) => {
        if (active) setRows(next);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [board]);

  return (
    <main className="p-5">
      <button onClick={onBack} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
      <h1 className="font-display text-3xl font-black">Leaderboards</h1>
      <select value={board} onChange={(event) => setBoard(event.target.value)} className="mt-4 w-full rounded-2xl border border-flaggo-border bg-white p-3 font-display font-black shadow-card">
        {boards.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={onChallenge} className="rounded-2xl bg-flaggo-green p-3 font-display font-black text-white shadow-card">Challenge a friend</button>
        <button onClick={onOpenFriends} className="rounded-2xl bg-white p-3 font-display font-black text-flaggo-blue shadow-card">Friends</button>
      </div>
      {!user && <button onClick={onSignIn} className="mt-4 w-full rounded-2xl bg-flaggo-green p-3 font-display font-black text-white">Sign in to compete</button>}
      {error && <div className="mt-4 rounded-2xl bg-red-50 p-4 font-bold text-flaggo-red">{error}</div>}
      <section className="mt-5 grid gap-2">
        {rows.map((row) => (
          <div key={`${row.rank}-${row.display_name}-${row.score}`} className={`grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-2xl border p-3 shadow-card ${row.is_me ? "border-flaggo-green bg-flaggo-green/10" : "border-flaggo-border bg-white"}`}>
            <span className="font-display text-xl font-black text-flaggo-muted">#{row.rank}</span>
            <span className="truncate font-display font-black">{row.display_name}</span>
            <span className="font-display text-xl font-black text-flaggo-green">{row.score}</span>
          </div>
        ))}
        {!rows.length && !error && <div className="rounded-[24px] bg-white p-6 text-center font-bold text-flaggo-muted shadow-card">No scores yet.</div>}
      </section>
    </main>
  );
}
