import AsyncStorage from "@react-native-async-storage/async-storage";

export type PendingMatchResult = {
  matchId: string;
  score: number;
  total: number;
  at: number;
};

export const PENDING_MATCH_KEY = "flaggo-pending-match";
const PENDING_MATCH_MAX_AGE_MS = 48 * 60 * 60 * 1000;

function validPendingMatch(value: unknown): PendingMatchResult | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<PendingMatchResult>;
  if (typeof item.matchId !== "string" || !item.matchId) return null;
  if (typeof item.score !== "number" || !Number.isFinite(item.score)) return null;
  if (typeof item.total !== "number" || !Number.isFinite(item.total)) return null;
  if (typeof item.at !== "number" || !Number.isFinite(item.at)) return null;
  return {
    matchId: item.matchId,
    score: Math.max(0, Math.floor(item.score)),
    total: Math.max(1, Math.floor(item.total)),
    at: item.at
  };
}

export async function readPendingMatch(now = Date.now()): Promise<PendingMatchResult | null> {
  try {
    const parsed = validPendingMatch(JSON.parse((await AsyncStorage.getItem(PENDING_MATCH_KEY)) ?? "null"));
    if (!parsed) return null;
    if (now - parsed.at > PENDING_MATCH_MAX_AGE_MS) {
      await clearPendingMatch();
      return null;
    }
    return parsed;
  } catch {
    await clearPendingMatch();
    return null;
  }
}

export async function writePendingMatch(result: PendingMatchResult): Promise<void> {
  const valid = validPendingMatch(result);
  if (!valid) return;
  await AsyncStorage.setItem(PENDING_MATCH_KEY, JSON.stringify(valid));
}

export async function clearPendingMatch(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_MATCH_KEY);
}
