import { useMemo, useState } from "react";
import FeedbackPanel from "../components/FeedbackPanel";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import QuestionCard from "../components/QuestionCard";
import type { Country } from "../types/country";
import type { Lesson } from "../types/lesson";
import type { AppProgress } from "../types/progress";
import type { Topic } from "../types/topic";
import { updateStreak } from "../utils/date";
import { generateLessonQuestions, generateReviewQuestions, type Question } from "../utils/quiz";
import { updateReviewState } from "../utils/spacedRepetition";
import type { LessonResult } from "./LessonCompleteScreen";

export default function LessonScreen({
  lesson,
  countries,
  progress,
  mode = "lesson",
  onProgress,
  onComplete,
  onHome,
  reviewCountries = [],
  reviewTopic = "flag"
}: {
  lesson?: Lesson;
  countries: Country[];
  progress: AppProgress;
  mode?: "lesson" | "review";
  onProgress: (progress: AppProgress) => void;
  onComplete: (result: LessonResult) => void;
  onHome: () => void;
  reviewCountries?: Country[];
  reviewTopic?: Topic;
}) {
  const activeTopic = mode === "review" ? reviewTopic : lesson?.topic ?? "flag";
  const questions = useMemo<Question[]>(() => {
    if (mode === "review") return generateReviewQuestions(reviewCountries.length ? reviewCountries : countries, activeTopic);
    return lesson ? generateLessonQuestions(lesson, countries) : [];
  }, [activeTopic, countries, lesson, mode, reviewCountries]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [xp, setXp] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; question: Question } | null>(null);
  const question = questions[index];
  const correctAnswerLabel = (q: Question) => {
    if (q.type === "guess-currency") return q.correctCurrency;
    if (q.type === "guess-language") return q.correctLanguage;
    if (q.type === "guess-capital" || q.type === "flag-to-capital") return q.correctCapital;
    if (q.type === "capital-true-false") return q.correctCountry.capital ?? q.correctCountry.name;
    if (q.type === "pick-neighbor" || q.type === "not-neighbor") return q.correctNeighbor.name;
    return q.correctCountry.name;
  };

  function answer(wasCorrect: boolean) {
    if (!question || feedback) return;
    const earned = wasCorrect ? 10 : 0;
    let next = updateReviewState(question.correctCountry.code, activeTopic, wasCorrect, progress);
    next = { ...next, xp: next.xp + earned };
    onProgress(next);
    setXp((value) => value + earned);
    setCorrect((value) => value + (wasCorrect ? 1 : 0));
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
    onProgress(next);
    onComplete({ xpEarned: xp + bonusXp, accuracy: Math.round((correct / total) * 100), correct, total, streak: next.streak, coinsEarned, topic: activeTopic });
  }

  function continueNext() {
    setFeedback(null);
    if (index >= questions.length - 1) complete();
    else setIndex((value) => value + 1);
  }

  if (!question) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <button onClick={onHome} className="flaggo-button bg-flaggo-green text-white">Go Home</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-flaggo-bg">
      <header className="sticky top-0 z-20 bg-flaggo-bg/85 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onHome}
            aria-label="Close lesson"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-flaggo-muted shadow-card transition active:translate-y-0.5 active:shadow-none hover:text-flaggo-text"
          >
            <Icon name="close" size={20} />
          </button>
          <div className="flex-1"><ProgressBar value={(index / questions.length) * 100} /></div>
          <span className="shrink-0 text-sm font-display font-extrabold text-flaggo-muted">
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
          answerLabel={correctAnswerLabel(feedback.question)}
          onContinue={continueNext}
        />
      )}
    </main>
  );
}
