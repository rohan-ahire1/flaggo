import { describe, expect, it } from "vitest";
import world110m from "../../data/world-110m.json";
import { countries } from "../../data/countries";
import type { Country } from "../../types/country";
import { buildCcn3Index, geoIdToCountry, mapPresentCountries } from "../geo";

describe("map geography helpers", () => {
  it("builds a ccn3 index and resolves known topojson ids", () => {
    const index = buildCcn3Index(countries);

    expect(index.get("250")?.name).toBe("France");
    expect(geoIdToCountry("250", index)?.code).toBe("FR");
  });

  it("filters countries to topojson-present geometry", () => {
    const present = mapPresentCountries(countries, world110m);
    const presentCodes = new Set(present.map((country) => country.code));
    const absentCountry: Country = {
      code: "ZZ",
      ccn3: "999",
      name: "Absent",
      continent: "Europe",
      difficulty: "hard",
      isUNMember: false,
      isIndependent: false,
      flagUrl: "https://example.com/zz.svg"
    };

    expect(presentCodes.has("FR")).toBe(true);
    expect(mapPresentCountries([...countries, absentCountry], world110m)).not.toContain(absentCountry);
  });
});
