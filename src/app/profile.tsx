import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWardrobe } from '@/store/wardrobe-store';
import { Categories, CategoryLabels } from '@/types/wardrobe';
import { comingSoon } from '@/lib/dialogs';

export default function ProfileScreen() {
  const theme = useTheme();
  const { items, outfits } = useWardrobe();
  const byCategory = Categories.map((c) => ({
    category: c,
    count: items.filter((i) => i.category === c).length,
  })).filter((c) => c.count > 0);

  return (
    <Screen>
      <View style={styles.section}>
        <ThemedText type="smallBold">Übersicht</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <Row label="Artikel" value={items.length} />
          <Row label="Outfits" value={outfits.length} />
          {byCategory.map((c) => (
            <Row key={c.category} label={CategoryLabels[c.category]} value={c.count} />
          ))}
          <Pressable onPress={() => router.push('/stats')}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Alle Stil-Statistiken ansehen
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">Einstellungen</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          {['Konto & Synchronisierung', 'Standort für Wetter', 'Mitteilungen'].map((label) => (
            <Pressable key={label} onPress={() => comingSoon(label)}>
              <ThemedText type="small">{label}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small">{label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
