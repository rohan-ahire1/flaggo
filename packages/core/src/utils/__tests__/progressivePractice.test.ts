import { describe, expect, it } from "vitest";
import { countries } from "../../data/countries";
import { defaultProgress, type AppProgress } from "../../types/progress";
import { reviewKey } from "../../types/topic";
import { progressivePracticeBatch, progressiveResults } from "../progressivePractice";

function seenState(countryCode: string, wrongCount = 0) {
  return {
    countryCode,
    topic: "flag" as const,
    box: wrongCount ? 0 : 1,
    correctCount: 1,
    wrongCount,
    lastSeenAt: "2026-07-18T00:00:00.000Z",
    nextReviewAt: "2026-07-19T00:00:00.000Z"
  };
}

describe("progressivePractice", () => {
  it("introduces only easy flags for a new learner", () => {
    const batch = progressivePracticeBatch(defaultProgress, countries, 8, () => 0.5);

    expect(batch.stage).toBe("easy");
    expect(batch.countries).toHaveLength(8);
    expect(batch.countries.every((country) => country.difficulty === "easy")).toBe(true);
  });

  it("unlocks medium flags while repeating missed easy flags", () => {
    const easy = countries.filter((country) => country.difficulty === "easy");
    const missed = easy[0];
    const review = Object.fromEntries(
      easy.map((country) => [reviewKey(country.code, "flag"), seenState(country.code, country.code === missed.code ? 3 : 0)])
    );
    const progress: AppProgress = { ...defaultProgress, review };
    const batch = progressivePracticeBatch(progress, countries, 8, () => 0.5, new Date("2026-07-18T12:00:00.000Z").getTime());

    expect(batch.stage).toBe("medium");
    expect(batch.countries.map((country) => country.code)).toContain(missed.code);
    expect(batch.countries.some((country) => country.difficulty === "medium")).toBe(true);
  });

  it("summarizes persistent results by difficulty", () => {
    const easy = countries.find((country) => country.difficulty === "easy")!;
    const progress: AppProgress = {
      ...defaultProgress,
      review: { [reviewKey(easy.code, "flag")]: seenState(easy.code, 1) }
    };
    const results = progressiveResults(progress, countries, new Date("2026-07-18T12:00:00.000Z").getTime());

    expect(results.seen).toBe(1);
    expect(results.needsRepetition).toBe(1);
    expect(results.tiers.find((tier) => tier.difficulty === "easy")?.seen).toBe(1);
  });
});
