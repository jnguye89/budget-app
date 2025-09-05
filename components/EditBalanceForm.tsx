import { useCallback, useEffect, useState } from "react";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { getState, updateDbState } from "@/data/repository/state.repo";
import { State } from "@/models/state.interface";

export function EditExpenseForm() {
    const [balance, setBalance] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const canSubmit = +balance.trim() >= 0;

    useEffect(() => {
        (async () => {
            const state = await getState();
            setBalance(`${state.currentBalance / 100}`);
        })()
    }, [])

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        try {
            await updateDbState(+balance);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to update balance.');
        } finally {
            setSubmitting(false);
        }
    }, [balance]);

    return (
        <ThemedView style={styles.card}>
            <ThemedText type="subtitle">Overwrite Balance</ThemedText>
            <KeyboardAvoidingView>
                <View style={styles.field}>
                    <ThemedText style={styles.label}>Name</ThemedText>
                    <TextInput
                        value={balance}
                        onChangeText={setBalance}
                        placeholder="$"
                        autoCapitalize="words"
                        returnKeyType="next"
                        style={styles.input}
                        accessibilityLabel="Expense name"
                        testID="expense-name"
                    />
                </View>
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
                            {submitting ? 'Saving…' : 'Update balance'}
                        </ThemedText>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </ThemedView>
    )
}
const styles = StyleSheet.create({
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
    primaryBtn: {
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#3b82f6',
    },
    primaryBtnPressed: { opacity: 0.85 },
    primaryBtnDisabled: { backgroundColor: '#93c5fd' },
    primaryBtnText: { color: 'white', fontWeight: '600' },
})