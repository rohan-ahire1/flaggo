import type { ArcadeMode } from "../types/arcade";
import type { Country } from "../types/country";
import type { Lesson } from "../types/lesson";
import type { AppProgress } from "../types/progress";
import { reviewKey } from "../types/topic";

export type BadgeId =
  | "europe-explorer"
  | "capital-rookie"
  | "flag-streak-7"
  | "africa-master"
  | "perfect-round"
  | "lookalike-survivor";

export type BadgeMeta = {
  id: BadgeId;
  name: string;
  hint: string;
  icon: string;
};

export const BADGES: BadgeMeta[] = [
  { id: "europe-explorer", name: "Europe Explorer", hint: "Finish every Europe flags lesson", icon: "globe" },
  { id: "capital-rookie", name: "Capital Rookie", hint: "Complete your first capitals lesson", icon: "pin" },
  { id: "flag-streak-7", name: "Flag Streak 7", hint: "Keep a 7-day daily streak", icon: "flame" },
  { id: "africa-master", name: "Africa Master", hint: "Master 20 African countries", icon: "star" },
  { id: "perfect-round", name: "Perfect Round", hint: "Score 100% in a round of 5+", icon: "check" },
  { id: "lookalike-survivor", name: "Similar Flags Survivor", hint: "Score 10+ in a Hard arcade run", icon: "target" }
];

export type RoundContext = {
  score: number;
  total: number;
  kind: "lesson" | "review" | "daily" | "arcade" | "trivia" | "test" | "map";
  arcadeMode?: ArcadeMode;
};

function hasBadge(progress: AppProgress, id: BadgeId) {
  return progress.badges.some((badge) => badge.id === id);
}

function hasCompletedEveryEuropeFlagLesson(progress: AppProgress, lessons: Lesson[]) {
  const europeLessons = lessons.filter((lesson) => lesson.topic === "flag" && lesson.region === "Europe");
  return europeLessons.length > 0 && europeLessons.every((lesson) => progress.completedLessonIds.includes(lesson.id));
}

function hasCompletedCapitalLesson(progress: AppProgress, lessons: Lesson[]) {
  const capitalLessonIds = new Set(lessons.filter((lesson) => lesson.topic === "capital").map((lesson) => lesson.id));
  return progress.completedLessonIds.some((id) => capitalLessonIds.has(id));
}

function masteredAfricanFlagCountries(progress: AppProgress, countries: Country[]) {
  const africanCodes = new Set(countries.filter((country) => country.continent === "Africa").map((country) => country.code));
  return Array.from(africanCodes).filter((code) => (progress.review[reviewKey(code, "flag")]?.box ?? 0) >= 5).length;
}

export function evaluateBadges(progress: AppProgress, countries: Country[], lessons: Lesson[], round?: RoundContext): BadgeId[] {
  const earned: BadgeId[] = [];
  const maybeAdd = (id: BadgeId, condition: boolean) => {
    if (condition && !hasBadge(progress, id)) earned.push(id);
  };

  maybeAdd("europe-explorer", hasCompletedEveryEuropeFlagLesson(progress, lessons));
  maybeAdd("capital-rookie", hasCompletedCapitalLesson(progress, lessons));
  maybeAdd("flag-streak-7", progress.daily.streak >= 7);
  maybeAdd("africa-master", masteredAfricanFlagCountries(progress, countries) >= 20);
  maybeAdd("perfect-round", Boolean(round && round.total >= 5 && round.score === round.total));
  maybeAdd("lookalike-survivor", Boolean(round && round.kind === "arcade" && round.arcadeMode === "hard" && round.score >= 10));

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
