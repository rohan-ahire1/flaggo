import type { Country } from "../types/country";
import type { AppProgress, Deck } from "../types/progress";
import { reviewKey, type Topic } from "../types/topic";

export const STARRED_DECK_ID = "starred";
export const STARRED_DECK_NAME = "Starred";

export function buildWeakDeck(progress: AppProgress, topic: Topic, limit = 30): string[] {
  return Object.values(progress.review)
    .filter((state) => (state.topic ?? "flag") === topic && (state.box <= 1 || state.wrongCount > state.correctCount))
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, limit)
    .map((state) => state.countryCode);
}

export function createDeck(name: string, codes: string[], topic: Topic): Deck {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "Custom deck",
    codes: Array.from(new Set(codes)),
    topic,
    createdAt: new Date().toISOString()
  };
}

export function countryCodesByRegion(countries: Country[], region: string) {
  return countries
    .filter((country) => (region === "World" ? country.isIndependent && country.isUNMember : country.continent === region))
    .map((country) => country.code);
}

export function toggleStarredDeck(progress: AppProgress, code: string, topic: Topic): AppProgress {
  const existing = progress.decks.find((deck) => deck.id === STARRED_DECK_ID && deck.topic === topic);
  const deck = existing ?? { id: STARRED_DECK_ID, name: STARRED_DECK_NAME, codes: [], topic, createdAt: new Date().toISOString() };
  const hasCode = deck.codes.includes(code);
  const nextDeck = { ...deck, codes: hasCode ? deck.codes.filter((item) => item !== code) : [...deck.codes, code] };
  const decks = existing
    ? progress.decks.map((item) => (item === existing ? nextDeck : item))
    : [...progress.decks, nextDeck];
  return { ...progress, decks };
}

export function isStarred(progress: AppProgress, code: string, topic: Topic) {
  return progress.decks.some((deck) => deck.id === STARRED_DECK_ID && deck.topic === topic && deck.codes.includes(code));
}

export function deckCountries(deck: Deck, countries: Country[]) {
  const byCode = new Map(countries.map((country) => [country.code, country]));
  return deck.codes.map((code) => byCode.get(code)).filter(Boolean) as Country[];
}

export function reviewedCodes(progress: AppProgress, topic: Topic) {
  return Object.keys(progress.review).map((key) => progress.review[reviewKey(key.split(":")[0], topic)]?.countryCode).filter(Boolean) as string[];
}
