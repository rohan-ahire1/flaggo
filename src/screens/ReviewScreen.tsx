import FlagCard from "../components/FlagCard";
import type { Country } from "../types/country";
import type { AppProgress } from "../types/progress";
import { getDueCountries, getWeakCountries } from "../utils/spacedRepetition";

export default function ReviewScreen({
  countries,
  progress,
  onStart,
  onOpenTest
}: {
  countries: Country[];
  progress: AppProgress;
  onStart: (countries: Country[]) => void;
  onOpenTest: () => void;
}) {
  const due = getDueCountries(progress, countries).slice(0, 12);
  const weak = getWeakCountries(progress, countries).slice(0, 6);
  const practice = due.length ? due : weak.length ? weak : countries.slice(0, 8);
  return (
    <main className="p-5 pb-24">
      <h1 className="text-3xl font-black">Review</h1>
      <section className="mt-5 rounded-[24px] bg-white p-5 shadow-sm">
        <div className="text-5xl font-black text-flaggo-blue">{due.length}</div>
        <p className="font-bold text-flaggo-muted">{due.length ? "flags due for review" : "No reviews due today."}</p>
        <button onClick={() => onStart(practice)} className="flaggo-button mt-5 w-full bg-flaggo-green text-white">Start Review</button>
      </section>
      <section className="mt-5 rounded-[24px] bg-white p-5 shadow-[0_8px_0_#e5e7eb]">
        <p className="text-sm font-black uppercase text-flaggo-blue">New</p>
        <h2 className="text-2xl font-black">50-country test</h2>
        <p className="mt-1 font-bold text-flaggo-muted">Choose Top 50, 51-100, and beyond. Practice with typed recall or answer choices.</p>
        <button onClick={onOpenTest} className="flaggo-button mt-5 w-full bg-flaggo-blue text-white">Configure test</button>
      </section>
      <h2 className="mt-6 text-xl font-black">Weakest flags</h2>
      {weak.length ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {weak.map((country) => <FlagCard key={country.code} country={country} review={progress.review[country.code]} onClick={() => onStart([country])} />)}
        </div>
      ) : <p className="mt-3 font-bold text-flaggo-muted">Practice will include new flags until weak flags appear.</p>}
    </main>
  );
}
