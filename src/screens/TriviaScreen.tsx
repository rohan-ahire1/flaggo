import { useEffect, useMemo, useState } from "react";
import Icon, { type IconName } from "../components/Icon";
import { TriviaCard } from "../components/QuestionCard";
import type { Country } from "../types/country";
import type { AppProgress } from "../types/progress";
import { arcadeScore } from "../utils/arcade";
import { hashStringToSeed, mulberry32 } from "../utils/seededRandom";
import { buildTrivia, type TriviaMode, type TriviaRound } from "../utils/trivia";
import { trackEvent } from "../lib/analytics";

const MODES: { mode: TriviaMode; label: string; desc: string; icon: IconName }[] = [
  { mode: "higher-lower", label: "Higher / Lower", desc: "Pick which country ranks higher.", icon: "stats" },
  { mode: "odd-one-out", label: "Odd one out", desc: "Spot the one that doesn't belong.", icon: "search" },
  { mode: "true-false", label: "True / False", desc: "Decide if the claim holds up.", icon: "check" }
];

type RunMode = "timed" | "sudden";

const FORMATS: { mode: RunMode; label: string; icon: IconName }[] = [
  { mode: "timed", label: "Timed", icon: "bolt" },
  { mode: "sudden", label: "Sudden death", icon: "flame" }
];

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
      <main className="flex min-h-full flex-col p-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back">
            <Icon name="chevron" className="rotate-180" />
          </button>
          <div>
            <h1 className="screen-title">Trivia</h1>
            <p className="mt-1 text-sm font-semibold text-flaggo-muted">Quick-fire rounds to test your instincts.</p>
          </div>
        </div>

        {done && (
          <section className="mt-5 rounded-[24px] bg-green-grad p-6 text-center text-white shadow-glow">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">You scored</p>
            <p className="font-display text-6xl font-black leading-none">{score}</p>
            <p className="mt-1 font-bold text-white/80">Best {Math.max(best, score)}</p>
          </section>
        )}

        <div className="mt-7 flex flex-1 flex-col gap-7">
          <section className="grid gap-3">
            <h2 className="section-label">Mode</h2>
            {MODES.map((item) => {
              const on = mode === item.mode;
              const modeBest = progress.arcade[triviaKey(item.mode)] ?? 0;
              return (
                <button
                  key={item.mode}
                  onClick={() => setMode(item.mode)}
                  aria-pressed={on}
                  className={`flex items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-all ${on ? "border-flaggo-green bg-flaggo-green text-white shadow-button-green" : "border-line bg-white text-ink shadow-card"}`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${on ? "bg-white/15 text-white" : "bg-surface text-flaggo-green"}`}>
                    <Icon name={item.icon} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[17px] font-black">{item.label}</span>
                    <span className={`block text-[12.5px] font-semibold ${on ? "text-white/80" : "text-flaggo-muted"}`}>{item.desc}</span>
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
            <h2 className="section-label">Format</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {FORMATS.map((item) => {
                const on = runMode === item.mode;
                return (
                  <button
                    key={item.mode}
                    onClick={() => setRunMode(item.mode)}
                    aria-pressed={on}
                    className={`flex items-center gap-2.5 rounded-2xl border-2 px-3.5 py-3 transition-all ${on ? "border-flaggo-blue bg-flaggo-blue text-white shadow-button-blue" : "border-line bg-white text-ink shadow-card"}`}
                  >
                    <Icon name={item.icon} size={19} className={on ? "text-white" : "text-flaggo-blue"} />
                    <span className="font-display text-[15px] font-extrabold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-7">
          <button onClick={start} className="flaggo-button w-full bg-flaggo-green text-white">Start trivia</button>
        </div>
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
