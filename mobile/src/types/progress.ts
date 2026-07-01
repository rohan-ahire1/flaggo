import type { Topic } from "./topic";

export type DailyResult = { score: number; total: number };

export type DailyProgress = {
  lastDate: string | null;
  streak: number;
  best: number;
  history: Record<string, DailyResult>;
};

export type Deck = {
  id: string;
  name: string;
  codes: string[];
  topic: Topic;
  createdAt: string;
};

export type ReviewState = {
  countryCode: string;
  topic?: Topic;
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
  selectedTopic: Topic;
  review: Record<string, ReviewState>;
  totalCorrect: number;
  totalWrong: number;
  daily: DailyProgress;
  arcade: Record<string, number>;
  decks: Deck[];
};

export const defaultProgress: AppProgress = {
  xp: 0,
  coins: 0,
  streak: 0,
  lastLessonDate: null,
  completedLessonIds: [],
  selectedTopic: "flag",
  review: {},
  totalCorrect: 0,
  totalWrong: 0,
  daily: { lastDate: null, streak: 0, best: 0, history: {} },
  arcade: {},
  decks: []
};
