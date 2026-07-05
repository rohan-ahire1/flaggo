import type { Country } from "../types/country";
import type { Topic } from "../types/topic";
import type { MapQuestion, Question } from "../utils/quiz";

export type QuestionWrapper =
  | { topic: Exclude<Topic, "location">; country: Country; question: Question }
  | { topic: "location"; country: Country; question: MapQuestion };

export function answerLabel(question: Question): string {
  if (question.type === "guess-currency") return question.correctCurrency;
  if (question.type === "guess-language") return question.correctLanguage;
  if (question.type === "guess-capital" || question.type === "flag-to-capital") return question.correctCapital;
  if (question.type === "capital-true-false") return question.correctCountry.capital ?? question.correctCountry.name;
  if (question.type === "pick-neighbor" || question.type === "not-neighbor") return question.correctNeighbor.name;
  return question.correctCountry.name;
}

export function answerLabelForWrapper(wrapper: QuestionWrapper): string {
  return wrapper.topic === "location" ? wrapper.country.name : answerLabel(wrapper.question);
}
