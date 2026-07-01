import FlagCard from "../components/FlagCard";
import Icon from "../components/Icon";
import type { Country } from "../types/country";
import type { AppProgress } from "../types/progress";
import { reviewKey } from "../types/topic";
import { getDueCountries, getWeakCountries } from "../utils/spacedRepetition";

export default function ReviewScreen({
  countries,
  progress,
  onStart,
  onOpenTest,
  onOpenMapPractice
}: {
  countries: Country[];
  progress: AppProgress;
  onStart: (countries: Country[]) => void;
  onOpenTest: () => void;
  onOpenMapPractice: () => void;
}) {
  const topic = progress.selectedTopic;
  const topicCountries = topic === "capital" ? countries.filter((country) => country.capital?.trim()) : countries;
  const label = topic === "capital" ? "capitals" : "flags";
  const due = getDueCountries(progress, topicCountries, topic).slice(0, 12);
  const weak = getWeakCountries(progress, topicCountries, topic).slice(0, 6);
  const practice = due.length ? due : weak.length ? weak : topicCountries.slice(0, 8);
  return (
    <main className="p-5">
      <h1 className="font-display text-3xl font-black">Review</h1>
      <section className="mt-5 overflow-hidden rounded-[24px] border border-flaggo-border bg-white p-5 shadow-card-lg">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-flaggo-blue/10 text-flaggo-blue">
            <Icon name="review" size={28} />
          </span>
          <div>
            <div className="font-display text-5xl font-black leading-none text-flaggo-blue">{due.length}</div>
            <p className="mt-1 font-bold text-flaggo-muted">{due.length ? `${label} due for review` : "No reviews due today."}</p>
          </div>
        </div>
        <button onClick={() => onStart(practice)} className="flaggo-button mt-5 flex w-full items-center justify-center gap-2 bg-green-grad text-white shadow-button-green">
          <Icon name="bolt" size={20} /> Start Review
        </button>
      </section>
      <section className="mt-5 rounded-[24px] border border-flaggo-border bg-white p-5 shadow-card-lg">
        <h2 className="font-display text-2xl font-black">Map practice</h2>
        <p className="mt-1 font-bold text-flaggo-muted">Review country locations with the same spaced-repetition schedule.</p>
        <button onClick={onOpenMapPractice} className="flaggo-button mt-5 flex w-full items-center justify-center gap-2 bg-green-grad text-white shadow-button-green">
          <Icon name="globe" size={18} /> Start map practice
        </button>
      </section>
      <section className="mt-5 rounded-[24px] border border-flaggo-border bg-white p-5 shadow-card-lg">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-flaggo-blue/10 px-2.5 py-0.5 text-xs font-display font-extrabold uppercase tracking-wide text-flaggo-blue">
          <Icon name="sparkle" size={13} /> New
        </p>
        <h2 className="mt-2 font-display text-2xl font-black">50-country test</h2>
        <p className="mt-1 font-bold text-flaggo-muted">Choose Top 50, 51-100, and beyond. Practice with typed recall or answer choices.</p>
        <button onClick={onOpenTest} className="flaggo-button mt-5 flex w-full items-center justify-center gap-2 bg-blue-grad text-white shadow-button-blue">
          <Icon name="target" size={18} /> Configure test
        </button>
      </section>
      <h2 className="mt-6 flex items-center gap-2 font-display text-xl font-black">
        <Icon name="heart" size={18} className="text-flaggo-red" /> Weakest {label}
      </h2>
      {weak.length ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {weak.map((country) => <FlagCard key={country.code} country={country} review={progress.review[reviewKey(country.code, topic)]} onClick={() => onStart([country])} />)}
        </div>
      ) : <p className="mt-3 font-bold text-flaggo-muted">Practice will include new {label} until weak {label} appear.</p>}
    </main>
  );
}
