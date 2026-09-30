import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from './icon';
import { ItemImage } from './item-tile';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWardrobe } from '@/store/wardrobe-store';
import { Categories, CategoryLabels } from '@/types/wardrobe';

/** All wardrobe items grouped by category, each tile toggles its selection. */
export function ItemPicker({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  const theme = useTheme();
  const { items } = useWardrobe();

  return (
    <>
      {Categories.map((category) => {
        const inCategory = items.filter((i) => i.category === category);
        if (inCategory.length === 0) return null;
        return (
          <View key={category} style={styles.section}>
            <ThemedText type="smallBold">{CategoryLabels[category]}</ThemedText>
            <View style={styles.grid}>
              {inCategory.map((item) => {
                const isSelected = selected.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={item.brand || CategoryLabels[item.category]}
                    onPress={() => onToggle(item.id)}
                    style={styles.tile}>
                    <ThemedView
                      type="backgroundElement"
                      style={[styles.tileInner, { borderColor: isSelected ? theme.accent : 'transparent' }]}>
                      <ItemImage item={item} style={styles.tileImage} />
                      {isSelected && (
                        <View style={[styles.check, { backgroundColor: theme.accent }]}>
                          <Icon ios="checkmark" md="check" size={14} color="#fff" />
                        </View>
                      )}
                    </ThemedView>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </>
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
  tile: {
    width: '31.5%',
  },
  tileInner: {
    aspectRatio: 1,
    borderRadius: Spacing.three,
    borderWidth: 2,
    overflow: 'hidden',
  },
  tileImage: {
    flex: 1,
  },
  check: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
