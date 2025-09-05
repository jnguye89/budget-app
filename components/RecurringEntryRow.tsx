// src/components/RecurringEntryRow.tsx
import React, { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { RecurringEntry } from '@/models/recurring-entry.interface';

export function RecurringEntryRow({
  item,
  onDelete,
  onPress,
}: {
  item: RecurringEntry;
  onDelete: (id: number) => void | Promise<void>;
  onPress?: () => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const handleDelete = async () => {
    await onDelete(item.id!);
    swipeRef.current?.close(); // ensure the row snaps shut after delete
  };

  const RightActions = () => (
    <Pressable onPress={handleDelete} style={styles.deleteBtn} accessibilityRole="button">
      <ThemedText style={styles.deleteText}>Delete</ThemedText>
    </Pressable>
  );

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={RightActions}
    >
      <Pressable onPress={onPress}>
        <ThemedView style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.title}>{item.name}</ThemedText>
            <ThemedText style={styles.sub}>
              {item.cadence} • Due {new Date(item.dueDay).toLocaleDateString()}
            </ThemedText>
          </View>
          <ThemedText style={[styles.amount, item.isIncome ? styles.income : styles.expense]}>
            {(item.isIncome ? '+' : '-')}${(item.amount / 100).toFixed(2)}
          </ThemedText>
        </ThemedView>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#0000001a',
  },
  title: { fontWeight: '600' },
  sub: { opacity: 0.6, marginTop: 2 },
  amount: { fontWeight: '700' },
  income: { color: '#059669' },
  expense: { color: '#dc2626' },
  deleteBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    backgroundColor: '#ef4444',
  },
  deleteText: { color: 'white', fontWeight: '700' },
});
