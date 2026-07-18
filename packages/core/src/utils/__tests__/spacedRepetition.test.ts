import { describe, expect, it } from "vitest";
import { countries } from "../../data/countries";
import { defaultProgress, type ReviewState } from "../../types/progress";
import { getDueCountries, getWeakCountries, isMasteredReview, isWeakReview, updateReviewState } from "../spacedRepetition";

describe("spaced repetition topics", () => {
  it("keeps flag, capital, and location state isolated for the same country", () => {
    const afterFlag = updateReviewState("FR", "flag", true, defaultProgress);
    const afterCapital = updateReviewState("FR", "capital", false, afterFlag);
    const afterLocation = updateReviewState("FR", "location", true, afterCapital);

    expect(afterLocation.review["FR:flag"]).toMatchObject({
      countryCode: "FR",
      topic: "flag",
      box: 1,
      correctCount: 1,
      wrongCount: 0
    });
    expect(afterLocation.review["FR:capital"]).toMatchObject({
      countryCode: "FR",
      topic: "capital",
      box: 0,
      correctCount: 0,
      wrongCount: 1
    });
    expect(afterLocation.review["FR:location"]).toMatchObject({
      countryCode: "FR",
      topic: "location",
      box: 1,
      correctCount: 1,
      wrongCount: 0
    });
  });

  it("only returns previously seen countries that are due", () => {
    const afterMiss = updateReviewState("FR", "flag", false, defaultProgress);
    const france = countries.find((country) => country.code === "FR");
    const germany = countries.find((country) => country.code === "DE");

    expect(france).toBeDefined();
    expect(germany).toBeDefined();
    expect(getDueCountries(afterMiss, [france!, germany!], "flag").map((country) => country.code)).toEqual(["FR"]);
  });

  it("does not advance a card again before its scheduled review", () => {
    const firstAt = new Date("2026-07-18T12:00:00.000Z");
    const afterFirst = updateReviewState("FR", "flag", true, defaultProgress, firstAt);
    const firstState = afterFirst.review["FR:flag"];
    const afterEarlyRepeat = updateReviewState("FR", "flag", true, afterFirst, new Date("2026-07-18T13:00:00.000Z"));

    expect(firstState).toMatchObject({ box: 1, nextReviewAt: "2026-07-19T12:00:00.000Z" });
    expect(afterEarlyRepeat.review["FR:flag"]).toMatchObject({
      box: 1,
      correctCount: 2,
      nextReviewAt: firstState.nextReviewAt
    });

    const afterDueRecall = updateReviewState("FR", "flag", true, afterEarlyRepeat, new Date(firstState.nextReviewAt));
    expect(afterDueRecall.review["FR:flag"]).toMatchObject({ box: 2, nextReviewAt: "2026-07-22T12:00:00.000Z" });
  });

  it("resets a missed card to box zero and makes it immediately due", () => {
    const firstAt = new Date("2026-07-18T12:00:00.000Z");
    const learned = updateReviewState("FR", "flag", true, defaultProgress, firstAt);
    const missedAt = new Date("2026-07-18T13:00:00.000Z");
    const missed = updateReviewState("FR", "flag", false, learned, missedAt);

    expect(missed.review["FR:flag"]).toMatchObject({ box: 0, wrongCount: 1, nextReviewAt: missedAt.toISOString() });
  });

  it("orders equally difficult due cards by the oldest due date", () => {
    const france = countries.find((country) => country.code === "FR")!;
    const germany = countries.find((country) => country.code === "DE")!;
    const reviewState = (countryCode: string, nextReviewAt: string): ReviewState => ({
      countryCode,
      topic: "flag",
      box: 2,
      correctCount: 2,
      wrongCount: 0,
      lastSeenAt: "2020-01-01T00:00:00.000Z",
      nextReviewAt
    });
    const progress = {
      ...defaultProgress,
      review: {
        "FR:flag": reviewState("FR", "2020-01-03T00:00:00.000Z"),
        "DE:flag": reviewState("DE", "2020-01-01T00:00:00.000Z")
      }
    };

    expect(getDueCountries(progress, [france, germany], "flag").map((country) => country.code)).toEqual(["DE", "FR"]);
  });

  it("lets recovered cards leave the weak set and uses one mastery definition", () => {
    const recovered: ReviewState = {
      countryCode: "FR",
      topic: "flag",
      box: 5,
      correctCount: 6,
      wrongCount: 2,
      lastSeenAt: "2026-07-18T00:00:00.000Z",
      nextReviewAt: "2026-08-17T00:00:00.000Z"
    };
    const struggling = { ...recovered, box: 2, correctCount: 2, wrongCount: 2 };

    expect(isWeakReview(recovered)).toBe(false);
    expect(isMasteredReview(recovered)).toBe(true);
    expect(isWeakReview(struggling)).toBe(true);
    expect(isMasteredReview(struggling)).toBe(false);
  });

  it("ranks weak cards by current box and error rate instead of lifetime misses alone", () => {
    const france = countries.find((country) => country.code === "FR")!;
    const germany = countries.find((country) => country.code === "DE")!;
    const base: ReviewState = {
      countryCode: "FR",
      topic: "flag",
      box: 1,
      correctCount: 90,
      wrongCount: 10,
      lastSeenAt: "2026-07-18T00:00:00.000Z",
      nextReviewAt: "2026-07-19T00:00:00.000Z"
    };
    const progress = {
      ...defaultProgress,
      review: {
        "FR:flag": base,
        "DE:flag": { ...base, countryCode: "DE", correctCount: 1, wrongCount: 1 }
      }
    };

    expect(getWeakCountries(progress, [france, germany], "flag").map((country) => country.code)).toEqual(["DE", "FR"]);
  });
});
