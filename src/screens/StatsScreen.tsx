import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import StatCard from "../components/StatCard";
import type { Country } from "../types/country";
import type { Lesson } from "../types/lesson";
import type { AppProgress } from "../types/progress";
import { parseReviewKey, reviewKey } from "../types/topic";
import { lessonsForTopic } from "../utils/lessonGenerator";
import { getMasteredCountries, getWeakCountries } from "../utils/spacedRepetition";

export default function StatsScreen({ progress, countries, lessons, onBack }: { progress: AppProgress; countries: Country[]; lessons: Lesson[]; onBack: () => void }) {
  const total = progress.totalCorrect + progress.totalWrong;
  const topic = progress.selectedTopic;
  const topicCountries = topic === "capital" ? countries.filter((country) => country.capital?.trim()) : countries;
  const weak = getWeakCountries(progress, topicCountries, topic).slice(0, 5);
  const flagMastered = getMasteredCountries(progress, countries, "flag");
  const capitalMastered = getMasteredCountries(progress, countries.filter((country) => country.capital?.trim()), "capital");
  const [mapCountryCount, setMapCountryCount] = useState(0);
  const [mapMasteredCount, setMapMasteredCount] = useState(0);
  const seen = Object.keys(progress.review).filter((key) => parseReviewKey(key).topic === topic).length;
  const completedCount = lessonsForTopic(lessons, topic).filter((lesson) => progress.completedLessonIds.includes(lesson.id)).length;
  const topicLabel = topic === "capital" ? "Capitals" : "Flags";
  const regions = Array.from(new Set(countries.map((country) => country.continent)));

  useEffect(() => {
    let active = true;
    Promise.all([import("../data/world-110m.json"), import("../utils/geo")]).then(([{ default: world110m }, geo]) => {
      if (!active) return;
      const mapCountries = geo.mapPresentCountries(countries, world110m);
      setMapCountryCount(mapCountries.length);
      setMapMasteredCount(getMasteredCountries(progress, mapCountries, "location").length);
    });
    return () => {
      active = false;
    };
  }, [countries, progress]);

  return (
    <main className="p-5">
      <button onClick={onBack} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back">
        <Icon name="chevron" size={20} className="rotate-180" />
      </button>
      <h1 className="screen-title">Stats</h1>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total XP" value={progress.xp} tone="blue" icon="bolt" />
        <StatCard label="Current streak" value={progress.streak} tone="orange" icon="flame" />
        <StatCard label="Lessons completed" value={completedCount} tone="green" icon="check" />
        <StatCard label={`${topicLabel} seen`} value={seen} tone="blue" icon="globe" />
        <StatCard label="Flags mastered" value={flagMastered.length} tone="green" icon="star" />
        <StatCard label="Capitals mastered" value={capitalMastered.length} tone="green" icon="star" />
        <StatCard label="Map mastered" value={mapCountryCount ? `${mapMasteredCount}/${mapCountryCount}` : mapMasteredCount} tone="green" icon="globe" />
        <StatCard label="Accuracy" value={total ? `${Math.round((progress.totalCorrect / total) * 100)}%` : "0%"} tone="orange" icon="target" />
      </div>
      <section className="mt-6 rounded-[24px] border border-flaggo-border bg-white p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-display text-xl font-black">
          <Icon name="heart" size={20} className="text-flaggo-red" /> Weakest {topicLabel.toLowerCase()}
        </h2>
        {weak.length ? weak.map((country) => (
          <div key={country.code} className="mt-3 flex items-center gap-3">
            <img src={country.flagUrl} alt="" className="h-9 w-12 rounded-md border border-flaggo-border object-contain" />
            <span className="font-bold">{country.name}</span>
            <span className="ml-auto rounded-full bg-error/10 px-2.5 py-1 text-xs font-display font-extrabold text-error">{progress.review[reviewKey(country.code, topic)]?.wrongCount ?? 0} misses</span>
          </div>
        )) : <p className="mt-3 font-bold text-flaggo-muted">No weak {topicLabel.toLowerCase()} yet.</p>}
      </section>
      <section className="mt-6 rounded-[24px] border border-flaggo-border bg-white p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-display text-xl font-black">
          <Icon name="globe" size={20} className="text-flaggo-blue" /> Region progress
        </h2>
        <div className="mt-2 space-y-3">
          {regions.map((region) => {
            const group = topicCountries.filter((country) => country.continent === region);
            const done = group.filter((country) => progress.review[reviewKey(country.code, topic)]?.box >= 5).length;
            const pct = group.length ? Math.round((done / group.length) * 100) : 0;
            return (
              <div key={region}>
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>{region}</span>
                  <span className="text-flaggo-muted">{done}/{group.length}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
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
