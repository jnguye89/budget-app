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
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        amount INTEGER NOT NULL,
        cadence TEXT NOT NULL CHECK (cadence IN ('monthly', 'annual', 'biweekly', 'weekly', 'daily')),
        dueDay INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isIncome      INTEGER NOT NULL DEFAULT 0
                      CHECK (isIncome IN (0,1))
      );

      CREATE TABLE IF NOT EXISTS state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        lastCalcDate    INTEGER,
        currentBalance  INTEGER NOT NULL DEFAULT 0
      );
      
      INSERT OR IGNORE INTO state (id, lastCalcDate, currentBalance)
      VALUES (1, NULL, 0);
    `);
  } catch (e) {
    console.error("initDb failed:", e);
    throw e; // so you see a JS error, not a native crash
  }
}
