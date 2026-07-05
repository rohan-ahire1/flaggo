import { describe, expect, it } from "vitest";
import { defaultProgress } from "../../types/progress";
import { updateReviewState } from "../spacedRepetition";

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
});
