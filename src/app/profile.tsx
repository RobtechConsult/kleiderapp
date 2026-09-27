import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useWardrobe } from '@/store/wardrobe-store';

export default function ProfileScreen() {
  const { items } = useWardrobe();
  const mostWorn = [...items].sort((a, b) => b.wearCount - a.wearCount).slice(0, 3);

  return (
    <Screen>
      <ThemedText type="subtitle">Profil</ThemedText>

      <View style={styles.section}>
        <ThemedText type="smallBold">Stil-Statistiken</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          {mostWorn.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <ThemedText type="small" style={styles.grow}>
                {item.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.wearCount}× getragen
              </ThemedText>
            </View>
          ))}
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">Einstellungen</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="small">Konto & Synchronisierung · bald</ThemedText>
          <ThemedText type="small">Standort für Wetter · bald</ThemedText>
          <ThemedText type="small">Wunschliste · bald</ThemedText>
        </ThemedView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  grow: {
    flex: 1,
  },
});
