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
  | { id: string; type: "capital-true-false"; correctCountry: Country; shownCapital: string; answer: boolean }
  | { id: string; type: "guess-currency"; correctCountry: Country; correctCurrency: string; optionCurrencies: string[] }
  | { id: string; type: "currency-to-country"; correctCountry: Country; correctCurrency: string; currencyClue: string; options: Country[] }
  | { id: string; type: "guess-language"; correctCountry: Country; correctLanguage: string; optionLanguages: string[] }
  | { id: string; type: "language-to-country"; correctCountry: Country; correctLanguage: string; options: Country[] }
  | { id: string; type: "pick-neighbor"; correctCountry: Country; correctNeighbor: Country; options: Country[] }
  | { id: string; type: "not-neighbor"; correctCountry: Country; correctNeighbor: Country; options: Country[] };

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

function currencyCountries(countries: Country[]) {
  return countries.filter((country) => Boolean(country.currencyName?.trim()));
}

function languageCountries(countries: Country[]) {
  return countries.filter((country) => (country.languages ?? []).some((language) => language.trim()));
}

function neighborCountries(countries: Country[]) {
  return countries.filter((country) => (country.borders ?? []).length > 0);
}

function uniqueValues(values: (string | undefined)[]) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function makeCurrencyOptions(correctCountry: Country, allCountries: Country[], rng: () => number = Math.random) {
  const correct = correctCountry.currencyName!.trim();
  const distractors = uniqueValues(allCountries.map((country) => country.currencyName)).filter((currency) => currency !== correct);
  return shuffleArray([correct, ...shuffleArray(distractors, rng).slice(0, 3)], rng);
}

function sentenceCase(value: string) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getCurrencyClue(country: Country) {
  const currencyName = country.currencyName?.trim() ?? "";
  if (!currencyName) return "";

  const countryDescriptors = [
    country.name,
    country.officialName,
    ...(country.demonym?.split(",") ?? [])
  ]
    .map((descriptor) => descriptor?.trim())
    .filter((descriptor): descriptor is string => Boolean(descriptor));

  const stripped = countryDescriptors.reduce((label, descriptor) => {
    return label.replace(new RegExp(`^${escapeRegex(descriptor)}\\s+`, "i"), "");
  }, currencyName).trim();
  const label = stripped && stripped.toLowerCase() !== currencyName.toLowerCase()
    ? sentenceCase(stripped)
    : currencyName;

  return label;
}

function makeLanguageOptions(correctCountry: Country, allCountries: Country[], rng: () => number = Math.random) {
  const actualLanguages = new Set(uniqueValues(correctCountry.languages ?? []));
  const correct = shuffleArray(Array.from(actualLanguages), rng)[0];
  const distractors = uniqueValues(allCountries.flatMap((country) => country.languages ?? [])).filter((language) => !actualLanguages.has(language));
  return {
    correct,
    options: shuffleArray([correct, ...shuffleArray(distractors, rng).slice(0, 3)], rng)
  };
}

function countriesWithDifferentCurrency(correctCountry: Country, allCountries: Country[]) {
  const correct = correctCountry.currencyName?.trim();
  return allCountries.filter((country) => country.code === correctCountry.code || country.currencyName?.trim() !== correct);
}

function countriesWithoutLanguage(language: string, correctCountry: Country, allCountries: Country[]) {
  return allCountries.filter((country) => country.code === correctCountry.code || !(country.languages ?? []).includes(language));
}

function countryByCode(countries: Country[]) {
  return new Map(countries.map((country) => [country.code, country]));
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

export function generateCurrencyQuestions(idPrefix: string, lessonCountries: Country[], countries: Country[], rng: () => number = Math.random): Question[] {
  const pool = shuffleArray(currencyCountries(lessonCountries), rng).slice(0, Math.min(lessonCountries.length, 8));
  const currencyPool = currencyCountries(countries);
  return pool.map((country, index) => {
    const correctCurrency = country.currencyName!.trim();
    if (index % 2 === 0) {
      return { id: `${idPrefix}-${index}`, type: "guess-currency", correctCountry: country, correctCurrency, optionCurrencies: makeCurrencyOptions(country, currencyPool, rng) };
    }
    return {
      id: `${idPrefix}-${index}`,
      type: "currency-to-country",
      correctCountry: country,
      correctCurrency,
      currencyClue: getCurrencyClue(country),
      options: makeOptions(country, countriesWithDifferentCurrency(country, currencyPool), rng)
    };
  });
}

export function generateLanguageQuestions(idPrefix: string, lessonCountries: Country[], countries: Country[], rng: () => number = Math.random): Question[] {
  const pool = shuffleArray(languageCountries(lessonCountries), rng).slice(0, Math.min(lessonCountries.length, 8));
  const languagePool = languageCountries(countries);
  return pool.map((country, index) => {
    const languageOptions = makeLanguageOptions(country, languagePool, rng);
    if (index % 2 === 0) {
      return { id: `${idPrefix}-${index}`, type: "guess-language", correctCountry: country, correctLanguage: languageOptions.correct, optionLanguages: languageOptions.options };
    }
    return {
      id: `${idPrefix}-${index}`,
      type: "language-to-country",
      correctCountry: country,
      correctLanguage: languageOptions.correct,
      options: makeOptions(country, countriesWithoutLanguage(languageOptions.correct, country, languagePool), rng)
    };
  });
}

export function generateNeighborQuestions(idPrefix: string, lessonCountries: Country[], countries: Country[], rng: () => number = Math.random): Question[] {
  const byCode = countryByCode(countries);
  const pool = shuffleArray(neighborCountries(lessonCountries), rng).slice(0, Math.min(lessonCountries.length, 8));
  return pool.flatMap((country, index): Question[] => {
    const borderSet = new Set(country.borders ?? []);
    const borderCountries = shuffleArray((country.borders ?? []).map((code) => byCode.get(code)).filter((item): item is Country => Boolean(item)), rng);
    const nonBorders = countries.filter((item) => item.code !== country.code && !borderSet.has(item.code));
    const correctNeighbor = borderCountries[0];
    if (!correctNeighbor || nonBorders.length < 3) return [];
    if (index % 2 === 0 || borderCountries.length < 3) {
      return [{
        id: `${idPrefix}-${index}`,
        type: "pick-neighbor",
        correctCountry: country,
        correctNeighbor,
        options: shuffleArray([correctNeighbor, ...shuffleArray(nonBorders, rng).slice(0, 3)], rng)
      }];
    }
    const correctNonNeighbor = shuffleArray(nonBorders, rng)[0];
    const distractors = borderCountries.slice(0, 3);
    if (!correctNonNeighbor || distractors.length < 3) return [];
    return [{
      id: `${idPrefix}-${index}`,
      type: "not-neighbor",
      correctCountry: country,
      correctNeighbor: correctNonNeighbor,
      options: shuffleArray([correctNonNeighbor, ...distractors], rng)
    }];
  });
}

export function generateLessonQuestions(lesson: Lesson, countries: Country[]): Question[] {
  const lessonCountries = lesson.countryCodes
    .map((code) => countries.find((country) => country.code === code))
    .filter(Boolean) as Country[];
  if (lesson.topic === "capital") return generateCapitalQuestions(lesson.id, lessonCountries, countries);
  if (lesson.topic === "currency") return generateCurrencyQuestions(lesson.id, lessonCountries, countries);
  if (lesson.topic === "language") return generateLanguageQuestions(lesson.id, lessonCountries, countries);
  // Location lessons play on the map (MapQuestions built by the map screen), not as MCQs.
  if (lesson.topic === "location") return [];
  return generateFlagQuestions(lesson.id, lessonCountries, countries);
}

export function generateReviewQuestions(
  countries: Country[],
  topic: Topic,
  rng: () => number = Math.random,
  optionCountries: Country[] = countries
): Question[] {
  const pool = topic === "capital" ? capitalCountries(countries) : countries;
  if (topic === "capital") return generateCapitalQuestions("review", pool, capitalCountries(optionCountries), rng);
  if (topic === "currency") return generateCurrencyQuestions("review", currencyCountries(countries), currencyCountries(optionCountries), rng);
  if (topic === "language") return generateLanguageQuestions("review", languageCountries(countries), languageCountries(optionCountries), rng);
  if (topic === "neighbor") return generateNeighborQuestions("review", neighborCountries(countries), optionCountries, rng);
  return shuffleArray(pool, rng).slice(0, 8).map((country, index) => {
    if (index % 3 === 1) return { id: `review-${country.code}-${index}`, type: "pick-flag", correctCountry: country, options: makeOptions(country, optionCountries, rng) };
    if (index % 3 === 2) return { id: `review-${country.code}-${index}`, type: "memory-review", correctCountry: country, options: makeOptions(country, optionCountries, rng) };
    return { id: `review-${country.code}-${index}`, type: "guess-country", correctCountry: country, options: makeOptions(country, optionCountries, rng) };
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
