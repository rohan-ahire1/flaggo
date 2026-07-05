import type { Question } from "@flaggo/core/utils/quiz";

export type QuizOption = { key: string; label?: string; flagCode?: string; correct: boolean };

export type DescribedQuestion = {
  promptFlagCode?: string;
  promptText?: string;
  subText: string;
  layout: "options" | "flags" | "boolean";
  options: QuizOption[];
};

// Short human label for the results review list, e.g. "Identify Brazil",
// "Capital of Australia", "Flag of Kenya".
export function questionLabel(q: Question): string {
  switch (q.type) {
    case "guess-country":
    case "memory-review":
      return `Identify ${q.correctCountry.name}`;
    case "pick-flag":
      return `Flag of ${q.correctCountry.name}`;
    case "true-false":
      return `${q.correctCountry.name} flag check`;
    case "guess-capital":
    case "flag-to-capital":
      return `Capital of ${q.correctCountry.name}`;
    case "capital-to-country":
      return `${q.correctCountry.capital ?? "Capital"} → country`;
    case "capital-true-false":
      return `${q.correctCountry.name} capital check`;
    case "guess-currency":
      return `Currency of ${q.correctCountry.name}`;
    case "currency-to-country":
      return `${q.correctCurrency} → country`;
    case "guess-language":
      return `Language of ${q.correctCountry.name}`;
    case "language-to-country":
      return `${q.correctLanguage} → country`;
    case "pick-neighbor":
      return `Border of ${q.correctCountry.name}`;
    case "not-neighbor":
      return `Not a border of ${q.correctCountry.name}`;
    default:
      return "Question";
  }
}

const countryOptions = (options: { code: string; name: string }[], correctCode: string): QuizOption[] =>
  options.map((c) => ({ key: c.code, label: c.name, correct: c.code === correctCode }));

const stringOptions = (values: string[], correct: string): QuizOption[] =>
  values.map((v, i) => ({ key: `${v}-${i}`, label: v, correct: v === correct }));

const boolOptions = (answer: boolean): QuizOption[] => [
  { key: "true", label: "True", correct: answer === true },
  { key: "false", label: "False", correct: answer === false }
];

// Normalizes any quiz Question into a flag/text prompt + a set of options, so a
// single QuestionCard can render every question type.
export function describeQuestion(q: Question): DescribedQuestion {
  switch (q.type) {
    case "guess-country":
    case "memory-review":
      return {
        promptFlagCode: q.correctCountry.code,
        subText: "Which country is this?",
        layout: "options",
        options: countryOptions(q.options, q.correctCountry.code)
      };
    case "pick-flag":
      return {
        promptText: q.correctCountry.name,
        subText: "Pick the flag",
        layout: "flags",
        options: q.options.map((c) => ({
          key: c.code,
          label: c.name,
          flagCode: c.code,
          correct: c.code === q.correctCountry.code
        }))
      };
    case "true-false":
      return {
        promptFlagCode: q.shownCountry.code,
        promptText: q.correctCountry.name,
        subText: "Is this the correct flag?",
        layout: "boolean",
        options: boolOptions(q.answer)
      };
    case "guess-capital":
    case "flag-to-capital":
      return {
        promptFlagCode: q.correctCountry.code,
        subText: "What is the capital?",
        layout: "options",
        options: stringOptions(q.optionCapitals, q.correctCapital)
      };
    case "capital-to-country":
      return {
        promptText: q.correctCountry.capital ?? "",
        subText: "Which country's capital is this?",
        layout: "options",
        options: countryOptions(q.options, q.correctCountry.code)
      };
    case "capital-true-false":
      return {
        promptFlagCode: q.correctCountry.code,
        promptText: q.shownCapital,
        subText: "Is this the correct capital?",
        layout: "boolean",
        options: boolOptions(q.answer)
      };
    case "guess-currency":
      return {
        promptFlagCode: q.correctCountry.code,
        subText: "Which currency is used here?",
        layout: "options",
        options: stringOptions(q.optionCurrencies, q.correctCurrency)
      };
    case "currency-to-country":
      return {
        promptText: q.correctCurrency,
        subText: "Which country uses this currency?",
        layout: "options",
        options: countryOptions(q.options, q.correctCountry.code)
      };
    case "guess-language":
      return {
        promptFlagCode: q.correctCountry.code,
        subText: "Which language is spoken here?",
        layout: "options",
        options: stringOptions(q.optionLanguages, q.correctLanguage)
      };
    case "language-to-country":
      return {
        promptText: q.correctLanguage,
        subText: "Which country speaks this?",
        layout: "options",
        options: countryOptions(q.options, q.correctCountry.code)
      };
    case "pick-neighbor":
      return {
        promptText: q.correctCountry.name,
        subText: "Which country borders it?",
        layout: "options",
        options: countryOptions(q.options, q.correctNeighbor.code)
      };
    case "not-neighbor":
      return {
        promptText: q.correctCountry.name,
        subText: "Which country does NOT border it?",
        layout: "options",
        options: countryOptions(q.options, q.correctNeighbor.code)
      };
    default:
      return { subText: "", layout: "options", options: [] };
  }
}
