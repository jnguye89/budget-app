// src/components/RecurringEntryList.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { RecurringEntryRow } from './RecurringEntryRow';
import { ThemedView } from './ThemedView';
import { deleteRecurringEntryById, listRecurringEntries } from '@/data/repository/recurring-entry.repo';
import { RecurringEntry } from '@/models/recurring-entry.interface';

export function RecurringEntryList({ refreshKey }: { refreshKey?: any }) {
    const [items, setItems] = useState<RecurringEntry[]>([]);

    const load = useCallback(async () => {
        const rows = await listRecurringEntries(); // SELECT * FROM recurringEntry ORDER BY createdAt DESC
        setItems(rows ?? []);
    }, []);

    useEffect(() => { load(); }, [load, refreshKey]);

    return (
        <ThemedView>
            <FlatList
                data={items}
                keyExtractor={(it) => String(it.id)}
                renderItem={({ item }) => (
                    <RecurringEntryRow
                        item={item}
                        onDelete={async (id) => {
                            await deleteRecurringEntryById(id);
                            await load();
                        }}
                    />
                )}
            />
        </ThemedView>
    );
}
