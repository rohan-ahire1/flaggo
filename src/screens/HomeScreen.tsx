import { useNavigate } from "react-router-dom";
import Icon, { type IconName } from "../components/Icon";
import { DAILY_QUESTION_COUNT } from "@flaggo/core/utils/dailyChallenge";
import type { Topic } from "@flaggo/core/types/topic";
import { useGame } from "../state/GameProvider";

const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { progress, lessons, openLesson, createAndShareChallenge } = useGame();
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
  const nextLesson =
    topicLessons.find((lesson) => !completed.has(lesson.id)) ??
    lessons.filter((lesson) => lesson.topic === "flag").find((lesson) => !completed.has(lesson.id));
  const doneCount = topicLessons.filter((lesson) => completed.has(lesson.id)).length;

  const quick: { label: string; icon: IconName; onClick: () => void }[] = [
    { label: "Review due", icon: "review", onClick: () => navigate("/review") },
    { label: "Find on map", icon: "globe", onClick: () => navigate("/map") },
    { label: "Arcade", icon: "bolt", onClick: () => navigate("/arcade") }
  ];

  const more: { label: string; icon: IconName; onClick: () => void }[] = [
    { label: "Trivia", icon: "sparkle", onClick: () => navigate("/trivia") },
    { label: "Leaderboard", icon: "trophy", onClick: () => navigate("/leaderboard") },
    { label: "Flag library", icon: "library", onClick: () => navigate("/library") },
    { label: "Decks", icon: "star", onClick: () => navigate("/decks") },
    { label: "Stats", icon: "stats", onClick: () => navigate("/stats") }
  ];

  return (
    <div className="px-5 pb-5 pt-5">
      {/* header */}
      <header className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="screen-title">Today</h1>
          <p className="mt-1 text-sm font-medium text-muted">
            {DOW[today.getDay()]}, {MON[today.getMonth()]} {today.getDate()}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-[22px] border border-line bg-surface px-3.5 py-1.5 text-[17px] font-bold text-accent">
          <Icon name="flame" size={17} />
          {streak}
        </div>
      </header>

      {/* hero: continue learning */}
      <button
        onClick={() => navigate("/learn")}
        className="relative mb-[18px] w-full overflow-hidden rounded-[26px] bg-primary p-5 text-left shadow-card-lg"
      >
        <span className="wl-dots absolute inset-0 opacity-90" />
        <span className="relative block">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/80">
            {nextLesson ? "Continue learning" : "Learning paths"}
          </span>
          <span className="mt-2.5 block font-display text-[30px] font-semibold leading-tight text-white">
            {nextLesson ? nextLesson.title : "All caught up!"}
          </span>
          <span className="mt-1 block text-[15px] text-white/80">
            {nextLesson ? `${nextLesson.region} · ${doneCount}/${topicLessons.length} lessons done` : "You've finished every lesson in this path"}
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              if (nextLesson) openLesson(nextLesson);
              else navigate("/learn");
            }}
            className="mt-4 block rounded-2xl bg-white py-3.5 text-center font-display text-xl font-semibold text-primary shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
          >
            {nextLesson ? "Start next lesson →" : "Browse learning paths →"}
          </span>
        </span>
      </button>

      {/* today's practice (daily) */}
      <button
        onClick={() => navigate("/daily")}
        className="mb-4 flex w-full items-center gap-3.5 rounded-[20px] border-[1.5px] border-line bg-surface p-3.5 text-left"
      >
        <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[14px] bg-primary text-white">
          <Icon name="flame" size={24} />
        </span>
        <span className="flex-1">
          <span className="block font-display text-[18px] font-medium text-ink">Today's practice</span>
          <span className="block text-[13px] text-muted">
            {played ? `Done ${score}/${total} · play again` : `${total} mixed questions · keeps your streak alive`}
          </span>
        </span>
        <span className="flex-none text-[12px] font-semibold text-muted">resets in {hoursToReset}h</span>
        <Icon name="chevron" size={20} className="text-muted" />
      </button>

      {/* challenge a friend */}
      <button
        onClick={() => void createAndShareChallenge()}
        className="mb-6 flex w-full items-center gap-3.5 rounded-[20px] border-[1.5px] border-line bg-surface p-3.5 text-left"
      >
        <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[14px] bg-accent text-white">
          <Icon name="flag" size={24} />
        </span>
        <span className="flex-1">
          <span className="block font-display text-[18px] font-medium text-ink">Challenge a friend</span>
          <span className="block text-[13px] text-muted">Send today's exact round &amp; compare</span>
        </span>
        <Icon name="chevron" size={20} className="text-muted" />
      </button>

      {/* quick play */}
      <h2 className="mb-2.5 font-display text-[17px] font-medium text-ink">Quick play</h2>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {quick.map((q) => (
          <button
            key={q.label}
            onClick={q.onClick}
            className="flex items-center gap-2.5 rounded-[18px] border-[1.5px] border-line bg-paper p-3.5 text-left shadow-card"
          >
            <Icon name={q.icon} size={24} className="text-primary" />
            <span className="font-semibold text-ink">{q.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate("/friends")}
        className="mb-7 flex w-full items-center gap-3.5 rounded-[20px] border-[1.5px] border-line bg-surface p-3.5 text-left"
      >
        <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[14px] bg-accent text-white">
          <Icon name="trophy" size={24} />
        </span>
        <span className="flex-1">
          <span className="block font-display text-[18px] font-medium text-ink">Friends &amp; leaderboards</span>
          <span className="block text-[13px] text-muted">Play a challenge to build your friends list</span>
        </span>
        <Icon name="chevron" size={20} className="text-muted" />
      </button>

      {/* more */}
      <div className="grid grid-cols-2 gap-3">
        {more.map((m) => (
          <button
            key={m.label}
            onClick={m.onClick}
            className="flex items-center gap-2.5 rounded-[18px] border-[1.5px] border-line bg-paper p-3.5 text-left shadow-card"
          >
            <Icon name={m.icon} size={22} className="text-muted" />
            <span className="font-semibold text-ink">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
