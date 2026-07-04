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
    <div className="flex flex-col px-4 pb-8 pt-4">
      {lessons.map((lesson, index) => {
        const state: LessonNodeState = completed.has(lesson.id)
          ? "completed"
          : index === Math.max(0, currentIndex)
            ? "current"
            : "upcoming";
        return <LessonNode key={lesson.id} lesson={lesson} state={state} index={index} total={lessons.length} onClick={() => onOpenLesson(lesson)} />;
      })}
    </div>
  );
}
