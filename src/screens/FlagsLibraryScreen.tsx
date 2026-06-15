import { useMemo, useState } from "react";
import FlagCard from "../components/FlagCard";
import type { Country } from "../types/country";
import type { AppProgress } from "../types/progress";

export default function FlagsLibraryScreen({ countries, progress, onPractice }: { countries: Country[]; progress: AppProgress; onPractice: (country: Country) => void }) {
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [scope, setScope] = useState("All");
  const [sort, setSort] = useState("az");

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
      if (sort === "mastery") return (progress.review[b.code]?.box ?? 0) - (progress.review[a.code]?.box ?? 0);
      if (sort === "weakest") return (progress.review[b.code]?.wrongCount ?? 0) - (progress.review[a.code]?.wrongCount ?? 0);
      return a.name.localeCompare(b.name);
    });
  }, [continent, countries, difficulty, progress.review, query, scope, sort]);

  return (
    <main className="p-5 pb-24">
      <h1 className="text-3xl font-black">Flag library</h1>
      <div className="mt-4 grid gap-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search flags" className="rounded-2xl border border-flaggo-border bg-white px-4 py-3 font-bold outline-none focus:border-flaggo-blue" />
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
        <div className="mt-5 grid grid-cols-2 gap-3">
          {filtered.map((country) => <FlagCard key={country.code} country={country} review={progress.review[country.code]} onClick={() => onPractice(country)} />)}
        </div>
      ) : (
        <div className="mt-8 rounded-[24px] bg-white p-6 text-center font-bold text-flaggo-muted">No flags match those filters.</div>
      )}
    </main>
  );
}
