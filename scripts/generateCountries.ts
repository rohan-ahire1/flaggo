import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type RawCountry = {
  name?: { common?: string; official?: string };
  cca2?: string;
  ccn3?: string;
  region?: string;
  subregion?: string;
  unMember?: boolean;
  independent?: boolean;
  capital?: string[];
  currencies?: Record<string, { name?: string; symbol?: string }>;
  languages?: Record<string, string>;
  population?: number;
};

const easyCodes = [
  "in", "us", "gb", "jp", "cn", "br", "fr", "de", "it", "ca",
  "au", "ru", "kr", "es", "mx", "za", "sa", "ae", "tr", "id",
  "th", "sg", "pk", "bd", "lk", "np"
];
const validContinents = ["Africa", "Americas", "Asia", "Europe", "Oceania", "Antarctic"];

function getDifficulty(code: string, independent: boolean, unMember: boolean) {
  if (easyCodes.includes(code.toLowerCase())) return "easy";
  if (!independent || !unMember) return "hard";
  return "medium";
}

function normalizeContinent(region: string | undefined) {
  if (region === "Polar") return "Antarctic";
  return region;
}

const rawPath = resolve("countries.raw.json");
const raw = JSON.parse(readFileSync(rawPath, "utf8")) as RawCountry[];

const countries = raw
  .filter((country) => country.cca2 && country.name?.common && country.region)
  .map((country) => {
    const code = country.cca2!.toUpperCase();
    const isIndependent = Boolean(country.independent);
    const isUNMember = Boolean(country.unMember);
    const currency = Object.entries(country.currencies ?? {})[0];
    return {
      code,
      ccn3: country.ccn3 || undefined,
      name: country.name!.common!,
      officialName: country.name!.official,
      continent: normalizeContinent(country.region),
      subregion: country.subregion,
      difficulty: getDifficulty(code, isIndependent, isUNMember),
      isUNMember,
      isIndependent,
      flagUrl: `https://flagcdn.com/${code.toLowerCase()}.svg`,
      capital: country.capital?.[0],
      currencyCode: currency?.[0],
      currencyName: currency?.[1].name,
      currencySymbol: currency?.[1].symbol,
      languages: Object.values(country.languages ?? {}),
      population: country.population
    };
  })
  .filter((country) => country.continent && validContinents.includes(country.continent))
  .sort((a, b) => a.name.localeCompare(b.name));

const output = `import type { Country } from "../types/country";

export const countries: Country[] = ${JSON.stringify(countries, null, 2)};
`;

writeFileSync(resolve("src/data/countries.ts"), output);
console.log(`Generated ${countries.length} countries and territories.`);
