import type { Country } from "../types/country";
import type { Topic } from "../types/topic";
import { TOPICS } from "../types/topic";
import { arcadePool } from "../utils/arcade";
import { buildDailyQuiz, DAILY_QUESTION_COUNT } from "../utils/dailyChallenge";
import {
  generateCapitalQuestions,
  generateCurrencyQuestions,
  generateFlagQuestions,
  generateLanguageQuestions,
  generateMapQuestions,
  generateNeighborQuestions,
  type MapQuestion,
  type Question
} from "../utils/quiz";
import { hashStringToSeed, mulberry32, seededPick, seededShuffle } from "../utils/seededRandom";

export type MatchMode = "daily" | "arcade";

export type MatchConfig = {
  topics: Topic[];
  mode: MatchMode;
  questionCount: number;
};

export type MatchQuestion =
  | { id: string; topic: Exclude<Topic, "location">; country: Country; question: Question }
  | { id: string; topic: "location"; country: Country; question: MapQuestion };

export type MatchResultLike = {
  display_name: string;
  score: number;
  finished_at: string;
};

export type MatchLike = {
  config: MatchConfig;
};

export function defaultMatchConfig(): MatchConfig {
  return { topics: ["flag", "capital", "currency", "language", "neighbor"], mode: "daily", questionCount: DAILY_QUESTION_COUNT };
}

export function normalizeMatchConfig(config: Partial<MatchConfig> | null | undefined): MatchConfig {
  const topics = (config?.topics ?? defaultMatchConfig().topics).filter((topic): topic is Topic => TOPICS.includes(topic));
  const mode = config?.mode === "arcade" ? "arcade" : "daily";
  const questionCount = Math.max(3, Math.min(20, Math.floor(config?.questionCount ?? DAILY_QUESTION_COUNT)));
  return { topics: topics.length ? topics : defaultMatchConfig().topics, mode, questionCount };
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

function oneTopicQuestion(seed: string, index: number, countries: Country[], topic: Topic, mode: MatchMode): MatchQuestion | null {
  const rng = mulberry32(hashStringToSeed(`match-${seed}-${mode}-${topic}-${index}`));
  const basePool = mode === "arcade" ? arcadePool(countries, "timed", topic) : eligibleCountries(countries);
  const pool = topicPool(basePool, topic);
  const [country] = seededPick(pool, 1, rng);
  if (!country) return null;
  if (topic === "location") {
    const [question] = generateMapQuestions([country, ...seededShuffle(basePool.filter((item) => item.code !== country.code), rng)], "locate", rng);
    return question ? { id: `match-${seed}-${index}`, topic, country, question } : null;
  }
  const prefix = `match-${seed}-${index}`;
  const [question] = topic === "capital"
    ? generateCapitalQuestions(prefix, [country], topicPool(basePool, "capital"), rng)
    : topic === "currency"
      ? generateCurrencyQuestions(prefix, [country], topicPool(basePool, "currency"), rng)
      : topic === "language"
        ? generateLanguageQuestions(prefix, [country], topicPool(basePool, "language"), rng)
        : topic === "neighbor"
          ? generateNeighborQuestions(prefix, [country], basePool, rng)
          : generateFlagQuestions(prefix, [country], basePool, rng);
  return question ? { id: `match-${seed}-${index}`, topic, country, question } : null;
}

export function buildMatchQuestions(seed: string, config: MatchConfig, countries: Country[]): MatchQuestion[] {
  const normalized = normalizeMatchConfig(config);
  if (
    normalized.mode === "daily" &&
    normalized.topics.join(",") === defaultMatchConfig().topics.join(",") &&
    normalized.questionCount === DAILY_QUESTION_COUNT
  ) {
    return buildDailyQuiz(seed, countries).map((question, index) => ({ ...question, id: `match-${seed}-${index}` }));
  }
  return Array.from({ length: normalized.questionCount }, (_, index) => {
    const topic = normalized.topics[index % normalized.topics.length];
    return oneTopicQuestion(seed, index, countries, topic, normalized.mode);
  }).filter((question): question is MatchQuestion => Boolean(question));
}

export function buildRematchConfig(match?: MatchLike | null): MatchConfig {
  return normalizeMatchConfig(match?.config ?? defaultMatchConfig());
}

export function winnerFromResults<T extends MatchResultLike>(results: T[]) {
  if (results.length < 2) return null;
  const sorted = [...results].sort((a, b) => b.score - a.score || a.finished_at.localeCompare(b.finished_at));
  if (sorted[0].score === sorted[1].score) return { type: "tie" as const, winner: null, topScore: sorted[0].score };
  return { type: "winner" as const, winner: sorted[0], topScore: sorted[0].score };
}
