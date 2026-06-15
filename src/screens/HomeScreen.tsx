import HeaderStats from "../components/HeaderStats";
import Icon from "../components/Icon";
import LearningPath from "../components/LearningPath";
import type { Lesson } from "../types/lesson";
import type { AppProgress } from "../types/progress";

export default function HomeScreen({ progress, lessons, onOpenLesson }: { progress: AppProgress; lessons: Lesson[]; onOpenLesson: (lesson: Lesson) => void }) {
  const completed = progress.completedLessonIds.length;
  const pct = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;
  return (
    <>
      <HeaderStats progress={progress} />
      <section className="px-5 pt-4">
        <div className="relative overflow-hidden rounded-[28px] bg-blue-grad p-5 text-white shadow-[0_8px_0_#1899D6]">
          <div className="absolute -right-6 -top-6 opacity-20">
            <Icon name="globe" size={120} className="animate-spin-slow" />
          </div>
          <p className="flex items-center gap-1.5 text-sm font-display font-extrabold uppercase tracking-wide text-white/85">
            <Icon name="learn" size={15} /> Countries mode
          </p>
          <h1 className="font-display text-3xl font-black">Learn flags</h1>
          <p className="font-bold text-white/85">Tiny lessons, big memory gains.</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-display font-extrabold">{completed}/{lessons.length}</span>
          </div>
        </div>
      </section>
      <LearningPath lessons={lessons} progress={progress} onOpenLesson={onOpenLesson} />
    </>
  );
}
