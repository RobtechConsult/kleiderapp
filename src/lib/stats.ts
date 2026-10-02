import { colorName } from '@/constants/garment-colors';
import { Categories, CategoryLabels, SeasonLabels, Seasons, type ClothingItem } from '@/types/wardrobe';

export type Bar = { key: string; label: string; value: number; swatch?: string };

/** "Lange nicht getragen": worn before, but not within this many days. */
export const LONG_UNWORN_DAYS = 90;

const DAY = 86_400_000;
const daysSince = (iso: string, now: number) => Math.floor((now - new Date(iso).getTime()) / DAY);

/** Cost per wear; unworn items count as one wear so the price isn't divided by zero. */
export const costPerWear = (item: ClothingItem) => (item.price ?? 0) / Math.max(1, item.wearCount);

export function wardrobeStats(items: ClothingItem[], now = Date.now()) {
  const totalWears = items.reduce((sum, i) => sum + i.wearCount, 0);
  const neverWorn = items.filter((i) => i.wearCount === 0);

  const byCategory: Bar[] = Categories.map((c) => ({
    key: c,
    label: CategoryLabels[c],
    value: items.filter((i) => i.category === c).length,
  }))
    .filter((b) => b.value > 0)
    .sort((a, b) => b.value - a.value);

  const colorCounts = new Map<string, number>();
  for (const i of items) {
    const key = i.color?.toUpperCase() ?? 'none';
    colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1);
  }
  const byColor: Bar[] = [...colorCounts.entries()]
    .map(([key, value]) =>
      key === 'none'
        ? { key, label: 'Ohne Farbe', value }
        : { key, label: colorName(key), value, swatch: key },
    )
    // "Ohne Farbe" last, the rest by count
    .sort((a, b) => Number(a.key === 'none') - Number(b.key === 'none') || b.value - a.value);

  // Items without a season are worn all year, so they count for every season.
  const bySeason: Bar[] = Seasons.map((s) => ({
    key: s,
    label: SeasonLabels[s],
    value: items.filter((i) => i.seasons.length === 0 || i.seasons.includes(s)).length,
  }));

  const mostWorn = items
    .filter((i) => i.wearCount > 0)
    .sort((a, b) => b.wearCount - a.wearCount)
    .slice(0, 5);

  const longUnworn = items
    .filter((i) => i.lastWornAt && daysSince(i.lastWornAt, now) > LONG_UNWORN_DAYS)
    .sort((a, b) => (a.lastWornAt ?? '').localeCompare(b.lastWornAt ?? ''))
    .slice(0, 5)
    .map((item) => ({ item, days: daysSince(item.lastWornAt!, now) }));

  const priced = items.filter((i) => i.price !== undefined && i.price > 0);
  const costPerWearTop = [...priced].sort((a, b) => costPerWear(b) - costPerWear(a)).slice(0, 5);
  const totalValue = priced.reduce((sum, i) => sum + (i.price ?? 0), 0);

  return {
    count: items.length,
    totalWears,
    neverWorn,
    neverWornShare: items.length ? neverWorn.length / items.length : 0,
    byCategory,
    byColor,
    bySeason,
    mostWorn,
    longUnworn,
    pricedCount: priced.length,
    totalValue,
    costPerWearTop,
  };
}
