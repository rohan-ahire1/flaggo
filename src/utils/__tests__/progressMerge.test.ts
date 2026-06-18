import { describe, expect, it } from "vitest";
import { defaultProgress, type AppProgress } from "../../types/progress";
import { mergeProgress, normalizeProgress } from "../progressMerge";

function progress(partial: Partial<AppProgress>): AppProgress {
  return { ...defaultProgress, ...partial, review: partial.review ?? {}, completedLessonIds: partial.completedLessonIds ?? [] };
}

describe("mergeProgress", () => {
  it("normalizes engagement fields for legacy and malformed progress", () => {
    const normalized = normalizeProgress({
      daily: {
        lastDate: "2026-06-18",
        streak: 2.8,
        best: -4,
        history: {
          "2026-06-18": { score: 8.9, total: 10 },
          bad: { score: "x", total: 10 } as never
        }
      },
      arcade: { "timed-flag": 4.7, bad: "x" as never },
      decks: [
        { id: "a", name: "A", codes: ["FR"], topic: "flag", createdAt: "2026-06-18T00:00:00.000Z" },
        { id: "a", name: "Duplicate", codes: ["DE"], topic: "flag", createdAt: "2026-06-19T00:00:00.000Z" },
        { id: 1, name: "Bad", codes: [], topic: "flag", createdAt: "" } as never
      ]
    });

    expect(normalized.daily.streak).toBe(2);
    expect(normalized.daily.best).toBe(0);
    expect(normalized.daily.history["2026-06-18"]).toEqual({ score: 8, total: 10 });
    expect(normalized.daily.history.bad).toBeUndefined();
    expect(normalized.arcade).toEqual({ "timed-flag": 4 });
    expect(normalized.decks).toHaveLength(1);
    expect(normalized.decks[0].name).toBe("A");
  });

  it("keeps max counters, max streak, later lesson date, and union of lessons", () => {
    const merged = mergeProgress(
      progress({ xp: 50, coins: 8, streak: 3, totalCorrect: 12, totalWrong: 4, lastLessonDate: "2026-06-17", completedLessonIds: ["a", "b"] }),
      progress({ xp: 40, coins: 10, streak: 5, totalCorrect: 9, totalWrong: 7, lastLessonDate: "2026-06-18", completedLessonIds: ["b", "c"] })
    );

    expect(merged).toMatchObject({
      xp: 50,
      coins: 10,
      streak: 5,
      totalCorrect: 12,
      totalWrong: 7,
      lastLessonDate: "2026-06-18"
    });
    expect(merged.completedLessonIds.sort()).toEqual(["a", "b", "c"]);
  });

  it("merges review by higher box and sums counts", () => {
    const merged = mergeProgress(
      progress({
        review: {
          IN: { countryCode: "IN", box: 2, correctCount: 4, wrongCount: 1, lastSeenAt: "2026-06-16T00:00:00.000Z", nextReviewAt: "2026-06-20T00:00:00.000Z" }
        }
      }),
      progress({
        review: {
          IN: { countryCode: "IN", box: 4, correctCount: 2, wrongCount: 3, lastSeenAt: "2026-06-15T00:00:00.000Z", nextReviewAt: "2026-06-22T00:00:00.000Z" }
        }
      })
    );

    expect(merged.review["IN:flag"]).toMatchObject({
      box: 4,
      correctCount: 6,
      wrongCount: 4,
      nextReviewAt: "2026-06-22T00:00:00.000Z"
    });
  });

  it("tie-breaks review by later lastSeenAt", () => {
    const merged = mergeProgress(
      progress({
        review: {
          BR: { countryCode: "BR", box: 3, correctCount: 1, wrongCount: 0, lastSeenAt: "2026-06-18T00:00:00.000Z", nextReviewAt: "2026-06-20T00:00:00.000Z" }
        }
      }),
      progress({
        review: {
          BR: { countryCode: "BR", box: 3, correctCount: 1, wrongCount: 2, lastSeenAt: "2026-06-17T00:00:00.000Z", nextReviewAt: "2026-06-19T00:00:00.000Z" }
        }
      })
    );

    expect(merged.review["BR:flag"]).toMatchObject({
      lastSeenAt: "2026-06-18T00:00:00.000Z",
      nextReviewAt: "2026-06-20T00:00:00.000Z",
      correctCount: 2,
      wrongCount: 2
    });
  });

  it("normalizes legacy review keys to flag keys without dropping composite keys", () => {
    const normalized = normalizeProgress({
      selectedTopic: "capital",
      review: {
        FR: { countryCode: "FR", box: 2, correctCount: 3, wrongCount: 1, lastSeenAt: "2026-06-16T00:00:00.000Z", nextReviewAt: "2026-06-19T00:00:00.000Z" },
        "FR:flag": { countryCode: "FR", topic: "flag", box: 3, correctCount: 2, wrongCount: 0, lastSeenAt: "2026-06-17T00:00:00.000Z", nextReviewAt: "2026-06-20T00:00:00.000Z" },
        "FR:capital": { countryCode: "FR", topic: "capital", box: 1, correctCount: 1, wrongCount: 0, lastSeenAt: "2026-06-17T00:00:00.000Z", nextReviewAt: "2026-06-18T00:00:00.000Z" }
      }
    });

    expect(Object.keys(normalized.review).sort()).toEqual(["FR:capital", "FR:flag"]);
    expect(normalized.review["FR:flag"]).toMatchObject({ countryCode: "FR", topic: "flag", box: 3, correctCount: 5, wrongCount: 1 });
    expect(normalized.review["FR:capital"]).toMatchObject({ countryCode: "FR", topic: "capital", box: 1 });
    expect(normalized.selectedTopic).toBe("capital");
  });

  it("merges composite review keys independently by topic", () => {
    const merged = mergeProgress(
      progress({
        review: {
          "FR:flag": { countryCode: "FR", topic: "flag", box: 5, correctCount: 5, wrongCount: 0, lastSeenAt: "2026-06-18T00:00:00.000Z", nextReviewAt: "2026-07-18T00:00:00.000Z" },
          "FR:capital": { countryCode: "FR", topic: "capital", box: 1, correctCount: 1, wrongCount: 2, lastSeenAt: "2026-06-17T00:00:00.000Z", nextReviewAt: "2026-06-18T00:00:00.000Z" }
        }
      }),
      progress({
        review: {
          "FR:flag": { countryCode: "FR", topic: "flag", box: 3, correctCount: 2, wrongCount: 1, lastSeenAt: "2026-06-16T00:00:00.000Z", nextReviewAt: "2026-06-23T00:00:00.000Z" },
          "FR:capital": { countryCode: "FR", topic: "capital", box: 4, correctCount: 4, wrongCount: 0, lastSeenAt: "2026-06-18T00:00:00.000Z", nextReviewAt: "2026-07-02T00:00:00.000Z" }
        }
      })
    );

    expect(merged.review["FR:flag"]).toMatchObject({ topic: "flag", box: 5, correctCount: 7, wrongCount: 1 });
    expect(merged.review["FR:capital"]).toMatchObject({ topic: "capital", box: 4, correctCount: 5, wrongCount: 2 });
  });

  it("merges daily, arcade, and decks without data loss", () => {
    const merged = mergeProgress(
      progress({
        daily: { lastDate: "2026-06-17", streak: 3, best: 4, history: { "2026-06-18": { score: 6, total: 10 } } },
        arcade: { "timed-flag": 5, "hard-capital": 2 },
        decks: [{ id: "a", name: "Old", codes: ["FR"], topic: "flag", createdAt: "2026-06-17T00:00:00.000Z" }]
      }),
      progress({
        daily: { lastDate: "2026-06-18", streak: 2, best: 7, history: { "2026-06-18": { score: 8, total: 10 }, "2026-06-17": { score: 9, total: 10 } } },
        arcade: { "timed-flag": 7, "sudden-location": 3 },
        decks: [
          { id: "a", name: "New", codes: ["DE"], topic: "flag", createdAt: "2026-06-18T00:00:00.000Z" },
          { id: "b", name: "Only server", codes: ["IT"], topic: "capital", createdAt: "2026-06-18T00:00:00.000Z" }
        ]
      })
    );

    expect(merged.daily).toMatchObject({ lastDate: "2026-06-18", streak: 3, best: 7 });
    expect(merged.daily.history["2026-06-18"]).toEqual({ score: 8, total: 10 });
    expect(merged.daily.history["2026-06-17"]).toEqual({ score: 9, total: 10 });
    expect(merged.arcade).toEqual({ "timed-flag": 7, "hard-capital": 2, "sudden-location": 3 });
    expect(merged.decks.find((deck) => deck.id === "a")).toMatchObject({ name: "New", codes: ["FR", "DE"] });
    expect(merged.decks.find((deck) => deck.id === "b")).toBeTruthy();
  });
});
