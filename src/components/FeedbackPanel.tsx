import { useEffect, useRef } from "react";
import type { Country } from "@flaggo/core/types/country";
import FlagImage from "./FlagImage";
import Icon from "./Icon";
import { playCorrect, playWrong } from "../lib/sfx";

export default function FeedbackPanel({
  correct,
  country,
  xp,
  answerLabel,
  selectedLabel,
  revealCorrectFlag = false,
  onContinue
}: {
  correct: boolean;
  country: Country;
  xp: number;
  answerLabel?: string;
  selectedLabel?: string;
  revealCorrectFlag?: boolean;
  onContinue: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (correct) playCorrect();
    else playWrong();
    buttonRef.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key !== "Enter" || document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      onContinue();
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [onContinue]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md animate-slide-up safe-bottom rounded-t-[28px] px-5 pt-5 text-white shadow-[0_-18px_40px_rgba(38,50,56,0.18)] md:max-w-2xl lg:max-w-3xl ${
        correct ? "bg-success" : "bg-error"
      }`}
    >
      <div className="mb-4 flex items-center gap-4">
        <div className="relative shrink-0">
          <FlagImage code={country.code} name={country.name} src={country.flagUrl} fit="natural" className="w-28 rounded-[18px]" />
          {(correct || revealCorrectFlag) && (
            <span className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-full bg-paper shadow-md">
              <Icon name="check" size={20} className="text-success" />
            </span>
          )}
        </div>
        <div>
          <h2 className="font-display text-2xl font-black">{correct ? "Nice!" : "Not quite"}</h2>
          {correct ? (
            <p className="flex items-center gap-1 font-bold">
              <Icon name="bolt" size={16} /> +{xp} XP
            </p>
          ) : (
            <div className="text-sm font-semibold leading-tight text-white/95">
              {selectedLabel && (
                <p>
                  You picked <span className="font-black">{selectedLabel}</span>
                </p>
              )}
              {revealCorrectFlag ? (
                <p className="mt-1">
                  Correct flag <span className="font-black">{country.name}</span>
                </p>
              ) : (
                <p>
                  Correct answer <span className="font-black">{answerLabel ?? country.name}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <button
        ref={buttonRef}
        onClick={onContinue}
        className="btn-inverse w-full"
      >
        Continue
      </button>
    </div>
  );
}
