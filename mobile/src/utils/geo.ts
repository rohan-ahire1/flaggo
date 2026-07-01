import type { Country } from "../types/country";

export type CountryTopo = {
  objects?: {
    countries?: {
      geometries?: Array<{ id?: string | number | null }>;
    };
  };
};

export function normalizeCcn3(id: string | number | null | undefined) {
  if (id === null || id === undefined) return "";
  return String(id).padStart(3, "0");
}

export function buildCcn3Index(countries: Country[]) {
  return new Map(countries.filter((country) => country.ccn3).map((country) => [country.ccn3!, country]));
}

export function mapCountryIds(topo: CountryTopo) {
  return new Set((topo.objects?.countries?.geometries ?? []).map((geometry) => normalizeCcn3(geometry.id)).filter(Boolean));
}

export function mapPresentCountries(countries: Country[], topo: CountryTopo) {
  const ids = mapCountryIds(topo);
  return countries.filter((country) => Boolean(country.ccn3 && ids.has(country.ccn3)));
}

export function geoIdToCountry(id: string | number | null | undefined, index: Map<string, Country>) {
  return index.get(normalizeCcn3(id));
}
