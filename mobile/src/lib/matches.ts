import { BRAND } from "../config/brand";
import { defaultMatchConfig, normalizeMatchConfig, winnerFromResults, type MatchConfig } from "@flaggo/core/game/matchConfig";
export { buildMatchQuestions, buildRematchConfig, defaultMatchConfig, normalizeMatchConfig, winnerFromResults, type MatchConfig, type MatchQuestion } from "@flaggo/core/game/matchConfig";
import { trackEvent } from "./analytics";
import { sanitizeDisplayName } from "./leaderboard";
import { supabase } from "./supabase";



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

export function matchUrl(id: string) {
  return `${BRAND.url}/?m=${encodeURIComponent(id)}`;
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
