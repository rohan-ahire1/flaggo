import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import FeedbackPanel from "../components/FeedbackPanel";
import FlagImage from "../components/FlagImage";
import Icon, { type IconName } from "../components/Icon";
import QuestionCard from "../components/QuestionCard";
import ResultCard from "../components/ResultCard";
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

const MODE_META: Record<ArcadeMode, { label: string; desc: string; icon: IconName }> = {
  timed: { label: "Timed", desc: "Answer as many as you can in 60s.", icon: "bolt" },
  sudden: { label: "Sudden death", desc: "One wrong answer ends the run.", icon: "flame" },
  hard: { label: "Hard", desc: "Lookalike flags & tough calls.", icon: "target" }
};

const TOPIC_META: Record<Topic, { label: string; icon: IconName }> = {
  flag: { label: "Flags", icon: "flag" },
  capital: { label: "Capitals", icon: "pin" },
  location: { label: "Location", icon: "globe" },
  currency: { label: "Currency", icon: "coin" },
  language: { label: "Language", icon: "book" },
  neighbor: { label: "Neighbours", icon: "target" }
};

type ArcadeQuestion =
  | { topic: Exclude<Topic, "location">; country: Country; question: Question }
  | { topic: "location"; country: Country; question: MapQuestion };

function answerLabel(question: ArcadeQuestion) {
  if (question.topic === "location") return question.country.name;
  if ("correctCurrency" in question.question) return question.question.correctCurrency;
  if ("correctLanguage" in question.question) return question.question.correctLanguage;
  if ("correctNeighbor" in question.question) return question.question.correctNeighbor.name;
  if ("correctCapital" in question.question) return question.question.correctCapital;
  return question.question.correctCountry.name;
}

export default function ArcadeScreen({
  countries,
  progress,
  onProgress,
  onBack,
  onOpenLeaderboard,
  onSignIn,
  onChallenge
}: {
  countries: Country[];
  progress: AppProgress;
  onProgress: (progress: AppProgress) => void;
  onBack: () => void;
  onOpenLeaderboard: () => void;
  onSignIn: () => void;
  onChallenge: () => void;
}) {
  const { user, displayName, setDisplayName } = useAuth();
  const [mode, setMode] = useState<ArcadeMode>("timed");
  const [topic, setTopic] = useState<Topic>(progress.selectedTopic);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [newBest, setNewBest] = useState(false);
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
    setNewBest(false);
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
    setNewBest(finalScore > (currentProgress.arcade[arcadeKey(mode, topic)] ?? 0));
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
      <main className="flex min-h-full flex-col p-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
          <div>
            <h1 className="screen-title">Arcade</h1>
            <p className="mt-1 text-sm font-semibold text-flaggo-muted">Endless rounds, three ways.</p>
          </div>
        </div>

        {done && (
          <div className="mt-5">
            <ResultCard
              icon="bolt"
              title="Run over"
              praise={newBest ? "New personal best!" : undefined}
              badge={newBest ? "New best!" : undefined}
              heroValue={`${score}`}
              heroCaption="You scored"
              confetti={newBest}
              stats={[{ icon: "star", label: "Best", value: `${Math.max(best, score)}`, tone: "text-flaggo-orange" }]}
              actions={[
                { label: "Challenge a friend", onClick: onChallenge },
                { label: "View leaderboard", onClick: onOpenLeaderboard, kind: "ghost" }
              ]}
            />
          </div>
        )}

        <div className="mt-7 flex flex-1 flex-col gap-7">
          <section className="grid gap-3">
            <h2 className="section-label">Mode</h2>
            {ARCADE_MODES.map((item) => {
              const on = mode === item;
              const meta = MODE_META[item];
              const modeBest = progress.arcade[arcadeKey(item, topic)] ?? 0;
              return (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  aria-pressed={on}
                  className={`flex items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-all ${on ? "border-flaggo-green bg-flaggo-green text-white shadow-button-green" : "border-line bg-white text-ink shadow-card"}`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${on ? "bg-white/15 text-white" : "bg-surface text-flaggo-green"}`}>
                    <Icon name={meta.icon} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[17px] font-black">{meta.label}</span>
                    <span className={`block text-[12.5px] font-semibold ${on ? "text-white/80" : "text-flaggo-muted"}`}>{meta.desc}</span>
                  </span>
                  <span className="shrink-0 pl-1 text-right">
                    <span className={`block text-[10px] font-bold uppercase tracking-wide ${on ? "text-white/70" : "text-flaggo-muted"}`}>Best</span>
                    <span className="block font-display text-lg font-black leading-none">{modeBest}</span>
                  </span>
                </button>
              );
            })}
          </section>

          <section className="grid gap-3">
            <h2 className="section-label">Category</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {TOPICS.map((item) => {
                const on = topic === item;
                const meta = TOPIC_META[item];
                return (
                  <button
                    key={item}
                    onClick={() => setTopic(item)}
                    aria-pressed={on}
                    className={`flex items-center gap-2.5 rounded-2xl border-2 px-3.5 py-3 transition-all ${on ? "border-flaggo-blue bg-flaggo-blue text-white shadow-button-blue" : "border-line bg-white text-ink shadow-card"}`}
                  >
                    <Icon name={meta.icon} size={19} className={on ? "text-white" : "text-flaggo-blue"} />
                    <span className="font-display text-[15px] font-extrabold">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-7 grid gap-3">
          <button onClick={start} disabled={!pool.length} className="flaggo-button bg-flaggo-green text-white disabled:opacity-50">Start run</button>
          {!user && <button onClick={onSignIn} className="font-display font-black text-flaggo-green underline">Sign in to compete</button>}
        </div>
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
