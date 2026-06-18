import type { Country } from "../types/country";
import type { AppProgress, DailyResult } from "../types/progress";
import { TOPICS, type Topic } from "../types/topic";
import { generateCapitalQuestions, generateCurrencyQuestions, generateFlagQuestions, generateLanguageQuestions, generateMapQuestions, generateNeighborQuestions, type MapQuestion, type Question } from "./quiz";
import { hashStringToSeed, mulberry32, seededPick } from "./seededRandom";

export const DAILY_QUESTION_COUNT = 10;

export type DailyQuestion =
  | { id: string; topic: Exclude<Topic, "location">; country: Country; question: Question }
  | { id: string; topic: "location"; country: Country; question: MapQuestion };

export function dateKey(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dailyTopics(mapShipped: boolean): Topic[] {
  return mapShipped && TOPICS.includes("location") ? ["flag", "capital", "location", "currency", "language", "neighbor"] : ["flag", "capital", "currency", "language", "neighbor"];
}

function eligibleCountries(countries: Country[]) {
  return countries.filter((country) => country.isIndependent && country.isUNMember && country.continent !== "Antarctic");
}

function topicPool(countries: Country[], topic: Topic) {
  if (topic === "capital") return countries.filter((country) => country.capital?.trim());
  if (topic === "currency") return countries.filter((country) => country.currencyName?.trim());
  if (topic === "language") return countries.filter((country) => (country.languages ?? []).some((language) => language.trim()));
  if (topic === "neighbor") return countries.filter((country) => (country.borders ?? []).length > 0);
  return countries;
}

export function buildDailyQuiz(dateStr: string, countries: Country[], mapShipped = TOPICS.includes("location")): DailyQuestion[] {
  const rng = mulberry32(hashStringToSeed(`flaggo-daily-${dateStr}`));
  const pool = eligibleCountries(countries);
  const topics = dailyTopics(mapShipped);
  return Array.from({ length: DAILY_QUESTION_COUNT }, (_, index) => {
    const topic = topics[index % topics.length];
    const currentPool = topicPool(pool, topic);
    const country = seededPick(currentPool, 1, rng)[0];
    if (topic === "location") {
      const [question] = generateMapQuestions([country, ...pool.filter((item) => item.code !== country.code)], "locate", rng);
      return { id: `daily-${dateStr}-${index}`, topic, country, question };
    }
    const [question] = topic === "capital"
      ? generateCapitalQuestions(`daily-${dateStr}-${index}`, [country], topicPool(pool, "capital"), rng)
      : topic === "currency"
        ? generateCurrencyQuestions(`daily-${dateStr}-${index}`, [country], topicPool(pool, "currency"), rng)
        : topic === "language"
          ? generateLanguageQuestions(`daily-${dateStr}-${index}`, [country], topicPool(pool, "language"), rng)
          : topic === "neighbor"
            ? generateNeighborQuestions(`daily-${dateStr}-${index}`, [country], pool, rng)
            : generateFlagQuestions(`daily-${dateStr}-${index}`, [country], pool, rng);
    return { id: `daily-${dateStr}-${index}`, topic, country, question };
  });
}

function previousDate(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return dateKey(date);
}

export function applyDailyResult(progress: AppProgress, dateStr: string, result: DailyResult): AppProgress {
  const previous = progress.daily;
  const current = previous.history[dateStr];
  const betterResult = !current || result.score > current.score || (result.score === current.score && result.total > current.total) ? result : current;
  if (previous.lastDate === dateStr) {
    return {
      ...progress,
      daily: {
        ...previous,
        history: { ...previous.history, [dateStr]: betterResult }
      }
    };
  }
  const streak = previous.lastDate === previousDate(dateStr) ? previous.streak + 1 : 1;
  return {
    ...progress,
    daily: {
      lastDate: dateStr,
      streak,
      best: Math.max(previous.best, streak),
      history: { ...previous.history, [dateStr]: result }
    }
  };
}
