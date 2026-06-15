export type Lesson = {
  id: string;
  title: string;
  region: string;
  countryCodes: string[];
  difficulty: "easy" | "medium" | "hard";
  isTerritoryLesson: boolean;
};
