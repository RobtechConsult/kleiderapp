import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HeaderButton } from '@/components/app-header';
import { Icon } from '@/components/icon';
import { ItemImage } from '@/components/item-tile';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice } from '@/lib/format';
import { useWardrobe } from '@/store/wardrobe-store';
import { CategoryLabels } from '@/types/wardrobe';

const addToWishlist = () => router.push({ pathname: '/add-item', params: { wishlist: '1' } });

export default function WishlistScreen() {
  const theme = useTheme();
  const { wishlist, moveToWardrobe } = useWardrobe();
  const sorted = [...wishlist].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = wishlist.reduce((sum, i) => sum + (i.price ?? 0), 0);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton label="Zur Wunschliste hinzufügen" onPress={addToWishlist}>
              <Icon ios="plus" md="add" />
            </HeaderButton>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {wishlist.length === 0 ? (
          <View style={styles.empty}>
            <Icon ios="heart" md="favorite" size={48} color={theme.textSecondary} />
            <ThemedText themeColor="textSecondary" style={styles.center}>
              Merke dir Teile, die du gern hättest – mit Foto, Preis und Link zum Shop.
            </ThemedText>
            <PrimaryButton label="Zur Wunschliste hinzufügen" icon={{ ios: 'plus', md: 'add' }} onPress={addToWishlist} />
          </View>
        ) : (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              {wishlist.length} {wishlist.length === 1 ? 'Teil' : 'Teile'}
              {total > 0 ? ` · zusammen ${formatPrice(total)}` : ''}
            </ThemedText>
            <View style={styles.grid}>
              {sorted.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityLabel={item.brand || CategoryLabels[item.category]}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                  style={styles.card}>
                  <ThemedView type="backgroundElement" style={styles.image}>
                    <ItemImage item={item} style={styles.fill} />
                  </ThemedView>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {item.brand || CategoryLabels[item.category]}
                  </ThemedText>
                  <View style={styles.row}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.price !== undefined ? formatPrice(item.price) : '–'}
                    </ThemedText>
                    <Pressable
                      accessibilityLabel={`${item.brand || CategoryLabels[item.category]} gekauft`}
                      hitSlop={8}
                      onPress={() => moveToWardrobe(item.id)}>
                      <ThemedText type="small" style={{ color: theme.accent }}>
                        Gekauft
                      </ThemedText>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.six,
  },
  center: {
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    width: '47%',
    gap: Spacing.one,
  },
  image: {
    aspectRatio: 0.85,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
