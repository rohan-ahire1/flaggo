import { useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import FeedbackPanel from "../components/FeedbackPanel";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import QuestionCard from "../components/QuestionCard";
import RoundResults, { type RoundResultItem } from "../components/RoundResults";
import { useConfirm } from "../components/ConfirmDialog";
import { generateReviewQuestions, type Question } from "@flaggo/core/utils/quiz";
import { updateReviewState } from "@flaggo/core/utils/spacedRepetition";
import { answerDetail, answerLabel } from "@flaggo/core/game/answerLabel";
import { awardBadges, evaluateBadges } from "@flaggo/core/game/badges";
import { useGame } from "../state/GameProvider";
import { trackEvent } from "../lib/analytics";
import { earnedBadgeResults } from "../lib/badges";
import { parseReviewRoute } from "../navigation/routes";
import { useAppBack } from "../navigation/useAppBack";

export const TOPIC_LABEL: Record<string, string> = {
  flag: "Flags",
  capital: "Capitals",
  location: "Map",
  currency: "Currencies",
  language: "Languages",
  neighbor: "Neighbors"
};

export default function ReviewRoundScreen() {
  const goBack = useAppBack("/review");
  const confirm = useConfirm();
  const location = useLocation();
  const { countries, progress, setProgress } = useGame();
  const routeState = useMemo(() => parseReviewRoute(location.search, location.state), [location.search, location.state]);
  const reviewRoute = routeState;
  // Keyed memo: a fresh array here each render would retrigger the questions
  // memo below, regenerating (unseeded) questions mid-round on every answer.
  const reviewCodesKey = reviewRoute?.countryCodes.join(",") ?? "";
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
  const activeTopic = reviewRoute?.topic ?? "flag";

  const invalidRoute = !reviewRoute || reviewCountries.length === 0;
  const questions = useMemo<Question[]>(
    () => generateReviewQuestions(reviewCountries, activeTopic, Math.random, countries),
    [activeTopic, countries, reviewCountries]
  );
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [xp, setXp] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; question: Question; selectedLabel?: string } | null>(null);
  const [items, setItems] = useState<RoundResultItem[]>([]);
  const [result, setResult] = useState<{ xpEarned: number; correct: number; total: number; earnedBadgeIds: string[] } | null>(null);
  const question = questions[index];
  const topicLabel = TOPIC_LABEL[activeTopic] ?? activeTopic;
  const contextTitle = `Review · ${topicLabel}`;

  if (invalidRoute) return <Navigate to="/review" replace />;
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
    setFeedback({ ok: wasCorrect, question, selectedLabel });
  }

  function complete() {
    const total = questions.length || 1;
    const bonusXp = 10;
    let next = { ...progress, xp: progress.xp + bonusXp };
    const newIds = evaluateBadges(next, countries, { kind: "review", score: correct, total });
    if (newIds.length) next = awardBadges(next, newIds);
    setProgress(next);
    trackEvent("review-complete", { accuracy: Math.round((correct / total) * 100), topic: activeTopic });
    setResult({ xpEarned: xp + bonusXp, correct, total, earnedBadgeIds: newIds });
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
    goBack();
  }

  if (result) {
    return (
      <RoundResults
        score={result.correct}
        total={result.total}
        items={items}
        caption={`+${result.xpEarned} XP`}
        earnedBadges={earnedBadgeResults(result.earnedBadgeIds)}
        actions={[
          { label: "Done", variant: "primary", icon: "review", onPress: goBack }
        ]}
      />
    );
  }

  if (!question) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <button onClick={goBack} className="btn-primary">Back to review</button>
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
            aria-label="Close review"
            className="icon-btn shrink-0 hover:text-ink"
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
        <QuestionCard question={question} disabled={Boolean(feedback)} selectedLabel={feedback?.selectedLabel} onAnswer={answer} />
      </section>
      {feedback && (
        <FeedbackPanel
          correct={feedback.ok}
          country={feedback.question.correctCountry}
          xp={10}
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
