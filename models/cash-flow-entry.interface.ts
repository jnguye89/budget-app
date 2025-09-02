import { Cadence } from "./types/cadences.types";

export interface CashflowEntry {
    label: string;
    /** Positive for income, negative for expense. Use cents to avoid float issues. */
    amountCents: number;
    /** First due/paid date in YYYY-MM-DD (local). Acts as the anchor for recurrence. */
    startOn: string;
    cadence: Cadence;
    /** Optional last date (inclusive) the entry applies. */
    endOn?: string;
}