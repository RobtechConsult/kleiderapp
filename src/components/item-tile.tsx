import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import type { ClothingItem } from '@/types/wardrobe';

/** Photo of a clothing item, or a color swatch until a photo exists. */
export function ItemTile({ item, size = 104 }: { item: ClothingItem; size?: number }) {
  return (
    <View style={{ width: size, gap: Spacing.one }}>
      <ThemedView type="backgroundElement" style={[styles.image, { height: size }]}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFill} contentFit="contain" />
        ) : (
          <View style={[styles.swatch, { backgroundColor: item.color }]} />
        )}
      </ThemedView>
      <ThemedText type="small" numberOfLines={1}>
        {item.name}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  swatch: {
    width: '55%',
    height: '55%',
    borderRadius: Spacing.two,
  },
});
