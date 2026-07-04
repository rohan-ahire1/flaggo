import { lazy, Suspense, useMemo, useState } from "react";
import FlagImage from "../components/FlagImage";
import Icon from "../components/Icon";
import type { Country } from "../types/country";

const WorldMap = lazy(() => import("../components/WorldMap"));

export default function ExploreMapScreen({ countries, onBack }: { countries: Country[]; onBack: () => void }) {
  const countryByCode = useMemo(() => new Map(countries.map((country) => [country.code, country])), [countries]);
  const [selectedCode, setSelectedCode] = useState<string | undefined>();
  const selected = selectedCode ? countryByCode.get(selectedCode) : undefined;

  return (
    <main className="p-5">
      <button onClick={onBack} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back">
        <Icon name="chevron" size={20} className="rotate-180" />
      </button>
      <h1 className="screen-title">Explore</h1>
      <p className="mt-1 font-bold text-flaggo-muted">Pan, zoom, and tap a country.</p>
      <div className="mt-5">
        <Suspense fallback={<div className="h-[68vh] min-h-[420px] animate-pulse rounded-[24px] bg-white shadow-card" />}>
          <WorldMap countries={countries} highlightCode={selected?.code} onCountryTap={setSelectedCode} mapClassName="h-[68vh] min-h-[420px] w-full" />
        </Suspense>
      </div>
      {selected && (
        <section className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md animate-slide-up safe-bottom rounded-t-[28px] bg-white px-5 pt-5 shadow-[0_-18px_40px_rgba(38,50,56,0.18)]">
          <div className="mb-4 flex items-start gap-4">
            <FlagImage code={selected.code} name={selected.name} src={selected.flagUrl} className="h-20 w-28 shrink-0 rounded-[18px] bg-flaggo-bg p-2" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <h2 className="min-w-0 flex-1 font-display text-2xl font-black">{selected.name}</h2>
                <button
                  onClick={() => setSelectedCode(undefined)}
                  aria-label="Close country details"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-flaggo-bg text-flaggo-muted"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
              <dl className="mt-2 grid gap-1 text-sm font-bold">
                <div className="flex justify-between gap-3"><dt className="text-flaggo-muted">Capital</dt><dd className="text-right">{selected.capital ?? "None"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-flaggo-muted">Continent</dt><dd className="text-right">{selected.continent}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-flaggo-muted">Currency</dt><dd className="text-right">{selected.currencyName ?? selected.currencyCode ?? "Unknown"}</dd></div>
              </dl>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
