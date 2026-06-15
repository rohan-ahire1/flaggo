import Icon from "../components/Icon";
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
      <h1 className="font-display text-3xl font-black">Stats</h1>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <StatCard label="Total XP" value={progress.xp} tone="blue" icon="bolt" />
        <StatCard label="Current streak" value={progress.streak} tone="orange" icon="flame" />
        <StatCard label="Lessons completed" value={completedCount} tone="green" icon="check" />
        <StatCard label="Flags seen" value={seen} tone="blue" icon="globe" />
        <StatCard label="Flags mastered" value={mastered.length} tone="green" icon="star" />
        <StatCard label="Accuracy" value={total ? `${Math.round((progress.totalCorrect / total) * 100)}%` : "0%"} tone="orange" icon="target" />
      </div>
      <section className="mt-6 rounded-[24px] border border-flaggo-border bg-white p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-display text-xl font-black">
          <Icon name="heart" size={20} className="text-flaggo-red" /> Weakest flags
        </h2>
        {weak.length ? weak.map((country) => (
          <div key={country.code} className="mt-3 flex items-center gap-3">
            <img src={country.flagUrl} alt="" className="h-9 w-12 rounded-md border border-flaggo-border object-contain" />
            <span className="font-bold">{country.name}</span>
            <span className="ml-auto rounded-full bg-red-50 px-2.5 py-1 text-xs font-display font-extrabold text-flaggo-red">{progress.review[country.code]?.wrongCount ?? 0} misses</span>
          </div>
        )) : <p className="mt-3 font-bold text-flaggo-muted">No weak flags yet.</p>}
      </section>
      <section className="mt-6 rounded-[24px] border border-flaggo-border bg-white p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-display text-xl font-black">
          <Icon name="globe" size={20} className="text-flaggo-blue" /> Region progress
        </h2>
        <div className="mt-2 space-y-3">
          {regions.map((region) => {
            const group = countries.filter((country) => country.continent === region);
            const done = group.filter((country) => progress.review[country.code]?.box >= 5).length;
            const pct = group.length ? Math.round((done / group.length) * 100) : 0;
            return (
              <div key={region}>
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>{region}</span>
                  <span className="text-flaggo-muted">{done}/{group.length}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-flaggo-green transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
