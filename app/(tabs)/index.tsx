import React, { useCallback, useEffect, useState } from 'react';
import { Button, Platform, StyleSheet, View } from 'react-native';

import { AddExpenseForm } from '@/components/AddExpenseForm';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { deleteAllTransactions, listTransactions, monthlyTotal } from '@/data/repository/expense.repo';
import { Transaction } from '@/models/types/transaction.type';

export function formatDate(d: Date) {
  return d.toLocaleDateString();
}

/** -------- Home Screen (with list + actions) -------- */
export default function HomeScreen() {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [monthly, setMonthly] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [items, total] = await Promise.all([listTransactions(), monthlyTotal()]);
      setExpenses(items ?? []);
      setMonthly(Number(total ?? 0));
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDeleteAll = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      await deleteAllTransactions();
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setLoading(false);
    }
  }, [refresh]);

  return (
    <ParallaxScrollView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Budgeting made fun!</ThemedText>
        <HelloWave />
      </ThemedView>
      <AddExpenseForm onAdded={refresh} />

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Your expenses</ThemedText>
        {loading ? (
          <ThemedText>Loading…</ThemedText>
        ) : err ? (
          <ThemedText type="error">{err}</ThemedText>
        ) : expenses.length === 0 ? (
          <ThemedText>No expenses yet.</ThemedText>
        ) : (
          <View>
            {expenses.map((e, i) => {
              const due = e.dueDay ? new Date(e.dueDay) : undefined;
              return (
                <ThemedText key={e.id ?? i}>
                  • {e.name}: ${e.amount} ({e.cadence})
                  {due ? ` — due ${formatDate(due)}` : ''}
                </ThemedText>
              );
            })}
          </View>
        )}
        <ThemedText style={{ marginTop: 8 }}>
          Monthly total: <ThemedText type="defaultSemiBold">${monthly.toFixed(2)}</ThemedText>
        </ThemedText>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Button title="Refresh" onPress={refresh} />
          <Button title="Delete all" onPress={handleDeleteAll} />
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepContainer: { gap: 8, marginBottom: 8 },

  // Form styles
  card: {
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000022',
  },
  field: { marginBottom: 8 },
  label: { marginBottom: 6 },
  input: {
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 8 }),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00000033',
  },
  errorText: { marginTop: 6 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#00000033',
  },
  pillSelected: { backgroundColor: '#00000010' },
  pillText: {},
  pillTextSelected: { fontWeight: '600' },

  primaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
  primaryBtnPressed: { opacity: 0.85 },
  primaryBtnDisabled: { backgroundColor: '#93c5fd' },
  primaryBtnText: { color: 'white', fontWeight: '600' },

  reactLogo: { height: 178, width: 290, bottom: 0, left: 0, position: 'absolute' },
});
