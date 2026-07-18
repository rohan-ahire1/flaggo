import { describe, expect, it } from "vitest";
import type { Country } from "../../types/country";
import type { Lesson } from "../../types/lesson";
import { generateCurrencyQuestions, generateLanguageQuestions, generateLessonQuestions, generateMapQuestions, generateNeighborQuestions, generateReviewQuestions, getCapitalDistractors, getCurrencyClue } from "../quiz";
import { hashStringToSeed, mulberry32 } from "../seededRandom";

function country(code: string, name: string, continent: Country["continent"], capital?: string, ccn3?: string, extra: Partial<Country> = {}): Country {
  return {
    code,
    ccn3,
    name,
    continent,
    difficulty: "easy",
    isUNMember: true,
    isIndependent: true,
    flagUrl: `https://example.com/${code}.svg`,
    capital,
    ...extra
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

describe("attribute quiz generation", () => {
  const countries = [
    country("FR", "France", "Europe", "Paris", "250", { currencyName: "Euro", languages: ["French"], borders: ["ES", "DE", "IT"] }),
    country("ES", "Spain", "Europe", "Madrid", "724", { currencyName: "Euro", languages: ["Spanish"], borders: ["FR"] }),
    country("DE", "Germany", "Europe", "Berlin", "276", { currencyName: "Euro", languages: ["German"], borders: ["FR"] }),
    country("IT", "Italy", "Europe", "Rome", "380", { currencyName: "Euro", languages: ["Italian"], borders: ["FR"] }),
    country("JP", "Japan", "Asia", "Tokyo", "392", { currencyName: "Yen", languages: ["Japanese"], borders: [] }),
    country("BR", "Brazil", "Americas", "Brasilia", "076", { currencyName: "Real", languages: ["Portuguese"], borders: [] }),
    country("IN", "India", "Asia", "New Delhi", "356", { currencyName: "Indian rupee", languages: ["Hindi", "English"], borders: [] }),
    country("EG", "Egypt", "Africa", "Cairo", "818", { currencyName: "Egyptian pound", languages: ["Arabic"], borders: [] })
  ];

  it("generates deterministic currency questions without same-currency country distractors", () => {
    const rngA = mulberry32(hashStringToSeed("currency"));
    const rngB = mulberry32(hashStringToSeed("currency"));
    const questions = generateCurrencyQuestions("currency", countries, countries, rngA);
    expect(questions).toEqual(generateCurrencyQuestions("currency", countries, countries, rngB));

    questions.forEach((question) => {
      if (question.type === "guess-currency") {
        expect(question.optionCurrencies).toContain(question.correctCurrency);
        expect(new Set(question.optionCurrencies).size).toBe(question.optionCurrencies.length);
      }
      if (question.type === "currency-to-country") {
        expect(question.options.map((option) => option.code)).toContain(question.correctCountry.code);
        question.options.filter((option) => option.code !== question.correctCountry.code).forEach((option) => {
          expect(option.currencyName).not.toBe(question.correctCurrency);
        });
      }
    });
  });

  it("uses non-leaking currency clues for country-picking prompts", () => {
    expect(getCurrencyClue(country("BA", "Bosnia and Herzegovina", "Europe", "Sarajevo", "070", {
      currencyCode: "BAM",
      currencyName: "Bosnia and Herzegovina convertible mark"
    }))).toBe("Convertible mark (BAM)");

    expect(getCurrencyClue(country("IN", "India", "Asia", "New Delhi", "356", {
      currencyCode: "INR",
      currencyName: "Indian rupee",
      demonym: "Indian"
    }))).toBe("Rupee (INR)");
  });

  it("generates language questions with distractors outside the country's actual languages", () => {
    const questions = generateLanguageQuestions("language", countries, countries, mulberry32(hashStringToSeed("language")));
    questions.forEach((question) => {
      if (question.type === "guess-language") {
        const actual = new Set(question.correctCountry.languages ?? []);
        expect(question.optionLanguages).toContain(question.correctLanguage);
        question.optionLanguages.filter((language) => language !== question.correctLanguage).forEach((language) => {
          expect(actual.has(language)).toBe(false);
        });
      }
      if (question.type === "language-to-country") {
        expect(question.options.map((option) => option.code)).toContain(question.correctCountry.code);
        question.options.filter((option) => option.code !== question.correctCountry.code).forEach((option) => {
          expect(option.languages ?? []).not.toContain(question.correctLanguage);
        });
      }
    });
  });

  it("generates neighbor questions with no accidentally-correct distractors", () => {
    const questions = generateNeighborQuestions("neighbor", countries, countries, mulberry32(hashStringToSeed("neighbor")));
    expect(questions.length).toBeGreaterThan(0);
    questions.forEach((question) => {
      if (question.type !== "pick-neighbor" && question.type !== "not-neighbor") return;
      const borders = new Set(question.correctCountry.borders ?? []);
      expect(question.options.map((option) => option.code)).toContain(question.correctNeighbor.code);
      if (question.type === "pick-neighbor") {
        expect(borders.has(question.correctNeighbor.code)).toBe(true);
        question.options.filter((option) => option.code !== question.correctNeighbor.code).forEach((option) => expect(borders.has(option.code)).toBe(false));
      }
      if (question.type === "not-neighbor") {
        expect(borders.has(question.correctNeighbor.code)).toBe(false);
        question.options.filter((option) => option.code !== question.correctNeighbor.code).forEach((option) => expect(borders.has(option.code)).toBe(true));
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

describe("review quiz generation", () => {
  const countries = [
    country("ID", "Indonesia", "Asia"),
    country("MC", "Monaco", "Europe"),
    country("PL", "Poland", "Europe"),
    country("JP", "Japan", "Asia")
  ];

  it("uses the full catalog for answer options in a one-country review", () => {
    const questions = generateReviewQuestions([countries[0]], "flag", mulberry32(hashStringToSeed("single-review")), countries);

    expect(questions).toHaveLength(1);
    const question = questions[0];
    expect(question.type).toBe("guess-country");
    if (question.type !== "guess-country") throw new Error("Expected a country-choice review question");
    expect(question.options).toHaveLength(4);
    expect(new Set(question.options.map((option) => option.code)).size).toBe(4);
    expect(question.options.map((option) => option.code)).toContain("ID");
  });
});
