import { describe, expect, it } from "vitest";
import type { Country } from "../../types/country";
import { generateLessons, lessonsForTopic } from "../lessonGenerator";

const base = {
  continent: "Europe",
  difficulty: "easy",
  isUNMember: true,
  isIndependent: true,
  flagUrl: "https://example.com/flag.svg"
} satisfies Partial<Country>;

function country(code: string, name: string, capital?: string): Country {
  return { ...base, code, name, capital } as Country;
}

describe("lessonGenerator", () => {
  it("preserves flag lesson ids and prefixes capital lessons", () => {
    const lessons = generateLessons([
      country("FR", "France", "Paris"),
      country("DE", "Germany", "Berlin"),
      country("IT", "Italy", "Rome"),
      country("ES", "Spain", "Madrid"),
      country("US", "United States", "Washington, D.C."),
      country("JP", "Japan", "Tokyo"),
      country("BR", "Brazil", "Brasilia"),
      country("AQ", "Antarctica")
    ]);
    const flagLessons = lessonsForTopic(lessons, "flag");
    const capitalLessons = lessonsForTopic(lessons, "capital");

    expect(flagLessons.every((lesson) => !lesson.id.startsWith("cap-"))).toBe(true);
    expect(capitalLessons.length).toBeGreaterThan(0);
    expect(capitalLessons.every((lesson) => lesson.id.startsWith("cap-"))).toBe(true);
    expect(new Set(flagLessons.map((lesson) => lesson.id)).size).toBe(flagLessons.length);
    expect(flagLessons.some((lesson) => capitalLessons.some((capitalLesson) => capitalLesson.id === lesson.id))).toBe(false);
    expect(capitalLessons.flatMap((lesson) => lesson.countryCodes)).not.toContain("AQ");
  });
});
