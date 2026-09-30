import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemPicker } from '@/components/item-picker';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useWardrobe } from '@/store/wardrobe-store';

/** Chooses which wardrobe items go on a trip's packing list. */
export default function TripItemsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trips, items, updateTrip } = useWardrobe();
  const trip = trips.find((t) => t.id === id);
  const [selected, setSelected] = useState<string[]>(trip?.itemIds ?? []);

  if (!trip) return <ThemedText themeColor="textSecondary">Packliste nicht gefunden.</ThemedText>;

  const toggle = (itemId: string) =>
    setSelected((prev) => (prev.includes(itemId) ? prev.filter((x) => x !== itemId) : [...prev, itemId]));

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <ThemedText themeColor="textSecondary">Dein Kleiderschrank ist noch leer.</ThemedText>
        ) : (
          <ItemPicker selected={selected} onToggle={toggle} />
        )}
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <PrimaryButton
          label={`Übernehmen (${selected.length})`}
          onPress={() => {
            updateTrip(trip.id, { itemIds: selected });
            router.back();
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
