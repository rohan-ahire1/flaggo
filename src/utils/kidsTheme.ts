import type { RegionKey } from "./kidsContinents";

// Per-region accent colours from the Flaggo Kids design, harmonised with the
// illustrated continent art. Used for the highlight colour on names, progress
// bars and region borders. Backgrounds are keyed by screen type, not region.
export const REGION_ACCENT: Record<RegionKey, { hex: string; dark: string }> = {
  Americas: { hex: "#57C04A", dark: "#3fa235" },
  Europe: { hex: "#FF6B6B", dark: "#e0524f" },
  Africa: { hex: "#F4B400", dark: "#c99600" },
  Asia: { hex: "#F978A6", dark: "#e0568a" },
  Oceania: { hex: "#FF9A3D", dark: "#e07d22" }
};

export function regionAccent(key: RegionKey) {
  return REGION_ACCENT[key];
}

// Illustrated continent art. The version suffix busts stale browser / service
// worker caches whenever the cut-out art is reprocessed.
const ART_VERSION = 3;
export function regionArt(key: RegionKey): string {
  return `/kids/regions/${key.toLowerCase()}.png?v=${ART_VERSION}`;
}
