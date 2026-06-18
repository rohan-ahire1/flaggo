import { BRAND } from "../config/brand";
import type { Country } from "../types/country";
import type { Topic } from "../types/topic";
import { TOPICS } from "../types/topic";
import { arcadePool } from "../utils/arcade";
import { buildDailyQuiz } from "../utils/dailyChallenge";
import {
  generateCapitalQuestions,
  generateCurrencyQuestions,
  generateFlagQuestions,
  generateLanguageQuestions,
  generateMapQuestions,
  generateNeighborQuestions,
  generateReviewQuestions,
  type MapQuestion,
  type Question
} from "../utils/quiz";
import { hashStringToSeed, mulberry32, seededPick, seededShuffle } from "../utils/seededRandom";
import { trackEvent } from "./analytics";
import { sanitizeDisplayName } from "./leaderboard";
import { supabase } from "./supabase";

export type MatchMode = "daily" | "arcade";

export type MatchConfig = {
  topics: Topic[];
  mode: MatchMode;
  questionCount: number;
};

export type Match = {
  id: string;
  created_by: string;
  seed: string;
  config: MatchConfig;
  created_at: string;
};

export type MatchResult = {
  match_id: string;
  user_id: string;
  display_name: string;
  score: number;
  total: number;
  finished_at: string;
};

export type FriendsLeaderboardRow = {
  rank: number;
  handle: string;
  matches_played: number;
  wins: number;
  total_score: number;
};

export type MatchQuestion =
  | { id: string; topic: Exclude<Topic, "location">; country: Country; question: Question }
  | { id: string; topic: "location"; country: Country; question: MapQuestion };

export function defaultMatchConfig(): MatchConfig {
  return { topics: ["flag", "capital", "currency", "language", "neighbor"], mode: "daily", questionCount: 10 };
}

export function normalizeMatchConfig(config: Partial<MatchConfig> | null | undefined): MatchConfig {
  const topics = (config?.topics ?? defaultMatchConfig().topics).filter((topic): topic is Topic => TOPICS.includes(topic));
  const mode = config?.mode === "arcade" ? "arcade" : "daily";
  const questionCount = Math.max(3, Math.min(20, Math.floor(config?.questionCount ?? 10)));
  return { topics: topics.length ? topics : defaultMatchConfig().topics, mode, questionCount };
}

export function matchUrl(id: string) {
  const base = typeof window === "undefined" ? BRAND.url : window.location.origin;
  return `${base}/?m=${encodeURIComponent(id)}`;
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
  if (normalized.mode === "daily" && normalized.topics.join(",") === defaultMatchConfig().topics.join(",") && normalized.questionCount === 10) {
    return buildDailyQuiz(seed, countries).map((question, index) => ({ ...question, id: `match-${seed}-${index}` }));
  }
  return Array.from({ length: normalized.questionCount }, (_, index) => {
    const topic = normalized.topics[index % normalized.topics.length];
    return oneTopicQuestion(seed, index, countries, topic, normalized.mode);
  }).filter((question): question is MatchQuestion => Boolean(question));
}

export function buildRematchConfig(match?: Match | null): MatchConfig {
  return normalizeMatchConfig(match?.config ?? defaultMatchConfig());
}

export function winnerFromResults<T extends Pick<MatchResult, "display_name" | "score" | "finished_at">>(results: T[]) {
  if (results.length < 2) return null;
  const sorted = [...results].sort((a, b) => b.score - a.score || a.finished_at.localeCompare(b.finished_at));
  if (sorted[0].score === sorted[1].score) return { type: "tie" as const, winner: null, topScore: sorted[0].score };
  return { type: "winner" as const, winner: sorted[0], topScore: sorted[0].score };
}

export async function createMatch(config: MatchConfig): Promise<Match> {
  const client = supabase;
  const { data: auth } = client ? await client.auth.getUser() : { data: { user: null } };
  const user = auth.user;
  if (!client || !user) throw new Error("Sign in to create a match.");
  const normalized = normalizeMatchConfig(config);
  const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const { data, error } = await client
    .from("matches")
    .insert({ created_by: user.id, seed, config: normalized })
    .select("id, created_by, seed, config, created_at")
    .single();
  if (error) throw error;
  trackEvent("match_create", { topics: normalized.topics.join(","), mode: normalized.mode });
  return { ...(data as Omit<Match, "config"> & { config: MatchConfig }), config: normalizeMatchConfig((data as { config?: MatchConfig }).config) };
}

export async function getMatch(id: string): Promise<Match | null> {
  const client = supabase;
  if (!client) return null;
  const { data, error } = await client.from("matches").select("id, created_by, seed, config, created_at").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...(data as Omit<Match, "config"> & { config: MatchConfig }), config: normalizeMatchConfig((data as { config?: MatchConfig }).config) };
}

export async function getMatchResults(id: string): Promise<MatchResult[]> {
  const client = supabase;
  if (!client) return [];
  const { data, error } = await client
    .from("match_results")
    .select("match_id, user_id, display_name, score, total, finished_at")
    .eq("match_id", id)
    .order("score", { ascending: false })
    .order("finished_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MatchResult[];
}

export async function linkFriend(otherUserId: string): Promise<void> {
  const client = supabase;
  const { data: auth } = client ? await client.auth.getUser() : { data: { user: null } };
  const user = auth.user;
  if (!client || !user || otherUserId === user.id) return;
  const { error } = await client.from("friend_links").upsert({ user_id: user.id, friend_id: otherUserId }, { onConflict: "user_id,friend_id" });
  if (error) throw error;
}

async function autoLinkCompletedMatch(matchId: string, userId: string) {
  const results = await getMatchResults(matchId);
  if (results.length < 2) return;
  await Promise.all(results.filter((result) => result.user_id !== userId).map((result) => linkFriend(result.user_id)));
}

export async function submitMatchResult(id: string, score: number, total: number, name: string): Promise<void> {
  const client = supabase;
  const { data: auth } = client ? await client.auth.getUser() : { data: { user: null } };
  const user = auth.user;
  const clean = sanitizeDisplayName(name);
  if (!client || !user) throw new Error("Sign in to submit your match result.");
  if (clean.length < 2) throw new Error("Choose a display name before submitting.");
  const safeScore = Math.max(0, Math.min(Math.floor(score), Math.floor(total)));
  const safeTotal = Math.max(1, Math.floor(total));
  const { error } = await client.from("match_results").upsert(
    { match_id: id, user_id: user.id, display_name: clean, score: safeScore, total: safeTotal, finished_at: new Date().toISOString() },
    { onConflict: "match_id,user_id" }
  );
  if (error) throw error;
  await autoLinkCompletedMatch(id, user.id);
  const results = await getMatchResults(id);
  const outcome = winnerFromResults(results);
  const won = outcome?.type === "winner" && outcome.winner?.user_id === user.id;
  trackEvent("match_complete", { id, score: safeScore, total: safeTotal, won });
}

export async function getFriendsLeaderboard(): Promise<FriendsLeaderboardRow[]> {
  const client = supabase;
  if (!client) return [];
  const { data, error } = await client.rpc("friends_leaderboard");
  if (error) throw error;
  trackEvent("friends_leaderboard_open");
  return (data ?? []) as FriendsLeaderboardRow[];
}
