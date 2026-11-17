import { describe, expect, it } from "vitest";
import { defaultProgress, type AppProgress } from "../../types/progress";
import { currentStreak, localDayKey, recordActivity, updateStreak } from "../date";

function progress(partial: Partial<AppProgress> = {}): AppProgress {
  return { ...defaultProgress, ...partial };
}

describe("updateStreak", () => {
  it("starts a streak at 1 on the first play", () => {
    const now = new Date(2026, 5, 10, 12, 0);
    const next = updateStreak(progress(), now);
    expect(next.streak).toBe(1);
    expect(next.lastLessonDate).toBe(localDayKey(now));
    expect(next.lastLessonDate).toBe("2026-06-10");
  });

  it("does not change when played again the same day", () => {
    const first = updateStreak(progress(), new Date(2026, 5, 10, 9, 0));
    const again = updateStreak(first, new Date(2026, 5, 10, 22, 0));
    expect(again).toBe(first);
  });

  it("adds 1 on the next local day", () => {
    const first = updateStreak(progress(), new Date(2026, 5, 10, 9, 0));
    const next = updateStreak(first, new Date(2026, 5, 11, 9, 0));
    expect(next.streak).toBe(2);
    expect(next.lastLessonDate).toBe("2026-06-11");
  });

  it("resets to 1 after skipping a day", () => {
    const first = progress({ streak: 5, lastLessonDate: "2026-06-10" });
    const next = updateStreak(first, new Date(2026, 5, 12, 9, 0));
    expect(next.streak).toBe(1);
    expect(next.lastLessonDate).toBe("2026-06-12");
  });

  it("counts a play at 01:00 local time for that local date", () => {
    const next = updateStreak(progress({ streak: 3, lastLessonDate: "2026-06-10" }), new Date(2026, 5, 11, 1, 0));
    expect(next.lastLessonDate).toBe("2026-06-11");
    expect(next.streak).toBe(4);
  });
});

describe("recordActivity", () => {
  const now = new Date(2026, 5, 10, 12, 0);

  it("leaves progress unchanged when totals and xp did not grow", () => {
    const previous = progress({ totalCorrect: 2, totalWrong: 1, xp: 30 });
    const next = { ...previous, completedLessonIds: ["a"] };
    expect(recordActivity(previous, next, now)).toBe(next);
  });

  it("updates the streak when answers grow", () => {
    const previous = progress();
    const result = recordActivity(previous, { ...previous, totalWrong: 1 }, now);
    expect(result.streak).toBe(1);
    expect(result.lastLessonDate).toBe("2026-06-10");
  });

  it("updates the streak when xp grows", () => {
    const previous = progress();
    expect(recordActivity(previous, { ...previous, xp: 10 }, now).streak).toBe(1);
  });
});

describe("currentStreak", () => {
  const now = new Date(2026, 5, 10, 12, 0);

  it("returns the streak when last played today or yesterday", () => {
    expect(currentStreak(progress({ streak: 4, lastLessonDate: "2026-06-10" }), now)).toBe(4);
    expect(currentStreak(progress({ streak: 4, lastLessonDate: "2026-06-09" }), now)).toBe(4);
  });

  it("returns 0 when last played two days ago or never", () => {
    expect(currentStreak(progress({ streak: 4, lastLessonDate: "2026-06-08" }), now)).toBe(0);
    expect(currentStreak(progress({ streak: 4, lastLessonDate: null }), now)).toBe(0);
  });
});
