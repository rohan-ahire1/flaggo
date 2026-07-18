import { useEffect } from "react";
import type { Question } from "@flaggo/core/utils/quiz";
import type { TriviaRound } from "@flaggo/core/utils/trivia";
import AnswerOption from "./AnswerOption";
import FlagImage from "./FlagImage";
import Icon, { type IconName } from "./Icon";

function Eyebrow({ icon, children }: { icon: IconName; children: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm font-display font-semibold uppercase tracking-wide text-primary">
      <Icon name={icon} size={15} />
      {children}
    </p>
  );
}

export default function QuestionCard({
  question,
  disabled,
  selectedLabel,
  onAnswer
}: {
  question: Question;
  disabled: boolean;
  selectedLabel?: string;
  onAnswer: (wasCorrect: boolean, selectedLabel?: string) => void;
}) {
  useEffect(() => {
    const sources = new Set<string>([question.correctCountry.flagUrl]);
    if ("options" in question) {
      question.options.forEach((country) => sources.add(country.flagUrl));
    }
    if ("shownCountry" in question) {
      sources.add(question.shownCountry.flagUrl);
    }
    sources.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, [question]);

  useEffect(() => {
    if (disabled) return;
    function keydown(event: KeyboardEvent) {
      if (!/^[1-4]$/.test(event.key) || document.querySelector('[role="dialog"]')) return;
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("section.animate-fade-in button:not([disabled])"));
      const target = buttons[Number(event.key) - 1];
      if (target) {
        event.preventDefault();
        target.click();
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [disabled, question]);

  const Flag = ({ large = true }: { large?: boolean }) => (
    <FlagImage
      code={question.correctCountry.code}
      name={question.correctCountry.name}
      src={question.correctCountry.flagUrl}
      fit="natural"
      className={`${large ? "mx-auto w-full max-w-sm" : "w-28"} rounded-[24px] shadow-card`}
      imgClassName={large ? "max-h-[280px]" : "max-h-20"}
    />
  );

  if (question.type === "pick-flag") {
    return (
      <div className="space-y-5">
        <div>
          <Eyebrow icon="target">Pick the correct flag</Eyebrow>
          <h1 className="font-display text-2xl font-black">Pick the flag of {question.correctCountry.name}.</h1>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {question.options.map((country) => {
            const correctOption = disabled && country.code === question.correctCountry.code;
            const selectedWrongOption = disabled && country.name === selectedLabel && !correctOption;
            return (
              <button
                key={country.code}
                disabled={disabled}
                onClick={() => onAnswer(country.code === question.correctCountry.code, country.name)}
                className={`rounded-2xl border-2 border-b-[5px] bg-paper p-3 transition-all duration-150 active:translate-y-[3px] active:border-b-2 ${
                  correctOption
                    ? "border-success bg-success/10 ring-2 ring-success/20"
                    : selectedWrongOption
                      ? "border-error bg-error/10"
                      : "border-line hover:border-primary/40"
                }`}
              >
                <FlagImage code={country.code} name={country.name} src={country.flagUrl} framed={false} className="aspect-[4/3] w-full rounded-xl" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "guess-capital") {
    return (
      <div className="space-y-5">
        <Flag />
        <div>
          <Eyebrow icon="globe">Pick the capital</Eyebrow>
          <h1 className="font-display text-2xl font-black">What is the capital of {question.correctCountry.name}?</h1>
        </div>
        <div className="grid gap-3">
          {question.optionCapitals.map((capital) => (
            <AnswerOption key={capital} label={capital} disabled={disabled} onClick={() => onAnswer(capital === question.correctCapital, capital)} />
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "capital-to-country") {
    return (
      <div className="space-y-5">
        <div className="rounded-[28px] bg-paper p-6 text-center shadow-card">
          <p className="font-display text-4xl font-black text-ink">{question.correctCountry.capital}</p>
        </div>
        <div>
          <Eyebrow icon="target">Capital to country</Eyebrow>
          <h1 className="font-display text-2xl font-black">Which country has this capital?</h1>
        </div>
        <div className="grid gap-3">
          {question.options.map((country) => (
            <AnswerOption key={country.code} country={country} disabled={disabled} onClick={() => onAnswer(country.code === question.correctCountry.code, country.name)} />
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "flag-to-capital") {
    return (
      <div className="space-y-5">
        <Flag />
        <div>
          <Eyebrow icon="review">Flag to capital</Eyebrow>
          <h1 className="font-display text-2xl font-black">Which capital belongs to this country?</h1>
        </div>
        <div className="grid gap-3">
          {question.optionCapitals.map((capital) => (
            <AnswerOption key={capital} label={capital} disabled={disabled} onClick={() => onAnswer(capital === question.correctCapital, capital)} />
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "capital-true-false") {
    return (
      <div className="space-y-5">
        <Flag />
        <div>
          <Eyebrow icon="sparkle">True or false</Eyebrow>
          <h1 className="font-display text-2xl font-black">Is {question.shownCapital} the capital of {question.correctCountry.name}?</h1>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <AnswerOption label="Yes" disabled={disabled} onClick={() => onAnswer(question.answer, "Yes")} />
          <AnswerOption label="No" disabled={disabled} onClick={() => onAnswer(!question.answer, "No")} />
        </div>
      </div>
    );
  }

  if (question.type === "guess-currency") {
    return (
      <div className="space-y-5">
        <Flag />
        <div>
          <Eyebrow icon="coin">Pick the currency</Eyebrow>
          <h1 className="font-display text-2xl font-black">What currency does {question.correctCountry.name} use?</h1>
        </div>
        <div className="grid gap-3">
          {question.optionCurrencies.map((currency) => (
            <AnswerOption key={currency} label={currency} disabled={disabled} onClick={() => onAnswer(currency === question.correctCurrency, currency)} />
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "currency-to-country") {
    return (
      <div className="space-y-5">
        <div className="rounded-[28px] bg-paper p-6 text-center shadow-card">
          <p className="font-display text-4xl font-black text-ink">{question.currencyClue}</p>
        </div>
        <div>
          <Eyebrow icon="coin">Currency to country</Eyebrow>
          <h1 className="font-display text-2xl font-black">Which country uses this currency?</h1>
        </div>
        <div className="grid gap-3">
          {question.options.map((country) => (
            <AnswerOption key={country.code} country={country} disabled={disabled} onClick={() => onAnswer(country.code === question.correctCountry.code, country.name)} />
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "guess-language") {
    return (
      <div className="space-y-5">
        <Flag />
        <div>
          <Eyebrow icon="globe">Pick the language</Eyebrow>
          <h1 className="font-display text-2xl font-black">Which official language is spoken in {question.correctCountry.name}?</h1>
        </div>
        <div className="grid gap-3">
          {question.optionLanguages.map((language) => (
            <AnswerOption key={language} label={language} disabled={disabled} onClick={() => onAnswer(language === question.correctLanguage, language)} />
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "language-to-country") {
    return (
      <div className="space-y-5">
        <div className="rounded-[28px] bg-paper p-6 text-center shadow-card">
          <p className="font-display text-4xl font-black text-ink">{question.correctLanguage}</p>
        </div>
        <div>
          <Eyebrow icon="globe">Language to country</Eyebrow>
          <h1 className="font-display text-2xl font-black">Which country has this official language?</h1>
        </div>
        <div className="grid gap-3">
          {question.options.map((country) => (
            <AnswerOption key={country.code} country={country} disabled={disabled} onClick={() => onAnswer(country.code === question.correctCountry.code, country.name)} />
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "pick-neighbor" || question.type === "not-neighbor") {
    return (
      <div className="space-y-5">
        <Flag />
        <div>
          <Eyebrow icon="target">{question.type === "pick-neighbor" ? "Pick a neighbor" : "Find the odd border"}</Eyebrow>
          <h1 className="font-display text-2xl font-black">
            {question.type === "pick-neighbor" ? `Which country borders ${question.correctCountry.name}?` : `Which country does not border ${question.correctCountry.name}?`}
          </h1>
        </div>
        <div className="grid gap-3">
          {question.options.map((country) => (
            <AnswerOption key={country.code} country={country} disabled={disabled} onClick={() => onAnswer(country.code === question.correctNeighbor.code, country.name)} />
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "true-false") {
    return (
      <div className="space-y-5">
        <Flag />
        <div>
          <Eyebrow icon="sparkle">True or false</Eyebrow>
          <h1 className="font-display text-2xl font-black">Is this the flag of {question.shownCountry.name}?</h1>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <AnswerOption label="Yes" disabled={disabled} onClick={() => onAnswer(question.answer, "Yes")} />
          <AnswerOption label="No" disabled={disabled} onClick={() => onAnswer(!question.answer, "No")} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Flag />
      <div>
        <Eyebrow icon={question.type === "memory-review" ? "review" : "globe"}>
          {question.type === "memory-review" ? "Memory review" : "Identify the flag"}
        </Eyebrow>
        <h1 className="font-display text-2xl font-black">{question.type === "memory-review" ? "Which country is shown?" : "Which country is this?"}</h1>
      </div>
      <div className="grid gap-3">
        {question.options.map((country) => (
          <AnswerOption key={country.code} country={country} disabled={disabled} onClick={() => onAnswer(country.code === question.correctCountry.code, country.name)} />
        ))}
      </div>
    </div>
  );
}

function formatMetric(value: number, metric: "population" | "area") {
  return metric === "area" ? `${value.toLocaleString()} km2` : value.toLocaleString();
}

export function TriviaCard({
  round,
  disabled,
  onAnswer
}: {
  round: TriviaRound;
  disabled: boolean;
  onAnswer: (wasCorrect: boolean, selectedLabel?: string) => void;
}) {
  useEffect(() => {
    if (disabled) return;
    function keydown(event: KeyboardEvent) {
      if (!/^[1-4]$/.test(event.key) || document.querySelector('[role="dialog"]')) return;
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("section.animate-fade-in button:not([disabled])"));
      const target = buttons[Number(event.key) - 1];
      if (target) {
        event.preventDefault();
        target.click();
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [disabled, round]);

  if (round.mode === "higher-lower") {
    return (
      <div className="space-y-5">
        <div>
          <Eyebrow icon="stats">Higher or lower</Eyebrow>
          <h1 className="font-display text-2xl font-black">Which country has the larger {round.metric}?</h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {round.countries.map((country) => (
            <button
              key={country.code}
              disabled={disabled}
              onClick={() => onAnswer(country.code === round.correctCountry.code, country.name)}
              className="rounded-[24px] border-2 border-b-[5px] border-line bg-paper p-4 text-left transition active:translate-y-[3px] active:border-b-2"
            >
              <FlagImage code={country.code} name={country.name} src={country.flagUrl} framed={false} className="aspect-[4/3] w-full rounded-xl" />
              <p className="mt-3 font-display text-xl font-black">{country.name}</p>
              {disabled && <p className="text-sm font-bold text-muted">{formatMetric(country[round.metric] ?? 0, round.metric)}</p>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (round.mode === "odd-one-out") {
    return (
      <div className="space-y-5">
        <div>
          <Eyebrow icon="target">Odd one out</Eyebrow>
          <h1 className="font-display text-2xl font-black">Which country does not fit the set?</h1>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {round.countries.map((country) => (
            <button
              key={country.code}
              disabled={disabled}
              onClick={() => onAnswer(country.code === round.correctCountry.code, country.name)}
              className="rounded-2xl border-2 border-b-[5px] border-line bg-paper p-3 text-left transition active:translate-y-[3px] active:border-b-2"
            >
              <FlagImage code={country.code} name={country.name} src={country.flagUrl} framed={false} className="aspect-[4/3] w-full rounded-xl" />
              <p className="mt-2 font-display font-black">{country.name}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] bg-paper p-6 text-center shadow-card">
        <p className="font-display text-2xl font-black text-ink">{round.statement}</p>
      </div>
      <div>
        <Eyebrow icon="sparkle">True or false</Eyebrow>
        <h1 className="font-display text-2xl font-black">Is this statement correct?</h1>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <AnswerOption label="True" disabled={disabled} onClick={() => onAnswer(round.answer, "True")} />
        <AnswerOption label="False" disabled={disabled} onClick={() => onAnswer(!round.answer, "False")} />
      </div>
    </div>
  );
}
