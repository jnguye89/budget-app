import { RecurringEntry } from "@/models/recurring-entry.interface";
import { getDb } from "../db";


export async function addRecurringEntry(e: Omit<RecurringEntry, "id">) {
  const db = await getDb();
  const now = new Date().toISOString();
  const res = await db.runAsync(
    `INSERT INTO recurringEntry (name, amount, cadence, dueDay, createdAt, updatedAt, isIncome)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    e.name, e.amount, e.cadence, e.dueDay ?? null, now, now, e.isIncome
  );
  return res.lastInsertRowId as number;
}

export async function listRecurringEntries(): Promise<RecurringEntry[]> {
  const db = await getDb();
  const res = await db.getAllAsync<RecurringEntry>(
    `SELECT id, name, amount, cadence, dueDay, isIncome FROM recurringEntry ORDER BY name`
  );
  return res;
}

export async function monthlyTotal(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number }>(`
    SELECT IFNULL(SUM(CASE
      WHEN cadence='monthly' THEN amount
      WHEN cadence='annual'  THEN amount/12.0
    END), 0) as total
    FROM recurringEntry
  `);
  return row?.total ?? 0;
}

// Example recurringEntry
export async function renameTwoThings(aId: number, bId: number) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`UPDATE recurringEntry SET name = 'A' WHERE id = ?`, aId);
    await db.runAsync(`UPDATE recurringEntry SET name = 'B' WHERE id = ?`, bId);
  });
}

export async function deleteAllRecurringEntries() {
  const db = await getDb();
  await db.runAsync(`DELETE FROM recurringEntry`);
}