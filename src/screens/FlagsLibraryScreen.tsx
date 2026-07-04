import { useMemo, useState } from "react";
import FlagCard from "../components/FlagCard";
import Icon from "../components/Icon";
import type { Country } from "../types/country";
import type { AppProgress } from "../types/progress";
import { reviewKey } from "../types/topic";
import { isStarred, toggleStarredDeck } from "../utils/decks";

export default function FlagsLibraryScreen({
  countries,
  progress,
  onProgress,
  onPractice,
  onExploreMap,
  onBack
}: {
  countries: Country[];
  progress: AppProgress;
  onProgress: (progress: AppProgress) => void;
  onPractice: (country: Country) => void;
  onExploreMap: () => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [scope, setScope] = useState("All");
  const [sort, setSort] = useState("az");
  const topic = progress.selectedTopic;

  const filtered = useMemo(() => {
    const result = countries.filter((country) => {
      if (query && !country.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (continent !== "All" && country.continent !== continent) return false;
      if (difficulty !== "All" && country.difficulty !== difficulty) return false;
      if (scope === "UN" && !country.isUNMember) return false;
      if (scope === "Independent" && !country.isIndependent) return false;
      if (scope === "Territories" && country.isIndependent && country.isUNMember) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (sort === "mastery") return (progress.review[reviewKey(b.code, topic)]?.box ?? 0) - (progress.review[reviewKey(a.code, topic)]?.box ?? 0);
      if (sort === "weakest") return (progress.review[reviewKey(b.code, topic)]?.wrongCount ?? 0) - (progress.review[reviewKey(a.code, topic)]?.wrongCount ?? 0);
      return a.name.localeCompare(b.name);
    });
  }, [continent, countries, difficulty, progress.review, query, scope, sort, topic]);

  return (
    <main className="p-5">
      <button onClick={onBack} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back">
        <Icon name="chevron" size={20} className="rotate-180" />
      </button>
      <h1 className="screen-title">Flag library</h1>
      <div className="mt-4 grid grid-cols-2 rounded-2xl bg-white p-1 shadow-card">
        <button className="rounded-xl bg-flaggo-green px-4 py-2 font-display text-sm font-extrabold text-white shadow-sm">Flags</button>
        <button onClick={onExploreMap} className="rounded-xl px-4 py-2 font-display text-sm font-extrabold text-flaggo-muted hover:text-flaggo-text">Explore</button>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="relative">
          <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-flaggo-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search flags"
            className="w-full rounded-2xl border-2 border-flaggo-border bg-white py-3 pl-10 pr-4 font-bold outline-none transition focus:border-flaggo-blue"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={continent} onChange={(event) => setContinent(event.target.value)} className="rounded-2xl border border-flaggo-border bg-white p-3 font-bold">
            {["All", "Africa", "Americas", "Asia", "Europe", "Oceania", "Antarctic"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-2xl border border-flaggo-border bg-white p-3 font-bold">
            {["All", "easy", "medium", "hard"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={scope} onChange={(event) => setScope(event.target.value)} className="rounded-2xl border border-flaggo-border bg-white p-3 font-bold">
            {["All", "UN", "Independent", "Territories"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-2xl border border-flaggo-border bg-white p-3 font-bold">
            <option value="az">A to Z</option>
            <option value="mastery">Mastery</option>
            <option value="weakest">Weakest</option>
          </select>
        </div>
      </div>
      {filtered.length ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((country) => (
            <div key={country.code} className="relative h-full min-w-0">
              <FlagCard country={country} review={progress.review[reviewKey(country.code, topic)]} onClick={() => onPractice(country)} />
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onProgress(toggleStarredDeck(progress, country.code, topic));
                }}
                className={`absolute right-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-full shadow-md ${isStarred(progress, country.code, topic) ? "bg-flaggo-yellow text-white" : "bg-white text-flaggo-muted"}`}
                aria-label={isStarred(progress, country.code, topic) ? "Remove from starred deck" : "Add to starred deck"}
              >
                <Icon name="star" size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[24px] bg-white p-6 text-center font-bold text-flaggo-muted">No flags match those filters.</div>
      )}
    </main>
  );
}
