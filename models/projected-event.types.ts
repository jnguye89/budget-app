export interface ProjectedEvent {
    date: string;        // YYYY-MM-DD
    postings: { label: string; amountCents: number }[];
    dayNetCents: number; // sum of postings for that day
    balanceCents: number;
}