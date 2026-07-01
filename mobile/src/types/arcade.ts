import type { Topic } from "./topic";

export type ArcadeMode = "timed" | "sudden" | "hard";

export const ARCADE_MODES: ArcadeMode[] = ["timed", "sudden", "hard"];

export const arcadeKey = (mode: ArcadeMode, topic: Topic) => `${mode}-${topic}`;
