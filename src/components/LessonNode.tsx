import type { Lesson } from "../types/lesson";

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
  const offset = index % 2 === 0 ? "self-start ml-8" : "self-end mr-8";
  const colors = {
    locked: "bg-slate-100 text-slate-400 border-slate-300",
    current: "bg-flaggo-green text-white border-flaggo-greenDark animate-pulse-node",
    completed: "bg-flaggo-blue text-white border-blue-600",
    "review-needed": "bg-flaggo-yellow text-flaggo-text border-flaggo-orange"
  };
  return (
    <button
      onClick={onClick}
      disabled={!unlocked}
      className={`relative z-10 flex w-48 items-center gap-3 rounded-[28px] border-b-8 p-3 text-left shadow-sm transition active:translate-y-1 ${offset} ${colors[state]}`}
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/35 text-xl font-black shadow-inner">
        {state === "completed" ? "OK" : state === "locked" ? "L" : lesson.isTerritoryLesson ? "*" : index + 1}
      </span>
      <span>
        <span className="block text-sm font-black">{lesson.title}</span>
        <span className="block text-xs font-bold opacity-80">{lesson.countryCodes.length} flags</span>
      </span>
    </button>
  );
}
