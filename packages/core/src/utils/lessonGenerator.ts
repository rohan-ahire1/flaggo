import { MAP_CCN3_IDS } from "../data/mapCcn3";
import type { Country } from "../types/country";
import type { Lesson } from "../types/lesson";
import type { Topic } from "../types/topic";

// Lesson id prefixes are persisted in user progress (completedLessonIds) —
// never change the flag ("") or capital ("cap-") values.
const TOPIC_LESSON_META: Partial<Record<Topic, { prefix: string; basicsTitle: string }>> = {
  flag: { prefix: "", basicsTitle: "World Basics" },
  capital: { prefix: "cap-", basicsTitle: "World Capitals" },
  currency: { prefix: "cur-", basicsTitle: "World Currencies" },
  location: { prefix: "loc-", basicsTitle: "World Map" },
  language: { prefix: "lang-", basicsTitle: "World Languages" }
};

const difficultyRank = { easy: 0, medium: 1, hard: 2 };
const commonOrder = ["IN", "US", "GB", "JP", "CN", "BR", "FR", "DE", "IT", "CA", "AU", "RU", "KR", "ES", "MX"];
const similarCodes = new Set("IE CI ID MC PL RO TD NL LU AU NZ SN ML GN SI SK RU QA BH MD AD CO EC VE".split(" "));

function sortCountries(a: Country, b: Country) {
  const ai = commonOrder.indexOf(a.code);
  const bi = commonOrder.indexOf(b.code);
  if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  const diff = difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
  if (diff !== 0) return diff;
  if (similarCodes.has(a.code) !== similarCodes.has(b.code)) return similarCodes.has(a.code) ? 1 : -1;
  return a.name.localeCompare(b.name);
}

function chunk<T>(items: T[], size = 7) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function lessonDifficulty(countries: Country[]): Lesson["difficulty"] {
  if (countries.some((country) => country.difficulty === "hard")) return "hard";
  if (countries.some((country) => country.difficulty === "medium")) return "medium";
  return "easy";
}

function hasCapital(country: Country) {
  return Boolean(country.capital?.trim());
}

function hasCurrency(country: Country) {
  return Boolean(country.currencyName?.trim());
}

function hasLanguage(country: Country) {
  return (country.languages ?? []).some((language) => language.trim());
}

function isOnMap(country: Country) {
  return Boolean(country.ccn3 && MAP_CCN3_IDS.has(country.ccn3));
}

function buildLessons(countries: Country[], topic: Topic): Lesson[] {
  const lessons: Lesson[] = [];
  const normal = countries.filter((country) => country.isIndependent && country.isUNMember).sort(sortCountries);
  const basics = normal.filter((country) => commonOrder.includes(country.code)).slice(0, 14);
  const meta = TOPIC_LESSON_META[topic] ?? { prefix: `${topic}-`, basicsTitle: "World Basics" };
  const prefix = meta.prefix;
  chunk(basics, 7).forEach((group, index) => lessons.push({
    id: `${prefix}world-basics-${index + 1}`,
    topic,
    title: `${meta.basicsTitle} ${index + 1}`,
    region: "World",
    countryCodes: group.map((country) => country.code),
    difficulty: lessonDifficulty(group),
    isTerritoryLesson: false
  }));

  (["Asia", "Europe", "Africa", "Americas", "Oceania", "Antarctic"] as const).forEach((region) => {
    const group = normal.filter((country) => country.continent === region && !basics.some((basic) => basic.code === country.code)).sort(sortCountries);
    chunk(group, 7).forEach((countriesInLesson, index) => lessons.push({
      id: `${prefix}${region.toLowerCase()}-${index + 1}`,
      topic,
      title: `${region} ${index + 1}`,
      region,
      countryCodes: countriesInLesson.map((country) => country.code),
      difficulty: lessonDifficulty(countriesInLesson),
      isTerritoryLesson: false
    }));
  });

  const territories = countries.filter((country) => !country.isIndependent || !country.isUNMember).sort(sortCountries);
  chunk(territories, 7).forEach((group, index) => lessons.push({
    id: `${prefix}territories-${index + 1}`,
    topic,
    title: `Territories ${index + 1}`,
    region: "Territories",
    countryCodes: group.map((country) => country.code),
    difficulty: "hard",
    isTerritoryLesson: true
  }));

  return lessons;
}

export function generateLessons(countries: Country[]): Lesson[] {
  return [
    ...buildLessons(countries, "flag"),
    ...buildLessons(countries.filter(hasCapital), "capital"),
    ...buildLessons(countries.filter(hasCurrency), "currency"),
    ...buildLessons(countries.filter(isOnMap), "location"),
    ...buildLessons(countries.filter(hasLanguage), "language")
  ];
}

export function lessonsForTopic(lessons: Lesson[], topic: Topic): Lesson[] {
  return lessons.filter((lesson) => lesson.topic === topic);
}
