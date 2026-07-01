import type { Country } from "../types/country";

export function getDifficulty(country: Country): "easy" | "medium" | "hard" {
  const easyCodes = [
    "in", "us", "gb", "jp", "cn", "br", "fr", "de", "it", "ca",
    "au", "ru", "kr", "es", "mx", "za", "sa", "ae", "tr", "id",
    "th", "sg", "pk", "bd", "lk", "np"
  ];

  if (easyCodes.includes(country.code.toLowerCase())) return "easy";
  if (!country.isIndependent || !country.isUNMember) return "hard";
  return "medium";
}
