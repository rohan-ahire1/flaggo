import StatCard from "../components/StatCard";
import type { Country } from "../types/country";
import type { AppProgress } from "../types/progress";
import { getMasteredCountries, getWeakCountries } from "../utils/spacedRepetition";

export default function StatsScreen({ progress, countries, completedCount }: { progress: AppProgress; countries: Country[]; completedCount: number }) {
  const total = progress.totalCorrect + progress.totalWrong;
  const weak = getWeakCountries(progress, countries).slice(0, 5);
  const mastered = getMasteredCountries(progress, countries);
  const seen = Object.keys(progress.review).length;
  const regions = Array.from(new Set(countries.map((country) => country.continent)));

  return (
    <main className="p-5 pb-24">
      <h1 className="text-3xl font-black">Stats</h1>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <StatCard label="Total XP" value={progress.xp} tone="blue" />
        <StatCard label="Current streak" value={progress.streak} tone="orange" />
        <StatCard label="Lessons completed" value={completedCount} tone="green" />
        <StatCard label="Flags seen" value={seen} tone="blue" />
        <StatCard label="Flags mastered" value={mastered.length} tone="green" />
        <StatCard label="Accuracy" value={total ? `${Math.round((progress.totalCorrect / total) * 100)}%` : "0%"} tone="orange" />
      </div>
      <section className="mt-6 rounded-[24px] bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black">Weakest flags</h2>
        {weak.length ? weak.map((country) => (
          <div key={country.code} className="mt-3 flex items-center gap-3">
            <img src={country.flagUrl} alt="" className="h-9 w-12 rounded border object-contain" />
            <span className="font-bold">{country.name}</span>
            <span className="ml-auto text-sm font-black text-flaggo-red">{progress.review[country.code]?.wrongCount ?? 0} misses</span>
          </div>
        )) : <p className="mt-3 font-bold text-flaggo-muted">No weak flags yet.</p>}
      </section>
      <section className="mt-6 rounded-[24px] bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black">Region progress</h2>
        {regions.map((region) => {
          const group = countries.filter((country) => country.continent === region);
          const done = group.filter((country) => progress.review[country.code]?.box >= 5).length;
          return <div key={region} className="mt-3 text-sm font-bold">{region}: {done}/{group.length}</div>;
        })}
      </section>
    </main>
  );
}
