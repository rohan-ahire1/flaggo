import type { Country } from "../types/country";
import FlagImage from "./FlagImage";

export default function FeedbackPanel({
  correct,
  country,
  xp,
  onContinue
}: {
  correct: boolean;
  country: Country;
  xp: number;
  onContinue: () => void;
}) {
  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md animate-slide-up rounded-t-[28px] p-5 text-white shadow-[0_-18px_40px_rgba(38,50,56,0.18)] ${correct ? "bg-flaggo-green" : "bg-flaggo-red"}`}>
      <div className="mb-4 flex items-center gap-4">
        <FlagImage code={country.code} name={country.name} src={country.flagUrl} className="h-20 w-28 shrink-0 rounded-[18px] bg-white/95 p-2" />
        <div>
          <h2 className="text-2xl font-black">{correct ? "Nice!" : "Not quite"}</h2>
          <p className="font-bold">{correct ? `+${xp} XP` : `Correct answer: ${country.name}`}</p>
        </div>
      </div>
      <button onClick={onContinue} className="flaggo-button w-full border-b-4 border-slate-200 bg-white text-flaggo-text">
        Continue
      </button>
    </div>
  );
}
