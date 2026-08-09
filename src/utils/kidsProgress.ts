// Kids Mode stores its own tiny progress blob, fully separate from the main
// AppProgress (own localStorage key, no Supabase sync). Kids play on a shared
// device with no account, so this stays local-only by design (COPPA-friendly).

const KEY = "flaggo-kids";

export type KidsProgress = {
  /** Country codes the child has correctly identified at least once (earns a sticker). */
  collected: string[];
  /** Total rounds played, for the "keep going" feel. */
  plays: number;
  /** Voice prompts on/off. Parents can mute. */
  voice: boolean;
};

const empty: KidsProgress = { collected: [], plays: 0, voice: true };

export function loadKids(): KidsProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...(JSON.parse(raw) as Partial<KidsProgress>) };
  } catch {
    return empty;
  }
}

export function saveKids(next: KidsProgress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private-mode failures — kids mode still works in-memory
  }
}

export function collectFlag(prev: KidsProgress, code: string): KidsProgress {
  const collected = prev.collected.includes(code) ? prev.collected : [...prev.collected, code];
  const next = { ...prev, collected, plays: prev.plays + 1 };
  saveKids(next);
  return next;
}
