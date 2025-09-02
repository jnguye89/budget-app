export const CADENCES = ['monthly', 'annual', 'biweekly', 'weekly', 'daily', 'once'] as const;
export type Cadence = typeof CADENCES[number];