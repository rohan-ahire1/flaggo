import { useNavigate } from "react-router-dom";
import Icon, { type IconName } from "../components/Icon";
import { DAILY_QUESTION_COUNT } from "@flaggo/core/utils/dailyChallenge";
import type { Topic } from "@flaggo/core/types/topic";
import { getDueCountries, getWeakCountries } from "@flaggo/core/utils/spacedRepetition";
import { useGame } from "../state/GameProvider";

const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { countries, progress, lessons, openLesson, startReview, createAndShareChallenge } = useGame();
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const dailyResult = progress.daily.history[todayKey];
  const played = Boolean(dailyResult);
  const total = dailyResult?.total ?? DAILY_QUESTION_COUNT;
  const score = dailyResult?.score ?? 0;
  const streak = progress.daily.streak;
  const hoursToReset = 24 - today.getUTCHours();

  const completed = new Set(progress.completedLessonIds);
  const learnTopic: Topic = progress.selectedTopic === "capital" ? "capital" : "flag";
  const topicLessons = lessons.filter((lesson) => lesson.topic === learnTopic);
  const nextLesson = topicLessons.find((lesson) => !completed.has(lesson.id)) ?? lessons.filter((lesson) => lesson.topic === "flag").find((lesson) => !completed.has(lesson.id));
  const doneCount = topicLessons.filter((lesson) => completed.has(lesson.id)).length;
  const mastery = topicLessons.length ? Math.round((doneCount / topicLessons.length) * 100) : 0;
  const due = getDueCountries(progress, countries, learnTopic).slice(0, 8);
  const weak = getWeakCountries(progress, countries, learnTopic).slice(0, 8);

  const quick: { label: string; icon: IconName; onClick: () => void }[] = [
    { label: "Learn", icon: "learn", onClick: () => navigate("/learn") },
    { label: "Find on map", icon: "globe", onClick: () => navigate("/map") },
    { label: "Arcade", icon: "bolt", onClick: () => navigate("/arcade") },
    { label: "Trivia", icon: "sparkle", onClick: () => navigate("/trivia") }
  ];

  const more: { label: string; icon: IconName; onClick: () => void }[] = [
    { label: "Leaderboard", icon: "trophy", onClick: () => navigate("/leaderboard") },
    { label: "Flag library", icon: "library", onClick: () => navigate("/library") },
    { label: "Decks", icon: "star", onClick: () => navigate("/decks") },
    { label: "Stats", icon: "stats", onClick: () => navigate("/stats") },
    { label: "Friends", icon: "user", onClick: () => navigate("/friends") }
  ];

  const nextAction = due.length
    ? { title: "Start review", sub: `${due.length} due now`, onClick: () => startReview(due, learnTopic) }
    : weak.length
      ? { title: "Practice weak spots", sub: `${weak.length} countries to reinforce`, onClick: () => startReview(weak, learnTopic) }
      : { title: nextLesson ? "Continue learning" : "Browse lessons", sub: nextLesson?.title ?? "Choose a path", onClick: () => nextLesson ? openLesson(nextLesson) : navigate("/learn") };

  return (
    <div className="px-5 pb-5 pt-5">
      <header className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="screen-title">Today</h1>
          <p className="mt-1 text-sm font-medium text-muted">{DOW[today.getDay()]}, {MON[today.getMonth()]} {today.getDate()}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-[22px] border border-line bg-surface px-3.5 py-1.5 text-[17px] font-bold text-accent">
          <Icon name="flame" size={17} />
          {streak}
        </div>
      </header>

      <section className="relative mb-4 overflow-hidden rounded-[26px] bg-primary p-5 text-white shadow-card-lg">
        <span className="wl-dots absolute inset-0 opacity-90" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/80">Today&apos;s five</p>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">resets in {hoursToReset}h</span>
          </div>
          <h2 className="mt-3 font-display text-[32px] font-semibold leading-none">Daily challenge</h2>
          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: total }).map((_, index) => (
              <span key={index} className={`h-2 flex-1 rounded-full ${played && index < score ? "bg-white" : "bg-white/25"}`} />
            ))}
          </div>
          <button onClick={() => navigate("/daily")} className="btn-inverse mt-5 w-full">
            {played ? "Play again" : "Play today's Five"}
          </button>
        </div>
      </section>

      <section className="mb-4 grid grid-cols-[1fr_auto] items-center gap-3 rounded-[22px] border border-line bg-paper p-4 shadow-card">
        <div>
          <p className="section-label">Progress pulse</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">{nextAction.title}</h2>
          <p className="text-sm font-semibold text-muted">{nextAction.sub}</p>
        </div>
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface text-center font-display text-xl font-black text-primary">{mastery}%</div>
        <button onClick={nextAction.onClick} className="btn-primary col-span-2">Go</button>
      </section>

      <button onClick={() => void createAndShareChallenge()} className="mb-6 flex w-full items-center gap-3.5 rounded-[20px] border border-line bg-surface p-3.5 text-left">
        <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[14px] bg-accent text-white"><Icon name="flag" size={24} /></span>
        <span className="flex-1">
          <span className="block font-display text-[18px] font-semibold text-ink">Challenge a friend</span>
          <span className="block text-[13px] text-muted">Send a shared round and compare</span>
        </span>
        <Icon name="chevron" size={20} className="text-muted" />
      </button>

      <h2 className="mb-2.5 font-display text-xl font-semibold text-ink">Quick play</h2>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {quick.map((q) => <Tile key={q.label} {...q} tone="primary" />)}
      </div>

      <h2 className="mb-2.5 font-display text-xl font-semibold text-ink">More</h2>
      <div className="grid grid-cols-2 gap-3">
        {more.map((m) => <Tile key={m.label} {...m} tone="muted" />)}
      </div>
    </div>
  );
}

function Tile({ label, icon, onClick, tone }: { label: string; icon: IconName; onClick: () => void; tone: "primary" | "muted" }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 rounded-[18px] border border-line bg-paper p-3.5 text-left shadow-card">
      <Icon name={icon} size={22} className={tone === "primary" ? "text-primary" : "text-muted"} />
      <span className="font-semibold text-ink">{label}</span>
    </button>
  );
}
