import type { ArcadeMode } from "../types/arcade";
import type { Country } from "../types/country";
import type { AppProgress } from "../types/progress";
import { reviewKey } from "../types/topic";
import { PROGRESSIVE_STAGES, progressiveTierGroups, type ProgressiveStage } from "../utils/progressivePractice";
import { isMasteredReview } from "../utils/spacedRepetition";

export type BadgeId =
  | "flag-scout"
  | "world-explorer"
  | "global-navigator"
  | "atlas-master"
  | "flag-streak-7"
  | "africa-master"
  | "perfect-round";

export type BadgeMeta = {
  id: BadgeId;
  name: string;
  hint: string;
  icon: string;
};

export const BADGES: BadgeMeta[] = [
  { id: "flag-scout", name: "Flag Scout", hint: "Complete the first 50-flag stage", icon: "flag" },
  { id: "world-explorer", name: "World Explorer", hint: "Complete the second 50-flag stage", icon: "globe" },
  { id: "global-navigator", name: "Global Navigator", hint: "Complete the third 50-flag stage", icon: "pin" },
  { id: "atlas-master", name: "Atlas Master", hint: "Complete all four learning stages", icon: "trophy" },
  { id: "flag-streak-7", name: "Flag Streak 7", hint: "Keep a 7-day daily streak", icon: "flame" },
  { id: "africa-master", name: "Africa Master", hint: "Master 20 African countries", icon: "star" },
  { id: "perfect-round", name: "Perfect Round", hint: "Score 100% in a round of 5+", icon: "check" }
];

export type RoundContext = {
  score: number;
  total: number;
  kind: "review" | "daily" | "arcade" | "trivia" | "test" | "map";
  arcadeMode?: ArcadeMode;
};

function hasBadge(progress: AppProgress, id: BadgeId) {
  return progress.badges.some((badge) => badge.id === id);
}

function hasCompletedStage(progress: AppProgress, countries: Country[], stage: ProgressiveStage) {
  const groups = progressiveTierGroups(countries);
  const stageIndex = PROGRESSIVE_STAGES.indexOf(stage);
  const journey = PROGRESSIVE_STAGES.slice(0, stageIndex + 1).flatMap((item) => groups[item]);
  return groups[stage].length > 0 && journey.every((country) => Boolean(progress.review[reviewKey(country.code, "flag")]));
}

function masteredAfricanFlagCountries(progress: AppProgress, countries: Country[]) {
  const africanCodes = new Set(countries.filter((country) => country.continent === "Africa").map((country) => country.code));
  return Array.from(africanCodes).filter((code) => isMasteredReview(progress.review[reviewKey(code, "flag")])).length;
}

export function evaluateBadges(progress: AppProgress, countries: Country[], round?: RoundContext): BadgeId[] {
  const earned: BadgeId[] = [];
  const maybeAdd = (id: BadgeId, condition: boolean) => {
    if (condition && !hasBadge(progress, id)) earned.push(id);
  };

  maybeAdd("flag-scout", hasCompletedStage(progress, countries, PROGRESSIVE_STAGES[0]));
  maybeAdd("world-explorer", hasCompletedStage(progress, countries, PROGRESSIVE_STAGES[1]));
  maybeAdd("global-navigator", hasCompletedStage(progress, countries, PROGRESSIVE_STAGES[2]));
  maybeAdd("atlas-master", hasCompletedStage(progress, countries, PROGRESSIVE_STAGES[3]));
  maybeAdd("flag-streak-7", progress.daily.streak >= 7);
  maybeAdd("africa-master", masteredAfricanFlagCountries(progress, countries) >= 20);
  maybeAdd("perfect-round", Boolean(round && round.total >= 5 && round.score === round.total));

  return earned;
}

export function awardBadges(progress: AppProgress, ids: string[], now = new Date()): AppProgress {
  const existing = new Set(progress.badges.map((badge) => badge.id));
  const earnedAt = now.toISOString();
  const badges = [...progress.badges];
  ids.forEach((id) => {
    if (existing.has(id)) return;
    existing.add(id);
    badges.push({ id, earnedAt });
  });
  return { ...progress, badges };
}
