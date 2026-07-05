import { supabase } from "./supabase";
import { trackEvent } from "./analytics";
export { arcadeBoard, dailyBoard, xpBoard } from "@flaggo/core/game/boards";

export type LeaderboardRow = {
  rank: number;
  display_name: string;
  score: number;
  is_me: boolean;
};

export function sanitizeDisplayName(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 24);
}

// A public handle must never be an email address (PII). Reject anything containing "@".
export function isPublicSafeHandle(value: string) {
  const clean = sanitizeDisplayName(value);
  return clean.length >= 2 && !clean.includes("@");
}

export async function updateDisplayName(userId: string, displayName: string): Promise<string> {
  const clean = sanitizeDisplayName(displayName);
  if (clean.length < 2) throw new Error("Display name must be 2-24 characters.");
  if (clean.includes("@")) throw new Error("Display name can't be an email address.");
  const client = supabase;
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("profiles").upsert({ id: userId, display_name: clean }, { onConflict: "id" });
  if (error) throw error;
  return clean;
}

export async function submitScore(board: string, score: number, displayName: string): Promise<void> {
  const client = supabase;
  const { data: auth } = client ? await client.auth.getUser() : { data: { user: null } };
  const user = auth.user;
  const clean = sanitizeDisplayName(displayName);
  // Never publish a handle that is empty or an email address (PII protection).
  if (!client || !user || !isPublicSafeHandle(clean)) return;
  const { data, error: fetchError } = await client
    .from("leaderboard_scores")
    .select("score")
    .eq("user_id", user.id)
    .eq("board", board)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (typeof data?.score === "number" && data.score >= score) return;
  const { error } = await client.from("leaderboard_scores").upsert(
    { user_id: user.id, board, score: Math.max(0, Math.floor(score)), display_name: clean, updated_at: new Date().toISOString() },
    { onConflict: "user_id,board" }
  );
  if (error) throw error;
  trackEvent("leaderboard_submit", { board, score });
}

export async function fetchTopScores(board: string, limit = 50): Promise<LeaderboardRow[]> {
  const client = supabase;
  if (!client) return [];
  const { data, error } = await client.rpc("top_scores", { p_board: board, p_limit: limit });
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}

export async function fetchMyScore(board: string): Promise<LeaderboardRow | null> {
  const client = supabase;
  if (!client) return null;
  const { data: auth } = await client.auth.getUser();
  const user = auth.user;
  if (!user) return null;
  const { data: mine, error } = await client
    .from("leaderboard_scores")
    .select("score,display_name")
    .eq("user_id", user.id)
    .eq("board", board)
    .maybeSingle();
  if (error) throw error;
  if (!mine || typeof mine.score !== "number") return null;
  const { count, error: countError } = await client
    .from("leaderboard_scores")
    .select("user_id", { count: "exact", head: true })
    .eq("board", board)
    .gt("score", mine.score);
  if (countError) throw countError;
  return {
    rank: (count ?? 0) + 1,
    display_name: mine.display_name ?? "you",
    score: mine.score,
    is_me: true
  };
}
