import type { ArcadeMode } from "../types/arcade";
import type { Topic } from "../types/topic";

export const dailyBoard = (dateStr: string) => `daily-${dateStr}`;
export const arcadeBoard = (mode: ArcadeMode, topic: Topic) => `arcade-${mode}-${topic}`;
export const xpBoard = () => "xp-alltime";
