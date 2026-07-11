import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { useAuth } from "../auth/AuthProvider";
import type { ArcadeMode } from "@flaggo/core/types/arcade";
import { ARCADE_MODES } from "@flaggo/core/types/arcade";
import type { Topic } from "@flaggo/core/types/topic";
import { TOPICS } from "@flaggo/core/types/topic";
import { arcadeBoard, dailyBoard, fetchMyScore, fetchTopScores, triviaBoard, type LeaderboardRow, xpBoard } from "../lib/leaderboard";
import { dateKey } from "@flaggo/core/utils/dailyChallenge";
import { trackEvent } from "../lib/analytics";
import { useGame } from "../state/GameProvider";
import type { TriviaMode } from "@flaggo/core/utils/trivia";

const TOPIC_LABEL: Record<Topic, string> = {
  flag: "Flags",
  capital: "Capitals",
  location: "Location",
  currency: "Currency",
  language: "Language",
  neighbor: "Neighbours"
};

const MODE_LABEL: Record<ArcadeMode, string> = {
  timed: "Timed",
  sudden: "Sudden death",
  hard: "Hard"
};

const TRIVIA: { mode: TriviaMode; label: string }[] = [
  { mode: "higher-lower", label: "Higher/Lower" },
  { mode: "odd-one-out", label: "Odd one out" },
  { mode: "true-false", label: "True/False" }
];

type Tab = "today" | "arcade" | "trivia" | "xp";

export default function LeaderboardScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openSignIn, createAndShareChallenge } = useGame();
  const [tab, setTab] = useState<Tab>("today");
  const [arcadeMode, setArcadeMode] = useState<ArcadeMode>("timed");
  const [topic, setTopic] = useState<Topic>("flag");
  const [triviaMode, setTriviaMode] = useState<TriviaMode>("higher-lower");

  const board = useMemo(() => {
    if (tab === "today") return dailyBoard(dateKey());
    if (tab === "xp") return xpBoard();
    if (tab === "trivia") return triviaBoard(triviaMode);
    return arcadeBoard(arcadeMode, topic);
  }, [arcadeMode, tab, topic, triviaMode]);
  const leaderboardQuery = useQuery<{ rows: LeaderboardRow[]; mine: LeaderboardRow | null }, Error>({
    queryKey: ["leaderboard", board],
    queryFn: async () => {
      trackEvent("leaderboard_open", { board });
      const [nextRows, myRow] = await Promise.all([fetchTopScores(board), user ? fetchMyScore(board) : Promise.resolve(null)]);
      return { rows: nextRows, mine: myRow && !nextRows.some((row) => row.is_me) ? myRow : null };
    }
  });
  const rows = leaderboardQuery.data?.rows ?? [];
  const mine = leaderboardQuery.data?.mine ?? null;
  const error = leaderboardQuery.error?.message ?? null;

  useEffect(() => {
    void leaderboardQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const heading = tab === "today"
    ? "Today"
    : tab === "xp"
      ? "All-time XP"
      : tab === "trivia"
        ? TRIVIA.find((item) => item.mode === triviaMode)?.label ?? "Trivia"
        : `${MODE_LABEL[arcadeMode]} · ${TOPIC_LABEL[topic]}`;

  return (
    <main className="p-5">
      <button onClick={() => navigate(-1)} className="icon-btn mb-4" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
      <h1 className="screen-title">Leaderboards</h1>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {([
          ["today", "Today"],
          ["arcade", "Arcade"],
          ["trivia", "Trivia"],
          ["xp", "XP"]
        ] as const).map(([value, label]) => (
          <button key={value} onClick={() => setTab(value)} className={`chip w-full ${tab === value ? "chip-on" : ""}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "arcade" ? (
        <div className="mt-4 grid gap-3">
          <ChipRow items={ARCADE_MODES.map((mode) => ({ value: mode, label: MODE_LABEL[mode] }))} value={arcadeMode} onChange={setArcadeMode} />
          <ChipRow items={TOPICS.map((item) => ({ value: item, label: TOPIC_LABEL[item] }))} value={topic} onChange={setTopic} />
        </div>
      ) : null}

      {tab === "trivia" ? (
        <div className="mt-4">
          <ChipRow items={TRIVIA.map((item) => ({ value: item.mode, label: item.label }))} value={triviaMode} onChange={setTriviaMode} />
        </div>
      ) : null}

      <p className="mt-4 font-display text-xl font-semibold text-ink">{heading}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={() => void createAndShareChallenge()} className="btn-primary">Challenge a friend</button>
        <button onClick={() => navigate("/friends")} className="btn-secondary">Friends</button>
      </div>
      {!user && <button onClick={openSignIn} className="btn-primary mt-4 w-full">Sign in to compete</button>}
      {error && <div className="mt-4 rounded-2xl bg-error/10 p-4 font-bold text-error">{error}</div>}

      <section className="mt-5 grid gap-2">
        {rows.map((row) => <LeaderboardItem key={`${row.rank}-${row.display_name}-${row.score}`} row={row} />)}
        {mine ? (
          <div className="mt-2 rounded-2xl border border-primary bg-primary/10 p-3 font-display font-semibold text-primary shadow-card">
            #{mine.rank} · you · {mine.score}
          </div>
        ) : null}
        {!rows.length && !error ? (
          <div className="rounded-[24px] border border-line bg-paper p-6 text-center shadow-card">
            <Icon name="trophy" size={42} className="mx-auto text-accent" />
            <h2 className="mt-3 font-display text-xl font-semibold text-ink">No scores yet</h2>
            <p className="mt-1 text-sm font-semibold text-muted">Finish today&apos;s round to claim the first spot</p>
            <button onClick={() => navigate("/daily")} className="btn-primary mt-4 w-full">Play today&apos;s round</button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ChipRow<T extends string>({ items, value, onChange }: { items: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={`chip shrink-0 ${value === item.value ? "chip-on" : ""}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function LeaderboardItem({ row }: { row: LeaderboardRow }) {
  const medal = row.rank <= 3;
  return (
    <div className={`grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-2xl border p-3 shadow-card ${row.is_me ? "border-primary bg-primary/10" : "border-line bg-paper"}`}>
      <span className={`grid h-10 w-10 place-items-center rounded-full font-display text-xl font-black ${medal ? "ring-2 ring-accent text-accent" : "text-muted"}`}>#{row.rank}</span>
      <span className="truncate font-display font-semibold">{row.display_name}</span>
      <span className="font-display text-xl font-black text-primary">{row.score}</span>
    </div>
  );
}
