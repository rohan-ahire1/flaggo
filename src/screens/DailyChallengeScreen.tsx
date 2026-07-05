import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeedbackPanel from "../components/FeedbackPanel";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import QuestionCard from "../components/QuestionCard";
import { useAuth } from "../auth/AuthProvider";
import { useNameClaim } from "../components/NameClaimProvider";
import { applyDailyResult, buildDailyQuiz, dateKey, type DailyQuestion } from "@flaggo/core/utils/dailyChallenge";
import { updateReviewState } from "@flaggo/core/utils/spacedRepetition";
import { answerLabelForWrapper } from "@flaggo/core/game/answerLabel";
import { trackEvent } from "../lib/analytics";
import { dailyBoard, submitScore } from "../lib/leaderboard";
import { BRAND } from "../config/brand";
import { useGame } from "../state/GameProvider";

export default function DailyChallengeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ensureName } = useNameClaim();
  const { countries, progress, setProgress, openSignIn, createAndShareChallenge } = useGame();
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

  function answer(ok: boolean, wrongCode?: string) {
    if (!question || feedback) return;
    const next = updateReviewState(question.country.code, question.topic, ok, currentProgress);
    const withXp = { ...next, xp: next.xp + (ok ? 10 : 0) };
    setCurrentProgress(withXp);
    setProgress(withXp);
    setCorrect((value) => value + (ok ? 1 : 0));
    setFeedback({ ok, question, wrongCode });
  }

  async function finish() {
    const result = { score: correct, total: questions.length };
    const next = applyDailyResult(currentProgress, today, result);
    setCurrentProgress(next);
    setProgress(next);
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
        <button onClick={() => navigate("/")} className="mb-5 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Go home">
          <Icon name="close" size={20} />
        </button>
        <section className="rounded-[28px] bg-white p-6 text-center shadow-card-lg">
          <Icon name="flame" size={44} className="mx-auto text-flaggo-red" />
          <h1 className="mt-3 screen-title">Daily complete</h1>
          <p className="mt-2 font-display text-5xl font-black text-flaggo-green">{correct}/{questions.length}</p>
          <p className="mt-1 font-bold text-flaggo-muted">Daily streak {currentProgress.daily.streak}</p>
          <div className="mt-5 grid gap-3">
            <button onClick={share} className="btn-primary">Share score</button>
            <button onClick={() => void createAndShareChallenge()} className="btn-secondary">Challenge a friend</button>
            <button onClick={() => navigate("/leaderboard")} className="btn-secondary">Leaderboard</button>
            {!user && <button onClick={openSignIn} className="btn-ghost mt-1">Sign in to compete</button>}
          </div>
        </section>
      </main>
    );
  }

  if (!question) return <main className="grid min-h-screen place-items-center p-5"><button onClick={() => navigate("/")} className="flaggo-button bg-flaggo-green text-white">Go Home</button></main>;

  return (
    <main className="min-h-screen bg-flaggo-bg">
      <header className="sticky top-0 z-20 bg-flaggo-bg/85 p-4 backdrop-blur-md">
        <p className="mb-2.5 text-center font-display text-[13px] font-extrabold uppercase tracking-wide text-flaggo-muted">Daily Challenge</p>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} aria-label="Close daily" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-flaggo-muted shadow-card">
            <Icon name="close" size={20} />
          </button>
          <div className="flex-1"><ProgressBar value={(index / questions.length) * 100} /></div>
          <span className="shrink-0 text-sm font-display font-extrabold text-flaggo-muted">{index + 1}/{questions.length}</span>
        </div>
      </header>
      <section key={question.id} className="animate-fade-in p-5">
        <QuestionCard question={question.question} disabled={Boolean(feedback)} onAnswer={answer} />
      </section>
      {feedback && <FeedbackPanel correct={feedback.ok} country={feedback.question.country} xp={10} answerLabel={answerLabelForWrapper(feedback.question)} onContinue={continueNext} />}
    </main>
  );
}
