import { AddExpenseForm } from "@/components/AddExpenseForm";
import { EditExpenseForm } from "@/components/EditBalanceForm";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { listRecurringEntries } from "@/data/repository/recurring-entry.repo";
import { RecurringEntry } from "@/models/recurring-entry.interface";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native";

export default function BalanceEditScreen() {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [expenses, setExpenses] = useState<RecurringEntry[]>([]);

    const refresh = useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const [items] = await Promise.all([listRecurringEntries()]);
            setExpenses(items ?? []);
        } catch (e: any) {
            setErr(e?.message ?? String(e));
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { refresh(); }, [refresh]);
    return (
        <ParallaxScrollView>
            <AddExpenseForm onAdded={refresh} />
            <EditExpenseForm />
        </ParallaxScrollView>
    )
}

