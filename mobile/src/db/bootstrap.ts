import type { SQLiteDatabase } from "expo-sqlite";

export const DATABASE_NAME = "worldly.db";

export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY,
    xp INTEGER NOT NULL DEFAULT 0,
    coins INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    last_lesson_date TEXT,
    selected_topic TEXT NOT NULL DEFAULT 'flag',
    total_correct INTEGER NOT NULL DEFAULT 0,
    total_wrong INTEGER NOT NULL DEFAULT 0,
    daily_last_date TEXT,
    daily_streak INTEGER NOT NULL DEFAULT 0,
    daily_best INTEGER NOT NULL DEFAULT 0,
    completed_lesson_ids TEXT NOT NULL DEFAULT '[]',
    daily_history TEXT NOT NULL DEFAULT '{}',
    arcade TEXT NOT NULL DEFAULT '{}',
    decks TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT,
    user_id TEXT,
    needs_merge INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS review_items (
    country_code TEXT PRIMARY KEY,
    topic TEXT,
    box INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    last_seen_at TEXT,
    next_review_at TEXT NOT NULL
  );
  INSERT OR IGNORE INTO progress (id) VALUES (1);
`;

export function bootstrapDbSync(db: SQLiteDatabase): void {
  db.execSync(SCHEMA_SQL);
}

export async function bootstrapDbAsync(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SCHEMA_SQL);
}
