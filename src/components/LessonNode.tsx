import type { Lesson } from "@flaggo/core/types/lesson";
import Icon from "./Icon";

export type LessonNodeState = "locked" | "current" | "completed" | "review-needed" | "upcoming";

export default function LessonNode({
  lesson,
  state,
  index,
  total,
  onClick
}: {
  lesson: Lesson;
  state: LessonNodeState;
  index: number;
  total?: number;
  onClick: () => void;
}) {
  const isFirst = index === 0;
  const isLast = total ? index === total - 1 : false;
  const done = state === "completed";
  const current = state === "current";
  const review = state === "review-needed";

  // Rail segments above/below the node fill in as progress is made.
  const railAbove = isFirst ? "bg-transparent" : done || current || review ? "bg-primary" : "bg-line";
  const railBelow = isLast ? "bg-transparent" : done ? "bg-primary" : "bg-line";

  const circle = done
    ? "bg-primary text-white"
    : current
      ? "bg-primary text-white ring-4 ring-primary/20"
      : review
        ? "bg-accent text-white"
        : "bg-surface2 text-muted";

  const card = current
    ? "border-2 border-primary bg-paper shadow-card"
    : done || review
      ? "border border-line bg-paper"
      : "border border-line bg-paper opacity-70";

  const badge = () => {
    if (done) return <Icon name="check" size={22} />;
    if (state === "locked") return <Icon name="lock" size={18} />;
    if (lesson.isTerritoryLesson) return <Icon name="star" size={20} />;
    return <span className="font-display text-lg font-black">{index + 1}</span>;
  };

  const countLabels: Record<string, string> = { capital: "capitals", currency: "currencies", location: "countries", language: "languages" };
  const countLabel = countLabels[lesson.topic] ?? "flags";

  return (
    <div className="flex items-stretch gap-3.5">
      {/* connector rail + node */}
      <div className="flex w-12 flex-col items-center">
        <span className={`w-[3px] flex-1 ${railAbove}`} />
        <span className={`z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full ${circle}`}>{badge()}</span>
        <span className={`w-[3px] flex-1 ${railBelow}`} />
      </div>

      {/* lesson card */}
      <button
        onClick={onClick}
        className={`my-2 flex flex-1 items-center gap-3 rounded-2xl p-4 text-left transition-all duration-150 active:translate-y-[1px] ${card}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[16px] font-semibold leading-tight text-ink">{lesson.title}</span>
          <span className="block text-[13px] font-semibold text-muted">{lesson.countryCodes.length} {countLabel}</span>
        </span>
        {current ? (
          <span className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 font-display text-xs font-semibold text-white">Start</span>
        ) : done ? (
          <Icon name="check" size={20} className="shrink-0 text-primary" />
        ) : review ? (
          <Icon name="sparkle" size={18} className="shrink-0 text-accent" />
        ) : (
          <Icon name="chevron" size={18} className="shrink-0 text-muted" />
        )}
      </button>
    </div>
  );
}
