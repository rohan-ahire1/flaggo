import { useMemo, useState } from "react";
import FeedbackPanel from "../components/FeedbackPanel";
import ProgressBar from "../components/ProgressBar";
import QuestionCard from "../components/QuestionCard";
import type { Country } from "../types/country";
import type { Lesson } from "../types/lesson";
import type { AppProgress } from "../types/progress";
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
  reviewCountries = []
}: {
  lesson?: Lesson;
  countries: Country[];
  progress: AppProgress;
  mode?: "lesson" | "review";
  onProgress: (progress: AppProgress) => void;
  onComplete: (result: LessonResult) => void;
  onHome: () => void;
  reviewCountries?: Country[];
}) {
  const questions = useMemo<Question[]>(() => {
    if (mode === "review") return generateReviewQuestions(reviewCountries.length ? reviewCountries : countries);
    return lesson ? generateLessonQuestions(lesson, countries) : [];
  }, [countries, lesson, mode, reviewCountries]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [xp, setXp] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; question: Question } | null>(null);
  const question = questions[index];

  function answer(wasCorrect: boolean) {
    if (!question || feedback) return;
    const earned = wasCorrect ? 10 : 0;
    let next = updateReviewState(question.correctCountry.code, wasCorrect, progress);
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
    onComplete({ xpEarned: xp + bonusXp, accuracy: Math.round((correct / total) * 100), correct, total, streak: next.streak, coinsEarned });
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
      <header className="sticky top-0 z-20 bg-flaggo-bg p-4">
        <div className="mb-3 flex items-center gap-3">
          <button onClick={onHome} className="grid h-10 w-10 place-items-center rounded-full bg-white font-black shadow-sm">X</button>
          <div className="flex-1"><ProgressBar value={(index / questions.length) * 100} /></div>
        </div>
      </header>
      <section className="p-5">
        <QuestionCard question={question} disabled={Boolean(feedback)} onAnswer={answer} />
      </section>
      {feedback && <FeedbackPanel correct={feedback.ok} country={feedback.question.correctCountry} xp={10} onContinue={continueNext} />}
    </main>
  );
}
