import { eq } from "drizzle-orm";
import { db, initDb } from "../db/client";
import { progress as progressTable, reviewItems, type ProgressRow } from "../db/schema";
import { defaultProgress, type AppProgress, type ReviewState } from "../types/progress";
import type { Topic } from "../types/topic";
import { normalizeProgress } from "./progressMerge";

// Storage is now SQLite (via Drizzle) instead of localStorage, so every export
// is async. The public function names/shapes match the web version so the rest
// of the game logic is unchanged.

export type ProgressMeta = {
  updatedAt: string | null;
  userId: string | null;
};

function parse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function rowToProgress(row: ProgressRow, review: Record<string, ReviewState>): AppProgress {
  return normalizeProgress({
    xp: row.xp,
    coins: row.coins,
    streak: row.streak,
    lastLessonDate: row.lastLessonDate,
    selectedTopic: row.selectedTopic as Topic,
    completedLessonIds: parse(row.completedLessonIds, [] as string[]),
    totalCorrect: row.totalCorrect,
    totalWrong: row.totalWrong,
    review,
    daily: {
      lastDate: row.dailyLastDate,
      streak: row.dailyStreak,
      best: row.dailyBest,
      history: parse(row.dailyHistory, {})
    },
    arcade: parse(row.arcade, {}),
    decks: parse(row.decks, [])
  });
}

async function readRow(): Promise<ProgressRow | undefined> {
  const rows = await db.select().from(progressTable).where(eq(progressTable.id, 1)).limit(1);
  return rows[0];
}

async function readReview(): Promise<Record<string, ReviewState>> {
  const rows = await db.select().from(reviewItems);
  const map: Record<string, ReviewState> = {};
  for (const r of rows) {
    map[r.countryCode] = {
      countryCode: r.countryCode,
      topic: (r.topic ?? undefined) as Topic | undefined,
      box: r.box,
      correctCount: r.correctCount,
      wrongCount: r.wrongCount,
      lastSeenAt: r.lastSeenAt,
      nextReviewAt: r.nextReviewAt
    };
  }
  return map;
}

export async function loadProgress(): Promise<AppProgress> {
  initDb();
  const row = await readRow();
  if (!row) return defaultProgress;
  const review = await readReview();
  return rowToProgress(row, review);
}

async function writeRow(progress: AppProgress, meta: ProgressMeta, needsMerge: boolean): Promise<void> {
  initDb();
  await db
    .update(progressTable)
    .set({
      xp: progress.xp,
      coins: progress.coins,
      streak: progress.streak,
      lastLessonDate: progress.lastLessonDate,
      selectedTopic: progress.selectedTopic,
      totalCorrect: progress.totalCorrect,
      totalWrong: progress.totalWrong,
      dailyLastDate: progress.daily.lastDate,
      dailyStreak: progress.daily.streak,
      dailyBest: progress.daily.best,
      completedLessonIds: JSON.stringify(progress.completedLessonIds),
      dailyHistory: JSON.stringify(progress.daily.history),
      arcade: JSON.stringify(progress.arcade),
      decks: JSON.stringify(progress.decks),
      updatedAt: meta.updatedAt,
      userId: meta.userId,
      needsMerge: needsMerge ? 1 : 0
    })
    .where(eq(progressTable.id, 1));

  // Re-sync the relational review table: clear and re-insert current cards.
  await db.delete(reviewItems);
  const entries = Object.values(progress.review);
  if (entries.length) {
    await db.insert(reviewItems).values(
      entries.map((r) => ({
        countryCode: r.countryCode,
        topic: r.topic ?? null,
        box: r.box,
        correctCount: r.correctCount,
        wrongCount: r.wrongCount,
        lastSeenAt: r.lastSeenAt,
        nextReviewAt: r.nextReviewAt
      }))
    );
  }
}

export async function saveProgress(progress: AppProgress): Promise<void> {
  await writeRow(progress, { updatedAt: new Date().toISOString(), userId: null }, hasProgress(progress));
}

export async function saveSyncedProgress(progress: AppProgress, meta: ProgressMeta): Promise<void> {
  await writeRow(progress, meta, false);
}

export async function resetProgress(): Promise<void> {
  initDb();
  await db.delete(reviewItems);
  await db.update(progressTable).set({
    xp: 0,
    coins: 0,
    streak: 0,
    lastLessonDate: null,
    selectedTopic: "flag",
    totalCorrect: 0,
    totalWrong: 0,
    dailyLastDate: null,
    dailyStreak: 0,
    dailyBest: 0,
    completedLessonIds: "[]",
    dailyHistory: "{}",
    arcade: "{}",
    decks: "[]",
    updatedAt: null,
    userId: null,
    needsMerge: 0
  }).where(eq(progressTable.id, 1));
}

export async function loadProgressMeta(): Promise<ProgressMeta> {
  initDb();
  const row = await readRow();
  return { updatedAt: row?.updatedAt ?? null, userId: row?.userId ?? null };
}

export async function needsAnonymousMerge(): Promise<boolean> {
  initDb();
  const row = await readRow();
  return Boolean(row?.needsMerge);
}

export async function clearAnonymousMergeMarker(): Promise<void> {
  initDb();
  await db.update(progressTable).set({ needsMerge: 0 }).where(eq(progressTable.id, 1));
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
