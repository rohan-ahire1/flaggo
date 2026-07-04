import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import FeedbackPanel from "../components/FeedbackPanel";
import FlagImage from "../components/FlagImage";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import QuestionCard from "../components/QuestionCard";
import { useAuth } from "../auth/AuthProvider";
import type { Country } from "../types/country";
import type { AppProgress } from "../types/progress";
import { applyDailyResult, buildDailyQuiz, dateKey, type DailyQuestion } from "../utils/dailyChallenge";
import { updateReviewState } from "../utils/spacedRepetition";
import { trackEvent } from "../lib/analytics";
import { dailyBoard, submitScore, updateDisplayName } from "../lib/leaderboard";
import { BRAND } from "../config/brand";

const WorldMap = lazy(() => import("../components/WorldMap"));

function answerLabel(question: DailyQuestion) {
  if (question.topic === "location") return question.country.name;
  if ("correctCurrency" in question.question) return question.question.correctCurrency;
  if ("correctLanguage" in question.question) return question.question.correctLanguage;
  if ("correctNeighbor" in question.question) return question.question.correctNeighbor.name;
  if ("correctCapital" in question.question) return question.question.correctCapital;
  if (question.question.type === "capital-true-false") return question.question.correctCountry.capital ?? question.question.correctCountry.name;
  return question.question.correctCountry.name;
}

export default function DailyChallengeScreen({
  countries,
  progress,
  onProgress,
  onHome,
  onOpenLeaderboard,
  onSignIn,
  onChallenge
}: {
  countries: Country[];
  progress: AppProgress;
  onProgress: (progress: AppProgress) => void;
  onHome: () => void;
  onOpenLeaderboard: () => void;
  onSignIn: () => void;
  onChallenge: () => void;
}) {
  const { user, displayName, setDisplayName } = useAuth();
  const today = dateKey();
  const questions = useMemo(() => buildDailyQuiz(today, countries), [countries, today]);
  const [index, setIndex] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; question: DailyQuestion; wrongCode?: string } | null>(null);
  const [complete, setComplete] = useState(false);
  const question = questions[index];

  useEffect(() => {
    trackEvent("daily_start", { date: today });
  }, [today]);

  async function ensureName() {
    if (!user) return null;
    if (displayName?.trim()) return displayName;
    const entered = window.prompt("Choose a leaderboard display name");
    if (!entered) return null;
    const clean = await updateDisplayName(user.id, entered);
    setDisplayName(clean);
    return clean;
  }

  function answer(ok: boolean, wrongCode?: string) {
    if (!question || feedback) return;
    const next = updateReviewState(question.country.code, question.topic, ok, currentProgress);
    const withXp = { ...next, xp: next.xp + (ok ? 10 : 0) };
    setCurrentProgress(withXp);
    onProgress(withXp);
    setCorrect((value) => value + (ok ? 1 : 0));
    setFeedback({ ok, question, wrongCode });
  }

  async function finish() {
    const result = { score: correct, total: questions.length };
    const next = applyDailyResult(currentProgress, today, result);
    setCurrentProgress(next);
    onProgress(next);
    setComplete(true);
    trackEvent("daily_complete", { date: today, score: result.score, streak: next.daily.streak });
    const name = await ensureName();
    if (name) await submitScore(dailyBoard(today), result.score, name);
  }

  function continueNext() {
    setFeedback(null);
    if (index >= questions.length - 1) void finish();
    else setIndex((value) => value + 1);
  }

  async function share() {
    const text = `${BRAND.name} Daily ${today} - ${correct}/${questions.length} streak ${currentProgress.daily.streak}\n${BRAND.url}`;
    if (navigator.share) await navigator.share({ text });
    else await navigator.clipboard?.writeText(text);
  }

  if (complete) {
    return (
      <main className="min-h-screen p-5">
        <button onClick={onHome} className="mb-5 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Go home">
          <Icon name="close" size={20} />
        </button>
        <section className="rounded-[28px] bg-white p-6 text-center shadow-card-lg">
          <Icon name="flame" size={44} className="mx-auto text-flaggo-red" />
          <h1 className="mt-3 screen-title">Daily complete</h1>
          <p className="mt-2 font-display text-5xl font-black text-flaggo-green">{correct}/{questions.length}</p>
          <p className="mt-1 font-bold text-flaggo-muted">Daily streak {currentProgress.daily.streak}</p>
          <div className="mt-5 grid gap-3">
            <button onClick={share} className="btn-primary">Share score</button>
            <button onClick={onChallenge} className="btn-secondary">Challenge a friend</button>
            <button onClick={onOpenLeaderboard} className="btn-secondary">Leaderboard</button>
            {!user && <button onClick={onSignIn} className="btn-ghost mt-1">Sign in to compete</button>}
          </div>
        </section>
      </main>
    );
  }

  if (!question) return <main className="grid min-h-screen place-items-center p-5"><button onClick={onHome} className="flaggo-button bg-flaggo-green text-white">Go Home</button></main>;

  return (
    <main className="min-h-screen bg-flaggo-bg">
      <header className="sticky top-0 z-20 bg-flaggo-bg/85 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={onHome} aria-label="Close daily" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-flaggo-muted shadow-card">
            <Icon name="close" size={20} />
          </button>
          <div className="flex-1"><ProgressBar value={(index / questions.length) * 100} /></div>
          <span className="shrink-0 text-sm font-display font-extrabold text-flaggo-muted">{index + 1}/{questions.length}</span>
        </div>
      </header>
      <section key={question.id} className="animate-fade-in p-5">
        {question.topic === "location" ? (
          <>
            <div className="mb-4 rounded-[24px] border border-flaggo-border bg-white p-4 shadow-card">
              <p className="flex items-center gap-1.5 text-xs font-display font-extrabold uppercase tracking-wide text-flaggo-blue"><Icon name="globe" size={14} /> Locate</p>
              <div className="mt-2 flex items-center gap-3">
                <FlagImage code={question.country.code} name={question.country.name} src={question.country.flagUrl} className="h-14 w-20 rounded-xl p-1" />
                <h1 className="font-display text-2xl font-black">Tap {question.country.name}</h1>
              </div>
            </div>
            <Suspense fallback={<div className="h-[360px] animate-pulse rounded-[24px] bg-white shadow-card" />}>
              <WorldMap
                countries={countries}
                correctCode={feedback?.ok ? question.country.code : undefined}
                wrongCode={feedback?.wrongCode}
                interactive={!feedback}
                onCountryTap={(code) => answer(code === question.country.code, code)}
              />
            </Suspense>
          </>
        ) : (
          <QuestionCard question={question.question} disabled={Boolean(feedback)} onAnswer={answer} />
        )}
      </section>
      {feedback && <FeedbackPanel correct={feedback.ok} country={feedback.question.country} xp={10} answerLabel={answerLabel(feedback.question)} onContinue={continueNext} />}
    </main>
  );
}
