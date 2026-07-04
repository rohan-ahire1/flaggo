import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import LessonNode from "../components/LessonNode";
import type { Lesson } from "../types/lesson";
import type { AppProgress } from "../types/progress";
import { lessonsForTopic } from "../utils/lessonGenerator";
import { trackEvent } from "../lib/analytics";

export default function PathsScreen({ lessons, progress, onOpenLesson, onBack }: { lessons: Lesson[]; progress: AppProgress; onOpenLesson: (lesson: Lesson) => void; onBack: () => void }) {
  const [region, setRegion] = useState<string | null>(null);
  const topicLessons = lessonsForTopic(lessons, progress.selectedTopic);
  const regions = useMemo(() => {
    const order = ["World", "Asia", "Europe", "Africa", "Americas", "Oceania", "Territories"];
    return order
      .map((name) => ({ name, lessons: topicLessons.filter((lesson) => lesson.region === name) }))
      .filter((item) => item.lessons.length);
  }, [topicLessons]);
  const visibleLessons = region ? topicLessons.filter((lesson) => lesson.region === region) : [];

  return (
    <main className="p-5">
      <button onClick={region ? () => setRegion(null) : onBack} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back">
        <Icon name="chevron" size={20} className="rotate-180" />
      </button>
      <h1 className="screen-title">{region ?? "Learning paths"}</h1>
      {!region ? (
        <section className="mt-5 grid gap-3">
          {regions.map((item) => {
            const done = item.lessons.filter((lesson) => progress.completedLessonIds.includes(lesson.id)).length;
            const pct = Math.round((done / item.lessons.length) * 100);
            return (
              <button
                key={item.name}
                onClick={() => {
                  setRegion(item.name);
                  trackEvent("path_open", { region: item.name, topic: progress.selectedTopic });
                }}
                className="flex items-center gap-4 rounded-[22px] border border-flaggo-border bg-white p-4 text-left shadow-card"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-flaggo-green/10 font-display font-black text-flaggo-green">{pct}%</span>
                <span className="flex-1">
                  <span className="block font-display text-xl font-black">{item.name === "World" ? "World Basics" : item.name}</span>
                  <span className="font-bold text-flaggo-muted">{done}/{item.lessons.length} lessons</span>
                </span>
                <Icon name="chevron" className="text-flaggo-muted" />
              </button>
            );
          })}
        </section>
      ) : (
        <section className="mt-5 grid gap-3">
          {visibleLessons.map((lesson, index) => {
            const state = progress.completedLessonIds.includes(lesson.id) ? "completed" : "current";
            return <LessonNode key={lesson.id} lesson={lesson} index={index} state={state} onClick={() => onOpenLesson(lesson)} />;
          })}
        </section>
      )}
    </main>
  );
}
