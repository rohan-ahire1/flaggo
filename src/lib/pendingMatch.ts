export type PendingMatchResult = {
  matchId: string;
  score: number;
  total: number;
  at: number;
};

export const PENDING_MATCH_KEY = "flaggo-pending-match";
export const PENDING_MATCH_MAX_AGE_MS = 48 * 60 * 60 * 1000;

type PendingStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function storage(): PendingStorage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

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

export function readPendingMatch(now = Date.now(), store = storage()): PendingMatchResult | null {
  if (!store) return null;
  try {
    const parsed = validPendingMatch(JSON.parse(store.getItem(PENDING_MATCH_KEY) ?? "null"));
    if (!parsed) return null;
    if (now - parsed.at > PENDING_MATCH_MAX_AGE_MS) {
      clearPendingMatch(store);
      return null;
    }
    return parsed;
  } catch {
    clearPendingMatch(store);
    return null;
  }
}

export function writePendingMatch(result: PendingMatchResult, store = storage()) {
  if (!store) return;
  const valid = validPendingMatch(result);
  if (!valid) return;
  store.setItem(PENDING_MATCH_KEY, JSON.stringify(valid));
}

export function clearPendingMatch(store = storage()) {
  store?.removeItem(PENDING_MATCH_KEY);
}
