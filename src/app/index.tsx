import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ItemTile } from '@/components/item-tile';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWardrobe } from '@/store/wardrobe-store';

type StylistFeature = {
  title: string;
  icon: SymbolViewProps['name'];
};

const FEATURES: StylistFeature[] = [
  { title: 'Outfitvorschläge', icon: { ios: 'wand.and.stars', android: 'auto_awesome', web: 'auto_awesome' } },
  { title: 'Stil-Chat', icon: { ios: 'bubble.left.and.bubble.right', android: 'chat', web: 'chat' } },
  { title: 'Finde meine Farben', icon: { ios: 'paintpalette', android: 'palette', web: 'palette' } },
  { title: 'Finde meinen Fit', icon: { ios: 'figure.stand', android: 'accessibility', web: 'accessibility' } },
  { title: 'Stil bewerten', icon: { ios: 'star', android: 'star', web: 'star' } },
  { title: 'Virtuelle Anprobe', icon: { ios: 'camera.viewfinder', android: 'photo_camera', web: 'photo_camera' } },
];

export default function StylistScreen() {
  const theme = useTheme();
  const { items, outfits } = useWardrobe();
  const outfitOfTheDay = outfits[0];
  const outfitItems = outfitOfTheDay
    ? items.filter((i) => outfitOfTheDay.itemIds.includes(i.id))
    : [];

  return (
    <Screen>
      <ThemedText type="subtitle">Hallo 👋</ThemedText>

      <View style={styles.section}>
        <ThemedText type="smallBold">KI-Stylist</ThemedText>
        <View style={styles.grid}>
          {FEATURES.map((f) => (
            <Pressable
              key={f.title}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() => Alert.alert(f.title, 'Kommt bald.')}>
              <ThemedView type="backgroundElement" style={styles.cardInner}>
                <SymbolView name={f.icon} tintColor={theme.accent} size={28} />
                <ThemedText type="small">{f.title}</ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </View>
      </View>

      {outfitOfTheDay && (
        <View style={styles.section}>
          <ThemedText type="smallBold">Outfit des Tages</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {outfitOfTheDay.name} · Wetter folgt
          </ThemedText>
          <View style={styles.row}>
            {outfitItems.map((item) => (
              <ItemTile key={item.id} item={item} size={76} />
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  card: {
    width: '48.5%',
  },
  cardInner: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
