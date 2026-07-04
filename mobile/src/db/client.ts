import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import { bootstrapDbSync, DATABASE_NAME } from "./bootstrap";
import * as schema from "./schema";

const expoDb = openDatabaseSync(DATABASE_NAME);
const db = drizzle(expoDb, { schema });

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;
  bootstrapDbSync(expoDb);
  initialized = true;
}

export async function initDb(): Promise<void> {
  ensureInitialized();
}

export function getDb() {
  ensureInitialized();
  return db;
}
