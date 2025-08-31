import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Button, View, TextInput, Pressable, KeyboardAvoidingView, Keyboard } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { addExpense, deleteAllExpenses, listExpenses, monthlyTotal } from '@/data/repository/expense.repo';
import { Cadence, CADENCES } from '@/models/cadences.types';
import { Expense } from '@/models/expense.type';

function formatDate(d: Date) {
  // render as local date (e.g., 9/30/2025). Adjust to your preferred format.
  return d.toLocaleDateString();
}

/** -------- Add Expense Form -------- */
function AddExpenseForm({ onAdded }: { onAdded: () => Promise<void> | void }) {
  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [cadence, setCadence] = useState<Cadence>('monthly');

  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNumber = useMemo(() => {
    const cleaned = amountText.replace(/[^\d.]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }, [amountText]);

  const canSubmit = name.trim().length > 0 && amountNumber > 0 && !submitting && !!dueDate;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      // Store ISO string to avoid TZ ambiguity; backend can parse to date-only if desired
      await addExpense({
        name: name.trim(),
        amount: amountNumber,
        cadence,
        dueDay: dueDate.toISOString(),
      });

      setName('');
      setAmountText('');
      setCadence('monthly');
      setDueDate(new Date());
      setShowPicker(false);
      Keyboard.dismiss();
      await onAdded();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add expense.');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, name, amountNumber, cadence, dueDate, onAdded]);

  const onDateChange = (_event: any, selected?: Date) => {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (selected) setDueDate(selected);
  };

  return (
    <ThemedView style={styles.card}>
      <ThemedText type="subtitle" style={{ marginBottom: 8 }}>Add an expense</ThemedText>

      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })}>
        <View style={styles.field}>
          <ThemedText style={styles.label}>Name</ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Rent"
            autoCapitalize="words"
            returnKeyType="next"
            style={styles.input}
            accessibilityLabel="Expense name"
            testID="expense-name"
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Amount</ThemedText>
          <TextInput
            value={amountText}
            onChangeText={setAmountText}
            placeholder="e.g., 1800"
            keyboardType={Platform.select({ ios: 'decimal-pad', android: 'numeric' })}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            style={styles.input}
            accessibilityLabel="Expense amount"
            testID="expense-amount"
          />
          {amountText.length > 0 && !(amountNumber > 0) && (
            <ThemedText type="error" style={styles.errorText}>Enter a valid amount &gt; 0</ThemedText>
          )}
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Cadence</ThemedText>
          <View style={styles.pillRow}>
            {CADENCES.map(c => (
              <Pressable
                key={c}
                onPress={() => setCadence(c)}
                accessibilityRole="button"
                accessibilityState={{ selected: cadence === c }}
                style={[styles.pill, cadence === c && styles.pillSelected]}
                testID={`cadence-${c}`}
              >
                <ThemedText style={[styles.pillText, cadence === c && styles.pillTextSelected]}>
                  {c}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Due date</ThemedText>

          <Pressable
            onPress={() => setShowPicker(true)}
            style={[styles.input, { justifyContent: 'center' }]}
            accessibilityRole="button"
            testID="due-date-open"
          >
            <ThemedText>{formatDate(dueDate)}</ThemedText>
          </Pressable>

          {showPicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.select({ ios: 'spinner', android: 'default' })}
              onChange={onDateChange}
            />
          )}
        </View>

        {error && <ThemedText type="error" style={styles.errorText}>{error}</ThemedText>}

        <View style={{ marginTop: 8 }}>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.primaryBtn,
              (!canSubmit || submitting) && styles.primaryBtnDisabled,
              pressed && canSubmit && styles.primaryBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            testID="add-expense-submit"
          >
            <ThemedText style={styles.primaryBtnText}>
              {submitting ? 'Saving…' : 'Add expense'}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

/** -------- Home Screen (with list + actions) -------- */
export default function HomeScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthly, setMonthly] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [items, total] = await Promise.all([listExpenses(), monthlyTotal()]);
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
      await deleteAllExpenses();
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

      {/* New Form with Due date */}
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
