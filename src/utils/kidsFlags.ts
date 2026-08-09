import type { Country } from "@flaggo/core/types/country";
import { getPopularityRankedCountries } from "@flaggo/core/utils/popularity";

// Kids Mode only ever uses the most recognisable flags so a 3-8 year old meets
// countries they might actually hear about (USA, Brazil, Japan…) rather than
// obscure ones. We reuse the app's popularity ranking as the source of truth.
export const KIDS_POOL_SIZE = 30;

export function kidsPool(countries: Country[]): Country[] {
  return getPopularityRankedCountries(countries).slice(0, KIDS_POOL_SIZE);
}

// Deterministic-enough shuffle for gameplay variety (Math.random is fine here —
// kids rounds don't need to be reproducible like the seeded daily challenge).
export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Pick `count` random distinct countries from a list. */
export function pick<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, count);
}
