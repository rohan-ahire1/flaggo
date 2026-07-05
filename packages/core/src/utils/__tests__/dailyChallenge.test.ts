import { describe, expect, it } from "vitest";
import type { Country } from "../../types/country";
import { defaultProgress } from "../../types/progress";
import { applyDailyResult, buildDailyQuiz, DAILY_QUESTION_COUNT, dailyTopics } from "../dailyChallenge";

function country(code: string, continent: Country["continent"] = "Europe", capital = "Capital"): Country {
  return {
    code,
    name: code,
    continent,
    capital,
    difficulty: "easy",
    isUNMember: true,
    isIndependent: true,
    flagUrl: `${code}.svg`,
    ccn3: code,
    currencyName: `Currency ${Number(code.slice(1)) % 8}`,
    languages: [`Language ${Number(code.slice(1)) % 8}`],
    borders: [`C${(Number(code.slice(1)) + 1) % 20}`]
  };
}

const countries = Array.from({ length: 20 }, (_, index) => country(`C${index}`, index % 3 === 0 ? "Asia" : "Europe"));

describe("dailyChallenge", () => {
  it("builds deterministic daily quizzes by date", () => {
    const a = buildDailyQuiz("2026-06-18", countries).map((q) => q.id);
    const b = buildDailyQuiz("2026-06-18", countries).map((q) => q.id);
    const c = buildDailyQuiz("2026-06-19", countries).map((q) => [q.country.code, q.topic, JSON.stringify(q.question)]);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("builds exactly five non-location questions", () => {
    const quiz = buildDailyQuiz("2026-06-18", countries);
    expect(quiz).toHaveLength(DAILY_QUESTION_COUNT);
    expect(quiz).toHaveLength(5);
    expect(quiz.some((question) => (question.topic as string) === "location")).toBe(false);
    expect(dailyTopics()).toEqual(["flag", "capital", "currency", "language", "neighbor"]);
  });

  it("applies streak rules and keeps best same-day score", () => {
    const day1 = applyDailyResult(defaultProgress, "2026-06-17", { score: 6, total: 10 });
    const replay = applyDailyResult(day1, "2026-06-17", { score: 8, total: 10 });
    const day2 = applyDailyResult(replay, "2026-06-18", { score: 5, total: 10 });
    const gap = applyDailyResult(day2, "2026-06-20", { score: 7, total: 10 });
    expect(replay.daily.streak).toBe(1);
    expect(replay.daily.history["2026-06-17"].score).toBe(8);
    expect(day2.daily.streak).toBe(2);
    expect(day2.daily.best).toBe(2);
    expect(gap.daily.streak).toBe(1);
  });
});
