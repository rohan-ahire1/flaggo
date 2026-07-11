import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import world110m from "@flaggo/core/data/world-110m.json";
import type { MapMode } from "@flaggo/core/utils/quiz";
import { mapPresentCountries } from "@flaggo/core/utils/geo";
import { getPopularityGroups } from "@flaggo/core/utils/popularity";
import { useGame } from "../state/GameProvider";

type PickerMode = "tier" | "region";

export default function MapMenuScreen() {
  const navigate = useNavigate();
  const { countries, startMapPractice } = useGame();
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
    <main className="p-5">
      <button onClick={() => navigate(-1)} className="icon-btn mb-4" aria-label="Back">
        <Icon name="chevron" size={20} className="rotate-180" />
      </button>
      <h1 className="screen-title">World Map</h1>
      <p className="mt-1 font-bold text-muted">Practice uses countries present in the offline world map.</p>

      <section className="mt-5 grid gap-3">
        {([
          ["locate", "Locate", "Tap the named country on the map."],
          ["identify", "Identify", "Name the highlighted country."]
        ] as const).map(([value, title, copy]) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`btn-secondary items-start justify-start text-left ${mode === value ? "border-primary bg-primary text-white" : ""}`}
          >
            <span className="flex items-center gap-3">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${mode === value ? "bg-primary/15 text-primary" : "bg-surface"}`}>
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

      <section className="mt-5 rounded-[24px] border border-line bg-paper p-4 shadow-card">
        <div className="mb-3 grid grid-cols-2 gap-2">
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
              className={`chip w-full ${pickerMode === value ? "chip-on" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={selectedId}
          aria-label="Country set"
          onChange={(event) => setSelectedId(event.target.value)}
          className="w-full rounded-2xl border border-line bg-paper p-3 font-bold"
        >
          {pickerMode === "tier"
            ? groups.map((group) => <option key={group.id} value={group.id}>{group.title} ({group.countries.length})</option>)
            : regions.map((region) => <option key={region} value={region}>{region} ({region === "World" ? mapCountries.length : mapCountries.filter((country) => country.continent === region).length})</option>)}
        </select>
        <button onClick={() => startMapPractice(mode, selectedCountries)} className="btn-primary mt-4 w-full">
          <Icon name="bolt" size={20} /> Start map practice
        </button>
      </section>

      <button onClick={() => navigate("/map/explore")} className="btn-secondary mt-5 w-full">
        <Icon name="globe" size={20} /> Explore map
      </button>
    </main>
  );
}
