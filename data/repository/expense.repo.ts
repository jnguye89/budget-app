import { Transaction } from "@/models/types/transaction.type";
import { getDb } from "../db";


export async function addTransaction(e: Omit<Transaction, "id">) {
  const db = await getDb();
  const now = new Date().toISOString();
  const res = await db.runAsync(
    `INSERT INTO transactions (name, amount, cadence, dueDay, createdAt, updatedAt, isIncome)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    e.name, e.amount, e.cadence, e.dueDay ?? null, now, now, e.isIncome
  );
  return res.lastInsertRowId as number;
}

export async function listTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  const res = await db.getAllAsync<Transaction>(
    `SELECT id, name, amount, cadence, dueDay, isIncome FROM transactions ORDER BY name`
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
    FROM transactions
  `);
  return row?.total ?? 0;
}

// Example transactions
export async function renameTwoThings(aId: number, bId: number) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`UPDATE transactions SET name = 'A' WHERE id = ?`, aId);
    await db.runAsync(`UPDATE transactions SET name = 'B' WHERE id = ?`, bId);
  });
}

export async function deleteAllTransactions() {
  const db = await getDb();
  await db.runAsync(`DELETE FROM transactions`);
}