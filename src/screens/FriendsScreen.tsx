import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Icon from "../components/Icon";
import { getFriendsLeaderboard, type FriendsLeaderboardRow } from "../lib/matches";
import { useGame } from "../state/GameProvider";

export default function FriendsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createAndShareChallenge, openSignIn } = useGame();
  const friendsQuery = useQuery<FriendsLeaderboardRow[], Error>({
    queryKey: ["friends-leaderboard"],
    queryFn: getFriendsLeaderboard
  });
  const rows = friendsQuery.data ?? [];
  const queryError = friendsQuery.error?.message ?? null;

  return (
    <main className="p-5">
      <button onClick={() => navigate(-1)} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-paper text-muted shadow-card" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="screen-title">Friends</h1>
          <p className="mt-1 font-bold text-muted">Friends are added automatically after a completed match.</p>
        </div>
        <button onClick={user ? () => void createAndShareChallenge() : openSignIn} className="rounded-2xl bg-primary px-4 py-3 font-display font-black text-white shadow-card">Challenge</button>
      </div>
      {!user && <button onClick={openSignIn} className="mt-4 w-full rounded-2xl bg-primary p-3 font-display font-black text-white">Sign in to challenge friends</button>}
      {queryError && <div className="mt-4 rounded-2xl bg-error/10 p-4 font-bold text-error">{queryError}</div>}
      <section className="mt-5 grid gap-2">
        {rows.map((row) => (
          <div key={`${row.rank}-${row.handle}`} className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-2xl border border-line bg-paper p-3 shadow-card">
            <span className="font-display text-xl font-black text-muted">#{row.rank}</span>
            <span className="min-w-0">
              <span className="block truncate font-display font-black">{row.handle}</span>
              <span className="block text-sm font-bold text-muted">{row.matches_played} matches · {row.total_score} total</span>
            </span>
            <span className="font-display text-xl font-black text-primary">{row.wins}W</span>
          </div>
        ))}
        {!rows.length && !queryError && (
          <div className="rounded-[24px] border border-line bg-paper p-6 text-center shadow-card">
            <Icon name="user" size={36} className="mx-auto text-primary" />
            <h2 className="mt-3 font-display text-xl font-semibold text-ink">No friends yet</h2>
            <p className="mt-1 text-sm font-semibold text-muted">Send a challenge — anyone who plays it joins your list.</p>
            <button onClick={() => void createAndShareChallenge()} className="btn-primary mt-4 w-full">Create a challenge</button>
          </div>
        )}
      </section>
    </main>
  );
}
