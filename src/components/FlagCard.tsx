import type { Country } from "../types/country";
import type { ReviewState } from "../types/progress";
import FlagImage from "./FlagImage";

export default function FlagCard({ country, review, onClick }: { country: Country; review?: ReviewState; onClick?: () => void }) {
  const mastery = review ? Math.min(100, review.box * 20) : 0;
  return (
    <button onClick={onClick} className="rounded-[22px] border border-flaggo-border bg-white p-3 text-left shadow-[0_6px_0_#e5e7eb] transition active:translate-y-1 active:shadow-none">
      <FlagImage code={country.code} name={country.name} src={country.flagUrl} className="mb-3 aspect-[4/3] w-full" />
      <div className="font-black leading-tight">{country.name}</div>
      <div className="text-xs font-bold text-flaggo-muted">{country.continent} · {country.difficulty}</div>
      <div className="mt-3 h-2 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-flaggo-green" style={{ width: `${mastery}%` }} />
      </div>
    </button>
  );
}
