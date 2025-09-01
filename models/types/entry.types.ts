import { Cadence } from "./cadences.types";

export type EntryType = 'expense' | 'income';
export type Entry = {
    id?: string | number;
    name: string;
    amount: number;       // may be signed (income +, expense -)
    cadence: Cadence;
    dueDate?: string;     // ISO string
    type?: EntryType;     // optional if your storage doesn’t have this yet
};