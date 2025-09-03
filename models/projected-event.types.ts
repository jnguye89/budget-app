export interface ProjectedEvent {
    date: string;        // YYYY-MM-DD
    postings: { label: string; amountCents: number, isIncome: boolean }[];
    dayNetCents: number; // sum of postings for that day
    balanceCents: number;
}