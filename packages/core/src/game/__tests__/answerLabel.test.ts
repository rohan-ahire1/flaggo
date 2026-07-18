import { describe, expect, it } from "vitest";
import { countries } from "../../data/countries";
import { answerDetail, answerLabel } from "../answerLabel";

describe("answer labels", () => {
  const china = countries.find((country) => country.code === "CN")!;
  const mauritius = countries.find((country) => country.code === "MU")!;

  it("answers flag true/false questions with Yes or No", () => {
    const question = {
      id: "flag-true-false",
      type: "true-false" as const,
      correctCountry: china,
      shownCountry: mauritius,
      answer: false
    };

    expect(answerLabel(question)).toBe("No");
    expect(answerDetail(question)).toBe("This is China’s flag, not Mauritius’s.");
  });

  it("answers capital true/false questions with Yes or No", () => {
    const question = {
      id: "capital-true-false",
      type: "capital-true-false" as const,
      correctCountry: china,
      shownCapital: "Tokyo",
      answer: false
    };

    expect(answerLabel(question)).toBe("No");
    expect(answerDetail(question)).toBe(`The capital of China is ${china.capital}, not Tokyo.`);
  });
});
