import type { Country } from "@flaggo/core/types/country";
import type { KidsProgress } from "./kidsProgress";

// Kids Mode is organised as a short journey through the continents. Each region
// is a small, curated set of the most recognisable flags (not every country —
// that would overwhelm a 3-8 year old). Regions unlock in order as the child
// collects the flags in the current one.

export type RegionKey = "Americas" | "Europe" | "Africa" | "Asia" | "Oceania";

export type Region = {
  key: RegionKey;
  label: string;
  /** Emoji fallback shown until the illustrated art file is added. */
  emoji: string;
  /** Tailwind gradient classes for the region's card / screen theme. */
  gradient: string;
  accent: string;
  /** Curated, most-recognisable country codes for this region (in teaching order). */
  codes: string[];
};

// Order here is the unlock order (gentlest / most familiar first).
export const REGIONS: Region[] = [
  {
    key: "Americas",
    label: "The Americas",
    emoji: "🗽",
    gradient: "from-rose-100 to-orange-100",
    accent: "text-rose-600",
    codes: ["US", "CA", "BR", "MX", "AR", "CL", "CO", "CU"]
  },
  {
    key: "Europe",
    label: "Europe",
    emoji: "🏰",
    gradient: "from-sky-100 to-indigo-100",
    accent: "text-indigo-600",
    codes: ["GB", "FR", "DE", "IT", "ES", "NL", "SE", "CH"]
  },
  {
    key: "Africa",
    label: "Africa",
    emoji: "🦁",
    gradient: "from-amber-100 to-yellow-100",
    accent: "text-amber-700",
    codes: ["EG", "NG", "ZA", "KE", "GH", "MA", "ET", "TZ"]
  },
  {
    key: "Asia",
    label: "Asia",
    emoji: "🐼",
    gradient: "from-emerald-100 to-teal-100",
    accent: "text-emerald-700",
    codes: ["JP", "CN", "IN", "KR", "TH", "SA", "VN", "ID"]
  },
  {
    key: "Oceania",
    label: "Oceania",
    emoji: "🦘",
    gradient: "from-cyan-100 to-blue-100",
    accent: "text-cyan-700",
    codes: ["AU", "NZ", "FJ", "PG", "WS"]
  }
];

export function getRegion(key: string | undefined): Region | undefined {
  return REGIONS.find((r) => r.key === key);
}

/** The curated Country objects for a region, in teaching order (skips any missing codes). */
export function regionCountries(region: Region, countries: Country[]): Country[] {
  const byCode = new Map(countries.map((c) => [c.code, c]));
  return region.codes.map((code) => byCode.get(code)).filter((c): c is Country => Boolean(c));
}

export function regionCollectedCount(region: Region, kids: KidsProgress): number {
  const set = new Set(kids.collected);
  return region.codes.filter((code) => set.has(code)).length;
}

export function isRegionComplete(region: Region, kids: KidsProgress): boolean {
  return regionCollectedCount(region, kids) >= region.codes.length;
}

/** A region is unlocked if it's the first, or the previous region is complete. */
export function isRegionUnlocked(region: Region, kids: KidsProgress): boolean {
  const index = REGIONS.findIndex((r) => r.key === region.key);
  if (index <= 0) return true;
  return isRegionComplete(REGIONS[index - 1], kids);
}
