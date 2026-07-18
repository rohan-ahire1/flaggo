import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Icon, { type IconName } from "../components/Icon";
import LessonNode from "../components/LessonNode";
import type { Topic } from "@flaggo/core/types/topic";
import { lessonsForTopic } from "@flaggo/core/utils/lessonGenerator";
import { trackEvent } from "../lib/analytics";
import { useAppBack } from "../navigation/useAppBack";
import { useGame } from "../state/GameProvider";

const TOPIC_LABELS: Record<string, string> = { flag: "Flags", capital: "Capitals", currency: "Currencies", location: "Map", language: "Languages" };
const TOPIC_CHOICES: { topic: Exclude<Topic, "neighbor">; title: string; desc: string; icon: IconName }[] = [
  { topic: "flag", title: "Flags", desc: "Recognize every national and territory flag.", icon: "flag" },
  { topic: "capital", title: "Capitals", desc: "Match countries with their capital cities.", icon: "pin" },
  { topic: "currency", title: "Currencies", desc: "Learn what money each country uses.", icon: "coin" },
  { topic: "location", title: "Locations", desc: "Place countries on the interactive world map.", icon: "globe" },
  { topic: "language", title: "Languages", desc: "Discover official languages around the world.", icon: "book" }
];
const EXTRA_TOPICS = TOPIC_CHOICES.filter((item) => item.topic !== "flag");

export default function PathsScreen() {
  const navigate = useNavigate();
  const goBack = useAppBack("/");
  const goBackToLessons = useAppBack("/learn");
  const location = useLocation();
  const params = useParams();
  const { lessons, progress, openLesson, switchTopic } = useGame();
  const region = params.region ? decodeURIComponent(params.region) : null;
  const showTopicChooser = !region && new URLSearchParams(location.search).get("view") === "topics";
  const topicLessons = lessonsForTopic(lessons, progress.selectedTopic);
  const regions = useMemo(() => {
    const order = ["World", "Asia", "Europe", "Africa", "Americas", "Oceania", "Territories"];
    return order
      .map((name) => ({ name, lessons: topicLessons.filter((lesson) => lesson.region === name) }))
      .filter((item) => item.lessons.length);
  }, [topicLessons]);
  const visibleLessons = region ? topicLessons.filter((lesson) => lesson.region === region) : [];

  function chooseTopic(topic: (typeof TOPIC_CHOICES)[number]["topic"]) {
    switchTopic(topic);
    navigate("/learn");
  }

  if (showTopicChooser) {
    return (
      <main className="p-5">
        <button onClick={goBack} className="icon-btn mb-4" aria-label="Back">
          <Icon name="chevron" size={20} className="rotate-180" />
        </button>
        <p className="section-label">Beyond flags</p>
        <h1 className="screen-title mt-1">Learn the whole world</h1>
        <p className="mt-1 font-bold text-muted">Choose another part of geography to master.</p>

        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          {TOPIC_CHOICES.map((item) => {
            const lessonCount = lessonsForTopic(lessons, item.topic).length;
            return (
              <button
                key={item.topic}
                onClick={() => chooseTopic(item.topic)}
                className="flex items-center gap-4 rounded-[22px] border border-line bg-paper p-4 text-left shadow-card"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon name={item.icon} size={25} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-semibold text-ink">{item.title}</span>
                  <span className="mt-0.5 block text-[13px] font-medium leading-snug text-muted">{item.desc}</span>
                  <span className="mt-1.5 block text-xs font-bold text-primary">{lessonCount} lessons</span>
                </span>
                <Icon name="chevron" size={17} className="shrink-0 text-muted" />
              </button>
            );
          })}
        </section>

      </main>
    );
  }

  return (
    <main className="p-5">
      <button onClick={region ? goBackToLessons : goBack} className="icon-btn mb-4" aria-label="Back">
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
              {EXTRA_TOPICS.map((item) => {
                const active = progress.selectedTopic === item.topic;
                return (
                  <button
                    key={item.topic}
                    onClick={() => switchTopic(item.topic)}
                    className={`chip ${active ? "chip-on" : ""}`}
                  >
                    {item.title}
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
