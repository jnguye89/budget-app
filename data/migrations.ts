import * as SQLite from 'expo-sqlite';

type Row<T extends object = any> = T;

// Open db
const db = await SQLite.openDatabaseAsync('app.db');

// Transaction (no explicit SQLTransaction type needed)
await db.withTransactionAsync(async () => {
  // PRAGMAs
  await db.execAsync('PRAGMA foreign_keys = ON');

  // Read current user_version
  const row = await db.getFirstAsync<Row<{ user_version: number }>>('PRAGMA user_version');
  let v = row?.user_version ?? 0;

  // Example migration: add "notes" column if missing
  if (v < 2) {
    const cols = await db.getAllAsync<Row<{ name: string }>>('PRAGMA table_info(recurring_cashflow_templates)');
    const hasNotes = cols.some(c => c.name === 'notes');
    if (!hasNotes) {
      await db.execAsync(`ALTER TABLE recurring_cashflow_templates ADD COLUMN notes TEXT DEFAULT ''`);
    }
    await db.execAsync('PRAGMA user_version = 2');
    v = 2;
  }
});
