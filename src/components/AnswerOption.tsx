import type { Country } from "@flaggo/core/types/country";
import FlagImage from "./FlagImage";

export default function AnswerOption({
  country,
  label,
  showFlag,
  disabled,
  onClick
}: {
  country?: Country;
  label?: string;
  showFlag?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="btn-primary min-h-16 border-2 border-b-[5px] border-line bg-paper text-left text-ink transition-all hover:border-primary/40 active:translate-y-[3px] active:border-b-2"
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
