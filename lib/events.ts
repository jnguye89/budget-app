// src/lib/events.ts
type Handler = () => void;
const subs = new Set<Handler>();
export function onBudgetChanged(h: Handler): () => void {
    subs.add(h);
    return () => {            // <-- return void
        subs.delete(h);         //     ignore boolean
    };
}

export function emitBudgetChanged(): void {
    subs.forEach(h => { try { h(); } catch { } });
}
