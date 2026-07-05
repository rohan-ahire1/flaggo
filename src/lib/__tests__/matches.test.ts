import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { countries } from "@flaggo/core/data/countries";
import { DAILY_QUESTION_COUNT } from "@flaggo/core/utils/dailyChallenge";
import { buildMatchQuestions, defaultMatchConfig, matchUrl, normalizeMatchConfig, winnerFromResults, type MatchConfig } from "../matches";

describe("match helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("builds identical questions for the same seed and config", () => {
    const config: MatchConfig = { topics: ["flag", "capital", "currency", "language", "neighbor"], mode: "daily", questionCount: DAILY_QUESTION_COUNT };

    const a = buildMatchQuestions("seed-123", config, countries);
    const b = buildMatchQuestions("seed-123", config, countries);

    expect(a).toHaveLength(DAILY_QUESTION_COUNT);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("changes the deterministic question set when the seed changes", () => {
    const config: MatchConfig = { topics: ["flag", "capital"], mode: "arcade", questionCount: 8 };

    const a = buildMatchQuestions("seed-123", config, countries).map((question) => question.country.code);
    const b = buildMatchQuestions("seed-456", config, countries).map((question) => question.country.code);

    expect(a).not.toEqual(b);
  });

  it("computes winners and ties from submitted results", () => {
    const finished_at = "2026-06-18T10:00:00.000Z";

    expect(winnerFromResults([
      { display_name: "Ava", score: 7, finished_at },
      { display_name: "Bo", score: 9, finished_at }
    ])).toMatchObject({ type: "winner", topScore: 9, winner: { display_name: "Bo" } });

    expect(winnerFromResults([
      { display_name: "Ava", score: 9, finished_at },
      { display_name: "Bo", score: 9, finished_at }
    ])).toMatchObject({ type: "tie", topScore: 9, winner: null });
  });

  it("normalizes configs and formats match links", () => {
    vi.stubGlobal("window", { location: { origin: "https://example.test" } });

    expect(defaultMatchConfig()).toMatchObject({ mode: "daily", questionCount: DAILY_QUESTION_COUNT });
    expect(normalizeMatchConfig({ topics: ["flag", "bad-topic" as "flag"], mode: "arcade", questionCount: 99 })).toEqual({
      topics: ["flag"],
      mode: "arcade",
      questionCount: 20
    });
    expect(matchUrl("abc 123")).toBe("https://example.test/?m=abc%20123");
  });

  it("submits a single result row per match and user", async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const selectResults = vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          order: vi.fn(async () => ({ data: [], error: null }))
        }))
      }))
    }));

    vi.doMock("../supabase", () => ({
      supabase: {
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
        from: vi.fn((table: string) => {
          if (table === "match_results") return { upsert, select: selectResults };
          if (table === "friend_links") return { upsert: vi.fn(async () => ({ error: null })) };
          return {};
        })
      }
    }));
    vi.doMock("../analytics", () => ({ trackEvent: vi.fn() }));

    const { submitMatchResult } = await import("../matches");
    await submitMatchResult("match-1", 8, 10, "Rohan");

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ match_id: "match-1", user_id: "user-1", display_name: "Rohan", score: 8, total: 10 }),
      { onConflict: "match_id,user_id" }
    );
  });

  it("keeps friends leaderboard ranked by wins then total score without exposing ids", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/202606180003_matches.sql"), "utf8");

    expect(sql).toContain("returns table (rank bigint, handle text, matches_played bigint, wins bigint, total_score bigint)");
    expect(sql).toContain("order by wins desc, total_score desc, matches_played asc, handle asc");
    expect(sql).not.toContain("returns table (user_id");
    expect(sql).not.toContain("email");
  });
});
