import { useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import FlagImage from "../components/FlagImage";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import RoundResults, { type RoundResultItem } from "../components/RoundResults";
import { useConfirm } from "../components/ConfirmDialog";
import { getCapitalDistractors, getDistractors, shuffleArray } from "@flaggo/core/utils/quiz";
import { updateReviewState } from "@flaggo/core/utils/spacedRepetition";
import { awardBadges, evaluateBadges } from "@flaggo/core/game/badges";
import { useGame } from "../state/GameProvider";
import { earnedBadgeResults } from "../lib/badges";
import { parseTestRoute } from "../navigation/routes";

export default function FlagTestScreen() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const location = useLocation();
  const { countries: allCountries, lessons, progress, setProgress, startReview } = useGame();
  const routeState = useMemo(() => parseTestRoute(location.search, location.state), [location.search, location.state]);
  // Keyed memo: a fresh array each render would reshuffle the test mid-round.
  const codesKey = routeState?.countryCodes.join(",") ?? "";
  const countries = useMemo(
    () =>
      codesKey
        ? codesKey
            .split(",")
            .map((code) => allCountries.find((country) => country.code === code))
            .filter((country): country is (typeof allCountries)[number] => Boolean(country))
        : [],
    [allCountries, codesKey]
  );
  const mode = routeState?.mode ?? "recall";
  const topic = routeState?.topic ?? "flag";
  const onDone = () => navigate("/review");
  const questions = useMemo(() => shuffleArray(countries), [countries]);
  const [index, setIndex] = useState(0);
  const progressRef = useRef(progress);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [graded, setGraded] = useState<null | boolean>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const correctRef = useRef(0);
  const [items, setItems] = useState<RoundResultItem[]>([]);
  const [missed, setMissed] = useState<typeof allCountries>([]);
  const [complete, setComplete] = useState(false);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const country = questions[index];
  const options = useMemo(() => {
    if (!country) return [];
    if (topic === "capital") return shuffleArray([country.capital!.trim(), ...getCapitalDistractors(country, allCountries, 3)]);
    return shuffleArray([country, ...getDistractors(country, allCountries, 3)]);
  }, [allCountries, country, topic]);
  const answer = topic === "capital" ? country?.capital?.trim() : country?.name;
  const topicLabel = topic === "capital" ? "Capital" : "Flag";

  function reveal() {
    if (!country || revealed) return;
    setRevealed(true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(answer ?? country.name);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  function grade(ok: boolean) {
    if (!country || graded !== null) return;
    setGraded(ok);
    if (ok) correctRef.current += 1;
    setCorrectCount((value) => value + (ok ? 1 : 0));
    setItems((value) => [...value, {
      label: country.name,
      correct: ok,
      chosen: ok ? undefined : selectedValue ? (topic === "capital" ? selectedValue : allCountries.find((item) => item.code === selectedValue)?.name ?? selectedValue) : "Missed it",
      answer,
      countryCode: country.code,
      countryName: country.name,
      flagUrl: country.flagUrl,
      context: [country.subregion, country.capital ? `Capital: ${country.capital}` : ""].filter(Boolean).join(" · ")
    }]);
    if (!ok) setMissed((value) => [...value, country]);
    const next = updateReviewState(country.code, topic, ok, progressRef.current);
    const withXp = { ...next, xp: next.xp + (ok ? 5 : 0) };
    progressRef.current = withXp;
    setProgress(withXp);
  }

  function next() {
    if (index >= questions.length - 1) {
      let finalProgress = progressRef.current;
      const newIds = evaluateBadges(finalProgress, allCountries, lessons, { kind: "test", score: correctRef.current, total: questions.length });
      if (newIds.length) finalProgress = awardBadges(finalProgress, newIds);
      progressRef.current = finalProgress;
      setEarnedBadgeIds(newIds);
      setProgress(finalProgress);
      setComplete(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelectedValue(null);
    setRevealed(false);
    setGraded(null);
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
    onDone();
  }

  if (!routeState) return <Navigate to="/test-setup" replace />;

  if (complete) {
    return (
      <RoundResults
        score={correctCount}
        total={questions.length}
        items={items}
        caption={`+${correctCount * 5} XP`}
        earnedBadges={earnedBadgeResults(earnedBadgeIds)}
        actions={[
          ...(missed.length ? [{ label: "Practice missed", variant: "primary" as const, icon: "review" as const, onPress: () => startReview(missed, topic) }] : []),
          { label: "Back to Practice", variant: missed.length ? "secondary" as const : "primary" as const, icon: "target" as const, onPress: onDone }
        ]}
      />
    );
  }

  if (!country) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <button onClick={onDone} className="btn-primary">Go back</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-5">
      <header className="mb-5">
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={() => void closeRound()}
            aria-label="Exit test"
            className="icon-btn shrink-0"
          >
            <Icon name="close" size={20} />
          </button>
          <div className="flex-1"><ProgressBar value={((index + (revealed ? 1 : 0)) / questions.length) * 100} /></div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="flex items-center gap-1.5 font-display font-bold uppercase text-primary">
              <Icon name={mode === "recall" ? "target" : "library"} size={15} />
              {mode === "recall" ? "Recall test" : "Multiple choice"}
            </p>
            <h1 className="font-display text-2xl font-semibold">{topicLabel} {index + 1} of {questions.length}</h1>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-paper px-3 py-2 text-sm font-display font-bold text-success shadow-card">
            <Icon name="check" size={15} />
            {correctCount}
          </div>
        </div>
      </header>

      <section className="rounded-[28px] bg-paper p-5 shadow-card-lg">
        <FlagImage code={country.code} name={country.name} src={country.flagUrl} className="aspect-[4/3] w-full rounded-[24px] p-4" />

        {mode === "recall" ? (
          <div className="mt-5 rounded-[24px] bg-surface p-4 text-center">
            <p className="font-display text-xl font-semibold">Say the {topic === "capital" ? "capital" : "country"} in your head.</p>
            <p className="mt-1 text-sm font-bold text-muted">Tap Reveal when you are ready.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {options.map((option) => {
              const value = typeof option === "string" ? option : option.code;
              const label = typeof option === "string" ? option : option.name;
              return (
              <button
                key={value}
                disabled={revealed}
                onClick={() => setSelectedValue(value)}
                className={`rounded-2xl border-b-4 p-4 text-left font-display font-black transition active:translate-y-1 ${
                  selectedValue === value ? "border-primary bg-primary/10 text-primaryDark" : "border-line bg-surface text-ink"
                }`}
              >
                {label}
              </button>
              );
            })}
          </div>
        )}

        {revealed ? (
          <div className={`mt-5 rounded-[24px] p-4 ${graded === true ? "bg-success/10 text-success" : graded === false ? "bg-error/10 text-error" : "bg-primary/10 text-primaryDark"}`}>
            <p className="font-display text-sm font-black uppercase">{graded === null ? "Answer" : graded ? "Marked right" : "Marked wrong"}</p>
            <p className="mt-1 font-display font-semibold text-ink">{answer}</p>
            {topic === "flag" && country.officialName && <p className="text-sm font-bold text-muted">{country.officialName}</p>}
            {topic === "capital" && <p className="text-sm font-bold text-muted">{country.name}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                disabled={graded !== null}
                onClick={() => grade(true)}
                className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-b-[5px] border-primaryDark bg-success px-3 py-3 font-display font-semibold text-white transition active:translate-y-[3px] active:border-b-2 disabled:opacity-60"
              >
                <Icon name="check" size={18} /> Got it
              </button>
              <button
                disabled={graded !== null}
                onClick={() => grade(false)}
                className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-b-[5px] border-error bg-error px-3 py-3 font-display font-semibold text-white transition active:translate-y-[3px] active:border-b-2 disabled:opacity-60"
              >
                <Icon name="x" size={18} /> Missed it
              </button>
            </div>
          </div>
        ) : null}

        <button
          onClick={revealed ? next : reveal}
          disabled={revealed && graded === null}
          className="btn-primary mt-5 w-full"
        >
          {revealed ? (index >= questions.length - 1 ? "Finish" : `Next ${topic}`) : "Reveal answer"}
        </button>
      </section>
    </main>
  );
}
