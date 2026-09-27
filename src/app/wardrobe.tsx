import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ItemTile } from '@/components/item-tile';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useWardrobe } from '@/store/wardrobe-store';
import { CategoryLabels, type Category } from '@/types/wardrobe';

const CATEGORIES = Object.keys(CategoryLabels) as Category[];

export default function WardrobeScreen() {
  const { items } = useWardrobe();
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const visible = filter === 'all' ? items : items.filter((i) => i.category === filter);
  const favorites = items.filter((i) => i.favorite).length;

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">Kleiderschrank</ThemedText>
        <Pressable
          accessibilityLabel="Kleidungsstück hinzufügen"
          onPress={() => Alert.alert('Foto aufnehmen', 'Kamera & Freistellen kommen bald.')}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedView type="backgroundElement" style={styles.addButton}>
            <ThemedText type="subtitle">+</ThemedText>
          </ThemedView>
        </Pressable>
      </View>

      <View style={styles.stats}>
        <Stat label="Teile" value={items.length} />
        <Stat label="Favoriten" value={favorites} />
        <Stat label="Kategorien" value={new Set(items.map((i) => i.category)).size} />
      </View>

      <View style={styles.chips}>
        <Chip label="Alle" active={filter === 'all'} onPress={() => setFilter('all')} />
        {CATEGORIES.map((c) => (
          <Chip key={c} label={CategoryLabels[c]} active={filter === c} onPress={() => setFilter(c)} />
        ))}
      </View>

      <View style={styles.grid}>
        {visible.map((item) => (
          <ItemTile key={item.id} item={item} />
        ))}
        {visible.length === 0 && (
          <ThemedText themeColor="textSecondary">Noch nichts in dieser Kategorie.</ThemedText>
        )}
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <ThemedView type="backgroundElement" style={styles.stat}>
      <ThemedText type="subtitle">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView type={active ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
        <ThemedText type="small" themeColor={active ? 'text' : 'textSecondary'}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stat: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
});
