import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, comingSoon, HeaderButton } from '@/components/app-header';
import { Icon, type IconProps } from '@/components/icon';
import { ItemImage } from '@/components/item-tile';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { discoverFeed, type FeedPost } from '@/data/discover-feed';
import { useTheme } from '@/hooks/use-theme';
import { useWardrobe } from '@/store/wardrobe-store';
import type { Category } from '@/types/wardrobe';

const CATEGORY_ICONS: Record<Category, Pick<IconProps, 'ios' | 'md'>> = {
  tops: { ios: 'tshirt.fill', md: 'apparel' },
  bottoms: { ios: 'figure.walk', md: 'straighten' },
  dresses: { ios: 'figure.dress.line.vertical.figure', md: 'woman' },
  outerwear: { ios: 'cloud.snow', md: 'ac_unit' },
  shoes: { ios: 'shoeprints.fill', md: 'footprint' },
  bags: { ios: 'handbag.fill', md: 'shopping_bag' },
  accessories: { ios: 'eyeglasses', md: 'eyeglasses' },
};

export default function DiscoverScreen() {
  const theme = useTheme();
  const { items } = useWardrobe();
  const [feed, setFeed] = useState<'new' | 'following'>('new');
  const [tipVisible, setTipVisible] = useState(true);
  const selected = items[0];

  const left = discoverFeed.filter((_, i) => i % 2 === 0);
  const right = discoverFeed.filter((_, i) => i % 2 === 1);

  return (
    <ThemedView type="tint" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <SafeAreaView edges={['top']} style={styles.top}>
          <AppHeader
            left={
              <View style={styles.feedSwitch}>
                {(['new', 'following'] as const).map((f) => (
                  <Pressable key={f} onPress={() => setFeed(f)}>
                    <ThemedText
                      type="subtitle"
                      themeColor={feed === f ? 'text' : 'textSecondary'}
                      style={styles.feedLabel}>
                      {f === 'new' ? 'Neu' : 'Folge ich'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            }
            right={
              <>
                <HeaderButton label="Beitrag hochladen" onPress={() => comingSoon('Beiträge')}>
                  <Icon ios="plus.circle" md="add_circle" />
                </HeaderButton>
                <HeaderButton label="Gespeichert" onPress={() => comingSoon('Gespeichert')}>
                  <Icon ios="bookmark" md="bookmark" />
                </HeaderButton>
                <HeaderButton label="Mitteilungen" onPress={() => comingSoon('Mitteilungen')}>
                  <Icon ios="bell" md="notifications" />
                </HeaderButton>
                <HeaderButton label="Menü" onPress={() => comingSoon('Menü')}>
                  <Icon ios="line.3.horizontal" md="menu" />
                </HeaderButton>
              </>
            }
          />

          {tipVisible && (
            <ThemedView style={styles.tip}>
              <ThemedView type="tint" style={styles.tipIcon}>
                <Icon ios="lightbulb" md="lightbulb" color={theme.accent} />
              </ThemedView>
              <ThemedText type="small" style={styles.grow}>
                Unter „Entdecken“ kannst du mit Artikeln nach Outfits suchen!
              </ThemedText>
              <Pressable accessibilityLabel="Tipp schließen" onPress={() => setTipVisible(false)} hitSlop={8}>
                <Icon ios="xmark" md="close" size={18} color={theme.textSecondary} />
              </Pressable>
            </ThemedView>
          )}

          <View style={styles.hero}>
            {selected ? (
              <ItemImage item={selected} style={styles.heroImage} />
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.heroHint}>
                Wähle einen Artikel, um passende Outfits zu finden.
              </ThemedText>
            )}
            <View style={[styles.pill, { backgroundColor: 'rgba(60,60,67,0.6)' }]}>
              <Pressable style={styles.pillPart} onPress={() => router.navigate('/wardrobe')}>
                <Icon ios="cabinet" md="door_sliding" color="#fff" size={20} />
                <ThemedText style={styles.pillText}>Kleiderschrank</ThemedText>
              </Pressable>
              <View style={styles.pillDivider} />
              <Pressable style={styles.pillPart} onPress={() => comingSoon('Suche')}>
                <Icon ios="magnifyingglass" md="search" color="#fff" size={20} />
              </Pressable>
              <Pressable style={styles.pillPart} onPress={() => comingSoon('Foto-Suche')}>
                <Icon ios="camera" md="photo_camera" color="#fff" size={20} />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>

        <ThemedView style={styles.sheet}>
          <ThemedView type="backgroundSelected" style={styles.grabber} />
          <View style={styles.filters}>
            <Pressable onPress={() => comingSoon('Filter')}>
              <ThemedView style={[styles.filterButton, { borderColor: theme.border }]}>
                <Icon ios="slider.horizontal.3" md="tune" size={20} />
              </ThemedView>
            </Pressable>
            <Pressable onPress={() => comingSoon('Sortierung')}>
              <ThemedView style={[styles.sortButton, { borderColor: theme.border }]}>
                <ThemedText type="small">Relevanz</ThemedText>
                <Icon ios="chevron.down" md="keyboard_arrow_down" size={16} />
              </ThemedView>
            </Pressable>
          </View>

          {feed === 'following' ? (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              Du folgst noch niemandem.
            </ThemedText>
          ) : (
            <View style={styles.masonry}>
              <View style={styles.column}>
                {left.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </View>
              <View style={styles.column}>
                {right.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </View>
            </View>
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

function PostCard({ post }: { post: FeedPost }) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => comingSoon('Outfit-Details')}>
      <ThemedView
        type="backgroundElement"
        style={[styles.post, { borderColor: theme.border }]}>
        {post.pieces.map((piece, i) => {
          const icon = CATEGORY_ICONS[piece.category];
          return (
            <View key={i} style={styles.piece}>
              <View style={[styles.pieceSwatch, { backgroundColor: piece.color }]}>
                <Icon ios={icon.ios} md={icon.md} size={18} color="rgba(128,128,128,0.9)" />
              </View>
            </View>
          );
        })}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  top: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  feedSwitch: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  feedLabel: {
    fontSize: 24,
    lineHeight: 32,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  heroImage: {
    width: 180,
    height: 180,
  },
  heroHint: {
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 32,
    paddingHorizontal: Spacing.three,
    height: 56,
  },
  pillPart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    height: '100%',
  },
  pillText: {
    color: '#fff',
  },
  pillDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: Spacing.one,
  },
  sheet: {
    flexGrow: 1,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
  },
  filters: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  filterButton: {
    width: 44,
    height: 40,
    borderRadius: Spacing.three,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButton: {
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  masonry: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  column: {
    flex: 1,
    gap: Spacing.three,
  },
  post: {
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.two,
    overflow: 'hidden',
  },
  piece: {
    width: '50%',
    padding: Spacing.one,
    flexGrow: 1,
  },
  pieceSwatch: {
    aspectRatio: 1,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
});
