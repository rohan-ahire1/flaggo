import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useSyncedProgress } from "../hooks/useSyncedProgress";
import { submitScore, xpBoard } from "../lib/leaderboard";

// Shares ONE useSyncedProgress instance across every tab and the quiz screen,
// so a round finished in /quiz is immediately reflected on Home and Profile.
type ProgressContextValue = ReturnType<typeof useSyncedProgress>;

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const value = useSyncedProgress();
  const { user, displayName } = useAuth();
  const lastSubmittedXp = useRef<number | null>(null);

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

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
