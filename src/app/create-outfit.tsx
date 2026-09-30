import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ItemImage } from '@/components/item-tile';
import { ItemPicker } from '@/components/item-picker';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWardrobe } from '@/store/wardrobe-store';

export default function CreateOutfitScreen() {
  const theme = useTheme();
  // Set when opened from the calendar: the new outfit gets planned for that day.
  const { date } = useLocalSearchParams<{ date?: string }>();
  const { items, addOutfit, planOutfit } = useWardrobe();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  function save() {
    const fallback = `Outfit vom ${new Date().toLocaleDateString('de-DE')}`;
    const id = addOutfit({ name: name.trim() || fallback, itemIds: selected });
    if (date) planOutfit(date, id);
    router.back();
  }

  if (items.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.empty]}>
        <Icon ios="tshirt" md="checkroom" size={48} color={theme.textSecondary} />
        <ThemedText themeColor="textSecondary" style={styles.center}>
          Dein Kleiderschrank ist noch leer. Füge zuerst Artikel hinzu, um sie zu Outfits zu kombinieren.
        </ThemedText>
        <PrimaryButton label="Artikel hinzufügen" onPress={() => router.replace('/add-item')} />
      </ThemedView>
    );
  }

  const selectedItems = selected
    .map((id) => items.find((i) => i.id === id))
    .filter((i) => i !== undefined);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedView type="backgroundElement" style={styles.preview}>
          {selectedItems.length === 0 ? (
            <ThemedText themeColor="textSecondary" style={styles.center}>
              Tippe unten auf Artikel, um dein Outfit zusammenzustellen.
            </ThemedText>
          ) : (
            selectedItems.map((item) => (
              <ItemImage
                key={item.id}
                item={item}
                style={[styles.previewItem, selectedItems.length > 4 && styles.previewItemSmall]}
              />
            ))
          )}
        </ThemedView>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name, z. B. Büro Montag"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          returnKeyType="done"
        />

        <ItemPicker selected={selected} onToggle={toggle} />
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <PrimaryButton
          label={selected.length ? `Outfit speichern (${selected.length})` : 'Outfit speichern'}
          disabled={selected.length === 0}
          onPress={save}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  center: {
    textAlign: 'center',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  preview: {
    aspectRatio: 1.2,
    borderRadius: Spacing.four,
    padding: Spacing.three,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
  },
  previewItem: {
    width: '48%',
    height: '48%',
  },
  previewItemSmall: {
    width: '32%',
    height: '32%',
  },
  input: {
    height: 48,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
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
