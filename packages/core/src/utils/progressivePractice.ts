import type { Country } from "../types/country";
import type { AppProgress, ReviewState } from "../types/progress";
import { reviewKey } from "../types/topic";
import { seededShuffle } from "./seededRandom";

export type ProgressiveStage = Country["difficulty"];

export type ProgressiveTierResult = {
  difficulty: ProgressiveStage;
  total: number;
  seen: number;
  mastered: number;
  needsRepetition: number;
};

const STAGES: ProgressiveStage[] = ["easy", "medium", "hard"];

function flagState(progress: AppProgress, country: Country): ReviewState | undefined {
  return progress.review[reviewKey(country.code, "flag")];
}

function isMastered(state: ReviewState | undefined) {
  return Boolean(state && state.box >= 5 && state.correctCount >= 5 && state.correctCount >= state.wrongCount * 2);
}

export function progressiveStage(progress: AppProgress, countries: Country[]): ProgressiveStage {
  return STAGES.find((difficulty) => countries.some((country) => country.difficulty === difficulty && !flagState(progress, country))) ?? "hard";
}

export function progressivePracticeBatch(
  progress: AppProgress,
  countries: Country[],
  size = 8,
  rng: () => number = Math.random,
  now = Date.now()
): { stage: ProgressiveStage; countries: Country[] } {
  const stage = progressiveStage(progress, countries);
  const unlocked = new Set(STAGES.slice(0, STAGES.indexOf(stage) + 1));
  const available = countries.filter((country) => unlocked.has(country.difficulty));
  const fresh = seededShuffle(
    available.filter((country) => country.difficulty === stage && !flagState(progress, country)),
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
  const tiers: ProgressiveTierResult[] = STAGES.map((difficulty) => {
    const group = countries.filter((country) => country.difficulty === difficulty);
    return {
      difficulty,
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
