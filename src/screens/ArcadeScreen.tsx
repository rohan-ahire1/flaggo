import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeedbackPanel from "../components/FeedbackPanel";
import FlagImage from "../components/FlagImage";
import Icon, { type IconName } from "../components/Icon";
import QuestionCard from "../components/QuestionCard";
import RoundResults, { type RoundResultItem } from "../components/RoundResults";
import { useConfirm } from "../components/ConfirmDialog";
import { useAuth } from "../auth/AuthProvider";
import { useNameClaim } from "../components/NameClaimProvider";
import type { ArcadeMode } from "@flaggo/core/types/arcade";
import { ARCADE_MODES, arcadeKey } from "@flaggo/core/types/arcade";
import type { Country } from "@flaggo/core/types/country";
import type { Topic } from "@flaggo/core/types/topic";
import { TOPICS } from "@flaggo/core/types/topic";
import { arcadePool, arcadeScore, persistArcadeBest } from "@flaggo/core/utils/arcade";
import { generateMapQuestions, generateReviewQuestions, type MapQuestion, type Question } from "@flaggo/core/utils/quiz";
import { updateReviewState } from "@flaggo/core/utils/spacedRepetition";
import { seededShuffle, hashStringToSeed, mulberry32 } from "@flaggo/core/utils/seededRandom";
import { answerLabel, answerLabelForWrapper } from "@flaggo/core/game/answerLabel";
import { awardBadges, evaluateBadges } from "@flaggo/core/game/badges";
import { trackEvent } from "../lib/analytics";
import { earnedBadgeResults } from "../lib/badges";
import { arcadeBoard, submitScore } from "../lib/leaderboard";
import { useGame } from "../state/GameProvider";

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

export default function ArcadeScreen() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user } = useAuth();
  const { ensureName } = useNameClaim();
  const { countries, lessons, progress, setProgress, openSignIn, createAndShareChallenge } = useGame();
  const [mode, setMode] = useState<ArcadeMode>("timed");
  const [topic, setTopic] = useState<Topic>(progress.selectedTopic);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [feedback, setFeedback] = useState<{ ok: boolean; question: ArcadeQuestion; wrongCode?: string } | null>(null);
  const [remaining, setRemaining] = useState(60);
  const [startedAt, setStartedAt] = useState(0);
  const [items, setItems] = useState<RoundResultItem[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
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

  const runSeconds = mode === "hard" ? 45 : 60;

  useEffect(() => {
    if (!running || done || mode === "sudden") return;
    const id = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((startedAt + runSeconds * 1000 - Date.now()) / 1000)));
    }, 250);
    return () => window.clearInterval(id);
  }, [done, mode, runSeconds, running, startedAt]);

  useEffect(() => {
    if (running && remaining === 0) void finish();
  }, [remaining, running]);

  function start() {
    setRunning(true);
    setDone(false);
    setIndex(0);
    setAnswers([]);
    setItems([]);
    setEarnedBadgeIds([]);
    setFeedback(null);
    setStartedAt(Date.now());
    setRemaining(runSeconds);
    trackEvent("arcade_start", { mode, topic });
  }

  function answer(ok: boolean, selectedLabel?: string) {
    if (!question || feedback || done) return;
    const next = updateReviewState(question.country.code, topic, ok, currentProgress);
    setCurrentProgress(next);
    setProgress(next);
    setAnswers((value) => [...value, ok]);
    const chosenLabel = question.topic === "location" && selectedLabel ? countries.find((country) => country.code === selectedLabel)?.name ?? selectedLabel : selectedLabel;
    setItems((value) => [...value, {
      label: question.country.name,
      correct: ok,
      chosen: ok ? undefined : chosenLabel,
      answer: question.topic === "location" ? question.country.name : answerLabel(question.question),
      countryCode: question.country.code,
      countryName: question.country.name,
      flagUrl: question.country.flagUrl,
      context: [question.country.subregion, question.country.capital ? `Capital: ${question.country.capital}` : ""].filter(Boolean).join(" · ")
    }]);
    setFeedback({ ok, question, wrongCode: selectedLabel });
    if (mode === "sudden" && !ok) window.setTimeout(() => void finish([...answers, ok]), 250);
  }

  async function finish(finalAnswers = answers) {
    if (done) return;
    const finalScore = arcadeScore(mode, finalAnswers);
    let next = persistArcadeBest(currentProgress, mode, topic, finalScore);
    const newIds = evaluateBadges(next, countries, lessons, { kind: "arcade", arcadeMode: mode, score: finalScore, total: finalAnswers.length });
    if (newIds.length) next = awardBadges(next, newIds);
    setEarnedBadgeIds(newIds);
    setCurrentProgress(next);
    setProgress(next);
    setAnswers(finalAnswers);
    setDone(true);
    setRunning(false);
    trackEvent("arcade_complete", { mode, topic, score: finalScore });
    const name = await ensureName();
    if (name) await submitScore(arcadeBoard(mode, topic), Math.max(next.arcade[arcadeKey(mode, topic)] ?? 0, finalScore), name);
  }

  function continueNext() {
    setFeedback(null);
    if (index >= questions.length - 1 || (mode !== "sudden" && remaining <= 0)) void finish();
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
    void finish();
  }

  if (done) {
    return (
      <RoundResults
        score={score}
        total={items.length}
        items={items}
        caption={`Best ${Math.max(best, score)}`}
        earnedBadges={earnedBadgeResults(earnedBadgeIds)}
        actions={[
          { label: "Play again", variant: "primary", icon: "play", onPress: start },
          { label: "Challenge a friend", variant: "secondary", icon: "flag", onPress: () => void createAndShareChallenge() },
          { label: "View leaderboard", variant: "secondary", icon: "trophy", onPress: () => navigate("/leaderboard") },
          { label: "Done", variant: "secondary", icon: "today", onPress: () => navigate("/") }
        ]}
      />
    );
  }

  if (!running) {
    return (
      <main className="flex min-h-full flex-col p-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-muted shadow-card" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
          <div>
            <h1 className="screen-title">Arcade</h1>
            <p className="mt-1 text-sm font-semibold text-muted">Endless rounds, three ways.</p>
          </div>
        </div>

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
                  className={`flex items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-all ${on ? "border-primary bg-primary text-white shadow-button" : "border-line bg-paper text-ink shadow-card"}`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${on ? "bg-paper/15 text-white" : "bg-surface text-primary"}`}>
                    <Icon name={meta.icon} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[17px] font-semibold">{meta.label}</span>
                    <span className={`block text-[12.5px] font-semibold ${on ? "text-white/80" : "text-muted"}`}>{meta.desc}</span>
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
                    className={`flex items-center gap-2.5 rounded-2xl border-2 px-3.5 py-3 transition-all ${on ? "border-primary bg-primary text-white shadow-button" : "border-line bg-paper text-ink shadow-card"}`}
                  >
                    <Icon name={meta.icon} size={19} className={on ? "text-white" : "text-primary"} />
                    <span className="font-display text-[15px] font-semibold">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-7 grid gap-3">
          <button onClick={start} disabled={!pool.length} className="btn-primary disabled:opacity-50">Start run</button>
          {!user && <button onClick={openSignIn} className="font-display font-bold text-primary underline">Sign in to compete</button>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 bg-paper/85 p-4 backdrop-blur-md">
        <p className="mb-2.5 text-center font-display text-[13px] font-bold uppercase tracking-wide text-muted">Arcade · {TOPIC_META[topic].label} · {MODE_META[mode].label}</p>
        <div className="flex items-center gap-3">
          <button onClick={() => void closeRound()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-muted shadow-card" aria-label="End run"><Icon name="close" size={20} /></button>
          <div className="flex-1 rounded-full bg-paper px-4 py-2 font-display font-bold shadow-card">Score {score}</div>
          {mode !== "sudden" && <span className={`rounded-full bg-error px-4 py-2 font-display font-black text-white ${remaining <= 10 ? "animate-pulse" : ""}`}>{remaining}s</span>}
        </div>
      </header>
      <section key={index} className="animate-fade-in p-5">
        {question.topic === "location" ? (
          <>
            <div className="mb-4 rounded-[24px] border border-line bg-paper p-4 shadow-card">
              <div className="mt-2 flex items-center gap-3">
                <FlagImage code={question.country.code} name={question.country.name} src={question.country.flagUrl} className="h-14 w-20 rounded-xl p-1" />
                <h1 className="font-display text-2xl font-semibold">Tap {question.country.name}</h1>
              </div>
            </div>
            <Suspense fallback={<div className="h-[360px] animate-pulse rounded-[24px] bg-paper shadow-card" />}>
              <WorldMap countries={countries} correctCode={feedback?.ok ? question.country.code : undefined} wrongCode={feedback?.wrongCode} interactive={!feedback} onCountryTap={(code) => answer(code === question.country.code, code)} />
            </Suspense>
          </>
        ) : (
          <QuestionCard question={question.question} disabled={Boolean(feedback)} onAnswer={answer} />
        )}
      </section>
      {feedback && <FeedbackPanel correct={feedback.ok} country={feedback.question.country} xp={10} answerLabel={answerLabelForWrapper(feedback.question)} onContinue={continueNext} />}
    </main>
  );
}
