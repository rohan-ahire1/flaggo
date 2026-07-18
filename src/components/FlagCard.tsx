import type { Country } from "@flaggo/core/types/country";
import type { ReviewState } from "@flaggo/core/types/progress";
import { isMasteredReview } from "@flaggo/core/utils/spacedRepetition";
import FlagImage from "./FlagImage";
import Icon from "./Icon";

export default function FlagCard({ country, review, onClick }: { country: Country; review?: ReviewState; onClick?: () => void }) {
  const mastered = isMasteredReview(review);
  const mastery = mastered ? 100 : review ? Math.min(80, review.box * 20) : 0;
  return (
    <button
      onClick={onClick}
      className="group relative flex h-full w-full min-w-0 flex-col rounded-[22px] border border-line bg-paper p-3 text-left shadow-card transition-all duration-150 hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
    >
      {mastered && (
        <span className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-accent text-white shadow-md">
          <Icon name="star" size={15} />
        </span>
      )}
      <FlagImage code={country.code} name={country.name} src={country.flagUrl} fit="natural" className="mb-3 aspect-[4/3] w-full" imgClassName="max-h-full" />
      <div className="truncate font-display font-semibold leading-tight">{country.name}</div>
      {country.capital && <div className="truncate text-xs font-bold text-primary">{country.capital}</div>}
      <div className="text-xs font-bold capitalize text-muted">{country.continent} · {country.difficulty}</div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full transition-all duration-500 ${mastered ? "bg-accent" : "bg-primary"}`}
          style={{ width: `${mastery}%` }}
        />
      </div>
    </button>
  );
}
