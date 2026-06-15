import HeaderStats from "../components/HeaderStats";
import LearningPath from "../components/LearningPath";
import type { Lesson } from "../types/lesson";
import type { AppProgress } from "../types/progress";

export default function HomeScreen({ progress, lessons, onOpenLesson }: { progress: AppProgress; lessons: Lesson[]; onOpenLesson: (lesson: Lesson) => void }) {
  return (
    <>
      <HeaderStats progress={progress} />
      <section className="px-5 pt-4">
        <div className="rounded-[28px] bg-white p-5 shadow-[0_8px_0_#e5e7eb]">
          <p className="text-sm font-black uppercase text-flaggo-blue">Countries mode</p>
          <h1 className="text-3xl font-black">Learn flags</h1>
          <p className="font-bold text-flaggo-muted">Tiny lessons, big memory gains.</p>
        </div>
      </section>
      <LearningPath lessons={lessons} progress={progress} onOpenLesson={onOpenLesson} />
    </>
  );
}
