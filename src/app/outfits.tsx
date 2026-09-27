import { StyleSheet, View } from 'react-native';

import { ItemTile } from '@/components/item-tile';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useWardrobe } from '@/store/wardrobe-store';

export default function OutfitsScreen() {
  const { items, outfits } = useWardrobe();

  return (
    <Screen>
      <ThemedText type="subtitle">Outfits</ThemedText>

      {outfits.map((outfit) => (
        <ThemedView key={outfit.id} type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">{outfit.name}</ThemedText>
          <View style={styles.row}>
            {items
              .filter((i) => outfit.itemIds.includes(i.id))
              .map((item) => (
                <ItemTile key={item.id} item={item} size={72} />
              ))}
          </View>
        </ThemedView>
      ))}

      {outfits.length === 0 && (
        <ThemedText themeColor="textSecondary">Noch keine Outfits gespeichert.</ThemedText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
