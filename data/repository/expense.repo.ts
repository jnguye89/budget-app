import { Expense } from "@/models/expense.type";
import { getDb } from "../db";


export async function addExpense(e: Omit<Expense, "id">) {
  const db = await getDb();
    const now = new Date().toISOString();
    const res = await db.runAsync(
        `INSERT INTO expenses (name, amount, cadence, dueDay, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
        e.name, e.amount, e.cadence, e.dueDay ?? null, now, now
    );
    return res.lastInsertRowId as number;
}

export async function listExpenses(): Promise<Expense[]> {
  const db = await getDb();
    return db.getAllAsync<Expense>(
        `SELECT id, name, amount, cadence, dueDay FROM expenses ORDER BY name`
    );
}

export async function monthlyTotal(): Promise<number> {
  const db = await getDb();
    const row = await db.getFirstAsync<{ total: number }>(`
    SELECT IFNULL(SUM(CASE
      WHEN cadence='monthly' THEN amount
      WHEN cadence='annual'  THEN amount/12.0
    END), 0) as total
    FROM expenses
  `);
    return row?.total ?? 0;
}

// Example transaction
export async function renameTwoThings(aId: number, bId: number) {
  const db = await getDb();
    await db.withTransactionAsync(async () => {
        await db.runAsync(`UPDATE expenses SET name = 'A' WHERE id = ?`, aId);
        await db.runAsync(`UPDATE expenses SET name = 'B' WHERE id = ?`, bId);
    });
}

export async function deleteAllExpenses() {
    const db = await getDb();
    await db.runAsync(`DELETE FROM expenses`);
}