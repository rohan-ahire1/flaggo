import { describe, expect, it } from "vitest";
import { PENDING_MATCH_KEY, PENDING_MATCH_MAX_AGE_MS, clearPendingMatch, readPendingMatch, writePendingMatch } from "../pendingMatch";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    has: (key: string) => values.has(key)
  };
}

describe("pendingMatch", () => {
  it("round-trips a fresh pending match", () => {
    const store = memoryStorage();
    writePendingMatch({ matchId: "m1", score: 4, total: 5, at: 1000 }, store);

    expect(readPendingMatch(1000, store)).toEqual({ matchId: "m1", score: 4, total: 5, at: 1000 });
  });

  it("expires pending matches after 48 hours", () => {
    const store = memoryStorage();
    store.setItem(PENDING_MATCH_KEY, JSON.stringify({ matchId: "m1", score: 4, total: 5, at: 1000 }));

    expect(readPendingMatch(1001 + PENDING_MATCH_MAX_AGE_MS, store)).toBeNull();
    expect(store.has(PENDING_MATCH_KEY)).toBe(false);
  });

  it("clears invalid pending payloads", () => {
    const store = memoryStorage();
    store.setItem(PENDING_MATCH_KEY, "{bad");

    expect(readPendingMatch(1000, store)).toBeNull();
    expect(store.has(PENDING_MATCH_KEY)).toBe(false);
  });

  it("clears the key", () => {
    const store = memoryStorage();
    writePendingMatch({ matchId: "m1", score: 4, total: 5, at: 1000 }, store);
    clearPendingMatch(store);

    expect(readPendingMatch(1000, store)).toBeNull();
  });
});
