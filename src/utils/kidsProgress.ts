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

function defaults(): KidsProgress {
  return { collected: [], plays: 0, voice: true };
}

export function loadKids(): KidsProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null || Array.isArray(data)) return defaults();
    const { collected, plays, voice } = data as Record<string, unknown>;
    return {
      collected: Array.isArray(collected)
        ? [...new Set(collected.filter((c): c is string => typeof c === "string"))]
        : [],
      plays: typeof plays === "number" && Number.isInteger(plays) && plays >= 0 ? plays : 0,
      voice: typeof voice === "boolean" ? voice : true
    };
  } catch {
    return defaults();
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
