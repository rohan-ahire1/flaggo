import type { Country } from "../types/country";

const popularCodes = [
  "US", "CN", "IN", "JP", "GB", "FR", "DE", "BR", "CA", "AU",
  "IT", "ES", "MX", "RU", "KR", "ID", "TR", "SA", "AE", "ZA",
  "AR", "EG", "TH", "SG", "NL", "SE", "NO", "CH", "IE", "NZ",
  "PT", "GR", "PL", "UA", "IL", "VN", "MY", "PH", "PK", "BD",
  "LK", "NP", "IR", "IQ", "QA", "KW", "MA", "NG", "KE", "ET",
  "CO", "CL", "PE", "VE", "EC", "CU", "JM", "CR", "PA", "DO",
  "BE", "AT", "DK", "FI", "CZ", "HU", "RO", "BG", "HR", "RS",
  "SK", "SI", "IS", "LU", "CN", "HK", "TW", "MO", "KH", "LA",
  "MM", "MN", "KZ", "UZ", "AF", "OM", "JO", "LB", "SY", "YE",
  "TN", "DZ", "GH", "TZ", "UG", "ZW", "ZM", "AO", "SN", "CI",
  "UY", "PY", "BO", "GT", "HN", "SV", "NI", "TT", "BS", "BB",
  "AL", "BA", "MK", "ME", "MD", "BY", "LT", "LV", "EE", "GE",
  "AM", "AZ", "CY", "MT", "LI", "MC", "SM", "VA", "AD", "FO",
  "GL", "PR", "GU", "VI", "AS", "PF", "NC", "FJ", "PG", "WS"
];

function popularityScore(country: Country) {
  const rank = popularCodes.indexOf(country.code);
  if (rank !== -1) return rank;
  if (country.isIndependent && country.isUNMember) return 1000 + country.name.localeCompare("M");
  if (country.isIndependent) return 1600;
  return 2200;
}

export function getPopularityRankedCountries(countries: Country[]) {
  return [...countries].sort((a, b) => {
    const score = popularityScore(a) - popularityScore(b);
    if (score !== 0) return score;
    if (a.difficulty !== b.difficulty) {
      const rank = { easy: 0, medium: 1, hard: 2 };
      return rank[a.difficulty] - rank[b.difficulty];
    }
    return a.name.localeCompare(b.name);
  });
}

export type PopularityGroup = {
  id: string;
  title: string;
  range: string;
  countries: Country[];
};

export function getPopularityGroups(countries: Country[], size = 50): PopularityGroup[] {
  const ranked = getPopularityRankedCountries(countries);
  const groups: PopularityGroup[] = [];
  for (let index = 0; index < ranked.length; index += size) {
    const start = index + 1;
    const end = Math.min(index + size, ranked.length);
    groups.push({
      id: `popularity-${start}-${end}`,
      title: index === 0 ? "Top 50" : `${start}-${end}`,
      range: `${start}-${end}`,
      countries: ranked.slice(index, end)
    });
  }
  return groups;
}
