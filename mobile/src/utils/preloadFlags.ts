import type { Country } from "@flaggo/core/types/country";

// On web this warmed the browser image cache. On mobile, expo-image handles
// disk/memory caching of flag URLs automatically, so this is a no-op.
export function preloadFlags(_countries: Country[]) {
  // no-op on mobile
}
