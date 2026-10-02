import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ItemImage } from '@/components/item-tile';
import { PrimaryButton } from '@/components/primary-button';
import { BarList, Section, StatTile } from '@/components/stats';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice } from '@/lib/format';
import { costPerWear, LONG_UNWORN_DAYS, wardrobeStats } from '@/lib/stats';
import { useWardrobe } from '@/store/wardrobe-store';
import { CategoryLabels, type ClothingItem } from '@/types/wardrobe';

const percent = (share: number) => `${Math.round(share * 100)} %`;

export default function StatsScreen() {
  const theme = useTheme();
  const { items, outfits } = useWardrobe();
  const s = wardrobeStats(items);

  if (items.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.empty]}>
        <Icon ios="chart.bar" md="bar_chart" size={48} color={theme.textSecondary} />
        <ThemedText themeColor="textSecondary" style={styles.center}>
          Sobald du Artikel hinzufügst und trägst, siehst du hier, was du wirklich anziehst.
        </ThemedText>
        <PrimaryButton label="Artikel hinzufügen" onPress={() => router.replace('/add-item')} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.tiles}>
          <StatTile label="Teile" value={String(s.count)} />
          <StatTile label="Outfits" value={String(outfits.length)} />
          <StatTile label="Getragen" value={`${s.totalWears}×`} note="insgesamt" />
          <StatTile
            label="Nie getragen"
            value={String(s.neverWorn.length)}
            note={`${percent(s.neverWornShare)} deines Kleiderschranks`}
          />
        </View>

        <Section title="Meistgetragen">
          {s.mostWorn.length ? (
            s.mostWorn.map((item) => <ItemRow key={item.id} item={item} detail={`${item.wearCount}× getragen`} />)
          ) : (
            <Hint>Markiere Teile als getragen – in der Detailansicht oder über den Kalender.</Hint>
          )}
        </Section>

        <Section title="Nach Kategorie">
          <BarList bars={s.byCategory} />
        </Section>

        <Section title="Nach Farbe">
          <BarList bars={s.byColor} />
        </Section>

        <Section title="Nach Saison" note="Teile ohne Saison zählen als ganzjährig.">
          <BarList bars={s.bySeason} />
        </Section>

        {s.neverWorn.length > 0 && (
          <Section title="Noch nie getragen" note={`${s.neverWorn.length} von ${s.count} Teilen`}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
              {s.neverWorn.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityLabel={item.brand || CategoryLabels[item.category]}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}>
                  <ThemedView type="backgroundElement" style={styles.stripItem}>
                    <ItemImage item={item} style={styles.fill} />
                  </ThemedView>
                </Pressable>
              ))}
            </ScrollView>
          </Section>
        )}

        {s.longUnworn.length > 0 && (
          <Section title="Lange nicht getragen" note={`Seit über ${LONG_UNWORN_DAYS} Tagen`}>
            {s.longUnworn.map(({ item, days }) => (
              <ItemRow key={item.id} item={item} detail={`vor ${days} Tagen`} />
            ))}
          </Section>
        )}

        <Section
          title="Kosten pro Tragen"
          note={
            s.pricedCount
              ? `Kaufpreis geteilt durch Anzahl Tragen · ${s.pricedCount} Teile mit Preis, zusammen ${formatPrice(s.totalValue)}`
              : undefined
          }>
          {s.pricedCount ? (
            s.costPerWearTop.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                detail={`${formatPrice(costPerWear(item))} pro Tragen · ${formatPrice(item.price ?? 0)}`}
              />
            ))
          ) : (
            <Hint>Trage beim Bearbeiten eines Artikels den Kaufpreis ein, dann siehst du, welche Teile sich lohnen.</Hint>
          )}
        </Section>
      </ScrollView>
    </ThemedView>
  );
}

function ItemRow({ item, detail }: { item: ClothingItem; detail: string }) {
  const theme = useTheme();
  const label = item.brand || CategoryLabels[item.category];
  return (
    <Pressable
      accessibilityLabel={`${label}, ${detail}`}
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.thumb}>
        <ItemImage item={item} style={styles.fill} />
      </ThemedView>
      <View style={styles.grow}>
        <ThemedText numberOfLines={1}>{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {detail}
        </ThemedText>
      </View>
      <Icon ios="chevron.right" md="chevron_right" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="small" themeColor="textSecondary">
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  center: {
    textAlign: 'center',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.five,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  grow: {
    flex: 1,
  },
  strip: {
    gap: Spacing.two,
  },
  stripItem: {
    width: 72,
    height: 72,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
});
