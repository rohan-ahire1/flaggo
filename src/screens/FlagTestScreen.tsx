import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import FlagImage from "../components/FlagImage";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import type { Topic } from "@flaggo/core/types/topic";
import { getCapitalDistractors, getDistractors, shuffleArray } from "@flaggo/core/utils/quiz";
import { updateReviewState } from "@flaggo/core/utils/spacedRepetition";
import { useGame } from "../state/GameProvider";
import type { TestMode } from "./TestSetupScreen";

type TestRouteState = { countryCodes: string[]; mode: TestMode; topic: Topic } | null;

export default function FlagTestScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { countries: allCountries, progress, setProgress } = useGame();
  const routeState = state as TestRouteState;
  const countries = routeState?.countryCodes.map((code) => allCountries.find((country) => country.code === code)).filter((country): country is (typeof allCountries)[number] => Boolean(country)) ?? [];
  const mode = routeState?.mode ?? "recall";
  const topic = routeState?.topic ?? "flag";
  const onDone = () => navigate("/review");
  const questions = useMemo(() => shuffleArray(countries), [countries]);
  const [index, setIndex] = useState(0);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [graded, setGraded] = useState<null | boolean>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const country = questions[index];
  const options = useMemo(() => {
    if (!country) return [];
    if (topic === "capital") return shuffleArray([country.capital!.trim(), ...getCapitalDistractors(country, allCountries, 3)]);
    return shuffleArray([country, ...getDistractors(country, allCountries, 3)]);
  }, [allCountries, country, topic]);
  const answer = topic === "capital" ? country?.capital?.trim() : country?.name;
  const topicLabel = topic === "capital" ? "Capital" : "Flag";

  function reveal() {
    if (!country || revealed) return;
    setRevealed(true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(answer ?? country.name);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  function grade(ok: boolean) {
    if (!country || graded !== null) return;
    setGraded(ok);
    setCorrectCount((value) => value + (ok ? 1 : 0));
    const next = updateReviewState(country.code, topic, ok, progress);
    setProgress({ ...next, xp: next.xp + (ok ? 5 : 0) });
  }

  function next() {
    if (index >= questions.length - 1) {
      onDone();
      return;
    }
    setIndex((value) => value + 1);
    setSelectedValue(null);
    setRevealed(false);
    setGraded(null);
  }

  if (!routeState) return <Navigate to="/test-setup" replace />;

  if (!country) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <button onClick={onDone} className="flaggo-button bg-flaggo-green text-white">Go back</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-5">
      <header className="mb-5">
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={onDone}
            aria-label="Exit test"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-flaggo-muted shadow-card transition active:translate-y-0.5 active:shadow-none"
          >
            <Icon name="close" size={20} />
          </button>
          <div className="flex-1"><ProgressBar value={((index + (revealed ? 1 : 0)) / questions.length) * 100} /></div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="flex items-center gap-1.5 font-display font-extrabold uppercase text-flaggo-blue">
              <Icon name={mode === "recall" ? "target" : "library"} size={15} />
              {mode === "recall" ? "Recall test" : "Multiple choice"}
            </p>
            <h1 className="font-display text-2xl font-black">{topicLabel} {index + 1} of {questions.length}</h1>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-white px-3 py-2 text-sm font-display font-extrabold text-flaggo-green shadow-card">
            <Icon name="check" size={15} />
            {correctCount}
          </div>
        </div>
      </header>

      <section className="rounded-[28px] bg-white p-5 shadow-card-lg">
        <FlagImage code={country.code} name={country.name} src={country.flagUrl} className="aspect-[4/3] w-full rounded-[24px] p-4" />

        {mode === "recall" ? (
          <div className="mt-5 rounded-[24px] bg-flaggo-bg p-4 text-center">
            <p className="font-display text-xl font-black">Say the {topic === "capital" ? "capital" : "country"} in your head.</p>
            <p className="mt-1 text-sm font-bold text-flaggo-muted">Tap Reveal when you are ready.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {options.map((option) => {
              const value = typeof option === "string" ? option : option.code;
              const label = typeof option === "string" ? option : option.name;
              return (
              <button
                key={value}
                disabled={revealed}
                onClick={() => setSelectedValue(value)}
                className={`rounded-2xl border-b-4 p-4 text-left font-display font-black transition active:translate-y-1 ${
                  selectedValue === value ? "border-primary bg-primary/10 text-primary" : "border-line bg-surface text-ink"
                }`}
              >
                {label}
              </button>
              );
            })}
          </div>
        )}

        {revealed ? (
          <div className={`mt-5 rounded-[24px] p-4 ${graded === true ? "bg-success/10 text-success" : graded === false ? "bg-error/10 text-error" : "bg-primary/10 text-primary"}`}>
            <p className="font-display text-sm font-black uppercase">{graded === null ? "Answer" : graded ? "Marked right" : "Marked wrong"}</p>
            <p className="mt-1 font-display font-black text-flaggo-text">{answer}</p>
            {topic === "flag" && country.officialName && <p className="text-sm font-bold text-flaggo-muted">{country.officialName}</p>}
            {topic === "capital" && <p className="text-sm font-bold text-flaggo-muted">{country.name}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                disabled={graded !== null}
                onClick={() => grade(true)}
                className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-b-[5px] border-flaggo-greenDark bg-flaggo-green px-3 py-3 font-display font-extrabold text-white transition active:translate-y-[3px] active:border-b-2 disabled:opacity-60"
              >
                <Icon name="check" size={18} /> Got it
              </button>
              <button
                disabled={graded !== null}
                onClick={() => grade(false)}
                className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-b-[5px] border-flaggo-redDark bg-flaggo-red px-3 py-3 font-display font-extrabold text-white transition active:translate-y-[3px] active:border-b-2 disabled:opacity-60"
              >
                <Icon name="x" size={18} /> Missed it
              </button>
            </div>
          </div>
        ) : null}

        <button
          onClick={revealed ? next : reveal}
          disabled={revealed && graded === null}
          className="flaggo-button mt-5 w-full bg-flaggo-green text-white"
        >
          {revealed ? (index >= questions.length - 1 ? "Finish" : `Next ${topic}`) : "Reveal answer"}
        </button>
      </section>
    </main>
  );
}
