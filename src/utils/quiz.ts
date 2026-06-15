import type { Country } from "../types/country";
import type { Lesson } from "../types/lesson";

export type Question =
  | { id: string; type: "guess-country"; correctCountry: Country; options: Country[] }
  | { id: string; type: "pick-flag"; correctCountry: Country; options: Country[] }
  | { id: string; type: "true-false"; correctCountry: Country; shownCountry: Country; answer: boolean }
  | { id: string; type: "memory-review"; correctCountry: Country; options: Country[] };

const similarFlagGroups = [
  ["IE", "CI"], ["ID", "MC", "PL"], ["RO", "TD"], ["NL", "LU"], ["AU", "NZ"],
  ["SN", "ML", "GN"], ["SI", "SK", "RU"], ["QA", "BH"], ["MD", "AD"], ["CO", "EC", "VE"]
];

export function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

export function getDistractors(correctCountry: Country, allCountries: Country[], count: number): Country[] {
  const similar = similarFlagGroups.find((group) => group.includes(correctCountry.code)) ?? [];
  const similarCountries = allCountries.filter((country) => similar.includes(country.code) && country.code !== correctCountry.code);
  const sameRegion = allCountries.filter((country) => country.continent === correctCountry.continent && country.code !== correctCountry.code);
  const rest = allCountries.filter((country) => country.code !== correctCountry.code);
  const merged = [...similarCountries, ...sameRegion, ...rest];
  const unique = Array.from(new Map(merged.map((country) => [country.code, country])).values());
  return shuffleArray(unique).slice(0, count);
}

function makeOptions(correctCountry: Country, allCountries: Country[]) {
  return shuffleArray([correctCountry, ...getDistractors(correctCountry, allCountries, 3)]);
}

export function generateLessonQuestions(lesson: Lesson, countries: Country[]): Question[] {
  const lessonCountries = lesson.countryCodes
    .map((code) => countries.find((country) => country.code === code))
    .filter(Boolean) as Country[];
  const pool = shuffleArray(lessonCountries).slice(0, Math.min(lessonCountries.length, 8));
  return pool.map((country, index) => {
    const kind = index % 4;
    if (kind === 0) return { id: `${lesson.id}-${index}`, type: "guess-country", correctCountry: country, options: makeOptions(country, countries) };
    if (kind === 1) return { id: `${lesson.id}-${index}`, type: "pick-flag", correctCountry: country, options: makeOptions(country, countries) };
    if (kind === 2) {
      const answer = Math.random() > 0.45;
      const shownCountry = answer ? country : getDistractors(country, countries, 1)[0];
      return { id: `${lesson.id}-${index}`, type: "true-false", correctCountry: country, shownCountry, answer };
    }
    return { id: `${lesson.id}-${index}`, type: "memory-review", correctCountry: country, options: makeOptions(country, countries) };
  });
}

export function generateReviewQuestions(countries: Country[]): Question[] {
  return shuffleArray(countries).slice(0, 8).map((country, index) => {
    if (index % 3 === 1) return { id: `review-${country.code}-${index}`, type: "pick-flag", correctCountry: country, options: makeOptions(country, countries) };
    if (index % 3 === 2) return { id: `review-${country.code}-${index}`, type: "memory-review", correctCountry: country, options: makeOptions(country, countries) };
    return { id: `review-${country.code}-${index}`, type: "guess-country", correctCountry: country, options: makeOptions(country, countries) };
  });
}
