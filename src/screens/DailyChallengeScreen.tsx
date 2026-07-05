import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeedbackPanel from "../components/FeedbackPanel";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import QuestionCard from "../components/QuestionCard";
import RoundResults, { type RoundResultItem } from "../components/RoundResults";
import { useConfirm } from "../components/ConfirmDialog";
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
  const confirm = useConfirm();
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
  const [items, setItems] = useState<RoundResultItem[]>([]);
  const question = questions[index];

  useEffect(() => {
    trackEvent("daily_start", { date: today });
  }, [today]);

  function answer(ok: boolean, selectedLabel?: string) {
    if (!question || feedback) return;
    const next = updateReviewState(question.country.code, question.topic, ok, currentProgress);
    const withXp = { ...next, xp: next.xp + (ok ? 10 : 0) };
    setCurrentProgress(withXp);
    setProgress(withXp);
    setCorrect((value) => value + (ok ? 1 : 0));
    setItems((value) => [...value, {
      label: question.country.name,
      correct: ok,
      chosen: ok ? undefined : selectedLabel,
      answer: answerLabelForWrapper(question),
      countryCode: question.country.code,
      countryName: question.country.name,
      flagUrl: question.country.flagUrl,
      context: [question.country.subregion, question.country.capital ? `Capital: ${question.country.capital}` : ""].filter(Boolean).join(" · ")
    }]);
    setFeedback({ ok, question, wrongCode: selectedLabel });
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

  async function closeRound() {
    if (items.length > 0 && !complete) {
      const ok = await confirm({
        title: "End this round?",
        body: "Answered questions are already counted.",
        confirmLabel: "End round",
        destructive: true
      });
      if (!ok) return;
    }
    navigate("/");
  }

  if (complete) {
    return (
      <RoundResults
        score={correct}
        total={questions.length}
        items={items}
        streak={currentProgress.daily.streak}
        caption={`+${correct * 10} XP · streak ${currentProgress.daily.streak}`}
        actions={[
          { label: "Challenge a friend", variant: "primary", icon: "flag", onPress: () => void createAndShareChallenge() },
          { label: "See leaderboard", variant: "secondary", icon: "trophy", onPress: () => navigate("/leaderboard") },
          { label: "Done", variant: "secondary", icon: "today", onPress: () => navigate("/") },
          ...(!user ? [{ label: "Sign in to compete", variant: "secondary" as const, icon: "user" as const, onPress: openSignIn }] : []),
          { label: "Share score", variant: "secondary", icon: "bolt", onPress: () => void share() }
        ]}
      />
    );
  }

  if (!question) return <main className="grid min-h-screen place-items-center p-5"><button onClick={() => navigate("/")} className="btn-primary">Go Home</button></main>;

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 bg-paper/85 p-4 backdrop-blur-md">
        <p className="mb-2.5 text-center font-display text-[13px] font-bold uppercase tracking-wide text-muted">Daily Challenge</p>
        <div className="flex items-center gap-3">
          <button onClick={() => void closeRound()} aria-label="Close daily" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-muted shadow-card">
            <Icon name="close" size={20} />
          </button>
          <div className="flex-1"><ProgressBar value={(index / questions.length) * 100} /></div>
          <span className="shrink-0 text-sm font-display font-bold text-muted">{index + 1}/{questions.length}</span>
        </div>
      </header>
      <section key={question.id} className="animate-fade-in p-5">
        <QuestionCard question={question.question} disabled={Boolean(feedback)} onAnswer={answer} />
      </section>
      {feedback && <FeedbackPanel correct={feedback.ok} country={feedback.question.country} xp={10} answerLabel={answerLabelForWrapper(feedback.question)} onContinue={continueNext} />}
    </main>
  );
}
