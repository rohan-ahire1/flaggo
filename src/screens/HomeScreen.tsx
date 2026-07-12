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
  const { countries, progress, lessons, openLesson, startReview } = useGame();
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
  const due = getDueCountries(progress, countries, learnTopic).slice(0, 8);
  const weak = getWeakCountries(progress, countries, learnTopic).slice(0, 8);

  const explore: { label: string; desc: string; icon: IconName; onClick: () => void }[] = [
    { label: "Arcade", desc: "Beat the clock", icon: "bolt", onClick: () => navigate("/arcade") },
    { label: "Trivia", desc: "Quick-fire facts", icon: "sparkle", onClick: () => navigate("/trivia") },
    { label: "World map", desc: "Find countries", icon: "globe", onClick: () => navigate("/map") },
    { label: "Custom test", desc: "Test yourself", icon: "target", onClick: () => navigate("/test-setup") },
    { label: "Flag library", desc: "Browse every flag", icon: "library", onClick: () => navigate("/library") },
    { label: "Decks", desc: "Build practice sets", icon: "star", onClick: () => navigate("/decks") }
  ];

  const isNewUser = !progress.xp && !progress.completedLessonIds.length && !Object.keys(progress.review).length;

  const nextAction = isNewUser
    ? { label: "Start here", title: "Learn your first flags", sub: "A 2-minute lesson to get going", cta: "Start lesson", onClick: () => nextLesson ? openLesson(nextLesson) : navigate("/learn") }
    : due.length
      ? { label: "Keep going", title: "Review what's due", sub: `${due.length} countries ready to review`, cta: "Review", onClick: () => startReview(due, learnTopic) }
      : weak.length
        ? { label: "Keep going", title: "Practice weak spots", sub: `${weak.length} countries to reinforce`, cta: "Practice", onClick: () => startReview(weak, learnTopic) }
        : { label: "Keep going", title: nextLesson ? "Continue learning" : "Browse lessons", sub: nextLesson?.title ?? "Choose a path", cta: "Go", onClick: () => nextLesson ? openLesson(nextLesson) : navigate("/learn") };

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
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/80">New round every day</p>
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

      <section className="mb-4 rounded-[22px] border border-line bg-paper p-4 shadow-card">
        <p className="section-label">{nextAction.label}</p>
        <h2 className="mt-1 font-display text-xl font-semibold text-ink">{nextAction.title}</h2>
        <p className="text-sm font-semibold text-muted">{nextAction.sub}</p>
        <button onClick={nextAction.onClick} className="btn-primary mt-3 w-full">{nextAction.cta}</button>
      </section>

      <h2 className="mb-2.5 font-display text-xl font-semibold text-ink">Explore</h2>
      <div className="grid grid-cols-2 gap-3">
        {explore.map((item) => <Tile key={item.label} {...item} />)}
      </div>
    </div>
  );
}

function Tile({ label, desc, icon, onClick }: { label: string; desc: string; icon: IconName; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-[18px] border border-line bg-paper p-3.5 text-left shadow-card">
      <Icon name={icon} size={22} className="text-primary" />
      <span className="mt-2 block font-semibold text-ink">{label}</span>
      <span className="block text-[13px] font-medium text-muted">{desc}</span>
    </button>
  );
}
