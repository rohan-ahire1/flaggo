import { useMemo, useRef, useState } from "react";
import Icon from "../components/Icon";
import { useConfirm } from "../components/ConfirmDialog";
import type { Deck } from "@flaggo/core/types/progress";
import type { Topic } from "@flaggo/core/types/topic";
import { createDeck, buildWeakDeck, countryCodesByRegion, deckCountries, STARRED_DECK_ID } from "@flaggo/core/utils/decks";
import { trackEvent } from "../lib/analytics";
import { useAppBack } from "../navigation/useAppBack";
import { useGame } from "../state/GameProvider";

const regions = ["Africa", "Americas", "Asia", "Europe", "Oceania"];

export default function DecksScreen() {
  const goBack = useAppBack("/review");
  const confirm = useConfirm();
  const { countries, progress, setProgress, startDeckPractice } = useGame();
  const [topic, setTopic] = useState<Topic>(progress.selectedTopic);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const buildersRef = useRef<HTMLElement | null>(null);
  const decks = progress.decks.filter((deck) => deck.topic === topic);
  const filtered = useMemo(
    () => countries.filter((country) => country.name.toLowerCase().includes(query.toLowerCase()) && (topic !== "capital" || country.capital?.trim())),
    [countries, query, topic]
  );

  function addDeck(deck: Deck, source: string) {
    setProgress({ ...progress, decks: [...progress.decks.filter((item) => item.id !== deck.id || item.topic !== deck.topic), deck] });
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

  async function removeDeck(deck: Deck) {
    const ok = await confirm({
      title: "Delete this deck?",
      body: "This deck will be removed from your practice list.",
      confirmLabel: "Delete deck",
      destructive: true
    });
    if (!ok) return;
    setProgress({ ...progress, decks: progress.decks.filter((item) => item !== deck) });
  }

  return (
    <main className="p-5">
      <button onClick={goBack} className="icon-btn mb-4" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
      <h1 className="screen-title">Decks</h1>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["flag", "capital"] as const).map((item) => <button key={item} onClick={() => setTopic(item)} className={`chip w-full capitalize ${topic === item ? "chip-on" : ""}`}>{item}</button>)}
      </div>

      <section className="mt-5 grid gap-3">
        {decks.map((deck) => {
          const size = deckCountries(deck, countries).length;
          return (
            <div key={`${deck.id}-${deck.topic}`} className="rounded-[22px] border border-line bg-paper p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/20 text-accent"><Icon name={deck.id === STARRED_DECK_ID ? "star" : "library"} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl font-black">{deck.name}</p>
                  <p className="font-bold text-muted">{size} countries</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <button onClick={() => startDeckPractice(deck)} disabled={!size} className="btn-primary">Practice</button>
                <button onClick={() => void removeDeck(deck)} className="icon-btn" aria-label="Delete deck"><Icon name="x" /></button>
              </div>
            </div>
          );
        })}
        {!decks.length && (
          <div className="rounded-[24px] border border-line bg-paper p-6 text-center shadow-card">
            <Icon name="library" size={36} className="mx-auto text-primary" />
            <h2 className="mt-3 font-display text-xl font-semibold">Build your first deck</h2>
            <p className="mt-1 text-sm font-semibold text-muted">Create a focused set for the countries you want to drill.</p>
            <button onClick={() => buildersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="btn-primary mt-4 w-full">Quick builders</button>
          </div>
        )}
      </section>

      <section ref={buildersRef} className="mt-6 rounded-[24px] bg-paper p-4 shadow-card">
        <h2 className="font-display text-xl font-black">Quick builders</h2>
        <button onClick={createWeak} className="btn-primary mt-3 w-full">Weak countries</button>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
          {regions.map((region, index) => (
            <button
              key={region}
              onClick={() => createRegion(region)}
              className={`btn-secondary ${index === regions.length - 1 && regions.length % 2 === 1 ? "col-span-2 md:col-span-1" : ""}`}
            >
              {region}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[24px] bg-paper p-4 shadow-card">
        <h2 className="font-display text-xl font-black">Manual deck</h2>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Deck name" className="mt-3 w-full rounded-2xl border border-line p-3 font-bold" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search countries" className="mt-3 w-full rounded-2xl border border-line p-3 font-bold" />
        <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto">
          {filtered.slice(0, 80).map((country) => {
            const active = selected.includes(country.code);
            return (
              <button
                key={country.code}
                onClick={() => setSelected((value) => (active ? value.filter((code) => code !== country.code) : [...value, country.code]))}
                className={`rounded-2xl border p-3 text-left font-display font-black ${active ? "border-primary bg-primary/10 text-primaryDark" : "border-line"}`}
              >
                {country.name}
              </button>
            );
          })}
        </div>
        <button onClick={createManual} disabled={!selected.length} className="btn-primary mt-3 w-full">Create deck</button>
      </section>
    </main>
  );
}
