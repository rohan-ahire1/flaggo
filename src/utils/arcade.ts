import { lookalikeCodes } from "../data/lookalikes";
import type { Country } from "../types/country";
import type { AppProgress } from "../types/progress";
import type { ArcadeMode } from "../types/arcade";
import { arcadeKey } from "../types/arcade";
import type { Topic } from "../types/topic";

export function arcadeScore(mode: ArcadeMode, answers: boolean[]) {
  if (mode === "sudden") {
    const firstWrong = answers.findIndex((answer) => !answer);
    return firstWrong === -1 ? answers.length : firstWrong;
  }
  return answers.filter(Boolean).length;
}

export function arcadePool(countries: Country[], mode: ArcadeMode, topic: Topic) {
  const topicPool =
    topic === "capital"
      ? countries.filter((country) => country.capital?.trim())
      : topic === "currency"
        ? countries.filter((country) => country.currencyName?.trim())
        : topic === "language"
          ? countries.filter((country) => (country.languages ?? []).some((language) => language.trim()))
          : topic === "neighbor"
            ? countries.filter((country) => (country.borders ?? []).length > 0)
            : countries;
  if (mode !== "hard") return topicPool.filter((country) => country.isIndependent && country.isUNMember);
  const lookalikes = new Set(lookalikeCodes);
  return topicPool.filter((country) => country.difficulty === "hard" || lookalikes.has(country.code));
}

export function persistArcadeBest(progress: AppProgress, mode: ArcadeMode, topic: Topic, score: number): AppProgress {
  const key = arcadeKey(mode, topic);
  return {
    ...progress,
    arcade: {
      ...progress.arcade,
      [key]: Math.max(progress.arcade[key] ?? 0, score)
    }
  };
}
