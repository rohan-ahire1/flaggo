import HeaderStats from "../components/HeaderStats";
import Icon from "../components/Icon";
import LearningPath from "../components/LearningPath";
import type { Lesson } from "../types/lesson";
import type { AppProgress } from "../types/progress";
import type { Topic } from "../types/topic";
import { lessonsForTopic } from "../utils/lessonGenerator";

export default function HomeScreen({
  progress,
  lessons,
  onOpenLesson,
  onTopicChange,
  onOpenMap,
  onOpenDaily,
  onOpenPaths,
  onOpenArcade,
  onOpenTrivia,
  onOpenDecks,
  onOpenLeaderboard,
  onOpenFriends,
  onChallenge
}: {
  progress: AppProgress;
  lessons: Lesson[];
  onOpenLesson: (lesson: Lesson) => void;
  onTopicChange: (topic: Topic) => void;
  onOpenMap: () => void;
  onOpenDaily: () => void;
  onOpenPaths: () => void;
  onOpenArcade: () => void;
  onOpenTrivia: () => void;
  onOpenDecks: () => void;
  onOpenLeaderboard: () => void;
  onOpenFriends: () => void;
  onChallenge: () => void;
}) {
  const topicLessons = lessonsForTopic(lessons, progress.selectedTopic);
  const completed = topicLessons.filter((lesson) => progress.completedLessonIds.includes(lesson.id)).length;
  const pct = topicLessons.length ? Math.round((completed / topicLessons.length) * 100) : 0;
  const isCapital = progress.selectedTopic === "capital";
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const dailyResult = progress.daily.history[todayKey];
  return (
    <>
      <HeaderStats progress={progress} />
      <section className="px-5 pt-4">
        <div className="mb-4 grid grid-cols-2 rounded-2xl bg-white p-1 shadow-card">
          {([
            ["flag", "Flags"],
            ["capital", "Capitals"]
          ] as const).map(([topic, label]) => (
            <button
              key={topic}
              onClick={() => onTopicChange(topic)}
              className={`rounded-xl px-4 py-2 font-display text-sm font-extrabold transition ${
                progress.selectedTopic === topic ? "bg-flaggo-green text-white shadow-sm" : "text-flaggo-muted hover:text-flaggo-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative overflow-hidden rounded-[28px] bg-blue-grad p-5 text-white shadow-[0_8px_0_#1899D6]">
          <div className="absolute -right-6 -top-6 opacity-20">
            <Icon name="globe" size={120} className="animate-spin-slow" />
          </div>
          <p className="flex items-center gap-1.5 text-sm font-display font-extrabold uppercase tracking-wide text-white/85">
            <Icon name="learn" size={15} /> Countries mode
          </p>
          <h1 className="font-display text-3xl font-black">Learn {isCapital ? "capitals" : "flags"}</h1>
          <p className="font-bold text-white/85">Tiny lessons, big memory gains.</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-display font-extrabold">{completed}/{topicLessons.length}</span>
          </div>
        </div>
        <button onClick={onOpenDaily} className="mt-4 w-full rounded-[24px] border border-flaggo-border bg-white p-4 text-left shadow-card">
          <span className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-flaggo-red/10 text-flaggo-red"><Icon name="flame" size={28} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-xl font-black">Daily Challenge</span>
              <span className="block font-bold text-flaggo-muted">{dailyResult ? `Completed ${dailyResult.score}/${dailyResult.total} · play again` : "Not played today"} · streak {progress.daily.streak}</span>
            </span>
          </span>
        </button>
        <button onClick={onOpenMap} className="mt-4 w-full overflow-hidden rounded-[24px] border border-flaggo-border bg-white p-4 text-left shadow-card">
          <span className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-flaggo-blue/10 text-flaggo-blue">
              <Icon name="globe" size={28} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-xl font-black">World Map</span>
              <span className="block font-bold text-flaggo-muted">Locate countries, identify shapes, or explore freely.</span>
            </span>
          </span>
        </button>
        <button onClick={onChallenge} className="mt-4 w-full overflow-hidden rounded-[24px] border border-flaggo-border bg-white p-4 text-left shadow-card">
          <span className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-flaggo-green/10 text-flaggo-green">
              <Icon name="trophy" size={28} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-xl font-black">Challenge a friend</span>
              <span className="block font-bold text-flaggo-muted">Share a seeded quiz and compare scores.</span>
            </span>
          </span>
        </button>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
          {[
            ["Paths", "learn", onOpenPaths],
            ["Arcade", "trophy", onOpenArcade],
            ["Trivia", "sparkle", onOpenTrivia],
            ["Decks", "star", onOpenDecks],
            ["Leaderboard", "stats", onOpenLeaderboard],
            ["Friends", "heart", onOpenFriends]
          ].map(([label, icon, handler]) => (
            <button key={label as string} onClick={handler as () => void} className="rounded-[22px] border border-flaggo-border bg-white p-4 text-left shadow-card">
              <Icon name={icon as "learn"} size={24} className="mb-2 text-flaggo-blue" />
              <span className="font-display font-black">{label as string}</span>
            </button>
          ))}
        </div>
      </section>
      <LearningPath lessons={topicLessons} progress={progress} onOpenLesson={onOpenLesson} />
      <div className="pb-24" />
    </>
  );
}
