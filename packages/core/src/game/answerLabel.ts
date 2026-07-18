import type { Country } from "../types/country";
import type { Topic } from "../types/topic";
import type { MapQuestion, Question } from "../utils/quiz";

export type QuestionWrapper =
  | { topic: Exclude<Topic, "location">; country: Country; question: Question }
  | { topic: "location"; country: Country; question: MapQuestion };

export function answerLabel(question: Question): string {
  if (question.type === "true-false" || question.type === "capital-true-false") return question.answer ? "Yes" : "No";
  if (question.type === "guess-currency") return question.correctCurrency;
  if (question.type === "guess-language") return question.correctLanguage;
  if (question.type === "guess-capital" || question.type === "flag-to-capital") return question.correctCapital;
  if (question.type === "pick-neighbor" || question.type === "not-neighbor") return question.correctNeighbor.name;
  return question.correctCountry.name;
}

export function answerDetail(question: Question): string | undefined {
  if (question.type === "true-false") {
    return question.answer
      ? `This is ${question.correctCountry.name}’s flag.`
      : `This is ${question.correctCountry.name}’s flag, not ${question.shownCountry.name}’s.`;
  }
  if (question.type === "capital-true-false") {
    const capital = question.correctCountry.capital ?? "unknown";
    return question.answer
      ? `${question.shownCapital} is the capital of ${question.correctCountry.name}.`
      : `The capital of ${question.correctCountry.name} is ${capital}, not ${question.shownCapital}.`;
  }
  return undefined;
}

export function answerLabelForWrapper(wrapper: QuestionWrapper): string {
  return wrapper.topic === "location" ? wrapper.country.name : answerLabel(wrapper.question);
}

export function answerDetailForWrapper(wrapper: QuestionWrapper): string | undefined {
  return wrapper.topic === "location" ? undefined : answerDetail(wrapper.question);
}
