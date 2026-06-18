import type { Country } from "../types/country";
import type { Lesson } from "../types/lesson";
import type { Topic } from "../types/topic";
import { seededShuffle } from "./seededRandom";

export type Question =
  | { id: string; type: "guess-country"; correctCountry: Country; options: Country[] }
  | { id: string; type: "pick-flag"; correctCountry: Country; options: Country[] }
  | { id: string; type: "true-false"; correctCountry: Country; shownCountry: Country; answer: boolean }
  | { id: string; type: "memory-review"; correctCountry: Country; options: Country[] }
  | { id: string; type: "guess-capital"; correctCountry: Country; correctCapital: string; optionCapitals: string[] }
  | { id: string; type: "capital-to-country"; correctCountry: Country; options: Country[] }
  | { id: string; type: "flag-to-capital"; correctCountry: Country; correctCapital: string; optionCapitals: string[] }
  | { id: string; type: "capital-true-false"; correctCountry: Country; shownCapital: string; answer: boolean };

export type MapMode = "locate" | "identify";

export type MapQuestion =
  | { id: string; type: "locate-country"; targetCode: string }
  | { id: string; type: "identify-country"; targetCode: string; options: Country[] };

const similarFlagGroups = [
  ["IE", "CI"], ["ID", "MC", "PL"], ["RO", "TD"], ["NL", "LU"], ["AU", "NZ"],
  ["SN", "ML", "GN"], ["SI", "SK", "RU"], ["QA", "BH"], ["MD", "AD"], ["CO", "EC", "VE"]
];

export function shuffleArray<T>(array: T[], rng: () => number = Math.random): T[] {
  return seededShuffle(array, rng);
}

export function getDistractors(correctCountry: Country, allCountries: Country[], count: number, rng: () => number = Math.random): Country[] {
  const similar = similarFlagGroups.find((group) => group.includes(correctCountry.code)) ?? [];
  const similarCountries = allCountries.filter((country) => similar.includes(country.code) && country.code !== correctCountry.code);
  const sameRegion = allCountries.filter((country) => country.continent === correctCountry.continent && country.code !== correctCountry.code);
  const rest = allCountries.filter((country) => country.code !== correctCountry.code);
  const merged = [...similarCountries, ...sameRegion, ...rest];
  const unique = Array.from(new Map(merged.map((country) => [country.code, country])).values());
  return shuffleArray(unique, rng).slice(0, count);
}

function makeOptions(correctCountry: Country, allCountries: Country[], rng: () => number = Math.random) {
  return shuffleArray([correctCountry, ...getDistractors(correctCountry, allCountries, 3, rng)], rng);
}

function hasCapital(country: Country) {
  return Boolean(country.capital?.trim());
}

export function getCapitalDistractors(correctCountry: Country, allCountries: Country[], count: number, rng: () => number = Math.random): string[] {
  const ownCapital = correctCountry.capital?.trim();
  const sameContinent = allCountries.filter((country) => country.continent === correctCountry.continent && country.code !== correctCountry.code && hasCapital(country));
  const rest = allCountries.filter((country) => country.code !== correctCountry.code && hasCapital(country));
  const merged = [...sameContinent, ...rest]
    .map((country) => country.capital?.trim())
    .filter((capital): capital is string => Boolean(capital) && capital !== ownCapital);
  return shuffleArray(Array.from(new Set(merged)), rng).slice(0, count);
}

function makeCapitalOptions(correctCountry: Country, allCountries: Country[], rng: () => number = Math.random) {
  return shuffleArray([correctCountry.capital!.trim(), ...getCapitalDistractors(correctCountry, allCountries, 3, rng)], rng);
}

function makeMapOptions(correctCountry: Country, pool: Country[], rng: () => number = Math.random) {
  const sameContinent = pool.filter((country) => country.continent === correctCountry.continent && country.code !== correctCountry.code);
  const rest = pool.filter((country) => country.code !== correctCountry.code);
  const distractors = Array.from(new Map([...sameContinent, ...rest].map((country) => [country.code, country])).values()).slice(0, 3);
  return shuffleArray([correctCountry, ...distractors], rng);
}

function capitalCountries(countries: Country[]) {
  return countries.filter(hasCapital);
}

export function generateFlagQuestions(idPrefix: string, lessonCountries: Country[], countries: Country[], rng: () => number = Math.random): Question[] {
  const pool = shuffleArray(lessonCountries, rng).slice(0, Math.min(lessonCountries.length, 8));
  return pool.map((country, index) => {
    const kind = index % 4;
    if (kind === 0) return { id: `${idPrefix}-${index}`, type: "guess-country", correctCountry: country, options: makeOptions(country, countries, rng) };
    if (kind === 1) return { id: `${idPrefix}-${index}`, type: "pick-flag", correctCountry: country, options: makeOptions(country, countries, rng) };
    if (kind === 2) {
      const answer = rng() > 0.45;
      const shownCountry = answer ? country : getDistractors(country, countries, 1, rng)[0];
      return { id: `${idPrefix}-${index}`, type: "true-false", correctCountry: country, shownCountry, answer };
    }
    return { id: `${idPrefix}-${index}`, type: "memory-review", correctCountry: country, options: makeOptions(country, countries, rng) };
  });
}

export function generateCapitalQuestions(idPrefix: string, lessonCountries: Country[], countries: Country[], rng: () => number = Math.random): Question[] {
  const pool = shuffleArray(capitalCountries(lessonCountries), rng).slice(0, Math.min(lessonCountries.length, 8));
  const capitalPool = capitalCountries(countries);
  return pool.map((country, index) => {
    const kind = index % 4;
    const correctCapital = country.capital!.trim();
    if (kind === 0) return { id: `${idPrefix}-${index}`, type: "guess-capital", correctCountry: country, correctCapital, optionCapitals: makeCapitalOptions(country, capitalPool, rng) };
    if (kind === 1) return { id: `${idPrefix}-${index}`, type: "capital-to-country", correctCountry: country, options: makeOptions(country, capitalPool, rng) };
    if (kind === 2) return { id: `${idPrefix}-${index}`, type: "flag-to-capital", correctCountry: country, correctCapital, optionCapitals: makeCapitalOptions(country, capitalPool, rng) };
    const answer = rng() > 0.45;
    const shownCapital = answer ? correctCapital : getCapitalDistractors(country, capitalPool, 1, rng)[0] ?? correctCapital;
    return { id: `${idPrefix}-${index}`, type: "capital-true-false", correctCountry: country, shownCapital, answer };
  });
}

export function generateLessonQuestions(lesson: Lesson, countries: Country[]): Question[] {
  const lessonCountries = lesson.countryCodes
    .map((code) => countries.find((country) => country.code === code))
    .filter(Boolean) as Country[];
  if (lesson.topic === "capital") return generateCapitalQuestions(lesson.id, lessonCountries, countries);
  return generateFlagQuestions(lesson.id, lessonCountries, countries);
}

export function generateReviewQuestions(countries: Country[], topic: Topic, rng: () => number = Math.random): Question[] {
  const pool = topic === "capital" ? capitalCountries(countries) : countries;
  if (topic === "capital") return generateCapitalQuestions("review", pool, pool, rng);
  return shuffleArray(pool, rng).slice(0, 8).map((country, index) => {
    if (index % 3 === 1) return { id: `review-${country.code}-${index}`, type: "pick-flag", correctCountry: country, options: makeOptions(country, pool, rng) };
    if (index % 3 === 2) return { id: `review-${country.code}-${index}`, type: "memory-review", correctCountry: country, options: makeOptions(country, pool, rng) };
    return { id: `review-${country.code}-${index}`, type: "guess-country", correctCountry: country, options: makeOptions(country, pool, rng) };
  });
}

export function generateMapQuestions(pool: Country[], mode: MapMode, rng: () => number = Math.random): MapQuestion[] {
  const mapPool = shuffleArray(pool.filter((country) => country.ccn3), rng).slice(0, Math.min(pool.length, 8));
  return mapPool.map((country, index) => {
    if (mode === "identify") {
      return {
        id: `map-identify-${country.code}-${index}`,
        type: "identify-country",
        targetCode: country.code,
        options: makeMapOptions(country, pool.filter((item) => item.ccn3), rng)
      };
    }
    return { id: `map-locate-${country.code}-${index}`, type: "locate-country", targetCode: country.code };
  });
}
