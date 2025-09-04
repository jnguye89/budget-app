import { listRecurringEntries } from "@/data/repository/recurring-entry.repo";
import { getState } from "@/data/repository/state.repo";
import { ProjectedEvent } from "@/models/projected-event.types";
import { RecurringEntry } from "@/models/recurring-entry.interface";

export async function getAllRecurringEntries(): Promise<RecurringEntry[]> {
    const entries = await listRecurringEntries();
    return entries;
}

export async function getCurrentState() {
    const state = await getState();
}

export async function projectBalance(opts: {
    startingBalanceCents: number;
    from: string;                // YYYY-MM-DD
    to?: string;                 // YYYY-MM-DD
    monthsAhead?: number;        // alternative to `to`
    // entries: CashflowEntry[];
}): Promise<{ timeline: ProjectedEvent[]; finalBalanceCents: number }> {
    const entries = await getAllRecurringEntries();
    const { startingBalanceCents, from, to, monthsAhead } = opts;
    if (!to && !monthsAhead) throw new Error('Provide either `to` or `monthsAhead`.');
    const end = to ?? formatISO(addMonths(parseISO(from), monthsAhead!));

    // ---- date helpers (local, date-only) ----
    function parseISO(s: string): Date {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    function formatISO(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    function addDays(d: Date, n: number): Date {
        const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        x.setDate(x.getDate() + n);
        return x;
    }
    function addMonths(d: Date, n: number): Date {
        const y = d.getFullYear();
        const m = d.getMonth();
        const day = d.getDate();
        const target = new Date(y, m + n, 1);
        const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        target.setDate(Math.min(day, lastDay)); // keep “day-of-month” intent
        return target;
    }

    const fromD = parseISO(from);
    const endD = parseISO(end);

    // ---- generate all occurrences within [from, end] ----
    type Occ = { date: string; label: string; amountCents: number, isIncome: boolean };
    const occs: Occ[] = [];

    for (const e of entries) {
        const start = new Date(e.dueDay);
        const until = endD;

        if (e.cadence === 'once') {
            if (start >= fromD && start <= endD) {
                occs.push({ date: formatISO(start), label: e.name, amountCents: e.amount, isIncome: e.isIncome });
            }
            continue;
        }

        if (e.cadence === 'weekly' || e.cadence === 'biweekly') {
            const step = e.cadence === 'weekly' ? 7 : 14;
            // advance current to first occurrence >= fromD, preserving anchor cadence
            let cur = start;
            if (cur < fromD) {
                const diffDays = Math.floor((fromD.getTime() - cur.getTime()) / 86400000);
                const stepsToSkip = Math.floor(diffDays / step) * step;
                cur = addDays(cur, stepsToSkip);
                while (cur < fromD) cur = addDays(cur, step);
            }
            while (cur <= endD && cur <= until) {
                if (cur >= fromD) {
                    occs.push({ date: formatISO(cur), label: e.name, amountCents: e.amount, isIncome: e.isIncome });
                }
                cur = addDays(cur, step);
            }
            continue;
        }

        if (e.cadence === 'monthly') {
            // keep the “day-of-month” of the anchor, clamped for short months
            let cur = start;
            // move up to first month >= fromD
            while (cur < fromD) cur = addMonths(cur, 1);
            while (cur <= endD && cur <= until) {
                occs.push({ date: formatISO(cur), label: e.name, amountCents: e.amount, isIncome: e.isIncome });
                cur = addMonths(cur, 1);
            }
            continue;
        }
    }

    // ---- group by date, then compute running balance ----
    const byDate = new Map<string, Occ[]>();
    for (const o of occs) {
        if (!byDate.has(o.date)) byDate.set(o.date, []);
        byDate.get(o.date)!.push(o);
    }
    console.log(byDate);
    const dates = Array.from(byDate.keys()).sort(); // YYYY-MM-DD sorts lexicographically
    let running = startingBalanceCents;
    const timeline: ProjectedEvent[] = [];

    for (const date of dates) {
        const postings = byDate.get(date)!;
        const dayNet = postings.reduce((s, p) => s + (p.isIncome ? p.amountCents : -p.amountCents), 0);
        timeline.push({
            date,
            postings: postings
                .sort((a, b) => (a.isIncome === b.isIncome) ? 0 : (a.isIncome ? -1 : 1))
                .map(p => {
                    running += (p.isIncome ? p.amountCents : -p.amountCents);
                    return { label: p.label, amountCents: p.amountCents, isIncome: p.isIncome, balanceCents: running }
                })

        });
    }

    return { timeline, finalBalanceCents: running };
}

// --- helpers for formatting (optional) ---
export const toCents = (dollars: number) => Math.round(dollars * 100);
export const fmt = (cents: number) =>
    (cents < 0 ? '-' : '') + '$' + (Math.abs(cents) / 100).toFixed(2);
