import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Icon, type IconProps } from '@/components/icon';
import { ItemImage } from '@/components/item-tile';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FilterSheet, SortSheet } from '@/components/wardrobe-sheets';
import { activeFilterCount, applyItemView, NO_FILTERS, SortLabels, type SortKey } from '@/lib/item-filters';
import { useWardrobe } from '@/store/wardrobe-store';
import { Categories, CategoryLabels, type Category, type ClothingItem } from '@/types/wardrobe';
import { comingSoon, confirmDestructive } from '@/lib/dialogs';

const QUICK_ACTIONS: { label: string; icon: Pick<IconProps, 'ios' | 'md'>; onPress?: () => void }[] = [
  { label: 'Artikel importieren', icon: { ios: 'square.and.arrow.down', md: 'download' }, onPress: () => router.push('/import-items') },
  { label: 'Stil-Statistiken', icon: { ios: 'chart.line.uptrend.xyaxis', md: 'trending_up' }, onPress: () => router.push('/stats') },
  { label: 'Wunschliste', icon: { ios: 'heart', md: 'favorite' }, onPress: () => router.push('/wishlist') },
  { label: 'Verschönern', icon: { ios: 'wand.and.stars', md: 'auto_fix_high' } },
  { label: 'Kleiderschrank teilen', icon: { ios: 'square.and.arrow.up', md: 'ios_share' } },
];

const COLUMNS = 3;

export default function WardrobeScreen() {
  const theme = useTheme();
  const { items } = useWardrobe();
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [bannerVisible, setBannerVisible] = useState(true);
  const [sort, setSort] = useState<SortKey>('newest');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [sheet, setSheet] = useState<'sort' | 'filter' | null>(null);

  const usedCategories = Categories.filter((c) => items.some((i) => i.category === c));
  const visible = applyItemView(items, { category: filter, filters, sort });
  const filterCount = activeFilterCount(filters);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedView type="tint" style={styles.top}>
          <SafeAreaView edges={['top']} style={styles.topInner}>
            <AppHeader title="Artikel" onTitlePress={() => comingSoon('Ansicht wechseln')} />
            {bannerVisible && (
              <View style={styles.banner}>
                <ThemedText type="smallBold" style={styles.bannerText}>
                  Füge Artikel zu deinem Kleiderschrank hinzu und schalte dein persönliches Styling frei!
                </ThemedText>
                <Pressable
                  accessibilityLabel="Hinweis schließen"
                  onPress={() => setBannerVisible(false)}
                  hitSlop={8}>
                  <ThemedView style={styles.bannerClose}>
                    <Icon ios="chevron.up" md="keyboard_arrow_up" size={18} />
                  </ThemedView>
                </Pressable>
              </View>
            )}
          </SafeAreaView>
        </ThemedView>

        <View style={styles.inner}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions}>
            {QUICK_ACTIONS.map((a) => (
              <Pressable key={a.label} style={styles.action} onPress={a.onPress ?? (() => comingSoon(a.label))}>
                <ThemedView type="backgroundElement" style={styles.actionCircle}>
                  <Icon ios={a.icon.ios} md={a.icon.md} size={28} />
                </ThemedView>
                <ThemedText type="small" style={styles.actionLabel} numberOfLines={2}>
                  {a.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Pressable style={styles.sectionTitle} onPress={() => comingSoon('Kleiderschränke')}>
              <ThemedText type="smallBold" style={styles.sectionTitleText}>
                Alle Kleidungsstücke
              </ThemedText>
              <ThemedText themeColor="textSecondary">{items.length}</ThemedText>
              <Icon ios="chevron.down" md="keyboard_arrow_down" size={18} />
            </Pressable>
            <Pressable accessibilityLabel="Mehr" onPress={() => comingSoon('Optionen')} hitSlop={8}>
              <Icon ios="ellipsis" md="more_vert" />
            </Pressable>
          </View>

          <View style={styles.filters}>
            <Pressable
              accessibilityLabel={filterCount ? `Filter (${filterCount} aktiv)` : 'Filter'}
              onPress={() => setSheet('filter')}>
              <ThemedView
                type={filterCount ? 'primary' : 'background'}
                style={[styles.filterButton, { borderColor: filterCount ? theme.primary : theme.border }]}>
                <Icon ios="slider.horizontal.3" md="tune" size={20} color={filterCount ? theme.onPrimary : theme.text} />
                {filterCount > 0 && (
                  <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
                    {filterCount}
                  </ThemedText>
                )}
              </ThemedView>
            </Pressable>
            <Pressable accessibilityLabel="Sortierung" onPress={() => setSheet('sort')}>
              <ThemedView style={[styles.sortButton, { borderColor: theme.border }]}>
                <ThemedText type="small">{SortLabels[sort]}</ThemedText>
                <Icon ios="chevron.down" md="keyboard_arrow_down" size={16} />
              </ThemedView>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            <CategoryTab label="Alle" active={filter === 'all'} onPress={() => setFilter('all')} />
            {usedCategories.map((c) => (
              <CategoryTab key={c} label={CategoryLabels[c]} active={filter === c} onPress={() => setFilter(c)} />
            ))}
          </ScrollView>
        </View>

        <View style={[styles.grid, { borderTopColor: theme.border }]}>
          {visible.map((item) => (
            <ItemCell key={item.id} item={item} />
          ))}
          <AddCell />
        </View>

        {items.length > 0 && visible.length === 0 && (
          <View style={styles.noResults}>
            <ThemedText themeColor="textSecondary">Keine Artikel passen zu den Filtern.</ThemedText>
            <Pressable
              onPress={() => {
                setFilters(NO_FILTERS);
                setFilter('all');
              }}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                Filter zurücksetzen
              </ThemedText>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <SortSheet visible={sheet === 'sort'} value={sort} onChange={setSort} onClose={() => setSheet(null)} />
      <FilterSheet
        visible={sheet === 'filter'}
        items={items}
        category={filter}
        sort={sort}
        value={filters}
        onApply={setFilters}
        onClose={() => setSheet(null)}
      />
    </ThemedView>
  );
}

function CategoryTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && { borderBottomColor: theme.text }]}>
      <ThemedText themeColor={active ? 'text' : 'textSecondary'} style={styles.tabText}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function ItemCell({ item }: { item: ClothingItem }) {
  const theme = useTheme();
  const { removeItem } = useWardrobe();

  async function askDelete() {
    const name = item.brand || CategoryLabels[item.category];
    if (await confirmDestructive('Artikel löschen?', `${name} wird aus deinem Kleiderschrank und allen Outfits entfernt.`)) {
      removeItem(item.id);
    }
  }

  return (
    <Pressable
      accessibilityLabel={item.brand || CategoryLabels[item.category]}
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      onLongPress={askDelete}
      delayLongPress={400}
      style={[styles.cell, { borderColor: theme.border }]}>
      <ItemImage item={item} style={styles.cellImage} />
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {item.brand || 'Keine Marke'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.date}>
        {new Date(item.createdAt).toLocaleDateString('de-DE')}
      </ThemedText>
    </Pressable>
  );
}

function AddCell() {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/add-item')}
      style={({ pressed }) => [styles.cell, { borderColor: theme.border }, pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.addCell}>
        <View style={[styles.addCircle, { backgroundColor: theme.textSecondary }]}>
          <Icon ios="plus" md="add" color={theme.background} />
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.addLabel}>
          Artikel hinzufügen
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  top: {
    borderBottomLeftRadius: Spacing.four,
    borderBottomRightRadius: Spacing.four,
  },
  topInner: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  bannerText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  bannerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  actions: {
    gap: Spacing.two,
  },
  action: {
    width: 84,
    alignItems: 'center',
    gap: Spacing.one,
  },
  actionCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  sectionTitleText: {
    fontSize: 20,
    lineHeight: 28,
  },
  filters: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  filterButton: {
    minWidth: 44,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    gap: Spacing.one,
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
  tabs: {
    gap: Spacing.four,
  },
  tab: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    width: `${100 / COLUMNS}%`,
    aspectRatio: 0.72,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: Spacing.two,
  },
  cellImage: {
    flex: 1,
  },
  date: {
    fontSize: 12,
    lineHeight: 16,
  },
  addCell: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  addCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    textAlign: 'center',
  },
  noResults: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
});
