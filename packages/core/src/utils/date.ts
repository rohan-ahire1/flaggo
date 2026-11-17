import type { AppProgress } from "../types/progress";

/** YYYY-MM-DD for the local calendar date (not UTC). */
export function localDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTodayKey(date = new Date()) {
  return localDayKey(date);
}

export function isYesterday(dateKey: string | null, now = new Date()) {
  if (!dateKey) return false;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return dateKey === localDayKey(yesterday);
}

export function updateStreak(progress: AppProgress, now = new Date()): AppProgress {
  const today = localDayKey(now);
  if (progress.lastLessonDate === today) return progress;
  return {
    ...progress,
    streak: isYesterday(progress.lastLessonDate, now) ? progress.streak + 1 : 1,
    lastLessonDate: today
  };
}

/** Updates the streak when this update shows the player did something (answered or earned XP). */
export function recordActivity(previous: AppProgress, next: AppProgress, now = new Date()): AppProgress {
  const answered = next.totalCorrect + next.totalWrong > previous.totalCorrect + previous.totalWrong;
  const earned = next.xp > previous.xp;
  return answered || earned ? updateStreak(next, now) : next;
}

/** The streak to display: 0 if the last play was before yesterday. */
export function currentStreak(progress: AppProgress, now = new Date()) {
  const last = progress.lastLessonDate;
  if (!last) return 0;
  return last === localDayKey(now) || isYesterday(last, now) ? progress.streak : 0;
}
