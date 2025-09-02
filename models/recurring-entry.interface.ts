import { Cadence } from "./types/cadences.types";

export interface RecurringEntry {
  id?: number;
  name: string;
  amount: number;
  cadence: Cadence;
  dueDay: string;
  isIncome: boolean;
};