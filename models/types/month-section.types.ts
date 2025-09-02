import { ProjectedEvent } from "../projected-event.types";

export type MonthSection = {
  title: string;            // e.g., "September 2025"
  monthKey: string;         // "YYYY-MM"
  monthNetCents: number;    // sum of dayNet in that month
  data: ProjectedEvent[];   // days in that month
};