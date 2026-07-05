import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useSyncedProgress } from "../hooks/useSyncedProgress";
import { submitScore, xpBoard } from "../lib/leaderboard";
import { useNameClaim } from "../components/NameClaimProvider";
import { clearPendingMatch, readPendingMatch } from "../lib/pendingMatch";
import { submitMatchResult } from "../lib/matches";

// Shares ONE useSyncedProgress instance across every tab and the quiz screen,
// so a round finished in /quiz is immediately reflected on Home and Profile.
type ProgressContextValue = ReturnType<typeof useSyncedProgress>;

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const value = useSyncedProgress();
  const { user, displayName } = useAuth();
  const { ensureName } = useNameClaim();
  const lastSubmittedXp = useRef<number | null>(null);
  const flushingPendingMatch = useRef(false);

  useEffect(() => {
    if (!user || !displayName?.trim() || value.progress.xp <= 0) return;
    if (lastSubmittedXp.current === value.progress.xp) return;
    const id = setTimeout(() => {
      if (lastSubmittedXp.current === value.progress.xp) return;
      lastSubmittedXp.current = value.progress.xp;
      void submitScore(xpBoard(), value.progress.xp, displayName).catch(() => undefined);
    }, 5000);
    return () => clearTimeout(id);
  }, [displayName, user, value.progress.xp]);

  useEffect(() => {
    if (!user || flushingPendingMatch.current) return;
    flushingPendingMatch.current = true;
    void readPendingMatch()
      .then(async (pending) => {
        if (!pending) return;
        const name = await ensureName();
        if (!name) return;
        await submitMatchResult(pending.matchId, pending.score, pending.total, name);
        await clearPendingMatch();
      })
      .catch(() => undefined)
      .finally(() => {
        flushingPendingMatch.current = false;
      });
  }, [ensureName, user]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
