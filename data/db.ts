import * as SQLite from 'expo-sqlite';

export type DB = SQLite.SQLiteDatabase;

let dbPromise: Promise<DB> | null = null;
export function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('budget.db');
  return dbPromise;
}

// --- tiny helpers ---
type Row<T extends object = any> = T;

async function getUserVersion(db: DB): Promise<number> {
  const r = await db.getFirstAsync<Row<{ user_version: number }>>('PRAGMA user_version');
  return r?.user_version ?? 0;
}
async function setUserVersion(db: DB, v: number) {
  await db.execAsync(`PRAGMA user_version = ${v}`);
}
async function tableExists(db: DB, name: string): Promise<boolean> {
  const r = await db.getFirstAsync<Row<{ name: string }>>(
    'SELECT name FROM sqlite_master WHERE type="table" AND name=? LIMIT 1',
    [name]
  );
  return !!r;
}
async function columnExists(db: DB, table: string, col: string): Promise<boolean> {
  const cols = await db.getAllAsync<Row<{ name: string }>>(`PRAGMA table_info(${table})`);
  return cols.some(c => c.name === col);
}

// --- migrations (append new ones over time) ---
type Migration = { to: number; run: (db: DB) => Promise<void> };

const migrations: Migration[] = [
  // v1: your current base schema
  {
    to: 1,
    run: async (db) => {
      await db.execAsync('PRAGMA foreign_keys = ON');

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS recurringEntry (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          amount INTEGER NOT NULL,
          cadence TEXT NOT NULL CHECK (cadence IN ('monthly','annual','biweekly','weekly','daily','once')),
          dueDay INTEGER,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          isIncome INTEGER NOT NULL DEFAULT 0 CHECK (isIncome IN (0,1))
        );
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          lastCalcDate INTEGER,
          currentBalance INTEGER NOT NULL DEFAULT 0
        );
      `);

      await db.runAsync(
        `INSERT OR IGNORE INTO state (id, lastCalcDate, currentBalance) VALUES (1, NULL, 0);`
      );
    },
  },
  {
    to: 2,
    run: async (db) => {
      await db.execAsync('PRAGMA foreign_keys = ON');
      if (!(await columnExists(db, 'recurringEntry', 'endDay'))) {
        await db.execAsync(`ALTER TABLE recurringEntry ADD COLUMN endDay INTEGER`);
      }
    },
  },
];

// --- runner ---
export async function runMigrations(): Promise<void> {
  const db = await getDb();
  let v = await getUserVersion(db);

  // Ensure ascending order
  const sorted = [...migrations].sort((a, b) => a.to - b.to);

  for (const m of sorted) {
    if (v < m.to) {
      await db.withTransactionAsync(async () => {
        await m.run(db);
        await setUserVersion(db, m.to);
      });
      v = m.to;
    }
  }
}

// Call this at app startup
export async function initDb() {
  const db = await getDb();
  // optional: durability tweaks (check support per platform)
  // await db.execAsync('PRAGMA journal_mode = WAL');
  // await db.execAsync('PRAGMA synchronous = NORMAL');

  await runMigrations();
}
