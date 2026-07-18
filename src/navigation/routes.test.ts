import { describe, expect, it } from "vitest";
import {
  lessonPath,
  mapPlayPath,
  parseLessonRoute,
  parseMapPlayRoute,
  parseTestRoute,
  testPath
} from "./routes";

describe("navigation routes", () => {
  it("round-trips lesson and review URLs", () => {
    const lesson = lessonPath({ lessonId: "asia-flag-1" });
    expect(lesson).toBe("/lesson?lesson=asia-flag-1");
    expect(parseLessonRoute(new URL(lesson, "https://flaggo.test").search)).toEqual({ lessonId: "asia-flag-1" });

    const review = lessonPath({ mode: "review", topic: "capital", countryCodes: ["JP", "IN"] });
    expect(parseLessonRoute(new URL(review, "https://flaggo.test").search)).toEqual({
      mode: "review",
      topic: "capital",
      countryCodes: ["JP", "IN"]
    });
  });

  it("round-trips test and map URLs", () => {
    const test = testPath({ mode: "options", topic: "flag", countryCodes: ["BR", "AR"] });
    expect(parseTestRoute(new URL(test, "https://flaggo.test").search)).toEqual({
      mode: "options",
      topic: "flag",
      countryCodes: ["BR", "AR"]
    });

    const map = mapPlayPath({ mode: "identify", countryCodes: ["FR", "DE"], lessonId: "europe-location-1" });
    expect(parseMapPlayRoute(new URL(map, "https://flaggo.test").search)).toEqual({
      mode: "identify",
      countryCodes: ["FR", "DE"],
      lessonId: "europe-location-1"
    });
  });

  it("keeps legacy router state working during the URL migration", () => {
    expect(parseLessonRoute("", { mode: "review", topic: "flag", countryCodes: ["US"] })).toEqual({
      mode: "review",
      topic: "flag",
      countryCodes: ["US"]
    });
  });

  it("rejects incomplete round URLs", () => {
    expect(parseLessonRoute("?mode=review&topic=flag")).toBeNull();
    expect(parseTestRoute("?mode=options&topic=flag")).toBeNull();
    expect(parseMapPlayRoute("?mode=locate")).toBeNull();
  });
});
