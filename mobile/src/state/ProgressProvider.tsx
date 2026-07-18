import { createContext, useContext, type ReactNode } from "react";
import { useSyncedProgress } from "../hooks/useSyncedProgress";

// Shares ONE useSyncedProgress instance across every tab and the quiz screen,
// so a round finished in /quiz is immediately reflected on Home and Profile.
type ProgressContextValue = ReturnType<typeof useSyncedProgress>;

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const value = useSyncedProgress();
  return <ProgressContext.Provider value={value}>{value.loading ? null : children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
