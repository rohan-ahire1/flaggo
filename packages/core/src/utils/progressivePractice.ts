import type { Country } from "../types/country";
import type { AppProgress, ReviewState } from "../types/progress";
import { reviewKey } from "../types/topic";
import { getPopularityRankedCountries } from "./popularity";
import { seededShuffle } from "./seededRandom";

export const PROGRESSIVE_TIER_SIZE = 50;
export const PROGRESSIVE_STAGES = ["tier-1", "tier-2", "tier-3", "tier-4"] as const;
export type ProgressiveStage = (typeof PROGRESSIVE_STAGES)[number];
export const PROGRESSIVE_STAGE_LABELS: Record<ProgressiveStage, string> = {
  "tier-1": "Flag Scout",
  "tier-2": "World Explorer",
  "tier-3": "Global Navigator",
  "tier-4": "Atlas Master"
};

export type ProgressiveTierResult = {
  stage: ProgressiveStage;
  total: number;
  seen: number;
  mastered: number;
  needsRepetition: number;
};

function flagState(progress: AppProgress, country: Country): ReviewState | undefined {
  return progress.review[reviewKey(country.code, "flag")];
}

function isMastered(state: ReviewState | undefined) {
  return Boolean(state && state.box >= 5 && state.correctCount >= 5 && state.correctCount >= state.wrongCount * 2);
}

export function progressiveTierGroups(countries: Country[]): Record<ProgressiveStage, Country[]> {
  const ranked = getPopularityRankedCountries(countries).slice(0, PROGRESSIVE_TIER_SIZE * PROGRESSIVE_STAGES.length);
  return Object.fromEntries(
    PROGRESSIVE_STAGES.map((stage, index) => [
      stage,
      ranked.slice(index * PROGRESSIVE_TIER_SIZE, (index + 1) * PROGRESSIVE_TIER_SIZE)
    ])
  ) as Record<ProgressiveStage, Country[]>;
}

export function progressiveStage(progress: AppProgress, countries: Country[]): ProgressiveStage {
  const groups = progressiveTierGroups(countries);
  return PROGRESSIVE_STAGES.find((stage) => groups[stage].some((country) => !flagState(progress, country))) ?? "tier-4";
}

export function progressivePracticeBatch(
  progress: AppProgress,
  countries: Country[],
  size = 8,
  rng: () => number = Math.random,
  now = Date.now()
): { stage: ProgressiveStage; countries: Country[] } {
  const stage = progressiveStage(progress, countries);
  const groups = progressiveTierGroups(countries);
  const available = PROGRESSIVE_STAGES
    .slice(0, PROGRESSIVE_STAGES.indexOf(stage) + 1)
    .flatMap((unlockedStage) => groups[unlockedStage]);
  const fresh = seededShuffle(
    groups[stage].filter((country) => !flagState(progress, country)),
    rng
  );
  const repeat = available
    .filter((country) => {
      const state = flagState(progress, country);
      return Boolean(state && state.wrongCount > 0 && !isMastered(state));
    })
    .sort((a, b) => {
      const aState = flagState(progress, a)!;
      const bState = flagState(progress, b)!;
      return bState.wrongCount - aState.wrongCount || aState.box - bState.box;
    });
  const repeatCodes = new Set(repeat.map((country) => country.code));
  const due = seededShuffle(
    available.filter((country) => {
      const state = flagState(progress, country);
      return Boolean(state && !repeatCodes.has(country.code) && new Date(state.nextReviewAt).getTime() <= now);
    }),
    rng
  );

  const selected: Country[] = [];
  const selectedCodes = new Set<string>();
  const add = (pool: Country[], limit: number) => {
    for (const country of pool) {
      if (selected.length >= size || limit <= 0) break;
      if (selectedCodes.has(country.code)) continue;
      selected.push(country);
      selectedCodes.add(country.code);
      limit -= 1;
    }
  };

  // Keep room for new material while still making repetition the first priority.
  const reinforcementSlots = fresh.length ? Math.floor(size / 2) : size;
  add(repeat, reinforcementSlots);
  add(due, reinforcementSlots - selected.length);
  add(fresh, size - selected.length);
  add(seededShuffle(available, rng), size - selected.length);

  return { stage, countries: selected };
}

export function progressiveResults(progress: AppProgress, countries: Country[], now = Date.now()) {
  const groups = progressiveTierGroups(countries);
  const tiers: ProgressiveTierResult[] = PROGRESSIVE_STAGES.map((stage) => {
    const group = groups[stage];
    return {
      stage,
      total: group.length,
      seen: group.filter((country) => flagState(progress, country)).length,
      mastered: group.filter((country) => isMastered(flagState(progress, country))).length,
      needsRepetition: group.filter((country) => {
        const state = flagState(progress, country);
        return Boolean(state && (state.wrongCount > 0 || new Date(state.nextReviewAt).getTime() <= now) && !isMastered(state));
      }).length
    };
  });

  return {
    stage: progressiveStage(progress, countries),
    tiers,
    seen: tiers.reduce((sum, tier) => sum + tier.seen, 0),
    mastered: tiers.reduce((sum, tier) => sum + tier.mastered, 0),
    needsRepetition: tiers.reduce((sum, tier) => sum + tier.needsRepetition, 0)
  };
}
