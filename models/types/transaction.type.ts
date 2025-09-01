import { Cadence } from "./cadences.types";

export type Transaction = {
  id?: number;
  name: string;
  amount: number;
  cadence: Cadence;
  dueDay?: string | null;
  isIncome: boolean;
};