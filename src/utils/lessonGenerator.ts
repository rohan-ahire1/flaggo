import type { Country } from "../types/country";
import type { Lesson } from "../types/lesson";

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

export function generateLessons(countries: Country[]): Lesson[] {
  const lessons: Lesson[] = [];
  const normal = countries.filter((country) => country.isIndependent && country.isUNMember).sort(sortCountries);
  const basics = normal.filter((country) => commonOrder.includes(country.code)).slice(0, 14);
  chunk(basics, 7).forEach((group, index) => lessons.push({
    id: `world-basics-${index + 1}`,
    title: `World Basics ${index + 1}`,
    region: "World",
    countryCodes: group.map((country) => country.code),
    difficulty: lessonDifficulty(group),
    isTerritoryLesson: false
  }));

  (["Asia", "Europe", "Africa", "Americas", "Oceania", "Antarctic"] as const).forEach((region) => {
    const group = normal.filter((country) => country.continent === region && !basics.some((basic) => basic.code === country.code)).sort(sortCountries);
    chunk(group, 7).forEach((countriesInLesson, index) => lessons.push({
      id: `${region.toLowerCase()}-${index + 1}`,
      title: `${region} ${index + 1}`,
      region,
      countryCodes: countriesInLesson.map((country) => country.code),
      difficulty: lessonDifficulty(countriesInLesson),
      isTerritoryLesson: false
    }));
  });

  const territories = countries.filter((country) => !country.isIndependent || !country.isUNMember).sort(sortCountries);
  chunk(territories, 7).forEach((group, index) => lessons.push({
    id: `territories-${index + 1}`,
    title: `Territories ${index + 1}`,
    region: "Territories",
    countryCodes: group.map((country) => country.code),
    difficulty: "hard",
    isTerritoryLesson: true
  }));

  return lessons;
}
