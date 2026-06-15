import { useEffect } from "react";
import type { Question } from "../utils/quiz";
import AnswerOption from "./AnswerOption";
import FlagImage from "./FlagImage";
import Icon, { type IconName } from "./Icon";

function Eyebrow({ icon, children }: { icon: IconName; children: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm font-display font-extrabold uppercase tracking-wide text-flaggo-blue">
      <Icon name={icon} size={15} />
      {children}
    </p>
  );
}

export default function QuestionCard({
  question,
  disabled,
  onAnswer
}: {
  question: Question;
  disabled: boolean;
  onAnswer: (wasCorrect: boolean) => void;
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

  const Flag = ({ large = true }: { large?: boolean }) => (
    <FlagImage
      code={question.correctCountry.code}
      name={question.correctCountry.name}
      src={question.correctCountry.flagUrl}
      className={`${large ? "aspect-[4/3] w-full" : "h-20 w-28"} rounded-[24px] p-4 shadow-[0_8px_0_#e5e7eb]`}
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
          {question.options.map((country) => (
            <button
              key={country.code}
              disabled={disabled}
              onClick={() => onAnswer(country.code === question.correctCountry.code)}
              className="rounded-2xl border-2 border-b-[5px] border-slate-200 bg-white p-3 transition-all duration-150 hover:border-flaggo-blue/40 active:translate-y-[3px] active:border-b-2"
            >
              <FlagImage code={country.code} name={country.name} src={country.flagUrl} className="aspect-[4/3] w-full rounded-xl p-2" />
            </button>
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
          <AnswerOption label="Yes" disabled={disabled} onClick={() => onAnswer(question.answer)} />
          <AnswerOption label="No" disabled={disabled} onClick={() => onAnswer(!question.answer)} />
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
          <AnswerOption key={country.code} country={country} disabled={disabled} onClick={() => onAnswer(country.code === question.correctCountry.code)} />
        ))}
      </div>
    </div>
  );
}
