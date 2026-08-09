import { describe, expect, it } from "vitest";
import {
  flashcardsPath,
  mapPlayPath,
  parseFlashcardsRoute,
  parseMapPlayRoute,
  parseReviewRoute,
  parseTestRoute,
  reviewPath,
  testPath
} from "./routes";

describe("navigation routes", () => {
  it("round-trips review URLs", () => {
    const review = reviewPath({ topic: "capital", countryCodes: ["JP", "IN"] });
    expect(parseReviewRoute(new URL(review, "https://flaggo.test").search)).toEqual({
      topic: "capital",
      countryCodes: ["JP", "IN"]
    });

    const flashcards = flashcardsPath({ countryCodes: ["CN", "FR", "US"] });
    expect(parseFlashcardsRoute(new URL(flashcards, "https://flaggo.test").search)).toEqual({
      countryCodes: ["CN", "FR", "US"]
    });
  });

  it("round-trips test and map URLs", () => {
    const test = testPath({ mode: "options", topic: "flag", countryCodes: ["BR", "AR"] });
    expect(parseTestRoute(new URL(test, "https://flaggo.test").search)).toEqual({
      mode: "options",
      topic: "flag",
      countryCodes: ["BR", "AR"]
    });

    const map = mapPlayPath({ mode: "identify", countryCodes: ["FR", "DE"] });
    expect(parseMapPlayRoute(new URL(map, "https://flaggo.test").search)).toEqual({
      mode: "identify",
      countryCodes: ["FR", "DE"]
    });
  });

  it("keeps legacy router state working during the URL migration", () => {
    expect(parseReviewRoute("", { topic: "flag", countryCodes: ["US"] })).toEqual({
      topic: "flag",
      countryCodes: ["US"]
    });
  });

  it("rejects incomplete round URLs", () => {
    expect(parseReviewRoute("?topic=flag")).toBeNull();
    expect(parseFlashcardsRoute("")).toBeNull();
    expect(parseTestRoute("?mode=options&topic=flag")).toBeNull();
    expect(parseMapPlayRoute("?mode=locate")).toBeNull();
  });
});
