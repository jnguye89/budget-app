import { parseUSDToCents } from "@/services/format-currency.service";
import { getDb } from "../db";
import { State } from "@/models/state.interface";

export async function getState(): Promise<State> {
    const db = await getDb();
    const res = await db.getAllAsync(
        `SELECT * FROM state`
    )
    return res[0] as State;
}

export async function updateDbState(amount: number) {
    const db = await getDb();
    const now = new Date().toISOString().slice(0, 10);
    const cents = parseUSDToCents(amount);
    await db.runAsync(`UPDATE state SET lastCalcDate = ?, currentBalance = ? WHERE ID = 1`, now, cents);
}