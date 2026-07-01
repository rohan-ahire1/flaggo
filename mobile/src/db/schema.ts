import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Single-row table (id = 1) holding the player's scalar progress plus the
// map/array-shaped fields as JSON. Kept as one row because it mirrors the
// Supabase `progress` jsonb blob that this syncs to.
export const progress = sqliteTable("progress", {
  id: integer("id").primaryKey(),
  xp: integer("xp").notNull().default(0),
  coins: integer("coins").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastLessonDate: text("last_lesson_date"),
  selectedTopic: text("selected_topic").notNull().default("flag"),
  totalCorrect: integer("total_correct").notNull().default(0),
  totalWrong: integer("total_wrong").notNull().default(0),
  dailyLastDate: text("daily_last_date"),
  dailyStreak: integer("daily_streak").notNull().default(0),
  dailyBest: integer("daily_best").notNull().default(0),
  completedLessonIds: text("completed_lesson_ids").notNull().default("[]"),
  dailyHistory: text("daily_history").notNull().default("{}"),
  arcade: text("arcade").notNull().default("{}"),
  decks: text("decks").notNull().default("[]"),
  updatedAt: text("updated_at"),
  userId: text("user_id"),
  needsMerge: integer("needs_merge").notNull().default(0)
});

// Relational spaced-repetition state: one row per country/topic Leitner card.
// Modelled as a real table (not JSON) so "cards due now" is a plain SQL query.
export const reviewItems = sqliteTable("review_items", {
  countryCode: text("country_code").primaryKey(),
  topic: text("topic"),
  box: integer("box").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  wrongCount: integer("wrong_count").notNull().default(0),
  lastSeenAt: text("last_seen_at"),
  nextReviewAt: text("next_review_at").notNull()
});

export type ProgressRow = typeof progress.$inferSelect;
export type ReviewItemRow = typeof reviewItems.$inferSelect;
