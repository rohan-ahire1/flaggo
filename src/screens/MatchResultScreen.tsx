import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import FlagImage from "../components/FlagImage";
import type { RoundResultItem } from "../components/RoundResults";
import { earnedBadgeResults } from "../lib/badges";
import { BRAND } from "../config/brand";
import { createMatch, getMatch, getMatchResults, matchUrl, winnerFromResults, buildRematchConfig, type Match, type MatchResult } from "../lib/matches";
import { supabase } from "../lib/supabase";
import { useGame } from "../state/GameProvider";

async function shareMatch(id: string) {
  const url = matchUrl(id);
  const text = `Take my ${BRAND.name} challenge: ${url}`;
  if (navigator.share) await navigator.share({ text, url });
  else await navigator.clipboard?.writeText(text);
}

export default function MatchResultScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id: matchId = null } = useParams();
  const queryClient = useQueryClient();
  const { openSignIn } = useGame();
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const resultState = state as { items?: RoundResultItem[]; guestScore?: number; guestTotal?: number; earnedBadgeIds?: string[] } | null;
  const reviewItems = resultState?.items ?? [];
  const earnedBadges = earnedBadgeResults(resultState?.earnedBadgeIds ?? []);
  const guestScore = typeof resultState?.guestScore === "number" ? resultState.guestScore : null;
  const guestTotal = typeof resultState?.guestTotal === "number" ? resultState.guestTotal : null;
  const matchQuery = useQuery<Match | null, Error>({
    queryKey: ["match-detail", matchId],
    enabled: Boolean(matchId),
    queryFn: () => (matchId ? getMatch(matchId) : Promise.resolve(null))
  });
  const resultsQuery = useQuery<MatchResult[], Error>({
    queryKey: ["match-results", matchId],
    enabled: Boolean(matchId),
    queryFn: () => (matchId ? getMatchResults(matchId) : Promise.resolve([]))
  });
  const match = matchQuery.data ?? null;
  const results = resultsQuery.data ?? [];
  const outcome = winnerFromResults(results);
  const [subscribed, setSubscribed] = useState(false);
  const refetchResults = resultsQuery.refetch;

  useEffect(() => {
    setError(matchQuery.error?.message ?? resultsQuery.error?.message ?? null);
  }, [matchQuery.error, resultsQuery.error]);

  useEffect(() => {
    const client = supabase;
    if (!client || !matchId) return;
    let poll: number | null = null;
    let isSubscribed = false;
    const fallback = window.setTimeout(() => {
      if (!isSubscribed) poll = window.setInterval(() => void refetchResults(), 10_000);
    }, 5_000);
    const channel = client
      .channel(`match-${matchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "match_results", filter: `match_id=eq.${matchId}` }, () => {
        void queryClient.invalidateQueries({ queryKey: ["match-results", matchId] });
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          isSubscribed = true;
          setSubscribed(true);
          window.clearTimeout(fallback);
          if (poll) window.clearInterval(poll);
        }
      });
    return () => {
      setSubscribed(false);
      window.clearTimeout(fallback);
      if (poll) window.clearInterval(poll);
      void client.removeChannel(channel);
    };
  }, [matchId, queryClient, refetchResults]);

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
      <button onClick={() => navigate("/")} className="icon-btn mb-4" aria-label="Back"><Icon name="chevron" className="rotate-180" /></button>
      <section className="rounded-[28px] bg-paper p-6 text-center shadow-card-lg">
        <Icon name="trophy" size={44} className="mx-auto text-primary" />
        <h1 className="mt-3 screen-title">Match results</h1>
        <p className="mt-2 font-bold text-muted">
          {outcome?.type === "winner" ? `${outcome.winner?.display_name} wins with ${outcome.topScore}.` : outcome?.type === "tie" ? `Tie at ${outcome.topScore}.` : (
            <span className="inline-flex items-center gap-2">
              {subscribed ? <span className="h-2 w-2 rounded-full bg-success animate-pulse" aria-hidden="true" /> : null}
              Waiting for another player.
            </span>
          )}
        </p>
      </section>
      {earnedBadges.length ? (
        <section className="mt-4 flex animate-pop-in items-center gap-3 rounded-[22px] border border-primary/30 bg-primary/10 p-4 shadow-card">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-white">
            <Icon name="trophy" size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="section-label text-primary">Badge earned!</p>
            <p className="mt-0.5 font-display text-[18px] font-semibold text-ink">{earnedBadges.map((badge) => badge.name).join(", ")}</p>
          </div>
        </section>
      ) : null}
      {error && <div className="mt-4 rounded-2xl bg-error/10 p-4 font-bold text-error">{error}</div>}
      <section className="mt-5 grid gap-3">
        {guestScore != null && guestTotal != null ? (
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-primary bg-primary/10 p-4 shadow-card">
            <span className="truncate font-display text-xl font-black">You <span className="text-sm text-muted">(not saved)</span></span>
            <span className="font-display text-2xl font-black text-primary">{guestScore}/{guestTotal}</span>
          </div>
        ) : null}
        {results.map((result) => (
          <div key={result.user_id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-line bg-paper p-4 shadow-card">
            <span className="truncate font-display text-xl font-black">{result.display_name}</span>
            <span className="font-display text-2xl font-black text-primary">{result.score}/{result.total}</span>
          </div>
        ))}
        {!results.length && guestScore == null && <div className="rounded-[24px] bg-paper p-6 text-center font-bold text-muted shadow-card">No results yet.</div>}
      </section>
      {reviewItems.length ? (
        <section className="mt-5 overflow-hidden rounded-[22px] border border-line bg-paper shadow-card">
          <button
            type="button"
            onClick={() => setReviewOpen((value) => !value)}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-display text-[17px] font-semibold text-ink"
          >
            Your round
            <Icon name="chevron" className={reviewOpen ? "rotate-90 text-muted" : "text-muted"} />
          </button>
          {reviewOpen ? (
            <div className="border-t border-line">
              {reviewItems.map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  {item.countryCode && item.flagUrl ? <FlagImage code={item.countryCode} name={item.countryName ?? item.countryCode} src={item.flagUrl} className="w-12 rounded-lg p-1" /> : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 font-display font-semibold">{item.label}</p>
                      <Icon name={item.correct ? "check" : "x"} className={item.correct ? "text-success" : "text-error"} size={16} />
                    </div>
                    {item.context ? <p className="text-xs font-semibold text-muted">{item.context}</p> : null}
                    {!item.correct ? <p className="mt-1 text-sm font-semibold text-error">You: {item.chosen ?? "Missed"} <span className="text-success">Answer: {item.answer}</span></p> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      <div className="mt-5 grid gap-3">
        {guestScore != null ? <button onClick={openSignIn} className="btn-primary w-full">Sign in to save your score</button> : null}
        <button onClick={rematch} disabled={working} className="btn-primary w-full">{working ? "Creating..." : "Rematch"}</button>
        {matchId && <button onClick={() => void shareMatch(matchId)} className="btn-secondary w-full">Share challenge</button>}
      </div>
    </main>
  );
}
