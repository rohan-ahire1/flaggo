import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import world110m from "../data/world-110m.json";
import type { Country } from "../types/country";
import type { MapMode } from "../utils/quiz";
import { mapPresentCountries } from "../utils/geo";
import { getPopularityGroups } from "../utils/popularity";

type PickerMode = "tier" | "region";

export default function MapMenuScreen({
  countries,
  onStart,
  onExplore
}: {
  countries: Country[];
  onStart: (mode: MapMode, countries: Country[]) => void;
  onExplore: () => void;
}) {
  const mapCountries = useMemo(() => mapPresentCountries(countries, world110m), [countries]);
  const groups = useMemo(() => getPopularityGroups(mapCountries), [mapCountries]);
  const regions = useMemo(() => ["World", ...Array.from(new Set(mapCountries.map((country) => country.continent)))], [mapCountries]);
  const [mode, setMode] = useState<MapMode>("locate");
  const [pickerMode, setPickerMode] = useState<PickerMode>("tier");
  const [selectedId, setSelectedId] = useState(groups[0]?.id ?? "World");

  const selectedCountries = useMemo(() => {
    if (pickerMode === "region") {
      if (selectedId === "World") return mapCountries;
      return mapCountries.filter((country) => country.continent === selectedId);
    }
    return groups.find((group) => group.id === selectedId)?.countries ?? groups[0]?.countries ?? mapCountries;
  }, [groups, mapCountries, pickerMode, selectedId]);

  return (
    <main className="p-5 pb-24">
      <h1 className="font-display text-3xl font-black">World Map</h1>
      <p className="mt-1 font-bold text-flaggo-muted">Practice uses countries present in the offline world map.</p>

      <section className="mt-5 grid gap-3">
        {([
          ["locate", "Locate", "Tap the named country on the map."],
          ["identify", "Identify", "Name the highlighted country."]
        ] as const).map(([value, title, copy]) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`flaggo-tile bg-white p-4 text-left ${mode === value ? "border-flaggo-green text-flaggo-text" : "border-flaggo-border text-flaggo-muted"}`}
          >
            <span className="flex items-center gap-3">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${mode === value ? "bg-flaggo-green/15 text-flaggo-green" : "bg-slate-100"}`}>
                <Icon name={value === "locate" ? "target" : "globe"} size={22} />
              </span>
              <span>
                <span className="block font-display text-xl font-black">{title}</span>
                <span className="block text-sm font-bold">{copy}</span>
              </span>
            </span>
          </button>
        ))}
      </section>

      <section className="mt-5 rounded-[24px] border border-flaggo-border bg-white p-4 shadow-card">
        <div className="mb-3 grid grid-cols-2 rounded-2xl bg-flaggo-bg p-1">
          {([
            ["tier", "Tier"],
            ["region", "Region"]
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                setPickerMode(value);
                setSelectedId(value === "tier" ? groups[0]?.id ?? "" : "World");
              }}
              className={`rounded-xl px-3 py-2 font-display text-sm font-extrabold ${pickerMode === value ? "bg-white text-flaggo-green shadow-sm" : "text-flaggo-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="w-full rounded-2xl border border-flaggo-border bg-white p-3 font-bold"
        >
          {pickerMode === "tier"
            ? groups.map((group) => <option key={group.id} value={group.id}>{group.title} ({group.countries.length})</option>)
            : regions.map((region) => <option key={region} value={region}>{region} ({region === "World" ? mapCountries.length : mapCountries.filter((country) => country.continent === region).length})</option>)}
        </select>
        <button
          onClick={() => onStart(mode, selectedCountries)}
          className="flaggo-button mt-4 flex w-full items-center justify-center gap-2 bg-green-grad text-white shadow-button-green"
        >
          <Icon name="bolt" size={20} /> Start map practice
        </button>
      </section>

      <button onClick={onExplore} className="flaggo-button mt-5 flex w-full items-center justify-center gap-2 bg-blue-grad text-white shadow-button-blue">
        <Icon name="globe" size={20} /> Explore map
      </button>
    </main>
  );
}
