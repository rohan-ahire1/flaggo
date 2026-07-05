export async function initDb(): Promise<void> {
  return Promise.resolve();
}

export function getDb() {
  throw new Error("SQLite is not used on web.");
}
