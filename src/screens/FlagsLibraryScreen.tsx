import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FlagCard from "../components/FlagCard";
import Icon from "../components/Icon";
import { reviewKey } from "@flaggo/core/types/topic";
import { isStarred, toggleStarredDeck } from "@flaggo/core/utils/decks";
import { useGame } from "../state/GameProvider";

export default function FlagsLibraryScreen() {
  const navigate = useNavigate();
  const { countries, progress, setProgress } = useGame();
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [scope, setScope] = useState("All");
  const [sort, setSort] = useState("az");
  const topic = "flag" as const;

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
      <h1 className="screen-title">Flag library</h1>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="chip chip-on w-full">Flags</button>
        <button onClick={() => navigate("/map/explore")} className="chip w-full gap-1">
          Explore <Icon name="chevron" size={14} className="-rotate-45" />
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="relative">
          <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search flags"
            className="w-full rounded-2xl border-2 border-line bg-paper py-3 pl-10 pr-4 font-bold outline-none transition focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={continent} aria-label="Continent" onChange={(event) => setContinent(event.target.value)} className="rounded-2xl border border-line bg-paper p-3 font-bold">
            {["All", "Africa", "Americas", "Asia", "Europe", "Oceania", "Antarctic"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={difficulty} aria-label="Difficulty" onChange={(event) => setDifficulty(event.target.value)} className="rounded-2xl border border-line bg-paper p-3 font-bold">
            {["All", "easy", "medium", "hard"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={scope} aria-label="Country scope" onChange={(event) => setScope(event.target.value)} className="rounded-2xl border border-line bg-paper p-3 font-bold">
            {["All", "UN", "Independent", "Territories"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={sort} aria-label="Sort order" onChange={(event) => setSort(event.target.value)} className="rounded-2xl border border-line bg-paper p-3 font-bold">
            <option value="az">A to Z</option>
            <option value="mastery">Mastery</option>
            <option value="weakest">Weakest</option>
          </select>
        </div>
      </div>
      {filtered.length ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((country) => {
            const starred = isStarred(progress, country.code, topic);
            return (
              <div key={country.code} className="relative h-full min-w-0">
                <FlagCard country={country} review={progress.review[reviewKey(country.code, topic)]} />
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setProgress(toggleStarredDeck(progress, country.code, topic));
                  }}
                  className={`absolute right-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-full border border-line bg-paper shadow-md transition-colors ${starred ? "text-accent" : "text-muted"}`}
                  aria-label={starred ? "Remove from starred deck" : "Add to starred deck"}
                  aria-pressed={starred}
                >
                  <Icon name="star" size={16} weight={starred ? "fill" : "duotone"} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-[24px] border border-line bg-paper p-6 text-center shadow-card">
          <Icon name="search" size={34} className="mx-auto text-primary" />
          <h2 className="mt-3 font-display text-xl font-semibold text-ink">No flags match those filters.</h2>
          <p className="mt-1 text-sm font-semibold text-muted">Try broadening the search or reset every filter.</p>
          <button
            onClick={() => {
              setQuery("");
              setContinent("All");
              setDifficulty("All");
              setScope("All");
              setSort("az");
            }}
            className="btn-primary mt-4 w-full"
          >
            Clear filters
          </button>
        </div>
      )}
    </main>
  );
}
