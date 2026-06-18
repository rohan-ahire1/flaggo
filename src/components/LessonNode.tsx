import type { Lesson } from "../types/lesson";
import Icon from "./Icon";

export type LessonNodeState = "locked" | "current" | "completed" | "review-needed";

export default function LessonNode({
  lesson,
  state,
  index,
  onClick
}: {
  lesson: Lesson;
  state: LessonNodeState;
  index: number;
  onClick: () => void;
}) {
  const unlocked = state !== "locked";
  const offset = index % 2 === 0 ? "self-start ml-6" : "self-end mr-6";
  const colors = {
    locked: "bg-slate-100 text-slate-400 border-slate-200",
    current: "bg-green-grad text-white border-flaggo-greenDark animate-pulse-node",
    completed: "bg-blue-grad text-white border-flaggo-blueDark",
    "review-needed": "bg-flaggo-yellow text-flaggo-text border-flaggo-orange"
  };

  const badge = () => {
    if (state === "completed") return <Icon name="check" size={26} />;
    if (state === "locked") return <Icon name="lock" size={22} />;
    if (lesson.isTerritoryLesson) return <Icon name="star" size={24} />;
    return <span className="text-xl font-black">{index + 1}</span>;
  };

  return (
    <button
      onClick={onClick}
      disabled={!unlocked}
      className={`relative z-10 flex w-52 items-center gap-3 rounded-[26px] border-b-[6px] p-3 text-left shadow-sm transition-all duration-150 active:translate-y-1 active:border-b-2 disabled:active:translate-y-0 ${offset} ${colors[state]}`}
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/25 shadow-inner ring-1 ring-white/30">
        {badge()}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-display font-extrabold leading-tight">{lesson.title}</span>
        <span className="block text-xs font-bold opacity-80">{lesson.countryCodes.length} {lesson.topic === "capital" ? "capitals" : "flags"}</span>
      </span>
    </button>
  );
}
