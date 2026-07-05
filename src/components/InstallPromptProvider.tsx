import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallPromptContextValue = {
  installPrompt: BeforeInstallPromptEvent | null;
  isStandalone: boolean;
  promptInstall: () => Promise<void>;
};

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null);

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(() => window.matchMedia?.("(display-mode: standalone)").matches ?? false);

  useEffect(() => {
    function beforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }
    const media = window.matchMedia?.("(display-mode: standalone)");
    function standaloneChange() {
      setIsStandalone(Boolean(media?.matches));
    }
    window.addEventListener("beforeinstallprompt", beforeInstallPrompt);
    media?.addEventListener("change", standaloneChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallPrompt);
      media?.removeEventListener("change", standaloneChange);
    };
  }, []);

  const value = useMemo<InstallPromptContextValue>(() => ({
    installPrompt,
    isStandalone,
    promptInstall: async () => {
      if (!installPrompt) return;
      await installPrompt.prompt();
      await installPrompt.userChoice.catch(() => null);
      setInstallPrompt(null);
    }
  }), [installPrompt, isStandalone]);

  return <InstallPromptContext.Provider value={value}>{children}</InstallPromptContext.Provider>;
}

export function useInstallPrompt() {
  const value = useContext(InstallPromptContext);
  if (!value) throw new Error("useInstallPrompt must be used within InstallPromptProvider");
  return value;
}
