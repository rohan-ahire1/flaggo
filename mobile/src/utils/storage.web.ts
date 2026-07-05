import { defaultProgress, type AppProgress } from "@flaggo/core/types/progress";
import { normalizeProgress } from "@flaggo/core/utils/progressMerge";

const STORAGE_KEY = "flaggo-progress";
const META_KEY = "flaggo-progress-meta";
const NEEDS_MERGE_KEY = "flaggo-progress-needs-merge";

export type ProgressMeta = {
  updatedAt: string | null;
  userId: string | null;
};

function storage() {
  return typeof localStorage === "undefined" ? null : localStorage;
}

export async function loadProgress(): Promise<AppProgress> {
  try {
    const saved = storage()?.getItem(STORAGE_KEY);
    if (!saved) return defaultProgress;
    return normalizeProgress(JSON.parse(saved) as Partial<AppProgress>);
  } catch {
    return defaultProgress;
  }
}

export async function saveProgress(progress: AppProgress): Promise<void> {
  const store = storage();
  if (!store) return;
  store.setItem(STORAGE_KEY, JSON.stringify(progress));
  store.setItem(META_KEY, JSON.stringify({ updatedAt: new Date().toISOString(), userId: null }));
  if (hasProgress(progress)) store.setItem(NEEDS_MERGE_KEY, "true");
}

export async function resetProgress(): Promise<void> {
  const store = storage();
  if (!store) return;
  store.removeItem(STORAGE_KEY);
  store.removeItem(META_KEY);
  store.removeItem(NEEDS_MERGE_KEY);
}

export async function saveSyncedProgress(progress: AppProgress, meta: ProgressMeta): Promise<void> {
  const store = storage();
  if (!store) return;
  store.setItem(STORAGE_KEY, JSON.stringify(progress));
  store.setItem(META_KEY, JSON.stringify(meta));
}

export async function loadProgressMeta(): Promise<ProgressMeta> {
  try {
    const saved = storage()?.getItem(META_KEY);
    if (!saved) return { updatedAt: null, userId: null };
    return { updatedAt: null, userId: null, ...JSON.parse(saved) };
  } catch {
    return { updatedAt: null, userId: null };
  }
}

export async function needsAnonymousMerge(): Promise<boolean> {
  return storage()?.getItem(NEEDS_MERGE_KEY) === "true";
}

export async function clearAnonymousMergeMarker(): Promise<void> {
  storage()?.removeItem(NEEDS_MERGE_KEY);
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
      progress.decks.length
  );
}
