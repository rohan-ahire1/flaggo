import type { ArcadeMode } from "../types/arcade";
import type { Topic } from "../types/topic";
import type { TriviaMode } from "../utils/trivia";

export const dailyBoard = (dateStr: string) => `daily-${dateStr}`;
export const arcadeBoard = (mode: ArcadeMode, topic: Topic) => `arcade-${mode}-${topic}`;
export const triviaBoard = (mode: TriviaMode) => `trivia-${mode}`;
export const xpBoard = () => "xp-alltime";
