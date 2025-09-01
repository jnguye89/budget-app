import { parseUSDToCents } from "@/services/format-currency.service";
import { getDb } from "../db";

export async function getState() {
    const db = await getDb();
    const res = await db.getAllAsync(
        `SELECT * FROM state`
    )
    return res;
}

export async function updateState(amount: number) {
    const db = await getDb();
    const now = new Date().toISOString();
    const cents = parseUSDToCents(amount);
    await db.runAsync(`UPDATE state SET lastCalcDate = ?, currentBalance = ? WHERE ID = 1`, now, cents);
}