import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthProvider";
import { updateDisplayName } from "../lib/leaderboard";
import NameClaimDialog from "./NameClaimDialog";

type NameClaimContextValue = {
  ensureName: () => Promise<string | null>;
};

const NameClaimContext = createContext<NameClaimContextValue>({
  ensureName: async () => null
});

type PendingResolver = (name: string | null) => void;

export function NameClaimProvider({ children }: { children: ReactNode }) {
  const { user, displayName, setDisplayName } = useAuth();
  const [open, setOpen] = useState(false);
  const resolver = useRef<PendingResolver | null>(null);

  const close = useCallback((name: string | null) => {
    resolver.current?.(name);
    resolver.current = null;
    setOpen(false);
  }, []);

  const ensureName = useCallback(async () => {
    if (!user) return null;
    const current = displayName?.trim();
    if (current) return current;
    if (resolver.current) return null;
    setOpen(true);
    return new Promise<string | null>((resolve) => {
      resolver.current = resolve;
    });
  }, [displayName, user]);

  async function saveName(value: string) {
    if (!user) {
      close(null);
      return;
    }
    const clean = await updateDisplayName(user.id, value);
    setDisplayName(clean);
    close(clean);
  }

  return (
    <NameClaimContext.Provider value={{ ensureName }}>
      {children}
      <NameClaimDialog open={open} onCancel={() => close(null)} onSave={saveName} />
    </NameClaimContext.Provider>
  );
}

export function useNameClaim() {
  return useContext(NameClaimContext);
}
