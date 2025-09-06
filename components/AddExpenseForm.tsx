import { formatDate } from "@/app/(tabs)";
import { addRecurringEntry } from "@/data/repository/recurring-entry.repo";
import { emitBudgetChanged } from "@/lib/events";
import { Cadence, CADENCES } from "@/models/types/cadences.types";
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useMemo, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Switch, TextInput, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

/** -------- Add Expense Form -------- */
export function AddExpenseForm({ onAdded }: { onAdded: () => Promise<void> | void }) {
    const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = stripTime(new Date());

    const [isIncome, setIsIncome] = useState(false);

    const [name, setName] = useState('');
    const [amountText, setAmountText] = useState('');
    const [cadence, setCadence] = useState<Cadence>('monthly');

    const [dueDate, setDueDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

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
            console.log('submitting end date', endDate)
            // Store ISO string to avoid TZ ambiguity; backend can parse to date-only if desired
            await addRecurringEntry({
                name: name.trim(),
                amount: amountNumber,
                cadence,
                dueDay: dueDate.toISOString(),
                isIncome: isIncome,
                endDay: endDate ? endDate.toISOString() : null
            });
            emitBudgetChanged();

            setName('');
            setAmountText('');
            setCadence('monthly');
            setDueDate(new Date());
            setEndDate(null);
            setShowPicker(false);
            setShowEndPicker(false);
            Keyboard.dismiss();
            await onAdded();
        } catch (e: any) {
            setError(e?.message ?? 'Failed to add expense.');
        } finally {
            setSubmitting(false);
        }
    }, [canSubmit, name, amountNumber, cadence, dueDate, isIncome, endDate, onAdded]);

    const onDateChange = (_event: any, selected?: Date) => {
        if (Platform.OS !== 'ios') setShowPicker(false);
        if (selected) setDueDate(selected);
    };

    const onEndDateChange = (_event: any, selected?: Date) => {
        if (Platform.OS !== 'ios') setShowEndPicker(false);
        if (selected) setEndDate(selected);
        console.log(endDate);
    };

    return (
        <ThemedView style={styles.card}>
            <ThemedText type="subtitle" style={{ marginBottom: 8 }}>Add an {isIncome ? 'income stream' : 'expense'}</ThemedText>

            <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ThemedText>Expense</ThemedText>
                    <Switch
                        value={isIncome}
                        onValueChange={setIsIncome}
                        trackColor={{ false: '#aaa', true: '#34d399' }}
                        thumbColor="#fff"
                        accessibilityRole="switch"
                        accessibilityLabel="Income toggle"
                    />
                    <ThemedText>Income</ThemedText>
                </View>
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
                            minimumDate={stripTime(new Date())}
                            mode="date"
                            display={Platform.select({ ios: 'spinner', android: 'default' })}
                            onChange={onDateChange}
                        />
                    )}
                </View>

                <View style={styles.field}>
                    <ThemedText style={styles.label}>End date</ThemedText>


                    <Pressable
                        onPress={() => setShowEndPicker(true)}
                        style={[styles.input, { justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                        accessibilityRole="button"
                        testID="end-date-open"
                    >
                        <ThemedText>
                            {endDate ? formatDate(endDate) : 'No end date'}
                        </ThemedText>

                        {endDate && (
                            <Pressable onPress={() => setEndDate(null)} accessibilityRole="button">
                                <ThemedText type="error">Clear</ThemedText>
                            </Pressable>
                        )}
                    </Pressable>

                    {showEndPicker && (
                        <DateTimePicker
                            // value cannot be null → fall back to a sensible default
                            value={endDate ?? stripTime(dueDate)}
                            minimumDate={stripTime(dueDate)}
                            mode="date"
                            display={Platform.select({ ios: 'spinner', android: 'default' })}
                            onChange={onEndDateChange}
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
                            {submitting ? 'Saving…' : isIncome ? 'Add Income' : 'Add Expense'}
                        </ThemedText>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}


const styles = StyleSheet.create({

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
});