import type { Country } from "../types/country";
import type { ReviewState } from "../types/progress";
import FlagImage from "./FlagImage";
import Icon from "./Icon";

export default function FlagCard({ country, review, onClick }: { country: Country; review?: ReviewState; onClick?: () => void }) {
  const mastery = review ? Math.min(100, review.box * 20) : 0;
  const mastered = mastery >= 100;
  return (
    <button
      onClick={onClick}
      className="group relative rounded-[22px] border border-flaggo-border bg-white p-3 text-left shadow-card transition-all duration-150 hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
    >
      {mastered && (
        <span className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-flaggo-yellow text-white shadow-md">
          <Icon name="star" size={15} />
        </span>
      )}
      <FlagImage code={country.code} name={country.name} src={country.flagUrl} className="mb-3 aspect-[4/3] w-full" />
      <div className="truncate font-display font-extrabold leading-tight">{country.name}</div>
      {country.capital && <div className="truncate text-xs font-bold text-flaggo-blue">{country.capital}</div>}
      <div className="text-xs font-bold capitalize text-flaggo-muted">{country.continent} · {country.difficulty}</div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${mastered ? "bg-flaggo-yellow" : "bg-flaggo-green"}`}
          style={{ width: `${mastery}%` }}
        />
      </div>
    </button>
  );
}
