import { Cadence } from "./cadences.types";

export type Expense = {
  id?: number;
  name: string;
  amount: number;
  cadence: Cadence;
  dueDay?: string | null;
};