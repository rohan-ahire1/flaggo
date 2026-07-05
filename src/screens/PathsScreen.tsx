import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import LessonNode from "../components/LessonNode";
import { PATH_TOPICS, type Topic } from "@flaggo/core/types/topic";
import { lessonsForTopic } from "@flaggo/core/utils/lessonGenerator";
import { trackEvent } from "../lib/analytics";
import { useGame } from "../state/GameProvider";

const TOPIC_LABELS: Record<string, string> = { flag: "Flags", capital: "Capitals" };

export default function PathsScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { lessons, progress, openLesson, switchTopic } = useGame();
  const region = params.region ? decodeURIComponent(params.region) : null;
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
      <button onClick={region ? () => navigate("/learn") : () => navigate(-1)} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back">
        <Icon name="chevron" size={20} className="rotate-180" />
      </button>
      <h1 className="screen-title">{region ?? "Learning paths"}</h1>
      {!region && (
        <div className="mt-3 flex gap-2">
          {PATH_TOPICS.map((topic) => {
            const active = progress.selectedTopic === topic;
            return (
              <button
                key={topic}
                onClick={() => switchTopic(topic)}
                className={`rounded-full px-4 py-1.5 font-display text-sm font-black transition ${active ? "bg-flaggo-green text-white shadow-card" : "border border-flaggo-border bg-white text-flaggo-muted"}`}
              >
                {TOPIC_LABELS[topic] ?? topic}
              </button>
            );
          })}
        </div>
      )}
      {region && <p className="mt-1 font-bold text-flaggo-muted">Learning path: {TOPIC_LABELS[progress.selectedTopic] ?? progress.selectedTopic}</p>}
      {!region ? (
        <section className="mt-5 grid gap-3">
          {regions.map((item) => {
            const done = item.lessons.filter((lesson) => progress.completedLessonIds.includes(lesson.id)).length;
            const pct = Math.round((done / item.lessons.length) * 100);
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(`/learn/${encodeURIComponent(item.name)}`);
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
        <section className="mt-6 flex flex-col">
          {(() => {
            const firstIncomplete = visibleLessons.findIndex((lesson) => !progress.completedLessonIds.includes(lesson.id));
            return visibleLessons.map((lesson, index) => {
              const completed = progress.completedLessonIds.includes(lesson.id);
              const state = completed ? "completed" : index === firstIncomplete ? "current" : "upcoming";
              return (
                <LessonNode
                  key={lesson.id}
                  lesson={lesson}
                  index={index}
                  total={visibleLessons.length}
                  state={state}
                  onClick={() => openLesson(lesson)}
                />
              );
            });
          })()}
        </section>
      )}
    </main>
  );
}
