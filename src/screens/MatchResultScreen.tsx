import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import { BRAND } from "../config/brand";
import { createMatch, getMatch, getMatchResults, matchUrl, winnerFromResults, buildRematchConfig, type Match, type MatchResult } from "../lib/matches";
import { useGame } from "../state/GameProvider";

async function shareMatch(id: string) {
  const url = matchUrl(id);
  const text = `Take my ${BRAND.name} challenge: ${url}`;
  if (navigator.share) await navigator.share({ text, url });
  else await navigator.clipboard?.writeText(text);
}

export default function MatchResultScreen() {
  const navigate = useNavigate();
  const { id: matchId = null } = useParams();
  const { openSignIn } = useGame();
  const [match, setMatch] = useState<Match | null>(null);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const outcome = winnerFromResults(results);

  useEffect(() => {
    if (!matchId) return;
    let active = true;
    setError(null);
    Promise.all([getMatch(matchId), getMatchResults(matchId)])
      .then(([nextMatch, nextResults]) => {
        if (!active) return;
        setMatch(nextMatch);
        setResults(nextResults);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [matchId]);

  async function rematch() {
    setWorking(true);
    try {
      const next = await createMatch(buildRematchConfig(match));
      await shareMatch(next.id);
      navigate(`/match/${next.id}`);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Sign in")) openSignIn();
      else setError(err instanceof Error ? err.message : "Could not create rematch.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="p-5">
      <button onClick={() => navigate("/")} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
      <section className="rounded-[28px] bg-white p-6 text-center shadow-card-lg">
        <Icon name="trophy" size={44} className="mx-auto text-flaggo-green" />
        <h1 className="mt-3 screen-title">Match results</h1>
        <p className="mt-2 font-bold text-flaggo-muted">
          {outcome?.type === "winner" ? `${outcome.winner?.display_name} wins with ${outcome.topScore}.` : outcome?.type === "tie" ? `Tie at ${outcome.topScore}.` : "Waiting for another player."}
        </p>
      </section>
      {error && <div className="mt-4 rounded-2xl bg-error/10 p-4 font-bold text-error">{error}</div>}
      <section className="mt-5 grid gap-3">
        {results.map((result) => (
          <div key={result.user_id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-flaggo-border bg-white p-4 shadow-card">
            <span className="truncate font-display text-xl font-black">{result.display_name}</span>
            <span className="font-display text-2xl font-black text-flaggo-green">{result.score}/{result.total}</span>
          </div>
        ))}
        {!results.length && <div className="rounded-[24px] bg-white p-6 text-center font-bold text-flaggo-muted shadow-card">No results yet.</div>}
      </section>
      <div className="mt-5 grid gap-3">
        <button onClick={rematch} disabled={working} className="btn-primary">{working ? "Creating..." : "Rematch"}</button>
        {matchId && <button onClick={() => void shareMatch(matchId)} className="btn-secondary">Share challenge</button>}
      </div>
    </main>
  );
}
