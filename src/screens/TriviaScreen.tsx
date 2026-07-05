import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Icon, { type IconName } from "../components/Icon";
import FeedbackPanel from "../components/FeedbackPanel";
import { TriviaCard } from "../components/QuestionCard";
import RoundResults, { type RoundResultItem } from "../components/RoundResults";
import { useConfirm } from "../components/ConfirmDialog";
import { arcadeScore } from "@flaggo/core/utils/arcade";
import { hashStringToSeed, mulberry32 } from "@flaggo/core/utils/seededRandom";
import { buildTrivia, type TriviaMode, type TriviaRound } from "@flaggo/core/utils/trivia";
import { triviaBoard } from "@flaggo/core/game/boards";
import { useNameClaim } from "../components/NameClaimProvider";
import { trackEvent } from "../lib/analytics";
import { submitScore } from "../lib/leaderboard";
import { useGame } from "../state/GameProvider";

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

const triviaKey = triviaBoard;

function answerLabel(round: TriviaRound) {
  if (round.mode === "higher-lower") return round.correctCountry.name;
  if (round.mode === "odd-one-out") return round.correctCountry.name;
  return round.answer ? "True" : "False";
}

function roundCountry(round: TriviaRound) {
  return "correctCountry" in round ? round.correctCountry : round.countries[0];
}

export default function TriviaScreen() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user } = useAuth();
  const { ensureName } = useNameClaim();
  const { countries, progress, setProgress } = useGame();
  const [mode, setMode] = useState<TriviaMode>("higher-lower");
  const [runMode, setRunMode] = useState<RunMode>("timed");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [seed, setSeed] = useState("idle");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; round: TriviaRound } | null>(null);
  const [remaining, setRemaining] = useState(60);
  const [startedAt, setStartedAt] = useState(0);
  const [items, setItems] = useState<RoundResultItem[]>([]);
  const rounds = useMemo(() => {
    const rng = mulberry32(hashStringToSeed(seed));
    return Array.from({ length: 60 }, () => buildTrivia(mode, countries, rng));
  }, [countries, mode, seed]);
  const round = rounds[index % Math.max(rounds.length, 1)];
  const score = arcadeScore(runMode === "sudden" ? "sudden" : "timed", answers);
  const best = progress.arcade[triviaKey(mode)] ?? 0;

  useEffect(() => {
    if (!running || done || runMode === "sudden") return;
    const id = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((startedAt + 60000 - Date.now()) / 1000)));
    }, 250);
    return () => window.clearInterval(id);
  }, [done, runMode, running, startedAt]);

  useEffect(() => {
    if (running && remaining === 0) finish();
  }, [remaining, running]);

  function start() {
    setSeed(`trivia-${mode}-${runMode}-${Date.now()}`);
    setRunning(true);
    setDone(false);
    setIndex(0);
    setAnswers([]);
    setItems([]);
    setFeedback(null);
    setStartedAt(Date.now());
    setRemaining(60);
    trackEvent("trivia_start", { mode, runMode });
  }

  function answer(ok: boolean, selectedLabel?: string) {
    if (!round || feedback || done) return;
    const country = roundCountry(round);
    setAnswers((value) => [...value, ok]);
    setItems((value) => [...value, {
      label: country.name,
      correct: ok,
      chosen: ok ? undefined : selectedLabel,
      answer: answerLabel(round),
      countryCode: country.code,
      countryName: country.name,
      flagUrl: country.flagUrl,
      context: [country.subregion, country.capital ? `Capital: ${country.capital}` : ""].filter(Boolean).join(" · ")
    }]);
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
    setProgress(next);
    setAnswers(finalAnswers);
    setDone(true);
    setRunning(false);
    trackEvent("trivia_complete", { mode, runMode, score: finalScore });
    if (user) {
      const bestScore = Math.max(progress.arcade[key] ?? 0, finalScore);
      void ensureName()
        .then((name) => {
          if (name) return submitScore(triviaBoard(mode), bestScore, name);
        })
        .catch(() => undefined);
    }
  }

  function continueNext() {
    setFeedback(null);
    if (index >= rounds.length - 1 || remaining <= 0) finish();
    else setIndex((value) => value + 1);
  }

  async function closeRound() {
    if (answers.length > 0 && !done) {
      const ok = await confirm({
        title: "End this round?",
        body: "Answered questions are already counted.",
        confirmLabel: "End round",
        destructive: true
      });
      if (!ok) return;
    }
    finish();
  }

  if (done) {
    return (
      <RoundResults
        score={score}
        total={items.length}
        items={items}
        caption={`Best ${Math.max(best, score)}`}
        actions={[
          { label: "Play again", variant: "primary", icon: "play", onPress: start },
          { label: "Done", variant: "secondary", icon: "today", onPress: () => navigate("/") }
        ]}
      />
    );
  }

  if (!running) {
    return (
      <main className="flex min-h-full flex-col p-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-muted shadow-card" aria-label="Back">
            <Icon name="chevron" className="rotate-180" />
          </button>
          <div>
            <h1 className="screen-title">Trivia</h1>
            <p className="mt-1 text-sm font-semibold text-muted">Quick-fire rounds to test your instincts.</p>
          </div>
        </div>

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
                  className={`flex items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-all ${on ? "border-primary bg-primary text-white shadow-button" : "border-line bg-paper text-ink shadow-card"}`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${on ? "bg-paper/15 text-white" : "bg-surface text-primary"}`}>
                    <Icon name={item.icon} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[17px] font-semibold">{item.label}</span>
                    <span className={`block text-[12.5px] font-semibold ${on ? "text-white/80" : "text-muted"}`}>{item.desc}</span>
                  </span>
                  <span className="shrink-0 pl-1 text-right">
                    <span className={`block text-[10px] font-bold uppercase tracking-wide ${on ? "text-white/70" : "text-muted"}`}>Best</span>
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
                    className={`flex items-center gap-2.5 rounded-2xl border-2 px-3.5 py-3 transition-all ${on ? "border-primary bg-primary text-white shadow-button" : "border-line bg-paper text-ink shadow-card"}`}
                  >
                    <Icon name={item.icon} size={19} className={on ? "text-white" : "text-primary"} />
                    <span className="font-display text-[15px] font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-7">
          <button onClick={start} className="btn-primary w-full">Start trivia</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 bg-paper/85 p-4 backdrop-blur-md">
        <p className="mb-2.5 text-center font-display text-[13px] font-bold uppercase tracking-wide text-muted">Trivia</p>
        <div className="flex items-center gap-3">
          <button onClick={() => void closeRound()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-muted shadow-card" aria-label="End run"><Icon name="close" size={20} /></button>
          <div className="flex-1 rounded-full bg-paper px-4 py-2 font-display font-bold shadow-card">Score {score}</div>
          {runMode !== "sudden" && <span className={`rounded-full bg-error px-4 py-2 font-display font-black text-white ${remaining <= 10 ? "animate-pulse" : ""}`}>{remaining}s</span>}
        </div>
      </header>
      <section key={round.id} className="animate-fade-in p-5">
        <TriviaCard round={round} disabled={Boolean(feedback)} onAnswer={answer} />
      </section>
      {feedback && <FeedbackPanel correct={feedback.ok} country={roundCountry(feedback.round)} xp={0} answerLabel={answerLabel(feedback.round)} onContinue={continueNext} />}
    </main>
  );
}
