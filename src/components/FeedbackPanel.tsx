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
  answerDetail,
  selectedLabel,
  revealCorrectFlag = false,
  showFlag = true,
  onContinue
}: {
  correct: boolean;
  country: Country;
  xp: number;
  answerLabel?: string;
  answerDetail?: string;
  selectedLabel?: string;
  revealCorrectFlag?: boolean;
  showFlag?: boolean;
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
      <div className="mb-4">
        {correct ? (
          <div className="flex items-center gap-4">
            {showFlag ? (
              <div className="relative shrink-0">
                <FlagImage code={country.code} name={country.name} src={country.flagUrl} fit="natural" className="w-28 rounded-[18px]" />
                <span className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-full bg-paper shadow-md">
                  <Icon name="check" size={20} className="text-success" />
                </span>
              </div>
            ) : (
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15">
                <Icon name="check" size={24} />
              </span>
            )}
            <div>
              <h2 className="font-display text-2xl font-black">Nice!</h2>
              <p className="flex items-center gap-1 font-bold">
                <Icon name="bolt" size={16} /> +{xp} XP
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15">
              <Icon name="x" size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-black">Not quite</h2>
              {revealCorrectFlag ? (
                <div className="mt-2 flex items-center gap-3 rounded-2xl bg-white/15 p-2.5">
                  <FlagImage
                    code={country.code}
                    name={country.name}
                    src={country.flagUrl}
                    fit="natural"
                    framed={false}
                    className="w-20 shrink-0"
                    imgClassName="max-h-12"
                  />
                  <p className="text-[15px] font-semibold text-white/95">
                    Correct flag: <span className="font-black">{country.name}</span>
                  </p>
                </div>
              ) : (
                <p className="mt-0.5 text-[15px] font-semibold text-white/95">
                  The correct answer is <span className="font-black">{answerLabel ?? country.name}</span>.
                </p>
              )}
              {answerDetail && <p className="mt-1 text-sm font-semibold text-white/90">{answerDetail}</p>}
            </div>
          </div>
        )}
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
