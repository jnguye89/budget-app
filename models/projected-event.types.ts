export interface ProjectedEvent {
    date: string;        // YYYY-MM-DD
    postings: { label: string; amountCents: number, isIncome: boolean, balanceCents: number }[];
    // balanceCents: number;
}