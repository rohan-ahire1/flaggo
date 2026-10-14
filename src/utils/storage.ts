import { defaultProgress, type AppProgress } from "@flaggo/core/types/progress";
import { normalizeProgress } from "@flaggo/core/utils/progressMerge";

const STORAGE_KEY = "flaggo-progress";
const META_KEY = "flaggo-progress-meta";
const NEEDS_MERGE_KEY = "flaggo-progress-needs-merge";

export type ProgressMeta = {
  updatedAt: string | null;
  userId: string | null;
};

export function loadProgress(): AppProgress {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultProgress;
    return normalizeProgress(JSON.parse(saved) as Partial<AppProgress>);
  } catch {
    return defaultProgress;
  }
}

// Writes can throw when storage is full or blocked (e.g. some private modes).
// Progress still lives in memory for the session, so don't crash the game over it.
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function saveProgress(progress: AppProgress): void {
  write(STORAGE_KEY, JSON.stringify(progress));
  write(META_KEY, JSON.stringify({ updatedAt: new Date().toISOString(), userId: null }));
  if (hasProgress(progress)) write(NEEDS_MERGE_KEY, "true");
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(META_KEY);
  localStorage.removeItem(NEEDS_MERGE_KEY);
}

export function saveSyncedProgress(progress: AppProgress, meta: ProgressMeta): void {
  write(STORAGE_KEY, JSON.stringify(progress));
  write(META_KEY, JSON.stringify(meta));
}

export function loadProgressMeta(): ProgressMeta {
  try {
    const saved = localStorage.getItem(META_KEY);
    if (!saved) return { updatedAt: null, userId: null };
    return { updatedAt: null, userId: null, ...JSON.parse(saved) };
  } catch {
    return { updatedAt: null, userId: null };
  }
}

export function needsAnonymousMerge(): boolean {
  return localStorage.getItem(NEEDS_MERGE_KEY) === "true";
}

export function clearAnonymousMergeMarker(): void {
  localStorage.removeItem(NEEDS_MERGE_KEY);
}

function hasProgress(progress: AppProgress) {
  return Boolean(
    progress.xp ||
      progress.coins ||
      progress.completedLessonIds.length ||
      Object.keys(progress.review).length ||
      progress.totalCorrect ||
      progress.totalWrong ||
      progress.daily.lastDate ||
      Object.keys(progress.daily.history).length ||
      Object.keys(progress.arcade).length ||
      progress.decks.length ||
      progress.badges.length
  );
}
