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
    badges TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT,
    user_id TEXT,
    needs_merge INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS review_items (
    country_code TEXT NOT NULL,
    topic TEXT NOT NULL DEFAULT 'flag',
    box INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    last_seen_at TEXT,
    next_review_at TEXT NOT NULL,
    PRIMARY KEY (country_code, topic)
  );
  INSERT OR IGNORE INTO progress (id) VALUES (1);
`;

type TableInfoRow = {
  name: string;
  pk: number;
};

const REVIEW_ITEMS_MIGRATION_SQL = [
  "CREATE TABLE review_items_new (country_code TEXT NOT NULL, topic TEXT NOT NULL DEFAULT 'flag', box INTEGER NOT NULL DEFAULT 0, correct_count INTEGER NOT NULL DEFAULT 0, wrong_count INTEGER NOT NULL DEFAULT 0, last_seen_at TEXT, next_review_at TEXT NOT NULL, PRIMARY KEY (country_code, topic));",
  "INSERT OR REPLACE INTO review_items_new (country_code, topic, box, correct_count, wrong_count, last_seen_at, next_review_at) SELECT country_code, COALESCE(topic, 'flag'), box, correct_count, wrong_count, last_seen_at, next_review_at FROM review_items;",
  "DROP TABLE review_items;",
  "ALTER TABLE review_items_new RENAME TO review_items;"
];

function needsReviewItemsMigration(rows: TableInfoRow[]): boolean {
  if (!rows.length) return false;
  const topic = rows.find((row) => row.name === "topic");
  return Boolean(topic && topic.pk === 0);
}

function migrationBatchSql() {
  return `BEGIN TRANSACTION;\n${REVIEW_ITEMS_MIGRATION_SQL.join("\n")}\nCOMMIT;`;
}

function needsProgressBadgesMigration(rows: TableInfoRow[]): boolean {
  return rows.length > 0 && !rows.some((row) => row.name === "badges");
}

export function bootstrapDbSync(db: SQLiteDatabase): void {
  const rows = db.getAllSync<TableInfoRow>("PRAGMA table_info(review_items)");
  if (needsReviewItemsMigration(rows)) db.execSync(migrationBatchSql());
  db.execSync(SCHEMA_SQL);
  const progressRows = db.getAllSync<TableInfoRow>("PRAGMA table_info(progress)");
  if (needsProgressBadgesMigration(progressRows)) db.execSync("ALTER TABLE progress ADD COLUMN badges TEXT NOT NULL DEFAULT '[]';");
}

export async function bootstrapDbAsync(db: SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<TableInfoRow>("PRAGMA table_info(review_items)");
  if (needsReviewItemsMigration(rows)) await db.execAsync(migrationBatchSql());
  await db.execAsync(SCHEMA_SQL);
  const progressRows = await db.getAllAsync<TableInfoRow>("PRAGMA table_info(progress)");
  if (needsProgressBadgesMigration(progressRows)) await db.execAsync("ALTER TABLE progress ADD COLUMN badges TEXT NOT NULL DEFAULT '[]';");
}
