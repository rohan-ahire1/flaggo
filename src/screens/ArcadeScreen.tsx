import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FeedbackPanel from "../components/FeedbackPanel";
import Icon, { type IconName } from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import ProgressiveResults from "../components/ProgressiveResults";
import QuestionCard from "../components/QuestionCard";
import RoundResults, { type RoundResultItem } from "../components/RoundResults";
import { useConfirm } from "../components/ConfirmDialog";
import type { Country } from "@flaggo/core/types/country";
import { generateReviewQuestions, type Question } from "@flaggo/core/utils/quiz";
import {
  PROGRESSIVE_STAGE_LABELS,
  PROGRESSIVE_STAGES,
  PROGRESSIVE_TIER_SIZE,
  progressivePracticeBatch,
  progressiveResults,
  type ProgressiveStage
} from "@flaggo/core/utils/progressivePractice";
import { updateReviewState } from "@flaggo/core/utils/spacedRepetition";
import { seededShuffle, hashStringToSeed, mulberry32 } from "@flaggo/core/utils/seededRandom";
import { answerDetail, answerLabel } from "@flaggo/core/game/answerLabel";
import { awardBadges, evaluateBadges } from "@flaggo/core/game/badges";
import { trackEvent } from "../lib/analytics";
import { earnedBadgeResults } from "../lib/badges";
import { useAppBack } from "../navigation/useAppBack";
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
    label: "Learning",
    desc: "Learn 50 flags at a time and repeat mistakes.",
    detail: "Four 50-flag stages keep progress clear while weak flags return until they stick.",
    icon: "learn"
  }
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
  const goBack = useAppBack("/");
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const { countries, progress, setProgress } = useGame();
  const requestedMode = searchParams.get("mode");
  const shouldAutoStart = searchParams.get("start") === "1";
  const autoStartHandled = useRef(false);
  const initialMode: PracticeMode = requestedMode === "progressive" || requestedMode === "strikes" ? requestedMode : "timed";
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
  const [stage, setStage] = useState<ProgressiveStage>("tier-1");
  const [items, setItems] = useState<RoundResultItem[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [canReturnToRound, setCanReturnToRound] = useState(false);

  const question = questions[index];
  const score = answers.filter(Boolean).length;
  const mistakes = answers.length - score;
  const learning = progressiveResults(progress, countries);
  const learningStageIndex = PROGRESSIVE_STAGES.indexOf(learning.stage);
  const viewingLearningResults = mode === "progressive" && setupTab === "results";

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
    setCanReturnToRound(false);
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
    const newIds = evaluateBadges(next, countries, { kind: "review", score: finalScore, total: finalAnswers.length });
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

  async function closeRound() {
    if (answers.length) {
      const ok = await confirm({
        title: "End this round?",
        body: "Answered questions are already counted.",
        confirmLabel: "End round",
        destructive: true
      });
      if (!ok) return;
    }
    setRunning(false);
    setQuestions([]);
    setFeedback(null);
    if (shouldAutoStart) goBack();
  }

  function returnToSetup(tab: SetupTab = "practice") {
    setDone(false);
    setRunning(false);
    setFeedback(null);
    setSetupTab(tab);
    setCanReturnToRound(false);
  }

  function viewLearningResults() {
    setDone(false);
    setRunning(false);
    setFeedback(null);
    setSetupTab("results");
    setCanReturnToRound(true);
  }

  function returnToCompletedRound() {
    setCanReturnToRound(false);
    setDone(true);
  }

  function leaveSetupView() {
    if (canReturnToRound) {
      returnToCompletedRound();
      return;
    }
    if (viewingLearningResults) {
      setSetupTab("practice");
      return;
    }
    goBack();
  }

  if (done) {
    const caption = mode === "timed"
      ? `${items.length} flags attempted in 120 seconds`
      : mode === "strikes"
        ? `${Math.min(mistakes, STRIKE_LIMIT)} of ${STRIKE_LIMIT} strikes used`
        : `${PROGRESSIVE_STAGE_LABELS[stage]} · missed flags were repeated`;
    return (
      <RoundResults
        score={score}
        total={items.length}
        items={items}
        caption={caption}
        earnedBadges={earnedBadgeResults(earnedBadgeIds)}
        actions={mode === "progressive" ? [
          { label: "Continue learning", variant: "primary", icon: "learn", onPress: () => start("progressive") },
          { label: "Back to home", variant: "secondary", icon: "flag", onPress: goBack },
          { label: "View learning results", variant: "compact", icon: "stats", onPress: viewLearningResults }
        ] : [
          { label: "Play again", variant: "primary", icon: "play", onPress: () => start(mode) },
          { label: "Choose another mode", variant: "secondary", icon: "review", onPress: () => returnToSetup() },
          { label: "Done", variant: "secondary", icon: "today", onPress: goBack }
        ]}
      />
    );
  }

  if (!running) {
    return (
      <main className="flex min-h-full flex-col p-5">
        <div className="flex items-center gap-3">
          <button
            onClick={leaveSetupView}
            className="icon-btn shrink-0"
            aria-label={canReturnToRound ? "Back to round results" : viewingLearningResults ? "Back to learning" : "Back"}
          >
            <Icon name="chevron" className="rotate-180" />
          </button>
          <div>
            <h1 className="screen-title">{viewingLearningResults ? "Learning results" : mode === "progressive" ? "Learn flags" : "Practice flags"}</h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              {viewingLearningResults
                ? "See what you have introduced, mastered, and need to repeat."
                : mode === "progressive"
                  ? "Learn 50 flags at a time with repetition that targets mistakes."
                  : "Choose the kind of session you need today."}
            </p>
          </div>
        </div>

        {mode !== "progressive" && <section className="mt-6 grid gap-3">
          {(["timed", "strikes"] as PracticeMode[]).map((item) => {
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
        </section>}

        {viewingLearningResults ? (
          <ProgressiveResults
            progress={progress}
            countries={countries}
            actionLabel="Continue learning"
            actionIcon="learn"
            onAction={() => start("progressive")}
          />
        ) : mode === "progressive" ? (
          <>
            <section className="mt-5 rounded-[24px] border border-line bg-surface p-4 shadow-card">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="section-label">Your learning path</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                    {PROGRESSIVE_STAGE_LABELS[learning.stage]}
                  </h2>
                </div>
                <span className="shrink-0 text-sm font-bold text-muted">
                  {learning.seen}/{PROGRESSIVE_STAGES.length * PROGRESSIVE_TIER_SIZE} introduced
                </span>
              </div>

              <div className="mt-4 grid gap-2">
                {PROGRESSIVE_STAGES.map((tier, position) => {
                  const result = learning.tiers[position];
                  const complete = result.seen === result.total;
                  const current = position === learningStageIndex && !complete;
                  const locked = position > learningStageIndex;
                  return (
                    <div
                      key={tier}
                      className={`flex items-center gap-3 rounded-[18px] border-2 p-3 ${
                        current
                          ? "border-primary bg-primary text-white shadow-card"
                          : complete
                            ? "border-success/30 bg-success/10 text-ink"
                            : "border-line bg-paper text-muted"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-semibold ${
                          current ? "bg-white/15 text-white" : complete ? "bg-success/15 text-success" : "bg-surface"
                        }`}
                      >
                        {complete ? <Icon name="check" size={16} /> : locked ? <Icon name="lock" size={15} /> : position + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[17px] font-semibold">{PROGRESSIVE_STAGE_LABELS[tier]}</span>
                        <span className={`block text-xs font-bold ${current ? "text-white/75" : "text-muted"}`}>
                          Flags {position * PROGRESSIVE_TIER_SIZE + 1}–{(position + 1) * PROGRESSIVE_TIER_SIZE}
                        </span>
                      </span>
                      <span className={`shrink-0 text-xs font-bold ${current ? "text-white/85" : complete ? "text-success" : "text-muted"}`}>
                        {complete ? "Complete" : locked ? "Locked" : `${result.seen}/${result.total}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <button onClick={() => start("progressive")} className="btn-primary mt-4 w-full">
              <Icon name="learn" size={19} /> {learning.seen ? `Continue ${PROGRESSIVE_STAGE_LABELS[learning.stage]}` : "Start learning"}
            </button>
            <button
              onClick={() => {
                setSetupTab("results");
                setCanReturnToRound(false);
              }}
              className="mx-auto mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <Icon name="stats" size={15} /> View learning results
            </button>
            <p className="mt-1 text-center text-xs font-bold text-muted">Untimed · quit anytime · mistakes return</p>
          </>
        ) : (
          <>
            <section className="mt-5 rounded-[22px] border border-line bg-surface p-4">
              <p className="section-label">How it works</p>
              <p className="mt-1 font-semibold leading-relaxed text-ink">{MODE_META[mode].detail}</p>
            </section>
            <div className="mt-auto pt-6">
              <button onClick={() => start(mode)} className="btn-primary w-full">
                <Icon name={MODE_META[mode].icon} size={19} /> Start {MODE_META[mode].label.toLowerCase()}
              </button>
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
          <button onClick={() => void closeRound()} className="icon-btn shrink-0" aria-label="End practice">
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
          answerDetail={answerDetail(feedback.question)}
          selectedLabel={feedback.selectedLabel}
          revealCorrectFlag={feedback.question.type === "pick-flag"}
          onContinue={continueNext}
        />
      )}
    </main>
  );
}
