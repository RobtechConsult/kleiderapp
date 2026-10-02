import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderButton } from '@/components/app-header';
import { Icon } from '@/components/icon';
import { ItemImage } from '@/components/item-tile';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/dialogs';
import { formatPrice } from '@/lib/format';
import { costPerWear } from '@/lib/stats';
import { useWardrobe } from '@/store/wardrobe-store';
import { CategoryLabels, SeasonLabels, Seasons, type Outfit } from '@/types/wardrobe';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('de-DE');

export default function ItemDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItem, outfits, toggleFavorite, markWorn, removeItem, moveToWardrobe } = useWardrobe();
  const item = getItem(id);

  if (!item) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <Stack.Screen options={{ title: '' }} />
        <ThemedText themeColor="textSecondary">Artikel nicht gefunden.</ThemedText>
      </ThemedView>
    );
  }

  const title = item.brand || CategoryLabels[item.category];
  const inOutfits = outfits.filter((o) => o.itemIds.includes(item.id));
  const seasons = Seasons.filter((s) => item.seasons.includes(s));

  async function askDelete() {
    if (!item) return;
    const ok = await confirmDestructive(
      'Artikel löschen?',
      item.wishlist
        ? `${title} wird von deiner Wunschliste entfernt.`
        : `${title} wird aus deinem Kleiderschrank und allen Outfits entfernt.`,
    );
    if (ok) {
      // Opened via deep link there is no screen to go back to.
      if (router.canGoBack()) router.back();
      else router.replace(item.wishlist ? '/wishlist' : '/wardrobe');
      removeItem(item.id);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <HeaderButton
              label="Bearbeiten"
              onPress={() => router.push({ pathname: '/item/[id]/edit', params: { id: item.id } })}>
              <Icon ios="pencil" md="edit" />
            </HeaderButton>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView type="tint" style={styles.hero}>
          <ItemImage item={item} style={styles.heroImage} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
            onPress={() => toggleFavorite(item.id)}
            style={styles.favorite}>
            <ThemedView style={styles.favoriteInner}>
              <Icon
                ios={item.favorite ? 'heart.fill' : 'heart'}
                md="favorite"
                color={item.favorite ? '#E0245E' : theme.textSecondary}
              />
            </ThemedView>
          </Pressable>
        </ThemedView>

        {item.wishlist ? (
          <View style={styles.wear}>
            <View style={styles.grow}>
              <ThemedText type="subtitle">{item.price !== undefined ? formatPrice(item.price) : 'Wunschliste'}</ThemedText>
              {item.link ? (
                <Pressable onPress={() => item.link && WebBrowser.openBrowserAsync(item.link)}>
                  <ThemedText type="small" style={{ color: theme.accent }}>
                    Im Shop ansehen
                  </ThemedText>
                </Pressable>
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  Auf deiner Wunschliste
                </ThemedText>
              )}
            </View>
            <Pressable
              onPress={() => moveToWardrobe(item.id)}
              style={({ pressed }) => [styles.wornButton, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
              <Icon ios="bag" md="shopping_bag" color={theme.onPrimary} size={18} />
              <ThemedText type="small" style={{ color: theme.onPrimary }}>
                Gekauft
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.wear}>
            <View style={styles.grow}>
              <ThemedText type="subtitle">{item.wearCount}×</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.lastWornAt ? `getragen, zuletzt am ${formatDate(item.lastWornAt)}` : 'noch nie getragen'}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => markWorn(item.id)}
              style={({ pressed }) => [styles.wornButton, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
              <Icon ios="checkmark" md="check" color={theme.onPrimary} size={18} />
              <ThemedText type="small" style={{ color: theme.onPrimary }}>
                Heute getragen
              </ThemedText>
            </Pressable>
          </View>
        )}

        <ThemedView type="backgroundElement" style={styles.card}>
          <Row label="Kategorie">{CategoryLabels[item.category]}</Row>
          <Row label="Marke">{item.brand || 'Keine Marke'}</Row>
          <Row label="Farbe">
            {item.color ? (
              <View style={[styles.swatch, { backgroundColor: item.color, borderColor: theme.border }]} />
            ) : (
              '–'
            )}
          </Row>
          <Row label="Saison">
            {seasons.length ? seasons.map((s) => SeasonLabels[s]).join(', ') : 'Ganzjährig'}
          </Row>
          {!item.wishlist && item.price !== undefined && (
            <Row label="Preis">
              {`${formatPrice(item.price)} · ${formatPrice(costPerWear(item))} pro Tragen`}
            </Row>
          )}
          <Row label="Hinzugefügt">{formatDate(item.createdAt)}</Row>
        </ThemedView>

        {!item.wishlist && (
          <View style={styles.section}>
            <ThemedText type="smallBold">In Outfits ({inOutfits.length})</ThemedText>
            {inOutfits.length === 0 ? (
              <Pressable onPress={() => router.push('/create-outfit')}>
                <ThemedText type="small" themeColor="textSecondary">
                  Noch in keinem Outfit. <ThemedText type="small" style={{ color: theme.accent }}>Outfit erstellen</ThemedText>
                </ThemedText>
              </Pressable>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.outfits}>
                {inOutfits.map((o) => (
                  <OutfitThumb key={o.id} outfit={o} />
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable onPress={askDelete} style={({ pressed }) => [styles.delete, pressed && styles.pressed]}>
          <Icon ios="trash" md="delete" color="#D70015" size={18} />
          <ThemedText type="small" style={styles.deleteText}>
            Artikel löschen
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      {typeof children === 'string' ? <ThemedText type="small">{children}</ThemedText> : children}
    </View>
  );
}

function OutfitThumb({ outfit }: { outfit: Outfit }) {
  const { items } = useWardrobe();
  const pieces = items.filter((i) => outfit.itemIds.includes(i.id)).slice(0, 4);
  return (
    <View style={styles.thumb}>
      <ThemedView type="backgroundElement" style={styles.thumbCollage}>
        {pieces.map((p) => (
          <ItemImage key={p.id} item={p} style={styles.thumbPiece} />
        ))}
      </ThemedView>
      <ThemedText type="small" numberOfLines={1}>
        {outfit.name}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  hero: {
    aspectRatio: 1,
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  heroImage: {
    flex: 1,
  },
  favorite: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
  },
  favoriteInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  grow: {
    flex: 1,
  },
  wornButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    height: 44,
    borderRadius: 22,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
  },
  section: {
    gap: Spacing.two,
  },
  outfits: {
    gap: Spacing.two,
  },
  thumb: {
    width: 110,
    gap: Spacing.one,
  },
  thumbCollage: {
    aspectRatio: 1,
    borderRadius: Spacing.three,
    padding: Spacing.one,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  thumbPiece: {
    width: '50%',
    height: '50%',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.two,
  },
  deleteText: {
    color: '#D70015',
  },
  pressed: {
    opacity: 0.6,
  },
});
