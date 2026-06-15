import type { Country } from "../types/country";
import type { AppProgress, ReviewState } from "../types/progress";

const intervals: Record<number, number> = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30
};

function dateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function updateReviewState(
  countryCode: string,
  wasCorrect: boolean,
  progress: AppProgress
): AppProgress {
  const previous: ReviewState = progress.review[countryCode] ?? {
    countryCode,
    box: 0,
    correctCount: 0,
    wrongCount: 0,
    lastSeenAt: null,
    nextReviewAt: new Date().toISOString()
  };
  const box = wasCorrect ? Math.min(previous.box + 1, 5) : 0;
  return {
    ...progress,
    totalCorrect: progress.totalCorrect + (wasCorrect ? 1 : 0),
    totalWrong: progress.totalWrong + (wasCorrect ? 0 : 1),
    review: {
      ...progress.review,
      [countryCode]: {
        ...previous,
        box,
        correctCount: previous.correctCount + (wasCorrect ? 1 : 0),
        wrongCount: previous.wrongCount + (wasCorrect ? 0 : 1),
        lastSeenAt: new Date().toISOString(),
        nextReviewAt: dateAfter(intervals[box])
      }
    }
  };
}

export function getDueCountries(progress: AppProgress, countries: Country[]) {
  const now = Date.now();
  return countries
    .filter((country) => {
      const state = progress.review[country.code];
      return !state || new Date(state.nextReviewAt).getTime() <= now;
    })
    .sort((a, b) => {
      const ar = progress.review[a.code];
      const br = progress.review[b.code];
      return (ar?.box ?? -1) - (br?.box ?? -1);
    });
}

export function getWeakCountries(progress: AppProgress, countries: Country[]) {
  return countries
    .filter((country) => (progress.review[country.code]?.wrongCount ?? 0) > 0)
    .sort((a, b) => {
      const ar = progress.review[a.code];
      const br = progress.review[b.code];
      return (br?.wrongCount ?? 0) - (ar?.wrongCount ?? 0);
    });
}

export function getMasteredCountries(progress: AppProgress, countries: Country[]) {
  return countries.filter((country) => {
    const state = progress.review[country.code];
    if (!state) return false;
    return state.box >= 5 && state.correctCount >= 5 && state.correctCount >= state.wrongCount * 2;
  });
}
