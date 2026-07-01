import { countries } from "../data/countries";
import { arcadePool } from "../utils/arcade";
import { generateReviewQuestions, type Question } from "../utils/quiz";
import type { ArcadeMode } from "../types/arcade";
import type { Topic } from "../types/topic";

// A lesson round: due/new questions for the chosen topic.
export function buildLessonQuestions(topic: Topic): Question[] {
  return generateReviewQuestions(countries, topic);
}

// An arcade round: questions drawn from the mode-specific pool (hard mode uses
// lookalike/difficult countries).
export function buildArcadeQuestions(topic: Topic, mode: ArcadeMode): Question[] {
  const pool = arcadePool(countries, mode, topic);
  return generateReviewQuestions(pool.length >= 4 ? pool : countries, topic);
}
