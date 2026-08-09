import { describe, expect, it } from "vitest";
import { countries } from "../../data/countries";
import { defaultProgress, type AppProgress } from "../../types/progress";
import { reviewKey } from "../../types/topic";
import {
  PROGRESSIVE_STAGES,
  PROGRESSIVE_TIER_SIZE,
  progressivePracticeBatch,
  progressiveResults,
  progressiveTierGroups
} from "../progressivePractice";

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
  it("builds four tiers of 50 popularity-ranked flags", () => {
    const groups = progressiveTierGroups(countries);

    expect(PROGRESSIVE_STAGES).toHaveLength(4);
    expect(PROGRESSIVE_STAGES.map((stage) => groups[stage].length)).toEqual([50, 50, 50, 50]);
    expect(new Set(PROGRESSIVE_STAGES.flatMap((stage) => groups[stage].map((country) => country.code))).size).toBe(200);
  });

  it("introduces only tier 1 flags for a new learner", () => {
    const groups = progressiveTierGroups(countries);
    const tierOneCodes = new Set(groups["tier-1"].map((country) => country.code));
    const batch = progressivePracticeBatch(defaultProgress, countries, 8, () => 0.5);

    expect(batch.stage).toBe("tier-1");
    expect(batch.countries).toHaveLength(8);
    expect(batch.countries.every((country) => tierOneCodes.has(country.code))).toBe(true);
  });

  it("unlocks tier 2 while repeating missed tier 1 flags", () => {
    const groups = progressiveTierGroups(countries);
    const tierOne = groups["tier-1"];
    const tierTwoCodes = new Set(groups["tier-2"].map((country) => country.code));
    const missed = tierOne[0];
    const review = Object.fromEntries(
      tierOne.map((country) => [reviewKey(country.code, "flag"), seenState(country.code, country.code === missed.code ? 3 : 0)])
    );
    const progress: AppProgress = { ...defaultProgress, review };
    const batch = progressivePracticeBatch(progress, countries, 8, () => 0.5, new Date("2026-07-18T12:00:00.000Z").getTime());

    expect(batch.stage).toBe("tier-2");
    expect(batch.countries.map((country) => country.code)).toContain(missed.code);
    expect(batch.countries.some((country) => tierTwoCodes.has(country.code))).toBe(true);
  });

  it("summarizes persistent results by tier", () => {
    const tierOneCountry = progressiveTierGroups(countries)["tier-1"][0];
    const progress: AppProgress = {
      ...defaultProgress,
      review: { [reviewKey(tierOneCountry.code, "flag")]: seenState(tierOneCountry.code, 1) }
    };
    const results = progressiveResults(progress, countries, new Date("2026-07-18T12:00:00.000Z").getTime());

    expect(results.seen).toBe(1);
    expect(results.needsRepetition).toBe(1);
    expect(results.tiers.find((tier) => tier.stage === "tier-1")?.seen).toBe(1);
    expect(results.tiers.every((tier) => tier.total === PROGRESSIVE_TIER_SIZE)).toBe(true);
  });
});
