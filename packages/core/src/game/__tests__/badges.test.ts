import { describe, expect, it } from "vitest";
import type { Country } from "../../types/country";
import { defaultProgress, type AppProgress } from "../../types/progress";
import { reviewKey } from "../../types/topic";
import { mergeProgress, normalizeProgress } from "../../utils/progressMerge";
import { awardBadges, evaluateBadges } from "../badges";

function progress(partial: Partial<AppProgress> = {}): AppProgress {
  return { ...defaultProgress, ...partial };
}

function country(code: string, continent: Country["continent"]): Country {
  return {
    code,
    name: code,
    continent,
    difficulty: "easy",
    isUNMember: true,
    isIndependent: true,
    flagUrl: `https://example.com/${code}.svg`
  };
}

const countries: Country[] = [
  country("FR", "Europe"),
  country("DE", "Europe"),
  ...Array.from({ length: 20 }, (_, index) => country(`A${index}`, "Africa")),
  ...Array.from({ length: 28 }, (_, index) => country(`Z${index}`, "Asia"))
];

describe("badges", () => {
  it("earns Flag Scout after all 50 flags in the first stage are introduced", () => {
    const review = Object.fromEntries(countries.map((item) => [
      reviewKey(item.code, "flag"),
      { countryCode: item.code, topic: "flag", box: 1, correctCount: 1, wrongCount: 0, lastSeenAt: null, nextReviewAt: new Date(0).toISOString() }
    ])) as AppProgress["review"];
    const oneMissing = { ...review };
    delete oneMissing[reviewKey(countries[0].code, "flag")];

    expect(evaluateBadges(progress({ review: oneMissing }), countries)).not.toContain("flag-scout");
    expect(evaluateBadges(progress({ review }), countries)).toContain("flag-scout");
  });

  it("earns Flag Streak 7 at a seven-day daily streak", () => {
    expect(evaluateBadges(progress({ daily: { ...defaultProgress.daily, streak: 6 } }), countries)).not.toContain("flag-streak-7");
    expect(evaluateBadges(progress({ daily: { ...defaultProgress.daily, streak: 7 } }), countries)).toContain("flag-streak-7");
  });

  it("earns Africa Master after 20 African flag countries reach SRS box 5", () => {
    const nineteen = Object.fromEntries(countries.filter((item) => item.continent === "Africa").slice(0, 19).map((item) => [
      reviewKey(item.code, "flag"),
      { countryCode: item.code, topic: "flag", box: 5, correctCount: 5, wrongCount: 0, lastSeenAt: null, nextReviewAt: new Date(0).toISOString() }
    ]));
    const twenty = {
      ...nineteen,
      [reviewKey("A19", "flag")]: { countryCode: "A19", topic: "flag", box: 5, correctCount: 5, wrongCount: 0, lastSeenAt: null, nextReviewAt: new Date(0).toISOString() }
    } as AppProgress["review"];

    expect(evaluateBadges(progress({ review: nineteen as AppProgress["review"] }), countries)).not.toContain("africa-master");
    expect(evaluateBadges(progress({ review: twenty }), countries)).toContain("africa-master");
  });

  it("earns Perfect Round only for a 100% round of at least five questions", () => {
    expect(evaluateBadges(progress(), countries, { kind: "daily", score: 4, total: 4 })).not.toContain("perfect-round");
    expect(evaluateBadges(progress(), countries, { kind: "daily", score: 4, total: 5 })).not.toContain("perfect-round");
    expect(evaluateBadges(progress(), countries, { kind: "daily", score: 5, total: 5 })).toContain("perfect-round");
  });

  it("does not return already-earned badges again", () => {
    const already = progress({ badges: [{ id: "perfect-round", earnedAt: "2026-07-01T00:00:00.000Z" }] });
    expect(evaluateBadges(already, countries, { kind: "daily", score: 5, total: 5 })).not.toContain("perfect-round");
  });

  it("awards badges with timestamps and merge keeps earliest earnedAt", () => {
    const awarded = awardBadges(progress(), ["perfect-round", "perfect-round"], new Date("2026-07-02T00:00:00.000Z"));
    expect(awarded.badges).toEqual([{ id: "perfect-round", earnedAt: "2026-07-02T00:00:00.000Z" }]);

    const normalized = normalizeProgress({
      badges: [
        { id: "perfect-round", earnedAt: "bad" },
        { id: "perfect-round", earnedAt: "2026-07-03T00:00:00.000Z" },
        { id: "perfect-round", earnedAt: "2026-07-01T00:00:00.000Z" },
        { id: 1, earnedAt: "2026-07-01T00:00:00.000Z" } as never
      ]
    });
    expect(normalized.badges).toEqual([{ id: "perfect-round", earnedAt: "2026-07-01T00:00:00.000Z" }]);

    const merged = mergeProgress(
      progress({ badges: [{ id: "perfect-round", earnedAt: "2026-07-03T00:00:00.000Z" }] }),
      progress({ badges: [{ id: "perfect-round", earnedAt: "2026-07-01T00:00:00.000Z" }] })
    );
    expect(merged.badges).toEqual([{ id: "perfect-round", earnedAt: "2026-07-01T00:00:00.000Z" }]);
  });
});
