import { countries } from "../data/countries";
import { arcadePool } from "../utils/arcade";
import { generateReviewQuestions, type Question } from "../utils/quiz";
import type { ArcadeMode } from "../types/arcade";
import type { Topic } from "../types/topic";
import { seededShuffle } from "../utils/seededRandom";

// A lesson round: due/new questions for the chosen topic.
export function buildLessonQuestions(topic: Topic): Question[] {
  return generateReviewQuestions(countries, topic);
}

// An arcade round: questions drawn from the mode-specific pool (hard mode uses
// lookalike/difficult countries).
export function buildArcadeQuestions(topic: Topic, mode: ArcadeMode): Question[] {
  const pool = arcadePool(countries, mode, topic);
  const source = pool.length >= 4 ? pool : countries;
  const questions: Question[] = [];
  let round = 0;
  while (questions.length < 60 && source.length >= 4) {
    const shuffled = seededShuffle(source, () => Math.random());
    questions.push(...generateReviewQuestions(shuffled, topic));
    round += 1;
    if (round > 20) break;
  }
  return questions.slice(0, Math.max(60, questions.length));
}
