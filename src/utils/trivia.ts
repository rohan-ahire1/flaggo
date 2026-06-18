import type { Country } from "../types/country";
import { seededShuffle } from "./seededRandom";

export type TriviaMode = "higher-lower" | "odd-one-out" | "true-false";

export type HigherLowerMetric = "population" | "area";
export type OddOneOutAttribute = "continent" | "landlocked" | "currency" | "language";

export type TriviaRound =
  | { id: string; mode: "higher-lower"; metric: HigherLowerMetric; countries: [Country, Country]; correctCountry: Country }
  | { id: string; mode: "odd-one-out"; attribute: OddOneOutAttribute; countries: Country[]; correctCountry: Country }
  | { id: string; mode: "true-false"; statement: string; answer: boolean; countries: Country[] };

function pick<T>(items: T[], rng: () => number): T | undefined {
  return items[Math.floor(rng() * items.length)];
}

function roundId(mode: TriviaMode, countries: Country[], detail: string) {
  return `trivia-${mode}-${detail}-${countries.map((country) => country.code).join("-")}`;
}

function buildHigherLower(countries: Country[], rng: () => number): TriviaRound {
  const metrics: HigherLowerMetric[] = ["population", "area"];
  const availableMetrics = metrics.filter((metric) => countries.filter((country) => typeof country[metric] === "number" && country[metric]! > 0).length >= 2);
  const metric = pick(availableMetrics, rng) ?? "area";
  const pool = seededShuffle(countries.filter((country) => typeof country[metric] === "number" && country[metric]! > 0), rng);
  if (pool.length < 2) throw new Error("Not enough country data to build higher-lower trivia.");
  const first = pool[0];
  const second = pool.find((country) => country.code !== first.code && country[metric] !== first[metric]) ?? pool[1];
  const pair: [Country, Country] = rng() > 0.5 ? [first, second] : [second, first];
  const correctCountry = pair[0][metric]! > pair[1][metric]! ? pair[0] : pair[1];
  return { id: roundId("higher-lower", pair, metric), mode: "higher-lower", metric, countries: pair, correctCountry };
}

function languageKey(country: Country) {
  return (country.languages ?? []).slice().sort().join("|");
}

function attributeValue(country: Country, attribute: OddOneOutAttribute) {
  if (attribute === "continent") return country.continent;
  if (attribute === "landlocked") return String(Boolean(country.landlocked));
  if (attribute === "currency") return country.currencyName?.trim();
  return languageKey(country);
}

function buildOddOneOut(countries: Country[], rng: () => number): TriviaRound {
  const attributes: OddOneOutAttribute[] = ["continent", "landlocked", "currency", "language"];
  const shuffledAttributes = seededShuffle(attributes, rng);
  for (const attribute of shuffledAttributes) {
    const groups = new Map<string, Country[]>();
    countries.forEach((country) => {
      const value = attributeValue(country, attribute);
      if (!value) return;
      groups.set(value, [...(groups.get(value) ?? []), country]);
    });
    const baseGroups = seededShuffle(Array.from(groups.entries()).filter(([, group]) => group.length >= 3), rng);
    for (const [value, group] of baseGroups) {
      const outlierPool = countries.filter((country) => {
        const outlierValue = attributeValue(country, attribute);
        return outlierValue && outlierValue !== value;
      });
      const outlier = pick(seededShuffle(outlierPool, rng), rng);
      if (!outlier) continue;
      const base = seededShuffle(group, rng).slice(0, 3);
      const options = seededShuffle([...base, outlier], rng);
      return { id: roundId("odd-one-out", options, attribute), mode: "odd-one-out", attribute, countries: options, correctCountry: outlier };
    }
  }
  throw new Error("Not enough country data to build odd-one-out trivia.");
}

function buildTrueFalse(countries: Country[], rng: () => number): TriviaRound {
  const country = pick(seededShuffle(countries, rng), rng);
  if (!country) throw new Error("Not enough country data to build true-false trivia.");
  const kind = Math.floor(rng() * 3);
  if (kind === 0) {
    return {
      id: roundId("true-false", [country], `landlocked-${Boolean(country.landlocked)}`),
      mode: "true-false",
      statement: `${country.name} is landlocked.`,
      answer: Boolean(country.landlocked),
      countries: [country]
    };
  }
  if (kind === 1) {
    const byCode = new Map(countries.map((item) => [item.code, item]));
    const border = pick(seededShuffle((country.borders ?? []).map((code) => byCode.get(code)).filter((item): item is Country => Boolean(item)), rng), rng);
    const nonBorder = pick(seededShuffle(countries.filter((item) => item.code !== country.code && !(country.borders ?? []).includes(item.code)), rng), rng);
    const shown = rng() > 0.5 ? border : nonBorder;
    if (shown) {
      const answer = (country.borders ?? []).includes(shown.code);
      return {
        id: roundId("true-false", [country, shown], `borders-${answer}`),
        mode: "true-false",
        statement: `${country.name} borders ${shown.name}.`,
        answer,
        countries: [country, shown]
      };
    }
  }
  const euroCountries = countries.filter((item) => item.currencyName === "Euro");
  const target = country.currencyName ? country : pick(seededShuffle(euroCountries, rng), rng) ?? country;
  const answer = target.currencyName === "Euro";
  return {
    id: roundId("true-false", [target], `euro-${answer}`),
    mode: "true-false",
    statement: `${target.name} uses the euro.`,
    answer,
    countries: [target]
  };
}

export function buildTrivia(mode: TriviaMode, countries: Country[], rng: () => number): TriviaRound {
  if (mode === "higher-lower") return buildHigherLower(countries, rng);
  if (mode === "odd-one-out") return buildOddOneOut(countries, rng);
  return buildTrueFalse(countries, rng);
}
