import type { Country } from "../types/country";
import FlagImage from "./FlagImage";
import Icon from "./Icon";

export default function FeedbackPanel({
  correct,
  country,
  xp,
  answerLabel,
  onContinue
}: {
  correct: boolean;
  country: Country;
  xp: number;
  answerLabel?: string;
  onContinue: () => void;
}) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md animate-slide-up safe-bottom rounded-t-[28px] px-5 pt-5 text-white shadow-[0_-18px_40px_rgba(38,50,56,0.18)] ${
        correct ? "bg-flaggo-green" : "bg-flaggo-red"
      }`}
    >
      <div className="mb-4 flex items-center gap-4">
        <div className="relative shrink-0">
          <FlagImage code={country.code} name={country.name} src={country.flagUrl} fit="natural" className="w-28 rounded-[18px]" />
          <span className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-full bg-white shadow-md">
            <Icon name={correct ? "check" : "x"} size={20} className={correct ? "text-flaggo-green" : "text-flaggo-red"} />
          </span>
        </div>
        <div>
          <h2 className="font-display text-2xl font-black">{correct ? "Nice!" : "Not quite"}</h2>
          <p className="flex items-center gap-1 font-bold">
            {correct ? (
              <>
                <Icon name="bolt" size={16} /> +{xp} XP
              </>
            ) : (
              <>Correct answer: {answerLabel ?? country.name}</>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={onContinue}
        className="flaggo-button w-full border-2 border-b-[5px] border-black/10 bg-white text-flaggo-text active:translate-y-[3px] active:border-b-2"
      >
        Continue
      </button>
    </div>
  );
}
