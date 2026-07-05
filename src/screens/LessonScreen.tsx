import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import FeedbackPanel from "../components/FeedbackPanel";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import QuestionCard from "../components/QuestionCard";
import RoundResults, { type RoundResultItem } from "../components/RoundResults";
import { useConfirm } from "../components/ConfirmDialog";
import type { Topic } from "@flaggo/core/types/topic";
import { updateStreak } from "@flaggo/core/utils/date";
import { generateLessonQuestions, generateReviewQuestions, type Question } from "@flaggo/core/utils/quiz";
import { updateReviewState } from "@flaggo/core/utils/spacedRepetition";
import { answerLabel } from "@flaggo/core/game/answerLabel";
import { useGame } from "../state/GameProvider";
import { trackEvent } from "../lib/analytics";

export const TOPIC_LABEL: Record<string, string> = {
  flag: "Flags",
  capital: "Capitals",
  location: "Map",
  currency: "Currencies",
  language: "Languages",
  neighbor: "Neighbors"
};

type LessonRouteState =
  | { lessonId: string }
  | { mode: "review"; countryCodes: string[]; topic: Topic }
  | null;

export default function LessonScreen() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { state } = useLocation();
  const { countries, lessons, progress, setProgress, nextLearningLesson, openLesson } = useGame();
  const routeState = state as LessonRouteState;
  const lesson = routeState && "lessonId" in routeState ? lessons.find((item) => item.id === routeState.lessonId) : undefined;
  const mode = routeState && "mode" in routeState ? routeState.mode : "lesson";
  // Keyed memo: a fresh array here each render would retrigger the questions
  // memo below, regenerating (unseeded) questions mid-round on every answer.
  const reviewCodesKey = routeState && "countryCodes" in routeState ? routeState.countryCodes.join(",") : "";
  const reviewCountries = useMemo(
    () =>
      reviewCodesKey
        ? reviewCodesKey
            .split(",")
            .map((code) => countries.find((country) => country.code === code))
            .filter((country): country is (typeof countries)[number] => Boolean(country))
        : [],
    [countries, reviewCodesKey]
  );
  const reviewTopic = routeState && "topic" in routeState ? routeState.topic : "flag";

  const invalidRoute = !routeState || (mode === "lesson" && !lesson);
  const activeTopic = mode === "review" ? reviewTopic : lesson?.topic ?? "flag";
  const questions = useMemo<Question[]>(() => {
    if (mode === "review") return generateReviewQuestions(reviewCountries.length ? reviewCountries : countries, activeTopic);
    return lesson ? generateLessonQuestions(lesson, countries) : [];
  }, [activeTopic, countries, lesson, mode, reviewCountries]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [xp, setXp] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; question: Question } | null>(null);
  const [items, setItems] = useState<RoundResultItem[]>([]);
  const [result, setResult] = useState<{ xpEarned: number; correct: number; total: number; streak: number } | null>(null);
  const question = questions[index];
  const topicLabel = TOPIC_LABEL[activeTopic] ?? activeTopic;
  const contextTitle = mode === "review" ? `Review · ${topicLabel}` : `${lesson?.title ?? "Lesson"} · ${topicLabel}`;

  if (invalidRoute) return <Navigate to="/learn" replace />;
  function resultItem(question: Question, wasCorrect: boolean, selectedLabel?: string): RoundResultItem {
    const country = question.correctCountry;
    return {
      label: country.name,
      correct: wasCorrect,
      chosen: wasCorrect ? undefined : selectedLabel,
      answer: answerLabel(question),
      countryCode: country.code,
      countryName: country.name,
      flagUrl: country.flagUrl,
      context: [country.subregion, country.capital ? `Capital: ${country.capital}` : ""].filter(Boolean).join(" · ")
    };
  }

  function answer(wasCorrect: boolean, selectedLabel?: string) {
    if (!question || feedback) return;
    const earned = wasCorrect ? 10 : 0;
    let next = updateReviewState(question.correctCountry.code, activeTopic, wasCorrect, progress);
    next = { ...next, xp: next.xp + earned };
    setProgress(next);
    setXp((value) => value + earned);
    setCorrect((value) => value + (wasCorrect ? 1 : 0));
    setItems((value) => [...value, resultItem(question, wasCorrect, selectedLabel)]);
    setFeedback({ ok: wasCorrect, question });
  }

  function complete() {
    const total = questions.length || 1;
    const perfect = correct === total;
    const bonusXp = mode === "lesson" ? 25 + (perfect ? 20 : 0) : 10;
    const coinsEarned = mode === "lesson" ? 5 + (perfect ? 10 : 0) : 0;
    let next = { ...progress, xp: progress.xp + bonusXp, coins: progress.coins + coinsEarned };
    if (mode === "lesson" && lesson) {
      next = updateStreak({
        ...next,
        completedLessonIds: Array.from(new Set([...next.completedLessonIds, lesson.id]))
      });
    }
    setProgress(next);
    trackEvent("lesson-complete", { accuracy: Math.round((correct / total) * 100), topic: activeTopic });
    setResult({ xpEarned: xp + bonusXp, correct, total, streak: next.streak });
  }

  function continueNext() {
    setFeedback(null);
    if (index >= questions.length - 1) complete();
    else setIndex((value) => value + 1);
  }

  async function closeRound() {
    if (items.length > 0 && !result) {
      const ok = await confirm({
        title: "End this round?",
        body: "Answered questions are already counted.",
        confirmLabel: "End round",
        destructive: true
      });
      if (!ok) return;
    }
    navigate(mode === "review" ? "/review" : "/");
  }

  if (result) {
    const next = nextLearningLesson(activeTopic);
    return (
      <RoundResults
        score={result.correct}
        total={result.total}
        items={items}
        streak={result.streak}
        caption={`+${result.xpEarned} XP`}
        actions={[
          ...(next ? [{ label: "Continue learning", variant: "primary" as const, icon: "learn" as const, onPress: () => openLesson(next) }] : []),
          { label: "Back to Today", variant: next ? "secondary" as const : "primary" as const, icon: "today" as const, onPress: () => navigate("/") }
        ]}
      />
    );
  }

  if (!question) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <button onClick={() => navigate("/")} className="btn-primary">Go Home</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 bg-paper/85 p-4 backdrop-blur-md">
        <p className="mb-2.5 text-center font-display text-[13px] font-bold uppercase tracking-wide text-muted">{contextTitle}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void closeRound()}
            aria-label="Close lesson"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-muted shadow-card transition active:translate-y-0.5 active:shadow-none hover:text-ink"
          >
            <Icon name="close" size={20} />
          </button>
          <div className="flex-1"><ProgressBar value={(index / questions.length) * 100} /></div>
          <span className="shrink-0 text-sm font-display font-bold text-muted">
            {index + 1}/{questions.length}
          </span>
        </div>
      </header>
      <section key={index} className="animate-fade-in p-5">
        <QuestionCard question={question} disabled={Boolean(feedback)} onAnswer={answer} />
      </section>
      {feedback && (
        <FeedbackPanel
          correct={feedback.ok}
          country={feedback.question.correctCountry}
          xp={10}
          answerLabel={answerLabel(feedback.question)}
          onContinue={continueNext}
        />
      )}
    </main>
  );
}
