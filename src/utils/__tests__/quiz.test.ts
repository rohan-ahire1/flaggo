import { describe, expect, it } from "vitest";
import type { Country } from "../../types/country";
import type { Lesson } from "../../types/lesson";
import { generateLessonQuestions, generateMapQuestions, getCapitalDistractors } from "../quiz";

function country(code: string, name: string, continent: Country["continent"], capital?: string, ccn3?: string): Country {
  return {
    code,
    ccn3,
    name,
    continent,
    difficulty: "easy",
    isUNMember: true,
    isIndependent: true,
    flagUrl: `https://example.com/${code}.svg`,
    capital
  };
}

describe("capital quiz generation", () => {
  const countries = [
    country("FR", "France", "Europe", "Paris"),
    country("DE", "Germany", "Europe", "Berlin"),
    country("IT", "Italy", "Europe", "Rome"),
    country("ES", "Spain", "Europe", "Madrid"),
    country("JP", "Japan", "Asia", "Tokyo"),
    country("AQ", "Antarctica", "Antarctic")
  ];

  it("dedupes capital distractors and excludes the correct capital", () => {
    const distractors = getCapitalDistractors(countries[0], countries, 3);
    expect(distractors).not.toContain("Paris");
    expect(new Set(distractors).size).toBe(distractors.length);
    expect(distractors).toHaveLength(3);
  });

  it("excludes capital-less countries and generates four capital answer options", () => {
    const lesson: Lesson = {
      id: "cap-europe-1",
      topic: "capital",
      title: "Europe 1",
      region: "Europe",
      countryCodes: countries.map((item) => item.code),
      difficulty: "easy",
      isTerritoryLesson: false
    };
    const questions = generateLessonQuestions(lesson, countries);

    expect(questions.some((question) => question.correctCountry.code === "AQ")).toBe(false);
    questions.forEach((question) => {
      if ("optionCapitals" in question) {
        expect(question.optionCapitals).toHaveLength(4);
        expect(new Set(question.optionCapitals).size).toBe(4);
        expect(question.optionCapitals).toContain(question.correctCapital);
      }
    });
  });
});

describe("map quiz generation", () => {
  const mapPool = [
    country("FR", "France", "Europe", "Paris", "250"),
    country("DE", "Germany", "Europe", "Berlin", "276"),
    country("IT", "Italy", "Europe", "Rome", "380"),
    country("ES", "Spain", "Europe", "Madrid", "724"),
    country("JP", "Japan", "Asia", "Tokyo", "392"),
    country("ZZ", "Absent", "Europe")
  ];

  it("creates locate prompts from map-present countries only", () => {
    const questions = generateMapQuestions(mapPool, "locate");

    expect(questions.length).toBe(5);
    questions.forEach((question) => {
      expect(question.type).toBe("locate-country");
      expect(question.targetCode).not.toBe("ZZ");
    });
  });

  it("creates identify prompts with four unique options including the target", () => {
    const questions = generateMapQuestions(mapPool, "identify");

    questions.forEach((question) => {
      expect(question.type).toBe("identify-country");
      if (question.type !== "identify-country") return;
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options.map((option) => option.code)).size).toBe(4);
      expect(question.options.map((option) => option.code)).toContain(question.targetCode);
    });
  });
});
