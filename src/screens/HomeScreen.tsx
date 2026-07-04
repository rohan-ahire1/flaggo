import Icon, { type IconName } from "../components/Icon";
import { DAILY_QUESTION_COUNT } from "../utils/dailyChallenge";
import type { Lesson } from "../types/lesson";
import type { AppProgress } from "../types/progress";
import type { Topic } from "../types/topic";

const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function HomeScreen({
  progress,
  lessons,
  onOpenLesson,
  onOpenPaths,
  onOpenMap,
  onOpenDaily,
  onOpenReview,
  onOpenArcade,
  onOpenTrivia,
  onOpenDecks,
  onOpenLeaderboard,
  onOpenFriends,
  onOpenLibrary,
  onOpenStats,
  onChallenge
}: {
  progress: AppProgress;
  lessons: Lesson[];
  onOpenLesson: (lesson: Lesson) => void;
  onTopicChange: (topic: Topic) => void;
  onOpenMap: () => void;
  onOpenDaily: () => void;
  onOpenReview: () => void;
  onOpenPaths: () => void;
  onOpenArcade: () => void;
  onOpenTrivia: () => void;
  onOpenDecks: () => void;
  onOpenLeaderboard: () => void;
  onOpenFriends: () => void;
  onOpenLibrary: () => void;
  onOpenStats: () => void;
  onChallenge: () => void;
}) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const dailyResult = progress.daily.history[todayKey];
  const played = Boolean(dailyResult);
  const total = dailyResult?.total ?? DAILY_QUESTION_COUNT;
  const score = dailyResult?.score ?? 0;
  const streak = progress.daily.streak;
  const hoursToReset = 24 - today.getHours();

  const completed = new Set(progress.completedLessonIds);
  const learnTopic: Topic = progress.selectedTopic === "capital" ? "capital" : "flag";
  const topicLessons = lessons.filter((lesson) => lesson.topic === learnTopic);
  const nextLesson =
    topicLessons.find((lesson) => !completed.has(lesson.id)) ??
    lessons.filter((lesson) => lesson.topic === "flag").find((lesson) => !completed.has(lesson.id));
  const doneCount = topicLessons.filter((lesson) => completed.has(lesson.id)).length;

  const quick: { label: string; icon: IconName; onClick: () => void }[] = [
    { label: "Review due", icon: "review", onClick: onOpenReview },
    { label: "Find on map", icon: "globe", onClick: onOpenMap },
    { label: "Arcade", icon: "bolt", onClick: onOpenArcade }
  ];

  const more: { label: string; icon: IconName; onClick: () => void }[] = [
    { label: "Trivia", icon: "sparkle", onClick: onOpenTrivia },
    { label: "Leaderboard", icon: "trophy", onClick: onOpenLeaderboard },
    { label: "Flag library", icon: "library", onClick: onOpenLibrary },
    { label: "Decks", icon: "star", onClick: onOpenDecks },
    { label: "Stats", icon: "stats", onClick: onOpenStats }
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
        onClick={() => (nextLesson ? onOpenLesson(nextLesson) : onOpenPaths())}
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
          <span className="mt-4 block rounded-2xl bg-white py-3.5 text-center font-display text-xl font-semibold text-primary shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
            {nextLesson ? "Start next lesson →" : "Browse learning paths →"}
          </span>
        </span>
      </button>

      {/* today's practice (daily) */}
      <button
        onClick={onOpenDaily}
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
        onClick={onChallenge}
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

      {/* friends today */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[17px] font-medium text-ink">Friends</h2>
        <button onClick={onOpenLeaderboard} className="text-[13px] font-semibold text-primary">
          See all
        </button>
      </div>
      <div className="mb-7 flex gap-4">
        {["Mia", "Leo", "Ada"].map((name, i) => (
          <button key={name} onClick={onOpenFriends} className="flex flex-col items-center gap-1.5">
            <span
              className="h-[52px] w-[52px] rounded-full border-[2.5px] border-line"
              style={{ background: ["#c9b79a", "#a9bcc4", "#cdb9c4"][i] }}
            />
            <span className="text-xs font-semibold text-ink">{name}</span>
          </button>
        ))}
        <button onClick={onOpenFriends} className="flex flex-col items-center gap-1.5">
          <span className="grid h-[52px] w-[52px] place-items-center rounded-full border-2 border-dashed border-muted text-2xl text-muted">
            +
          </span>
          <span className="text-xs font-semibold text-muted">Invite</span>
        </button>
      </div>

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
