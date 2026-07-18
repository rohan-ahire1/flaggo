import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FeedbackPanel from "../components/FeedbackPanel";
import FlagImage from "../components/FlagImage";
import Icon, { type IconName } from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import QuestionCard from "../components/QuestionCard";
import RoundResults, { type RoundResultItem } from "../components/RoundResults";
import type { Country } from "@flaggo/core/types/country";
import type { AppProgress } from "@flaggo/core/types/progress";
import { reviewKey } from "@flaggo/core/types/topic";
import { generateReviewQuestions, type Question } from "@flaggo/core/utils/quiz";
import { progressivePracticeBatch, progressiveResults, type ProgressiveStage } from "@flaggo/core/utils/progressivePractice";
import { updateReviewState } from "@flaggo/core/utils/spacedRepetition";
import { seededShuffle, hashStringToSeed, mulberry32 } from "@flaggo/core/utils/seededRandom";
import { answerLabel } from "@flaggo/core/game/answerLabel";
import { awardBadges, evaluateBadges } from "@flaggo/core/game/badges";
import { trackEvent } from "../lib/analytics";
import { earnedBadgeResults } from "../lib/badges";
import { useGame } from "../state/GameProvider";

type PracticeMode = "timed" | "strikes" | "progressive";
type SetupTab = "practice" | "results";

const TIMED_SECONDS = 120;
const STRIKE_LIMIT = 3;
const PROGRESSIVE_BATCH_SIZE = 8;
const CHALLENGE_QUESTION_COUNT = 60;

const MODE_META: Record<PracticeMode, { label: string; desc: string; detail: string; icon: IconName }> = {
  timed: {
    label: "120s timed",
    desc: "A focused two-minute flag round.",
    detail: "Answer at your own pace until the timer ends.",
    icon: "bolt"
  },
  strikes: {
    label: "Three strikes",
    desc: "The round ends after three misses.",
    detail: "Correct answers keep the round going. Your third incorrect answer ends it.",
    icon: "heart"
  },
  progressive: {
    label: "Progressive learning",
    desc: "Learn easier flags first and repeat mistakes.",
    detail: "Untimed and built for recall: weak flags return until they start to stick.",
    icon: "learn"
  }
};

const STAGE_LABEL: Record<ProgressiveStage, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard"
};

function questionSet(countries: Country[], count: number, rng: () => number, optionCountries: Country[]) {
  const selected = seededShuffle(countries, rng).slice(0, count);
  const questions: Question[] = [];
  for (let index = 0; index < selected.length; index += 8) {
    questions.push(...generateReviewQuestions(selected.slice(index, index + 8), "flag", rng, optionCountries));
  }
  return questions.slice(0, count);
}

export default function ArcadeScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { countries, lessons, progress, setProgress } = useGame();
  const requestedMode = searchParams.get("mode");
  const shouldAutoStart = searchParams.get("start") === "1";
  const autoStartHandled = useRef(false);
  const initialMode: PracticeMode = requestedMode === "timed" || requestedMode === "strikes" ? requestedMode : "progressive";
  const [mode, setMode] = useState<PracticeMode>(initialMode);
  const [setupTab, setSetupTab] = useState<SetupTab>(searchParams.get("tab") === "results" && initialMode === "progressive" ? "results" : "practice");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [feedback, setFeedback] = useState<{ ok: boolean; question: Question; selectedLabel?: string } | null>(null);
  const [remaining, setRemaining] = useState(TIMED_SECONDS);
  const [startedAt, setStartedAt] = useState(0);
  const [stage, setStage] = useState<ProgressiveStage>("easy");
  const [items, setItems] = useState<RoundResultItem[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);

  const question = questions[index];
  const score = answers.filter(Boolean).length;
  const mistakes = answers.length - score;

  useEffect(() => {
    if (!running || done || mode !== "timed") return;
    const id = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((startedAt + TIMED_SECONDS * 1000 - Date.now()) / 1000)));
    }, 250);
    return () => window.clearInterval(id);
  }, [done, mode, running, startedAt]);

  useEffect(() => {
    if (!shouldAutoStart || autoStartHandled.current) return;
    autoStartHandled.current = true;
    start("progressive");
  }, [shouldAutoStart]);

  useEffect(() => {
    if (running && mode === "timed" && remaining === 0) finish(answers);
  }, [remaining, running]);

  function start(nextMode: PracticeMode = mode) {
    const seed = Date.now();
    const rng = mulberry32(hashStringToSeed(`flag-practice-${nextMode}-${seed}`));
    let nextQuestions: Question[];
    if (nextMode === "progressive") {
      const batch = progressivePracticeBatch(progress, countries, PROGRESSIVE_BATCH_SIZE, rng);
      setStage(batch.stage);
      nextQuestions = questionSet(batch.countries, PROGRESSIVE_BATCH_SIZE, rng, countries);
    } else {
      nextQuestions = questionSet(countries, CHALLENGE_QUESTION_COUNT, rng, countries);
    }

    setMode(nextMode);
    setSetupTab("practice");
    setQuestions(nextQuestions);
    setRunning(true);
    setDone(false);
    setIndex(0);
    setAnswers([]);
    setItems([]);
    setEarnedBadgeIds([]);
    setFeedback(null);
    setCurrentProgress(progress);
    setStartedAt(Date.now());
    setRemaining(TIMED_SECONDS);
    trackEvent(
      "practice_mode_start",
      nextMode === "progressive" ? { mode: nextMode, stage: progressivePracticeBatch(progress, countries).stage } : { mode: nextMode }
    );
  }

  function answer(ok: boolean, selectedLabel?: string) {
    if (!question || feedback || done) return;
    let next = updateReviewState(question.correctCountry.code, "flag", ok, currentProgress);
    if (ok) next = { ...next, xp: next.xp + 10 };
    setCurrentProgress(next);
    setProgress(next);
    setAnswers((value) => [...value, ok]);
    setItems((value) => [...value, {
      label: question.correctCountry.name,
      correct: ok,
      chosen: ok ? undefined : selectedLabel,
      answer: answerLabel(question),
      countryCode: question.correctCountry.code,
      countryName: question.correctCountry.name,
      flagUrl: question.correctCountry.flagUrl,
      context: [question.correctCountry.subregion, question.correctCountry.capital ? `Capital: ${question.correctCountry.capital}` : ""].filter(Boolean).join(" · ")
    }]);
    setFeedback({ ok, question, selectedLabel });

    // A missed flag returns later in the same progressive session with a newly
    // generated question format and fresh distractors.
    if (mode === "progressive" && !ok) {
      const rng = mulberry32(hashStringToSeed(`progressive-retry-${question.correctCountry.code}-${questions.length}-${Date.now()}`));
      const [retry] = generateReviewQuestions([question.correctCountry], "flag", rng, countries);
      if (retry) setQuestions((value) => [...value, { ...retry, id: `${retry.id}-retry-${value.length}` }]);
    }
  }

  function finish(finalAnswers = answers) {
    if (done) return;
    const finalScore = finalAnswers.filter(Boolean).length;
    let next = currentProgress;
    const newIds = evaluateBadges(next, countries, lessons, { kind: "review", score: finalScore, total: finalAnswers.length });
    if (newIds.length) next = awardBadges(next, newIds);
    setEarnedBadgeIds(newIds);
    setCurrentProgress(next);
    setProgress(next);
    setAnswers(finalAnswers);
    setDone(true);
    setRunning(false);
    trackEvent(
      "practice_mode_complete",
      mode === "progressive" ? { mode, score: finalScore, total: finalAnswers.length, stage } : { mode, score: finalScore, total: finalAnswers.length }
    );
  }

  function continueNext() {
    setFeedback(null);
    if ((mode === "strikes" && mistakes >= STRIKE_LIMIT) || index >= questions.length - 1) finish(answers);
    else setIndex((value) => value + 1);
  }

  function closeRound() {
    if (answers.length) finish(answers);
    else {
      setRunning(false);
      setQuestions([]);
    }
  }

  function returnToSetup(tab: SetupTab = "practice") {
    setDone(false);
    setRunning(false);
    setFeedback(null);
    setSetupTab(tab);
  }

  if (done) {
    const caption = mode === "timed"
      ? `${items.length} flags attempted in 120 seconds`
      : mode === "strikes"
        ? `${Math.min(mistakes, STRIKE_LIMIT)} of ${STRIKE_LIMIT} strikes used`
        : `${STAGE_LABEL[stage]} stage · missed flags were repeated`;
    return (
      <RoundResults
        score={score}
        total={items.length}
        items={items}
        caption={caption}
        earnedBadges={earnedBadgeResults(earnedBadgeIds)}
        actions={mode === "progressive" ? [
          { label: "View learning results", variant: "primary", icon: "stats", onPress: () => returnToSetup("results") },
          { label: "Continue learning", variant: "secondary", icon: "learn", onPress: () => start("progressive") },
          { label: "Done", variant: "secondary", icon: "today", onPress: () => navigate("/") }
        ] : [
          { label: "Play again", variant: "primary", icon: "play", onPress: () => start(mode) },
          { label: "Choose another mode", variant: "secondary", icon: "review", onPress: () => returnToSetup() },
          { label: "Done", variant: "secondary", icon: "today", onPress: () => navigate("/") }
        ]}
      />
    );
  }

  if (!running) {
    return (
      <main className="flex min-h-full flex-col p-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="icon-btn shrink-0" aria-label="Back">
            <Icon name="chevron" className="rotate-180" />
          </button>
          <div>
            <h1 className="screen-title">Practice flags</h1>
            <p className="mt-1 text-sm font-semibold text-muted">Choose the kind of session you need today.</p>
          </div>
        </div>

        <section className="mt-6 grid gap-3">
          {(["timed", "strikes", "progressive"] as PracticeMode[]).map((item) => {
            const active = mode === item;
            const meta = MODE_META[item];
            return (
              <button
                key={item}
                onClick={() => {
                  setMode(item);
                  setSetupTab("practice");
                }}
                aria-pressed={active}
                className={`flex items-center gap-3.5 rounded-[20px] border-2 p-3.5 text-left transition-all ${
                  active ? "border-primary bg-primary text-white shadow-card" : "border-line bg-paper text-ink shadow-card"
                }`}
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${active ? "bg-white/15" : "bg-surface text-primary"}`}>
                  <Icon name={meta.icon} size={23} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[18px] font-semibold">{meta.label}</span>
                  <span className={`mt-0.5 block text-[12.5px] font-semibold leading-tight ${active ? "text-white/80" : "text-muted"}`}>{meta.desc}</span>
                </span>
                <Icon name="chevron" size={16} className={active ? "text-white/70" : "text-muted"} />
              </button>
            );
          })}
        </section>

        {mode === "progressive" && (
          <div className="mt-5 grid grid-cols-2 rounded-2xl bg-surface p-1" role="tablist" aria-label="Progressive learning views">
            <button
              role="tab"
              aria-selected={setupTab === "practice"}
              onClick={() => setSetupTab("practice")}
              className={`rounded-xl px-3 py-2.5 font-display text-sm font-semibold ${setupTab === "practice" ? "bg-paper text-primary shadow-card" : "text-muted"}`}
            >
              Practice
            </button>
            <button
              role="tab"
              aria-selected={setupTab === "results"}
              onClick={() => setSetupTab("results")}
              className={`rounded-xl px-3 py-2.5 font-display text-sm font-semibold ${setupTab === "results" ? "bg-paper text-primary shadow-card" : "text-muted"}`}
            >
              Results
            </button>
          </div>
        )}

        {mode === "progressive" && setupTab === "results" ? (
          <ProgressiveResults progress={progress} countries={countries} onContinue={() => start("progressive")} />
        ) : (
          <>
            <section className="mt-5 rounded-[22px] border border-line bg-surface p-4">
              <p className="section-label">How it works</p>
              <p className="mt-1 font-semibold leading-relaxed text-ink">{MODE_META[mode].detail}</p>
              {mode === "progressive" && (
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                  {(["easy", "medium", "hard"] as ProgressiveStage[]).map((difficulty, position) => (
                    <div key={difficulty} className={`rounded-2xl p-2.5 ${difficulty === progressiveResults(progress, countries).stage ? "bg-primary text-white" : "bg-paper text-muted"}`}>
                      <span className="block text-[10px] uppercase tracking-wide">Stage {position + 1}</span>
                      <span className="mt-0.5 block font-display text-sm font-semibold">{STAGE_LABEL[difficulty]}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <div className="mt-auto pt-6">
              <button onClick={() => start(mode)} className="btn-primary w-full">
                <Icon name={MODE_META[mode].icon} size={19} /> Start {MODE_META[mode].label.toLowerCase()}
              </button>
              {mode === "progressive" && <p className="mt-2 text-center text-xs font-bold text-muted">Untimed · quit anytime · mistakes return</p>}
            </div>
          </>
        )}
      </main>
    );
  }

  const headerValue = mode === "timed"
    ? ((TIMED_SECONDS - remaining) / TIMED_SECONDS) * 100
    : mode === "strikes"
      ? (Math.min(mistakes, STRIKE_LIMIT) / STRIKE_LIMIT) * 100
      : (index / Math.max(questions.length, 1)) * 100;
  const headerStatus = mode === "timed"
    ? `${remaining}s`
    : mode === "strikes"
      ? `${Math.max(0, STRIKE_LIMIT - mistakes)} left`
      : `${index + 1}/${questions.length}`;

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 bg-paper/85 p-4 backdrop-blur-md">
        <p className="mb-2.5 text-center font-display text-[13px] font-bold uppercase tracking-wide text-muted">{MODE_META[mode].label}</p>
        <div className="flex items-center gap-3">
          <button onClick={closeRound} className="icon-btn shrink-0" aria-label="End practice">
            <Icon name="close" size={20} />
          </button>
          <div className="flex-1"><ProgressBar value={headerValue} /></div>
          <span className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-display font-bold ${mode === "strikes" && mistakes >= 2 ? "bg-error/10 text-error" : "text-muted"}`}>
            {headerStatus}
          </span>
        </div>
      </header>
      <section key={question?.id ?? index} className="animate-fade-in p-5">
        {question && <QuestionCard question={question} disabled={Boolean(feedback)} selectedLabel={feedback?.selectedLabel} onAnswer={answer} />}
      </section>
      {feedback && (
        <FeedbackPanel
          correct={feedback.ok}
          country={feedback.question.correctCountry}
          xp={feedback.ok ? 10 : 0}
          answerLabel={answerLabel(feedback.question)}
          selectedLabel={feedback.selectedLabel}
          revealCorrectFlag={feedback.question.type === "pick-flag"}
          onContinue={continueNext}
        />
      )}
    </main>
  );
}

function ProgressiveResults({ progress, countries, onContinue }: { progress: AppProgress; countries: Country[]; onContinue: () => void }) {
  const results = progressiveResults(progress, countries);
  const weak = countries
    .filter((country) => {
      const state = progress.review[reviewKey(country.code, "flag")];
      return Boolean(state && state.wrongCount > 0 && state.box < 5);
    })
    .sort((a, b) => (progress.review[reviewKey(b.code, "flag")]?.wrongCount ?? 0) - (progress.review[reviewKey(a.code, "flag")]?.wrongCount ?? 0))
    .slice(0, 5);

  return (
    <div className="pb-2">
      <section className="mt-5 rounded-[22px] bg-primary p-5 text-white shadow-card-lg">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/75">Current stage</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold">{STAGE_LABEL[results.stage]} flags</h2>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Stage {(["easy", "medium", "hard"] as ProgressiveStage[]).indexOf(results.stage) + 1} of 3</span>
        </div>
        <p className="mt-2 text-sm font-semibold text-white/80">New flags come from this stage while earlier mistakes keep returning.</p>
      </section>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <ResultStat value={results.seen} label="Introduced" />
        <ResultStat value={results.mastered} label="Mastered" />
        <ResultStat value={results.needsRepetition} label="To repeat" />
      </div>

      <section className="mt-5 rounded-[22px] border border-line bg-paper p-4 shadow-card">
        <h2 className="font-display text-lg font-semibold">Results by difficulty</h2>
        <div className="mt-4 space-y-4">
          {results.tiers.map((tier) => {
            const pct = tier.total ? Math.round((tier.seen / tier.total) * 100) : 0;
            return (
              <div key={tier.difficulty}>
                <div className="flex items-center justify-between gap-3 text-sm font-bold">
                  <span>{STAGE_LABEL[tier.difficulty]}</span>
                  <span className="text-muted">{tier.seen}/{tier.total} introduced · {tier.mastered} mastered</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {weak.length > 0 && (
        <section className="mt-5 rounded-[22px] border border-line bg-paper p-4 shadow-card">
          <h2 className="font-display text-lg font-semibold">Needs repetition</h2>
          <div className="mt-3 grid gap-2">
            {weak.map((country) => (
              <div key={country.code} className="flex items-center gap-3 rounded-2xl bg-surface p-2.5">
                <FlagImage code={country.code} name={country.name} src={country.flagUrl} fit="natural" framed={false} className="w-12" imgClassName="max-h-9" />
                <span className="flex-1 font-display font-semibold">{country.name}</span>
                <span className="text-xs font-bold text-error">{progress.review[reviewKey(country.code, "flag")]?.wrongCount ?? 0} misses</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <button onClick={onContinue} className="btn-primary mt-5 w-full">
        <Icon name="learn" size={19} /> Continue progressive learning
      </button>
    </div>
  );
}

function ResultStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-paper p-3 text-center shadow-card">
      <div className="font-display text-2xl font-semibold text-primary">{value}</div>
      <div className="mt-0.5 text-[11px] font-bold text-muted">{label}</div>
    </div>
  );
}
