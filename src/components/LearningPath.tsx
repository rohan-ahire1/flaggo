import type { Lesson } from "../types/lesson";
import type { AppProgress } from "../types/progress";
import LessonNode, { type LessonNodeState } from "./LessonNode";

export default function LearningPath({
  lessons,
  progress,
  onOpenLesson
}: {
  lessons: Lesson[];
  progress: AppProgress;
  onOpenLesson: (lesson: Lesson) => void;
}) {
  const completed = new Set(progress.completedLessonIds);
  const currentIndex = lessons.findIndex((lesson) => !completed.has(lesson.id));
  return (
    <div className="relative flex flex-col gap-5 px-4 pb-8 pt-4">
      <div className="absolute bottom-10 left-1/2 top-8 w-2 -translate-x-1/2 rounded-full bg-slate-200" />
      {lessons.map((lesson, index) => {
        const state: LessonNodeState = completed.has(lesson.id)
          ? "completed"
          : index === Math.max(0, currentIndex)
            ? "current"
            : "locked";
        return <LessonNode key={lesson.id} lesson={lesson} state={state} index={index} onClick={() => onOpenLesson(lesson)} />;
      })}
    </div>
  );
}
