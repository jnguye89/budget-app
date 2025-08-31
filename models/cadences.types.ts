export const CADENCES = ['monthly', 'annual', 'biweekly', 'weekly', 'daily'] as const;
export type Cadence = typeof CADENCES[number];