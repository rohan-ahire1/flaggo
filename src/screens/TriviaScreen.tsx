import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import { TriviaCard } from "../components/QuestionCard";
import type { Country } from "../types/country";
import type { AppProgress } from "../types/progress";
import { arcadeScore } from "../utils/arcade";
import { hashStringToSeed, mulberry32 } from "../utils/seededRandom";
import { buildTrivia, type TriviaMode, type TriviaRound } from "../utils/trivia";
import { trackEvent } from "../lib/analytics";

const MODES: { mode: TriviaMode; label: string }[] = [
  { mode: "higher-lower", label: "Higher/Lower" },
  { mode: "odd-one-out", label: "Odd one out" },
  { mode: "true-false", label: "True/False" }
];

type RunMode = "timed" | "sudden";

const triviaKey = (mode: TriviaMode) => `trivia-${mode}`;

function answerLabel(round: TriviaRound) {
  if (round.mode === "higher-lower") return round.correctCountry.name;
  if (round.mode === "odd-one-out") return round.correctCountry.name;
  return round.answer ? "True" : "False";
}

export default function TriviaScreen({
  countries,
  progress,
  onProgress,
  onBack
}: {
  countries: Country[];
  progress: AppProgress;
  onProgress: (progress: AppProgress) => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<TriviaMode>("higher-lower");
  const [runMode, setRunMode] = useState<RunMode>("timed");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [seed, setSeed] = useState("idle");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; round: TriviaRound } | null>(null);
  const [remaining, setRemaining] = useState(60);
  const rounds = useMemo(() => {
    const rng = mulberry32(hashStringToSeed(seed));
    return Array.from({ length: 60 }, () => buildTrivia(mode, countries, rng));
  }, [countries, mode, seed]);
  const round = rounds[index % Math.max(rounds.length, 1)];
  const score = arcadeScore(runMode === "sudden" ? "sudden" : "timed", answers);
  const best = progress.arcade[triviaKey(mode)] ?? 0;

  useEffect(() => {
    if (!running || done) return;
    const id = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [done, running]);

  useEffect(() => {
    if (running && remaining === 0) finish();
  }, [remaining, running]);

  function start() {
    setSeed(`trivia-${mode}-${runMode}-${Date.now()}`);
    setRunning(true);
    setDone(false);
    setIndex(0);
    setAnswers([]);
    setFeedback(null);
    setRemaining(60);
    trackEvent("trivia_start", { mode, runMode });
  }

  function answer(ok: boolean) {
    if (!round || feedback || done) return;
    setAnswers((value) => [...value, ok]);
    setFeedback({ ok, round });
    if (runMode === "sudden" && !ok) window.setTimeout(() => finish([...answers, ok]), 250);
  }

  function finish(finalAnswers = answers) {
    if (done) return;
    const finalScore = arcadeScore(runMode === "sudden" ? "sudden" : "timed", finalAnswers);
    const key = triviaKey(mode);
    const next = {
      ...progress,
      arcade: {
        ...progress.arcade,
        [key]: Math.max(progress.arcade[key] ?? 0, finalScore)
      }
    };
    onProgress(next);
    setDone(true);
    setRunning(false);
    trackEvent("trivia_complete", { mode, runMode, score: finalScore });
  }

  function continueNext() {
    setFeedback(null);
    if (index >= rounds.length - 1 || remaining <= 0) finish();
    else setIndex((value) => value + 1);
  }

  if (!running) {
    return (
      <main className="p-5 pb-24">
        <button onClick={onBack} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back">
          <Icon name="chevron" className="rotate-180" />
        </button>
        <h1 className="font-display text-3xl font-black">Trivia</h1>
        {done && (
          <section className="mt-4 rounded-[24px] bg-white p-5 text-center shadow-card">
            <p className="font-display text-5xl font-black text-flaggo-green">{score}</p>
            <p className="font-bold text-flaggo-muted">Best {Math.max(best, score)}</p>
          </section>
        )}
        <section className="mt-5 grid gap-4">
          <div className="grid grid-cols-2 rounded-2xl bg-white p-1 shadow-card">
            {(["timed", "sudden"] as const).map((item) => (
              <button key={item} onClick={() => setRunMode(item)} className={`rounded-xl px-2 py-2 font-display text-xs font-extrabold capitalize ${runMode === item ? "bg-flaggo-green text-white" : "text-flaggo-muted"}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 rounded-2xl bg-white p-1 shadow-card">
            {MODES.map((item) => (
              <button key={item.mode} onClick={() => setMode(item.mode)} className={`rounded-xl px-2 py-2 font-display text-xs font-extrabold ${mode === item.mode ? "bg-flaggo-blue text-white" : "text-flaggo-muted"}`}>
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={start} className="flaggo-button bg-flaggo-green text-white">Start trivia</button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-flaggo-bg">
      <header className="sticky top-0 z-20 bg-flaggo-bg/85 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => finish()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="End run"><Icon name="close" size={20} /></button>
          <div className="flex-1 rounded-full bg-white px-4 py-2 font-display font-black shadow-card">Score {score}</div>
          <span className="rounded-full bg-flaggo-red px-4 py-2 font-display font-black text-white">{remaining}s</span>
        </div>
      </header>
      <section key={round.id} className="animate-fade-in p-5">
        <TriviaCard round={round} disabled={Boolean(feedback)} onAnswer={answer} />
      </section>
      {feedback && (
        <section className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md rounded-t-[28px] border-t border-flaggo-border bg-white p-5 shadow-soft md:max-w-2xl lg:max-w-3xl">
          <p className={`font-display text-2xl font-black ${feedback.ok ? "text-flaggo-green" : "text-flaggo-red"}`}>{feedback.ok ? "Correct" : "Not quite"}</p>
          <p className="mt-1 font-bold text-flaggo-muted">Answer: {answerLabel(feedback.round)}</p>
          <button onClick={continueNext} className="flaggo-button mt-4 w-full bg-flaggo-green text-white">Continue</button>
        </section>
      )}
    </main>
  );
}
