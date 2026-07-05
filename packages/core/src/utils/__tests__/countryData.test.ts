import { describe, expect, it } from "vitest";
import { countries } from "../../data/countries";

describe("generated country data", () => {
  it("includes enriched geography fields and valid app-code borders", () => {
    const codes = new Set(countries.map((country) => country.code));
    expect(countries.length).toBe(250);
    countries.forEach((country) => {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
      expect(country.borders ?? []).not.toContain(country.code);
      (country.borders ?? []).forEach((border) => {
        expect(border).toMatch(/^[A-Z]{2}$/);
        expect(codes.has(border)).toBe(true);
      });
    });
    expect(countries.some((country) => typeof country.area === "number" && country.area > 0)).toBe(true);
    expect(countries.some((country) => typeof country.landlocked === "boolean")).toBe(true);
    expect(countries.some((country) => country.demonym)).toBe(true);
  });

  it("spot-checks known border and landlocked facts", () => {
    const france = countries.find((country) => country.code === "FR");
    const bolivia = countries.find((country) => country.code === "BO");
    const japan = countries.find((country) => country.code === "JP");

    expect(france?.borders).toContain("ES");
    expect(bolivia?.landlocked).toBe(true);
    expect(japan?.borders).toEqual([]);
  });
});
