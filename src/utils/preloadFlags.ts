import type { Country } from "@flaggo/core/types/country";

const loaded = new Set<string>();

export function preloadFlags(countries: Country[]) {
  countries.forEach((country) => {
    if (loaded.has(country.flagUrl)) return;
    loaded.add(country.flagUrl);
    const image = new Image();
    image.decoding = "async";
    image.src = country.flagUrl;
  });
}
