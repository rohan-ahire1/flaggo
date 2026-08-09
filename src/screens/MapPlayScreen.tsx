import { lazy, Suspense, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import FeedbackPanel from "../components/FeedbackPanel";
import FlagImage from "../components/FlagImage";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import RoundResults, { type RoundResultItem } from "../components/RoundResults";
import { useConfirm } from "../components/ConfirmDialog";
import type { Country } from "@flaggo/core/types/country";
import { generateMapQuestions } from "@flaggo/core/utils/quiz";
import { updateReviewState } from "@flaggo/core/utils/spacedRepetition";
import { awardBadges, evaluateBadges } from "@flaggo/core/game/badges";
import { useGame } from "../state/GameProvider";
import { trackEvent } from "../lib/analytics";
import { earnedBadgeResults } from "../lib/badges";
import { parseMapPlayRoute } from "../navigation/routes";
import { useAppBack } from "../navigation/useAppBack";

const WorldMap = lazy(() => import("../components/WorldMap"));

export default function MapPlayScreen() {
  const goBack = useAppBack("/map");
  const confirm = useConfirm();
  const location = useLocation();
  const { countries: allCountries, progress, setProgress, startMapPractice } = useGame();
  const routeState = useMemo(() => parseMapPlayRoute(location.search, location.state), [location.search, location.state]);
  // Keyed memo: a fresh array each render would regenerate questions mid-round.
  const codesKey = routeState?.countryCodes.join(",") ?? "";
  // The selected practice set controls which countries can be targets, not
  // which countries exist on the interactive map. Tapping any other mapped
  // country must still be possible so it can be recorded as a wrong answer.
  const targetCountries = useMemo(
    () =>
      codesKey
        ? codesKey
            .split(",")
            .map((code) => allCountries.find((country) => country.code === code))
            .filter((country): country is Country => Boolean(country))
        : [],
    [allCountries, codesKey]
  );
  const mode = routeState?.mode ?? "locate";
  const onExit = goBack;
  const questions = useMemo(() => generateMapQuestions(targetCountries, mode), [targetCountries, mode]);
  const countryByCode = useMemo(() => new Map(allCountries.map((country) => [country.code, country])), [allCountries]);
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [xp, setXp] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; country: Country; wrongCode?: string } | null>(null);
  const [items, setItems] = useState<RoundResultItem[]>([]);
  const [finished, setFinished] = useState(false);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const question = questions[index];
  const target = question ? countryByCode.get(question.targetCode) : undefined;
  const isIdentify = question?.type === "identify-country";

  function answer(selectedCode: string) {
    if (!question || !target || feedback) return;
    const ok = selectedCode === target.code;
    const earned = ok ? 10 : 0;
    const next = updateReviewState(target.code, "location", ok, currentProgress);
    const withXp = { ...next, xp: next.xp + earned };
    setCurrentProgress(withXp);
    setProgress(withXp);
    setCorrect((value) => value + (ok ? 1 : 0));
    setXp((value) => value + earned);
    setItems((value) => [...value, {
      label: target.name,
      correct: ok,
      chosen: ok ? undefined : countryByCode.get(selectedCode)?.name ?? selectedCode,
      answer: target.name,
      countryCode: target.code,
      countryName: target.name,
      flagUrl: target.flagUrl,
      context: [target.subregion, target.capital ? `Capital: ${target.capital}` : ""].filter(Boolean).join(" · ")
    }]);
    setFeedback({ ok, country: target, wrongCode: ok ? undefined : selectedCode });
  }

  function finishRound() {
    const total = questions.length || 1;
    let next = { ...currentProgress, xp: currentProgress.xp + 10 };
    const newIds = evaluateBadges(next, allCountries, { kind: "map", score: correct, total });
    if (newIds.length) next = awardBadges(next, newIds);
    setEarnedBadgeIds(newIds);
    setCurrentProgress(next);
    setProgress(next);
    trackEvent("map-practice-complete", { accuracy: Math.round((correct / total) * 100), mode });
    setFinished(true);
  }

  function continueNext() {
    setFeedback(null);
    if (index >= questions.length - 1) finishRound();
    else setIndex((value) => value + 1);
  }

  if (!routeState) return <Navigate to="/map" replace />;

  async function closeRound() {
    if (items.length > 0 && !finished) {
      const ok = await confirm({
        title: "End this round?",
        body: "Answered questions are already counted.",
        confirmLabel: "End round",
        destructive: true
      });
      if (!ok) return;
    }
    onExit();
  }

  if (finished) {
    return (
      <RoundResults
        score={correct}
        total={questions.length || 1}
        items={items}
        caption={`+${xp + 10} XP`}
        earnedBadges={earnedBadgeResults(earnedBadgeIds)}
        actions={[
          { label: "Play again", variant: "primary", icon: "play", onPress: () => startMapPractice(mode, targetCountries, { replace: true }) },
          { label: "Done", variant: "secondary", icon: "globe", onPress: onExit }
        ]}
      />
    );
  }

  if (!question || !target) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <button onClick={onExit} className="btn-primary">Go back</button>
      </main>
    );
  }

  return (
    <main className={mode === "locate" ? "flex h-dvh flex-col overflow-hidden bg-paper p-5" : "min-h-screen bg-paper p-5"}>
      <header className="mb-4">
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={() => void closeRound()}
            aria-label="Exit map practice"
            className="icon-btn shrink-0"
          >
            <Icon name="close" size={20} />
          </button>
          <div className="flex-1"><ProgressBar value={(index / questions.length) * 100} /></div>
          <span className="shrink-0 text-sm font-display font-bold text-muted">{index + 1}/{questions.length}</span>
        </div>
        <div className="rounded-[24px] border border-line bg-paper p-4 shadow-card">
          <p className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wide text-primary">
            <Icon name="globe" size={14} /> {mode === "locate" ? "Locate" : "Identify"}
          </p>
          {mode === "locate" ? (
            <div className="mt-2 flex items-center gap-3">
              <FlagImage code={target.code} name={target.name} src={target.flagUrl} className="h-14 w-20 rounded-xl p-1" />
              <h1 className="font-display text-2xl font-semibold">Tap {target.name}</h1>
            </div>
          ) : (
            <h1 className="mt-1 font-display text-2xl font-semibold">Which country is highlighted?</h1>
          )}
        </div>
      </header>

      <Suspense fallback={<div className={mode === "locate" ? "min-h-0 flex-1 animate-pulse rounded-[24px] bg-paper shadow-card" : "h-[360px] animate-pulse rounded-[24px] bg-paper shadow-card"} />}>
        <WorldMap
          countries={allCountries}
          highlightCode={isIdentify ? question.targetCode : undefined}
          correctCode={feedback?.country.code}
          wrongCode={feedback?.wrongCode}
          interactive={!feedback && mode === "locate"}
          onCountryTap={answer}
          mapClassName={mode === "locate" ? "min-h-0 flex-1 w-full" : "h-[400px] w-full"}
        />
      </Suspense>

      {question.type === "identify-country" && (
        <section className="mt-4 grid gap-3">
          {question.options.map((country) => {
            const selected = feedback && country.code === (feedback.ok ? target.code : feedback.wrongCode);
            const correctOption = feedback && country.code === target.code;
            return (
              <button
                key={country.code}
                disabled={Boolean(feedback)}
                onClick={() => answer(country.code)}
                className={`rounded-2xl border-2 border-b-[5px] bg-paper p-4 text-left font-display font-semibold transition-all active:translate-y-[3px] active:border-b-2 ${
                  correctOption ? "border-success text-success" : selected ? "border-error text-error" : "border-line text-ink"
                }`}
              >
                {country.name}
              </button>
            );
          })}
        </section>
      )}

      {feedback && (
        <FeedbackPanel
          correct={feedback.ok}
          country={feedback.country}
          xp={10}
          answerLabel={feedback.country.name}
          selectedLabel={feedback.wrongCode ? countryByCode.get(feedback.wrongCode)?.name : undefined}
          onContinue={continueNext}
        />
      )}
    </main>
  );
}
