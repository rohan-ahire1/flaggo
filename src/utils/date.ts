import type { AppProgress } from "../types/progress";

export function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function isYesterday(dateKey: string | null) {
  if (!dateKey) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateKey === getTodayKey(yesterday);
}

export function updateStreak(progress: AppProgress): AppProgress {
  const today = getTodayKey();
  if (progress.lastLessonDate === today) return progress;
  return {
    ...progress,
    streak: isYesterday(progress.lastLessonDate) ? progress.streak + 1 : 1,
    lastLessonDate: today
  };
}
