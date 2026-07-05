import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useNameClaim } from "../components/NameClaimProvider";
import FeedbackPanel from "../components/FeedbackPanel";
import FlagImage from "../components/FlagImage";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import QuestionCard from "../components/QuestionCard";
import type { RoundResultItem } from "../components/RoundResults";
import { answerLabel, answerLabelForWrapper } from "@flaggo/core/game/answerLabel";
import { getMatch, getMatchResults, buildMatchQuestions, submitMatchResult, type Match, type MatchQuestion, type MatchResult } from "../lib/matches";
import { trackEvent } from "../lib/analytics";
import { useGame } from "../state/GameProvider";

const WorldMap = lazy(() => import("../components/WorldMap"));

export default function MatchScreen() {
  const navigate = useNavigate();
  const { id: matchId = null } = useParams();
  const { user } = useAuth();
  const { ensureName } = useNameClaim();
  const { countries, openSignIn } = useGame();
  const [match, setMatch] = useState<Match | null>(null);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; question: MatchQuestion; scoreAfter: number; wrongCode?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<RoundResultItem[]>([]);
  const questions = useMemo(() => (match ? buildMatchQuestions(match.seed, match.config, countries) : []), [countries, match]);
  const question = questions[index];

  useEffect(() => {
    if (!matchId) return;
    let active = true;
    setError(null);
    Promise.all([getMatch(matchId), getMatchResults(matchId)])
      .then(([nextMatch, nextResults]) => {
        if (!active) return;
        setMatch(nextMatch);
        setResults(nextResults);
        if (!nextMatch) setError("Match not found.");
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [matchId]);

  useEffect(() => {
    if (matchId && user) trackEvent("match_accept", { id: matchId });
  }, [matchId, user]);

  function answer(ok: boolean, selectedLabel?: string) {
    if (!question || feedback) return;
    const scoreAfter = correct + (ok ? 1 : 0);
    const chosen = question.topic === "location" && selectedLabel ? countries.find((country) => country.code === selectedLabel)?.name ?? selectedLabel : selectedLabel;
    setItems((value) => [...value, {
      label: question.country.name,
      correct: ok,
      chosen: ok ? undefined : chosen,
      answer: question.topic === "location" ? question.country.name : answerLabel(question.question),
      countryCode: question.country.code,
      countryName: question.country.name,
      flagUrl: question.country.flagUrl,
      context: [question.country.subregion, question.country.capital ? `Capital: ${question.country.capital}` : ""].filter(Boolean).join(" · ")
    }]);
    setCorrect(scoreAfter);
    setFeedback({ ok, question, scoreAfter, wrongCode: selectedLabel });
  }

  async function finish(finalScore = correct) {
    if (!matchId || submitting) return;
    const name = await ensureName();
    if (!name) {
      openSignIn();
      return;
    }
    setSubmitting(true);
    try {
      await submitMatchResult(matchId, finalScore, questions.length, name);
      navigate(`/match/${matchId}/result`, { state: { items } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit result.");
      setSubmitting(false);
    }
  }

  function continueNext() {
    if (!feedback) return;
    const nextScore = feedback.scoreAfter;
    setFeedback(null);
    if (index >= questions.length - 1) void finish(nextScore);
    else setIndex((value) => value + 1);
  }

  if (!matchId || error) {
    return (
      <main className="p-5">
        <button onClick={() => navigate("/")} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-paper text-muted shadow-card" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
        <section className="rounded-[24px] bg-paper p-6 text-center shadow-card">
          <h1 className="font-display text-2xl font-black">Challenge unavailable</h1>
          <p className="mt-2 font-bold text-muted">{error ?? "No match link was provided."}</p>
        </section>
      </main>
    );
  }

  if (!match) {
    return <main className="p-5"><div className="h-96 animate-pulse rounded-[24px] bg-paper shadow-card" /></main>;
  }

  if (!user) {
    const challenger = results[0];
    return (
      <main className="p-5">
        <button onClick={() => navigate("/")} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-paper text-muted shadow-card" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
        <section className="rounded-[28px] bg-paper p-6 text-center shadow-card-lg">
          <Icon name="trophy" size={44} className="mx-auto text-primary" />
          <h1 className="mt-3 screen-title">Friend challenge</h1>
          <p className="mt-2 font-bold text-muted">
            {challenger ? `${challenger.display_name} scored ${challenger.score}/${challenger.total}.` : "Play the same seeded quiz and compare scores."}
          </p>
          <p className="mt-2 font-medium text-muted">Sign in to accept this challenge and save your score to the leaderboard.</p>
          <button onClick={openSignIn} className="btn-primary mt-5 w-full bg-primary text-white">Sign in to accept &amp; save your score</button>
        </section>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <button onClick={() => navigate("/")} className="btn-primary bg-primary text-white">Go Home</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 bg-paper/85 p-4 backdrop-blur-md">
        <p className="mb-2.5 text-center font-display text-[13px] font-semibold uppercase tracking-wide text-muted">Friend Challenge</p>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} aria-label="Close match" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-muted shadow-card">
            <Icon name="close" size={20} />
          </button>
          <div className="flex-1"><ProgressBar value={(index / questions.length) * 100} /></div>
          <span className="shrink-0 text-sm font-display font-semibold text-muted">{index + 1}/{questions.length}</span>
        </div>
      </header>
      <section key={question.id} className="animate-fade-in p-5">
        {question.topic === "location" ? (
          <>
            <div className="mb-4 rounded-[24px] border border-line bg-paper p-4 shadow-card">
              <div className="mt-2 flex items-center gap-3">
                <FlagImage code={question.country.code} name={question.country.name} src={question.country.flagUrl} className="h-14 w-20 rounded-xl p-1" />
                <h1 className="font-display text-2xl font-black">Tap {question.country.name}</h1>
              </div>
            </div>
            <Suspense fallback={<div className="h-[360px] animate-pulse rounded-[24px] bg-paper shadow-card" />}>
              <WorldMap countries={countries} correctCode={feedback?.ok ? question.country.code : undefined} wrongCode={feedback?.wrongCode} interactive={!feedback} onCountryTap={(code) => answer(code === question.country.code, code)} />
            </Suspense>
          </>
        ) : (
          <QuestionCard question={question.question} disabled={Boolean(feedback) || submitting} onAnswer={answer} />
        )}
      </section>
      {feedback && <FeedbackPanel correct={feedback.ok} country={feedback.question.country} xp={0} answerLabel={answerLabelForWrapper(feedback.question)} onContinue={continueNext} />}
    </main>
  );
}
