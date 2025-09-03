import { FlatList, SectionList, StyleSheet, View } from 'react-native';

import { projectBalance } from '@/services/balance-service';
import { useEffect, useMemo, useState } from 'react';
import { ProjectedEvent } from '@/models/projected-event.types';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type Projection = Awaited<ReturnType<typeof projectBalance>>;
type Row = { id: string; name: string; amountCents: number; balanceCents: number };

export default function TabTwoScreen() {
  const [projection, setProjection] = useState<Projection | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await projectBalance({ startingBalanceCents: 16.04, from: '2025-09-01', monthsAhead: 12 });
      if (alive) setProjection(res);
    })();
    return () => { alive = false; };
  }, []);

  // ✅ Always called; returns [] while loading
  const timeline = useMemo(
    () => (projection ? projection.timeline : []),
    [projection]
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <FlatList
        data={timeline}
        // keyExtractor={(item) => item.date}
        renderItem={({ item }) =>
          <DayCard event={item} />
        }
        ListHeaderComponent={
          <ThemedView style={styles.card}>
            <View style={styles.postingRow}>
              <ThemedText style={styles.postingLabel}>Name</ThemedText>
              <ThemedText style={styles.postingAmount}>Amount</ThemedText>
              <ThemedText style={styles.balanceAmount}>Balance</ThemedText>
            </View>
          </ThemedView>
        }
        ListHeaderComponentStyle={styles.headerWrap}
        stickyHeaderIndices={[0]} // <- make the header stick to top while scrolling (optional)
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingBottom: 16 }} ></FlatList>
    </ThemedView>
  );
}

/** ---- Day card ---- */
function DayCard({ event }: { event: ProjectedEvent }) {
  const net = event.dayNetCents;
  return (
    <ThemedView style={styles.card}>
      {event.postings.map((p, i) => (
        <View style={styles.postingRow} key={`${event.date}-${i}-${p.label}-${p.amountCents}`}>
          <ThemedText style={styles.postingLabel}>{formatDate(event.date)} - {p.label}</ThemedText>
          <ThemedText
            style={[styles.postingAmount, p.amountCents >= 0 ? styles.income : styles.expense]}
          >
            {p.isIncome ? '+' : '-'}
            {fmtUSD(Math.abs(p.amountCents * 100))}
          </ThemedText>
          <ThemedText style={styles.balanceAmount}>{fmtUSD(event.balanceCents * 100)}</ThemedText>
        </View>
      ))}
    </ThemedView>
  );
}

/** ---- Helpers ---- */

function formatDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtUSD(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function sign(n: number) {
  return n >= 0 ? '+' : '−';
}

/** ---- Styles ---- */
const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16 },
  header: { paddingTop: 12, paddingBottom: 8 },
  h1: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  bold: { fontWeight: '700' },
  sep: { height: 8 },
  monthHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  monthTitle: { fontSize: 18, fontWeight: '600' },
  monthNet: { fontSize: 14, fontWeight: '600' },

  card: {
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.98,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  dayDate: { fontSize: 16, fontWeight: '600' },
  netPill: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  postingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  postingLabel: { fontSize: 14 },
  postingAmount: { fontSize: 14, fontWeight: '600' },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  balanceLabel: { fontSize: 12, opacity: 0.7 },
  balanceAmount: { fontSize: 14, fontWeight: '700' },

  income: { color: '#0a8f08' },
  expense: { color: '#c62828' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
