import type { Country } from "../types/country";
import type { AppProgress, ReviewState } from "../types/progress";
import { reviewKey, type Topic } from "../types/topic";

const intervals: Record<number, number> = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30
};

function dateAfter(days: number, from: Date) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function reviewTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}

export function isWeakReview(state: ReviewState | undefined) {
  if (!state || state.wrongCount <= 0) return false;
  return state.box <= 2 || state.correctCount < state.wrongCount * 2;
}

export function compareWeakReviews(a: ReviewState | undefined, b: ReviewState | undefined) {
  const boxDifference = (a?.box ?? 0) - (b?.box ?? 0);
  if (boxDifference) return boxDifference;
  const aAttempts = (a?.correctCount ?? 0) + (a?.wrongCount ?? 0);
  const bAttempts = (b?.correctCount ?? 0) + (b?.wrongCount ?? 0);
  const aErrorRate = aAttempts ? (a?.wrongCount ?? 0) / aAttempts : 0;
  const bErrorRate = bAttempts ? (b?.wrongCount ?? 0) / bAttempts : 0;
  const rateDifference = bErrorRate - aErrorRate;
  if (rateDifference) return rateDifference;
  return (b?.wrongCount ?? 0) - (a?.wrongCount ?? 0);
}

export function isMasteredReview(state: ReviewState | undefined) {
  return Boolean(state && state.box >= 5 && state.correctCount >= 5 && state.correctCount >= state.wrongCount * 2);
}

export function updateReviewState(
  countryCode: string,
  topic: Topic,
  wasCorrect: boolean,
  progress: AppProgress,
  now = new Date()
): AppProgress {
  const key = reviewKey(countryCode, topic);
  const stored = progress.review[key];
  const previous: ReviewState = stored ?? {
    countryCode,
    topic,
    box: 0,
    correctCount: 0,
    wrongCount: 0,
    lastSeenAt: null,
    nextReviewAt: now.toISOString()
  };
  const canAdvance = !stored || reviewTime(previous.nextReviewAt) <= now.getTime();
  const box = wasCorrect && canAdvance ? Math.min(previous.box + 1, 5) : wasCorrect ? previous.box : 0;
  const nextReviewAt = wasCorrect
    ? canAdvance
      ? dateAfter(intervals[box], now)
      : previous.nextReviewAt
    : now.toISOString();
  return {
    ...progress,
    totalCorrect: progress.totalCorrect + (wasCorrect ? 1 : 0),
    totalWrong: progress.totalWrong + (wasCorrect ? 0 : 1),
    review: {
      ...progress.review,
      [key]: {
        ...previous,
        countryCode,
        topic,
        box,
        correctCount: previous.correctCount + (wasCorrect ? 1 : 0),
        wrongCount: previous.wrongCount + (wasCorrect ? 0 : 1),
        lastSeenAt: now.toISOString(),
        nextReviewAt
      }
    }
  };
}

export function getDueCountries(progress: AppProgress, countries: Country[], topic: Topic) {
  const now = Date.now();
  return countries
    .filter((country) => {
      const state = progress.review[reviewKey(country.code, topic)];
      return Boolean(state && reviewTime(state.nextReviewAt) <= now);
    })
    .sort((a, b) => {
      const ar = progress.review[reviewKey(a.code, topic)];
      const br = progress.review[reviewKey(b.code, topic)];
      const boxDifference = (ar?.box ?? -1) - (br?.box ?? -1);
      if (boxDifference) return boxDifference;
      return reviewTime(ar?.nextReviewAt ?? "") - reviewTime(br?.nextReviewAt ?? "");
    });
}

export function getWeakCountries(progress: AppProgress, countries: Country[], topic: Topic) {
  return countries
    .filter((country) => isWeakReview(progress.review[reviewKey(country.code, topic)]))
    .sort((a, b) => {
      const ar = progress.review[reviewKey(a.code, topic)];
      const br = progress.review[reviewKey(b.code, topic)];
      return compareWeakReviews(ar, br);
    });
}

export function getMasteredCountries(progress: AppProgress, countries: Country[], topic: Topic) {
  return countries.filter((country) => {
    return isMasteredReview(progress.review[reviewKey(country.code, topic)]);
  });
}
