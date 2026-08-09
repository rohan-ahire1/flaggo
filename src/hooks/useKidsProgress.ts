import { useCallback, useEffect, useState } from "react";
import { collectFlag, loadKids, saveKids, type KidsProgress } from "../utils/kidsProgress";
import { setVoiceEnabled } from "../utils/speak";

// Thin state wrapper over the local kids blob. Each Kids Mode screen mounts
// fresh and reads from localStorage, so returning from a game reflects the
// latest collected stickers without any global store.
export function useKidsProgress() {
  const [kids, setKids] = useState<KidsProgress>(loadKids);

  // Keep the voice module in sync with the saved preference.
  useEffect(() => {
    setVoiceEnabled(kids.voice);
  }, [kids.voice]);

  const collect = useCallback((code: string) => {
    setKids((prev) => collectFlag(prev, code));
  }, []);

  const toggleVoice = useCallback(() => {
    setKids((prev) => {
      const next = { ...prev, voice: !prev.voice };
      saveKids(next);
      return next;
    });
  }, []);

  return { kids, collect, toggleVoice };
}
