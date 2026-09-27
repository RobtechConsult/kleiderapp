import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Icon } from './icon';

import { useTheme } from '@/hooks/use-theme';
import type { ClothingItem } from '@/types/wardrobe';

/** Photo of a clothing item; falls back to a color swatch or a placeholder glyph. */
export function ItemImage({ item, style }: { item: ClothingItem; style?: ViewStyle }) {
  const theme = useTheme();

  return (
    <View style={[styles.box, style]}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFill} contentFit="contain" />
      ) : item.color ? (
        <View style={[styles.swatch, { backgroundColor: item.color }]} />
      ) : (
        <Icon ios="tshirt" md="checkroom" size={36} color={theme.textSecondary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  swatch: {
    width: '60%',
    height: '60%',
    borderRadius: 8,
  },
});
