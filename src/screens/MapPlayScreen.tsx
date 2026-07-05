import { lazy, Suspense, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import FeedbackPanel from "../components/FeedbackPanel";
import FlagImage from "../components/FlagImage";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import type { Country } from "@flaggo/core/types/country";
import { updateStreak } from "@flaggo/core/utils/date";
import { generateMapQuestions, type MapMode, type MapQuestion } from "@flaggo/core/utils/quiz";
import { updateReviewState } from "@flaggo/core/utils/spacedRepetition";
import { useGame } from "../state/GameProvider";

const WorldMap = lazy(() => import("../components/WorldMap"));

type MapRouteState = { mode: MapMode; countryCodes: string[] } | null;

export default function MapPlayScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { countries: allCountries, progress, setProgress, completeLesson } = useGame();
  const routeState = state as MapRouteState;
  const countries = routeState?.countryCodes.map((code) => allCountries.find((country) => country.code === code)).filter((country): country is Country => Boolean(country)) ?? [];
  const mode = routeState?.mode ?? "locate";
  const onExit = () => navigate("/map");
  const questions = useMemo(() => generateMapQuestions(countries, mode), [countries, mode]);
  const countryByCode = useMemo(() => new Map(countries.map((country) => [country.code, country])), [countries]);
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [xp, setXp] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; country: Country; wrongCode?: string } | null>(null);
  const question = questions[index];
  const target = question ? countryByCode.get(question.targetCode) : undefined;
  const isIdentify = question?.type === "identify-country";

  function answer(selectedCode: string) {
    if (!question || !target || feedback) return;
    const ok = selectedCode === target.code;
    const earned = ok ? 10 : 0;
    const next = updateReviewState(target.code, "location", ok, currentProgress);
    const withXp = { ...next, xp: next.xp + earned };
    setCurrentProgress(withXp);
    setProgress(withXp);
    setCorrect((value) => value + (ok ? 1 : 0));
    setXp((value) => value + earned);
    setFeedback({ ok, country: target, wrongCode: ok ? undefined : selectedCode });
  }

  function complete() {
    const total = questions.length || 1;
    const bonusXp = 10;
    const next = updateStreak({ ...currentProgress, xp: currentProgress.xp + bonusXp });
    setProgress(next);
    completeLesson({
      xpEarned: xp + bonusXp,
      accuracy: Math.round((correct / total) * 100),
      correct,
      total,
      streak: next.streak,
      coinsEarned: 0,
      topic: "location"
    });
  }

  function continueNext() {
    setFeedback(null);
    if (index >= questions.length - 1) complete();
    else setIndex((value) => value + 1);
  }

  if (!routeState) return <Navigate to="/map" replace />;

  if (!question || !target) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <button onClick={onExit} className="flaggo-button bg-flaggo-green text-white">Go back</button>
      </main>
    );
  }

  return (
    <main className={mode === "locate" ? "flex h-dvh flex-col overflow-hidden bg-flaggo-bg p-5" : "min-h-screen bg-flaggo-bg p-5"}>
      <header className="mb-4">
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={onExit}
            aria-label="Exit map practice"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-flaggo-muted shadow-card transition active:translate-y-0.5 active:shadow-none"
          >
            <Icon name="close" size={20} />
          </button>
          <div className="flex-1"><ProgressBar value={(index / questions.length) * 100} /></div>
          <span className="shrink-0 text-sm font-display font-extrabold text-flaggo-muted">{index + 1}/{questions.length}</span>
        </div>
        <div className="rounded-[24px] border border-flaggo-border bg-white p-4 shadow-card">
          <p className="flex items-center gap-1.5 text-xs font-display font-extrabold uppercase tracking-wide text-flaggo-blue">
            <Icon name="globe" size={14} /> {mode === "locate" ? "Locate" : "Identify"}
          </p>
          {mode === "locate" ? (
            <div className="mt-2 flex items-center gap-3">
              <FlagImage code={target.code} name={target.name} src={target.flagUrl} className="h-14 w-20 rounded-xl p-1" />
              <h1 className="font-display text-2xl font-black">Tap {target.name}</h1>
            </div>
          ) : (
            <h1 className="mt-1 font-display text-2xl font-black">Which country is highlighted?</h1>
          )}
        </div>
      </header>

      <Suspense fallback={<div className={mode === "locate" ? "min-h-0 flex-1 animate-pulse rounded-[24px] bg-white shadow-card" : "h-[360px] animate-pulse rounded-[24px] bg-white shadow-card"} />}>
        <WorldMap
          countries={countries}
          highlightCode={isIdentify ? question.targetCode : undefined}
          correctCode={feedback?.country.code}
          wrongCode={feedback?.wrongCode}
          interactive={!feedback && mode === "locate"}
          onCountryTap={answer}
          mapClassName={mode === "locate" ? "min-h-0 flex-1 w-full" : "h-[400px] w-full"}
        />
      </Suspense>

      {question.type === "identify-country" && (
        <section className="mt-4 grid gap-3">
          {question.options.map((country) => {
            const selected = feedback && country.code === (feedback.ok ? target.code : feedback.wrongCode);
            const correctOption = feedback && country.code === target.code;
            return (
              <button
                key={country.code}
                disabled={Boolean(feedback)}
                onClick={() => answer(country.code)}
                className={`flaggo-tile bg-white p-4 text-left font-display font-extrabold ${
                  correctOption ? "border-flaggo-green text-flaggo-green" : selected ? "border-flaggo-red text-flaggo-red" : "border-flaggo-border text-flaggo-text"
                }`}
              >
                {country.name}
              </button>
            );
          })}
        </section>
      )}

      {feedback && (
        <FeedbackPanel
          correct={feedback.ok}
          country={feedback.country}
          xp={10}
          answerLabel={feedback.country.name}
          selectedLabel={feedback.wrongCode ? countryByCode.get(feedback.wrongCode)?.name : undefined}
          onContinue={continueNext}
        />
      )}
    </main>
  );
}
