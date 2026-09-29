import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ItemImage } from './item-tile';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useWardrobe } from '@/store/wardrobe-store';
import type { Outfit } from '@/types/wardrobe';

/** Square 2×2 collage of the first four items of an outfit. */
export function OutfitCollage({ outfit, style }: { outfit: Outfit; style?: StyleProp<ViewStyle> }) {
  const { items } = useWardrobe();
  const pieces = items.filter((i) => outfit.itemIds.includes(i.id)).slice(0, 4);

  return (
    <ThemedView type="backgroundElement" style={[styles.collage, style]}>
      {pieces.map((p) => (
        <ItemImage key={p.id} item={p} style={styles.piece} />
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  collage: {
    aspectRatio: 1,
    borderRadius: Spacing.three,
    padding: Spacing.one,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  piece: {
    width: '50%',
    height: '50%',
  },
});
