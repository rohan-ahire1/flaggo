import type { Topic } from "./topic";

export type Lesson = {
  id: string;
  topic: Topic;
  title: string;
  region: string;
  countryCodes: string[];
  difficulty: "easy" | "medium" | "hard";
  isTerritoryLesson: boolean;
};
