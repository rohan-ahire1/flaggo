import type { Country } from "@flaggo/core/types/country";
import FlagImage from "./FlagImage";

export default function AnswerOption({
  country,
  label,
  showFlag,
  disabled,
  state = "idle",
  onClick
}: {
  country?: Country;
  label?: string;
  showFlag?: boolean;
  disabled?: boolean;
  state?: "idle" | "correct" | "wrong";
  onClick: () => void;
}) {
  const stateClass =
    state === "correct"
      ? "border-success bg-success/10 text-success"
      : state === "wrong"
        ? "border-error bg-error/10 text-error"
        : "border-line bg-paper text-ink hover:border-primary/40";

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`min-h-16 rounded-2xl border-2 border-b-[5px] p-4 text-left font-display text-[17px] font-semibold transition-all duration-150 active:translate-y-[3px] active:border-b-2 ${stateClass}`}
    >
      {showFlag && country ? (
        <span className="flex items-center gap-3">
          <FlagImage code={country.code} name={country.name} src={country.flagUrl} className="h-12 w-16 shrink-0 rounded-xl p-1" />
          <span>{country.name}</span>
        </span>
      ) : (
        label ?? country?.name
      )}
    </button>
  );
}
