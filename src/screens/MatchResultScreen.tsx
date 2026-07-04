import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import ResultCard from "../components/ResultCard";
import { BRAND } from "../config/brand";
import { createMatch, getMatch, getMatchResults, matchUrl, winnerFromResults, buildRematchConfig, type Match, type MatchResult } from "../lib/matches";

async function shareMatch(id: string) {
  const url = matchUrl(id);
  const text = `Take my ${BRAND.name} challenge: ${url}`;
  if (navigator.share) await navigator.share({ text, url });
  else await navigator.clipboard?.writeText(text);
}

export default function MatchResultScreen({
  matchId,
  onBack,
  onOpenMatch,
  onSignIn
}: {
  matchId: string | null;
  onBack: () => void;
  onOpenMatch: (matchId: string) => void;
  onSignIn: () => void;
}) {
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
      onOpenMatch(next.id);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Sign in")) onSignIn();
      else setError(err instanceof Error ? err.message : "Could not create rematch.");
    } finally {
      setWorking(false);
    }
  }

  const praise =
    outcome?.type === "winner" ? `${outcome.winner?.display_name} wins with ${outcome.topScore}` : outcome?.type === "tie" ? `Tie at ${outcome.topScore}` : "Waiting for another player";
  const topScore = outcome?.topScore;

  return (
    <main className="grid min-h-screen place-items-center bg-hero-sky p-5">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
        <ResultCard
          icon="trophy"
          title="Match results"
          praise={praise}
          praiseTone="text-flaggo-muted"
          actions={[
            { label: working ? "Creating..." : "Rematch", onClick: rematch, disabled: working },
            ...(matchId ? [{ label: "Share challenge", onClick: () => void shareMatch(matchId), kind: "secondary" as const }] : [])
          ]}
        >
          {error && <div className="mt-4 rounded-2xl bg-error/10 p-4 font-bold text-error">{error}</div>}
          <div className="mt-5 grid gap-3 text-left">
            {results.map((result) => {
              const isTop = topScore != null && result.score === topScore;
              return (
                <div
                  key={result.user_id}
                  className={`grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border-2 p-4 ${isTop ? "border-flaggo-green bg-flaggo-green/5" : "border-flaggo-border bg-white"}`}
                >
                  <span className="flex min-w-0 items-center gap-1.5 truncate font-display text-xl font-black">
                    {isTop && <Icon name="trophy" size={16} className="shrink-0 text-flaggo-green" />}
                    {result.display_name}
                  </span>
                  <span className={`font-display text-2xl font-black ${isTop ? "text-flaggo-green" : "text-flaggo-muted"}`}>{result.score}/{result.total}</span>
                </div>
              );
            })}
            {!results.length && <div className="rounded-[24px] bg-white p-6 text-center font-bold text-flaggo-muted shadow-card">No results yet.</div>}
          </div>
        </ResultCard>
      </div>
    </main>
  );
}
