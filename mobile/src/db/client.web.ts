import { drizzle, type AsyncRemoteCallback } from "drizzle-orm/sqlite-proxy";
import {
  openDatabaseAsync,
  type SQLiteBindParams,
  type SQLiteDatabase,
  type SQLiteOpenOptions
} from "expo-sqlite";
import { bootstrapDbAsync, DATABASE_NAME } from "./bootstrap";
import * as schema from "./schema";

const openOptions: SQLiteOpenOptions = {
  finalizeUnusedStatementsBeforeClosing: true
};

let expoDb: SQLiteDatabase | null = null;
let db:
  | ReturnType<typeof drizzle<typeof schema>>
  | null = null;
let initPromise: Promise<void> | null = null;

const queryAsync: AsyncRemoteCallback = async (sql, params, method) => {
  if (!expoDb) {
    throw new Error("Database is not ready. Call initDb() before querying.");
  }

  const statement = await expoDb.prepareAsync(sql);
  try {
    if (method === "run") {
      const result = await statement.executeAsync(params as SQLiteBindParams);
      return {
        rows: [{ changes: result.changes, lastInsertRowId: result.lastInsertRowId }]
      };
    }

    const result = await statement.executeForRawResultAsync(params as SQLiteBindParams);
    if (method === "get") {
      return { rows: ((await result.getFirstAsync()) ?? undefined) as never };
    }

    return { rows: await result.getAllAsync() };
  } finally {
    await statement.finalizeAsync();
  }
};

// Best-effort release so the next document can open the database sooner (OPFS
// SyncAccessHandles are exclusive per origin). Recovery from a lost race is
// handled by an auto-reload in the root layout, since re-opening wa-sqlite in
// the same document after a failed open leaves the VFS in an invalid state.
function releaseOnPageHide(target: SQLiteDatabase) {
  if (typeof window === "undefined") return;
  window.addEventListener(
    "pagehide",
    () => {
      void target.closeAsync().catch(() => {});
    },
    { once: true }
  );
}

export async function initDb(): Promise<void> {
  if (db) return;
  if (!initPromise) {
    initPromise = (async () => {
      const openedDb = await openDatabaseAsync(DATABASE_NAME, openOptions);
      await bootstrapDbAsync(openedDb);
      expoDb = openedDb;
      db = drizzle(queryAsync, { schema });
      releaseOnPageHide(openedDb);
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  await initPromise;
}

export function getDb() {
  if (!db) {
    throw new Error("Database is not ready. Call initDb() before querying.");
  }
  return db;
}
