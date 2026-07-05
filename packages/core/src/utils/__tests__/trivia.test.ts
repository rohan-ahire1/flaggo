import { describe, expect, it } from "vitest";
import { countries } from "../../data/countries";
import { hashStringToSeed, mulberry32 } from "../seededRandom";
import { buildTrivia, type OddOneOutAttribute } from "../trivia";

function signature(seed: string) {
  const rng = mulberry32(hashStringToSeed(seed));
  return [
    buildTrivia("higher-lower", countries, rng),
    buildTrivia("odd-one-out", countries, rng),
    buildTrivia("true-false", countries, rng)
  ];
}

function value(country: (typeof countries)[number], attribute: OddOneOutAttribute) {
  if (attribute === "continent") return country.continent;
  if (attribute === "landlocked") return String(Boolean(country.landlocked));
  if (attribute === "currency") return country.currencyName;
  return (country.languages ?? []).slice().sort().join("|");
}

describe("trivia generation", () => {
  it("is deterministic for a fixed seed", () => {
    expect(signature("trivia-seed")).toEqual(signature("trivia-seed"));
    expect(signature("trivia-seed")).not.toEqual(signature("different-seed"));
  });

  it("higher-lower marks the truly larger population or area", () => {
    const rng = mulberry32(hashStringToSeed("higher-lower"));
    Array.from({ length: 20 }, () => buildTrivia("higher-lower", countries, rng)).forEach((round) => {
      if (round.mode !== "higher-lower") throw new Error("Expected higher-lower round");
      const [a, b] = round.countries;
      const expected = a[round.metric]! > b[round.metric]! ? a : b;
      expect(round.correctCountry.code).toBe(expected.code);
    });
  });

  it("odd-one-out has exactly one outlier for its selected attribute", () => {
    const rng = mulberry32(hashStringToSeed("odd-one-out"));
    Array.from({ length: 20 }, () => buildTrivia("odd-one-out", countries, rng)).forEach((round) => {
      if (round.mode !== "odd-one-out") throw new Error("Expected odd-one-out round");
      const correctValue = value(round.correctCountry, round.attribute);
      const otherValues = round.countries.filter((country) => country.code !== round.correctCountry.code).map((country) => value(country, round.attribute));
      expect(new Set(otherValues).size).toBe(1);
      expect(otherValues[0]).not.toBe(correctValue);
    });
  });

  it("true-false statements are verifiable against country data", () => {
    const rng = mulberry32(hashStringToSeed("true-false"));
    Array.from({ length: 30 }, () => buildTrivia("true-false", countries, rng)).forEach((round) => {
      if (round.mode !== "true-false") throw new Error("Expected true-false round");
      const [country, shown] = round.countries;
      if (round.statement.endsWith("is landlocked.")) expect(round.answer).toBe(Boolean(country.landlocked));
      if (shown && round.statement.includes(" borders ")) expect(round.answer).toBe((country.borders ?? []).includes(shown.code));
      if (round.statement.endsWith("uses the euro.")) expect(round.answer).toBe(country.currencyName === "Euro");
    });
  });
});
