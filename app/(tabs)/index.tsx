import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Switch, View } from 'react-native';

import { RecurringEntryRow } from '@/components/RecurringEntryRow';
import { ThemedText } from '@/components/ThemedText';
import { deleteRecurringEntryById, listRecurringEntries } from '@/data/repository/recurring-entry.repo';
import { RecurringEntry } from '@/models/recurring-entry.interface';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onBudgetChanged } from '@/lib/events';
import { getState } from '@/data/repository/state.repo';
import { isAfter } from '@/services/helper/date-only.service';

export function formatDate(d: Date) {
  return d.toLocaleDateString();
}

/** -------- Home Screen (with list + actions) -------- */
export default function HomeScreen() {
  const [expenses, setExpenses] = useState<RecurringEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [items] = await Promise.all([listRecurringEntries()]);
      setExpenses(items.filter(i => showAll ? true : !i.endDay || (!!i.endDay && isAfter(i.endDay, new Date))) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useCallback(
    async (id: number) => {
      setLoading(true);
      setErr(null);
      try {
        await deleteRecurringEntryById(id);
        // TODO: update local list state or refetch here
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    },
    [deleteRecurringEntryById]
  );

  useEffect(() => { refresh(); }, [refresh]);
  // keep your event wiring; ensure it returns an unsubscribe for cleanup
  useEffect(() => onBudgetChanged(refresh), [refresh]);

  // return (
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={{
        width: '100%',               // take full width
        flexDirection: 'row',
        alignItems: 'center',        // vertical center
        justifyContent: 'center',    // <-- horizontal center
        gap: 8,
        paddingVertical: 8,
      }}>
        <Switch
          value={showAll}
          onValueChange={setShowAll}
          trackColor={{ false: '#aaa', true: '#34d399' }}
          thumbColor="#fff"
          accessibilityRole="switch"
          accessibilityLabel="Show all toggle"
        />
        <ThemedText>Show Expired</ThemedText>
      </View>
      <FlatList
        data={expenses}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => <RecurringEntryRow item={item} onDelete={async () => { await deleteRecurringEntryById(item.id!); await refresh(); }} />}

        ListEmptyComponent={<ThemedText style={{ padding: 16, opacity: 0.6 }}>No entries yet</ThemedText>}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepContainer: { gap: 8, marginBottom: 8 },
});
