import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import FeedbackPanel from "../components/FeedbackPanel";
import FlagImage from "../components/FlagImage";
import Icon from "../components/Icon";
import QuestionCard from "../components/QuestionCard";
import { useAuth } from "../auth/AuthProvider";
import type { ArcadeMode } from "../types/arcade";
import { ARCADE_MODES, arcadeKey } from "../types/arcade";
import type { Country } from "../types/country";
import type { AppProgress } from "../types/progress";
import type { Topic } from "../types/topic";
import { TOPICS } from "../types/topic";
import { arcadePool, arcadeScore, persistArcadeBest } from "../utils/arcade";
import { generateMapQuestions, generateReviewQuestions, type MapQuestion, type Question } from "../utils/quiz";
import { updateReviewState } from "../utils/spacedRepetition";
import { seededShuffle, hashStringToSeed, mulberry32 } from "../utils/seededRandom";
import { trackEvent } from "../lib/analytics";
import { arcadeBoard, submitScore, updateDisplayName } from "../lib/leaderboard";

const WorldMap = lazy(() => import("../components/WorldMap"));

type ArcadeQuestion =
  | { topic: "flag" | "capital"; country: Country; question: Question }
  | { topic: "location"; country: Country; question: MapQuestion };

function answerLabel(question: ArcadeQuestion) {
  if (question.topic === "location") return question.country.name;
  if ("correctCapital" in question.question) return question.question.correctCapital;
  return question.question.correctCountry.name;
}

export default function ArcadeScreen({
  countries,
  progress,
  onProgress,
  onBack,
  onOpenLeaderboard,
  onSignIn
}: {
  countries: Country[];
  progress: AppProgress;
  onProgress: (progress: AppProgress) => void;
  onBack: () => void;
  onOpenLeaderboard: () => void;
  onSignIn: () => void;
}) {
  const { user, displayName, setDisplayName } = useAuth();
  const [mode, setMode] = useState<ArcadeMode>("timed");
  const [topic, setTopic] = useState<Topic>(progress.selectedTopic);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [feedback, setFeedback] = useState<{ ok: boolean; question: ArcadeQuestion; wrongCode?: string } | null>(null);
  const [remaining, setRemaining] = useState(60);
  const pool = useMemo(() => arcadePool(countries, mode, topic), [countries, mode, topic]);
  const questions = useMemo<ArcadeQuestion[]>(() => {
    const rng = mulberry32(hashStringToSeed(`arcade-${mode}-${topic}-${running ? Date.now() : 0}`));
    const shuffled = seededShuffle(pool, rng).slice(0, 60);
    if (topic === "location") return generateMapQuestions(shuffled, "locate", rng).map((question) => ({ topic, country: shuffled.find((country) => country.code === question.targetCode)!, question }));
    return generateReviewQuestions(shuffled, topic, rng).map((question) => ({ topic, country: question.correctCountry, question }));
  }, [mode, pool, running, topic]);
  const question = questions[index % Math.max(questions.length, 1)];
  const score = arcadeScore(mode, answers);
  const best = progress.arcade[arcadeKey(mode, topic)] ?? 0;

  useEffect(() => {
    if (!running || done) return;
    const id = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [done, running]);

  useEffect(() => {
    if (running && remaining === 0) void finish();
  }, [remaining, running]);

  async function ensureName() {
    if (!user) return null;
    if (displayName?.trim()) return displayName;
    const entered = window.prompt("Choose a leaderboard display name");
    if (!entered) return null;
    const clean = await updateDisplayName(user.id, entered);
    setDisplayName(clean);
    return clean;
  }

  function start() {
    setRunning(true);
    setDone(false);
    setIndex(0);
    setAnswers([]);
    setFeedback(null);
    setRemaining(mode === "hard" ? 60 : 60);
    trackEvent("arcade_start", { mode, topic });
  }

  function answer(ok: boolean, wrongCode?: string) {
    if (!question || feedback || done) return;
    const next = updateReviewState(question.country.code, topic, ok, currentProgress);
    setCurrentProgress(next);
    onProgress(next);
    setAnswers((value) => [...value, ok]);
    setFeedback({ ok, question, wrongCode });
    if (mode === "sudden" && !ok) window.setTimeout(() => void finish([...answers, ok]), 250);
  }

  async function finish(finalAnswers = answers) {
    if (done) return;
    const finalScore = arcadeScore(mode, finalAnswers);
    const next = persistArcadeBest(currentProgress, mode, topic, finalScore);
    setCurrentProgress(next);
    onProgress(next);
    setDone(true);
    setRunning(false);
    trackEvent("arcade_complete", { mode, topic, score: finalScore });
    const name = await ensureName();
    if (name) await submitScore(arcadeBoard(mode, topic), Math.max(next.arcade[arcadeKey(mode, topic)] ?? 0, finalScore), name);
  }

  function continueNext() {
    setFeedback(null);
    if (index >= questions.length - 1 || (mode === "hard" && remaining <= 0)) void finish();
    else setIndex((value) => value + 1);
  }

  if (!running) {
    return (
      <main className="p-5 pb-24">
        <button onClick={onBack} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
        <h1 className="font-display text-3xl font-black">Arcade</h1>
        {done && (
          <section className="mt-4 rounded-[24px] bg-white p-5 text-center shadow-card">
            <p className="font-display text-5xl font-black text-flaggo-green">{score}</p>
            <p className="font-bold text-flaggo-muted">Best {Math.max(best, score)}</p>
            <button onClick={onOpenLeaderboard} className="mt-3 font-display font-black text-flaggo-blue underline">Leaderboard</button>
          </section>
        )}
        <section className="mt-5 grid gap-4">
          <div className="grid grid-cols-3 rounded-2xl bg-white p-1 shadow-card">
            {ARCADE_MODES.map((item) => <button key={item} onClick={() => setMode(item)} className={`rounded-xl px-2 py-2 font-display text-xs font-extrabold capitalize ${mode === item ? "bg-flaggo-green text-white" : "text-flaggo-muted"}`}>{item}</button>)}
          </div>
          <div className="grid grid-cols-3 rounded-2xl bg-white p-1 shadow-card">
            {TOPICS.map((item) => <button key={item} onClick={() => setTopic(item)} className={`rounded-xl px-2 py-2 font-display text-xs font-extrabold capitalize ${topic === item ? "bg-flaggo-blue text-white" : "text-flaggo-muted"}`}>{item}</button>)}
          </div>
          <button onClick={start} disabled={!pool.length} className="flaggo-button bg-flaggo-green text-white disabled:opacity-50">Start run</button>
          {!user && <button onClick={onSignIn} className="font-display font-black text-flaggo-green underline">Sign in to compete</button>}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-flaggo-bg">
      <header className="sticky top-0 z-20 bg-flaggo-bg/85 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => void finish()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="End run"><Icon name="close" size={20} /></button>
          <div className="flex-1 rounded-full bg-white px-4 py-2 font-display font-black shadow-card">Score {score}</div>
          <span className="rounded-full bg-flaggo-red px-4 py-2 font-display font-black text-white">{remaining}s</span>
        </div>
      </header>
      <section key={index} className="animate-fade-in p-5">
        {question.topic === "location" ? (
          <>
            <div className="mb-4 rounded-[24px] border border-flaggo-border bg-white p-4 shadow-card">
              <div className="mt-2 flex items-center gap-3">
                <FlagImage code={question.country.code} name={question.country.name} src={question.country.flagUrl} className="h-14 w-20 rounded-xl p-1" />
                <h1 className="font-display text-2xl font-black">Tap {question.country.name}</h1>
              </div>
            </div>
            <Suspense fallback={<div className="h-[360px] animate-pulse rounded-[24px] bg-white shadow-card" />}>
              <WorldMap countries={countries} correctCode={feedback?.ok ? question.country.code : undefined} wrongCode={feedback?.wrongCode} interactive={!feedback} onCountryTap={(code) => answer(code === question.country.code, code)} />
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
