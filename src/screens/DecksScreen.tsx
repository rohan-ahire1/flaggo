import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import type { Country } from "../types/country";
import type { AppProgress, Deck } from "../types/progress";
import type { Topic } from "../types/topic";
import { createDeck, buildWeakDeck, countryCodesByRegion, deckCountries, STARRED_DECK_ID } from "../utils/decks";
import { trackEvent } from "../lib/analytics";

const regions = ["Africa", "Americas", "Asia", "Europe", "Oceania"];

export default function DecksScreen({
  countries,
  progress,
  onProgress,
  onPractice,
  onBack
}: {
  countries: Country[];
  progress: AppProgress;
  onProgress: (progress: AppProgress) => void;
  onPractice: (deck: Deck) => void;
  onBack: () => void;
}) {
  const [topic, setTopic] = useState<Topic>(progress.selectedTopic);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const decks = progress.decks.filter((deck) => deck.topic === topic);
  const filtered = useMemo(
    () => countries.filter((country) => country.name.toLowerCase().includes(query.toLowerCase()) && (topic !== "capital" || country.capital?.trim())),
    [countries, query, topic]
  );

  function addDeck(deck: Deck, source: string) {
    onProgress({ ...progress, decks: [...progress.decks.filter((item) => item.id !== deck.id || item.topic !== deck.topic), deck] });
    trackEvent("deck_create", { source, size: deck.codes.length, topic: deck.topic });
  }

  function createManual() {
    if (!selected.length) return;
    addDeck(createDeck(name || "Custom deck", selected, topic), "manual");
    setSelected([]);
    setName("");
  }

  function createWeak() {
    const codes = buildWeakDeck(progress, topic);
    if (codes.length) addDeck(createDeck("Weak countries", codes, topic), "weak");
  }

  function createRegion(region: string) {
    addDeck(createDeck(region, countryCodesByRegion(countries, region), topic), "region");
  }

  function removeDeck(deck: Deck) {
    onProgress({ ...progress, decks: progress.decks.filter((item) => item !== deck) });
  }

  return (
    <main className="p-5">
      <button onClick={onBack} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
      <h1 className="screen-title">Decks</h1>
      <div className="mt-4 grid grid-cols-2 rounded-2xl bg-white p-1 shadow-card">
        {(["flag", "capital"] as const).map((item) => <button key={item} onClick={() => setTopic(item)} className={`rounded-xl px-4 py-2 font-display text-sm font-extrabold capitalize ${topic === item ? "bg-flaggo-green text-white" : "text-flaggo-muted"}`}>{item}</button>)}
      </div>

      <section className="mt-5 grid gap-3">
        {decks.map((deck) => {
          const size = deckCountries(deck, countries).length;
          return (
            <div key={`${deck.id}-${deck.topic}`} className="rounded-[22px] border border-flaggo-border bg-white p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-flaggo-yellow/20 text-flaggo-orange"><Icon name={deck.id === STARRED_DECK_ID ? "star" : "library"} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl font-black">{deck.name}</p>
                  <p className="font-bold text-flaggo-muted">{size} countries</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <button onClick={() => onPractice(deck)} disabled={!size} className="flaggo-button bg-flaggo-green text-white disabled:opacity-50">Practice</button>
                <button onClick={() => removeDeck(deck)} className="grid h-12 w-12 place-items-center rounded-2xl bg-surface text-flaggo-muted" aria-label="Delete deck"><Icon name="x" /></button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-6 rounded-[24px] bg-white p-4 shadow-card">
        <h2 className="font-display text-xl font-black">Quick builders</h2>
        <button onClick={createWeak} className="mt-3 w-full rounded-2xl bg-flaggo-blue p-3 font-display font-black text-white">Weak countries</button>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
          {regions.map((region) => <button key={region} onClick={() => createRegion(region)} className="rounded-2xl border border-flaggo-border p-3 font-display font-black">{region}</button>)}
        </div>
      </section>

      <section className="mt-6 rounded-[24px] bg-white p-4 shadow-card">
        <h2 className="font-display text-xl font-black">Manual deck</h2>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Deck name" className="mt-3 w-full rounded-2xl border border-flaggo-border p-3 font-bold" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search countries" className="mt-3 w-full rounded-2xl border border-flaggo-border p-3 font-bold" />
        <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto">
          {filtered.slice(0, 80).map((country) => {
            const active = selected.includes(country.code);
            return (
              <button
                key={country.code}
                onClick={() => setSelected((value) => (active ? value.filter((code) => code !== country.code) : [...value, country.code]))}
                className={`rounded-2xl border p-3 text-left font-display font-black ${active ? "border-flaggo-green bg-flaggo-green/10 text-flaggo-green" : "border-flaggo-border"}`}
              >
                {country.name}
              </button>
            );
          })}
        </div>
        <button onClick={createManual} disabled={!selected.length} className="flaggo-button mt-3 w-full bg-flaggo-green text-white disabled:opacity-50">Create deck</button>
      </section>
    </main>
  );
}
