import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import LessonNode from "../components/LessonNode";
import { PATH_TOPICS, type Topic } from "@flaggo/core/types/topic";
import { lessonsForTopic } from "@flaggo/core/utils/lessonGenerator";
import { trackEvent } from "../lib/analytics";
import { useGame } from "../state/GameProvider";

const TOPIC_LABELS: Record<string, string> = { flag: "Flags", capital: "Capitals", currency: "Currencies", location: "Map", language: "Languages" };
const EXTRA_TOPICS = PATH_TOPICS.filter((topic) => topic !== "flag");

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
      <button onClick={region ? () => navigate("/learn") : () => navigate(-1)} className="icon-btn mb-4" aria-label="Back">
        <Icon name="chevron" size={20} className="rotate-180" />
      </button>
      <h1 className="screen-title">{region ?? (progress.selectedTopic === "flag" ? "Flag lessons" : `${TOPIC_LABELS[progress.selectedTopic]} lessons`)}</h1>
      {!region && progress.selectedTopic === "flag" && (
        <p className="mt-1 font-bold text-muted">Work region by region until you can recognize every flag.</p>
      )}
      {!region && progress.selectedTopic !== "flag" && (
        <button onClick={() => switchTopic("flag")} className="mt-3 flex w-full items-center gap-3 rounded-[18px] border border-primary/25 bg-primary/10 p-3.5 text-left text-primaryDark">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-paper"><Icon name="flag" size={20} /></span>
          <span className="flex-1">
            <span className="block font-display font-semibold">Back to flag lessons</span>
            <span className="block text-xs font-bold opacity-75">The main Flaggo learning path</span>
          </span>
          <Icon name="chevron" size={16} />
        </button>
      )}
      {region && <p className="mt-1 font-bold text-muted">Learning path: {TOPIC_LABELS[progress.selectedTopic] ?? progress.selectedTopic}</p>}
      {!region ? (
        <>
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
                  className="flex items-center gap-4 rounded-[22px] border border-line bg-paper p-4 text-left shadow-card"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 font-display font-black text-primaryDark">{pct}%</span>
                  <span className="flex-1">
                    <span className="block font-display text-xl font-black">{item.name === "World" ? "World Basics" : item.name}</span>
                    <span className="font-bold text-muted">{done}/{item.lessons.length} lessons</span>
                  </span>
                  <Icon name="chevron" className="text-muted" />
                </button>
              );
            })}
          </section>

          <section className="mt-8 border-t border-line pt-6">
            <p className="section-label">Beyond flags</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">Learn more about the world</h2>
            <p className="mt-1 text-sm font-medium text-muted">Optional paths for when you want to go further.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXTRA_TOPICS.map((topic) => {
                const active = progress.selectedTopic === topic;
                return (
                  <button
                    key={topic}
                    onClick={() => switchTopic(topic)}
                    className={`chip ${active ? "chip-on" : ""}`}
                  >
                    {TOPIC_LABELS[topic] ?? topic}
                  </button>
                );
              })}
            </div>
          </section>
        </>
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
