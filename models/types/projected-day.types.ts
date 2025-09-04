import { ProjectedPosting } from "./projected-posting.types";

export type ProjectedDay = {
    date: string;
    postings: ProjectedPosting[];
    dayNetCents: number;
    dayEndBalanceCents: number;
};