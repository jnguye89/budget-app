// src/data/db.ts
import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync("budget.db");
  return dbPromise;
}

export async function initDb() {
  try {
    const db = await getDb();
    // keep it simple first; add PRAGMAs later
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        cadence TEXT NOT NULL CHECK (cadence IN ('monthly','annual')),
        dueDay INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
  } catch (e) {
    console.error("initDb failed:", e);
    throw e; // so you see a JS error, not a native crash
  }
}
