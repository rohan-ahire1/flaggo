export type ReviewState = {
  countryCode: string;
  box: number;
  correctCount: number;
  wrongCount: number;
  lastSeenAt: string | null;
  nextReviewAt: string;
};

export type AppProgress = {
  xp: number;
  coins: number;
  streak: number;
  lastLessonDate: string | null;
  completedLessonIds: string[];
  review: Record<string, ReviewState>;
  totalCorrect: number;
  totalWrong: number;
};

export const defaultProgress: AppProgress = {
  xp: 0,
  coins: 0,
  streak: 0,
  lastLessonDate: null,
  completedLessonIds: [],
  review: {},
  totalCorrect: 0,
  totalWrong: 0
};
