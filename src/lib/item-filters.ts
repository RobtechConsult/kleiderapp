import type { Category, ClothingItem, Season } from '@/types/wardrobe';

export type SortKey = 'newest' | 'oldest' | 'mostWorn' | 'leastWorn' | 'recentlyWorn' | 'brand';

export const SortLabels: Record<SortKey, string> = {
  newest: 'Zuletzt hinzugefügt',
  oldest: 'Zuerst hinzugefügt',
  mostWorn: 'Am häufigsten getragen',
  leastWorn: 'Am seltensten getragen',
  recentlyWorn: 'Zuletzt getragen',
  brand: 'Marke A–Z',
};

export const SortKeys = Object.keys(SortLabels) as SortKey[];

export type ItemFilters = {
  favoritesOnly: boolean;
  neverWorn: boolean;
  colors: string[];
  seasons: Season[];
  brands: string[];
};

export const NO_FILTERS: ItemFilters = { favoritesOnly: false, neverWorn: false, colors: [], seasons: [], brands: [] };

export function activeFilterCount(f: ItemFilters) {
  return (
    Number(f.favoritesOnly) + Number(f.neverWorn) + f.colors.length + f.seasons.length + f.brands.length
  );
}

/** Items without a season count as all-year and match every season filter. */
function matches(item: ClothingItem, f: ItemFilters) {
  if (f.favoritesOnly && !item.favorite) return false;
  if (f.neverWorn && item.wearCount > 0) return false;
  if (f.colors.length && !(item.color && f.colors.includes(item.color))) return false;
  if (f.seasons.length && item.seasons.length && !item.seasons.some((s) => f.seasons.includes(s))) return false;
  if (f.brands.length && !f.brands.some((b) => b.toLowerCase() === item.brand?.toLowerCase())) return false;
  return true;
}

const byDateDesc = (a?: string, b?: string) => (b ?? '').localeCompare(a ?? '');

const comparators: Record<SortKey, (a: ClothingItem, b: ClothingItem) => number> = {
  newest: (a, b) => byDateDesc(a.createdAt, b.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  mostWorn: (a, b) => b.wearCount - a.wearCount || byDateDesc(a.lastWornAt, b.lastWornAt),
  leastWorn: (a, b) => a.wearCount - b.wearCount || byDateDesc(a.createdAt, b.createdAt),
  recentlyWorn: (a, b) => byDateDesc(a.lastWornAt, b.lastWornAt) || byDateDesc(a.createdAt, b.createdAt),
  // Items without a brand go last.
  brand: (a, b) =>
    (a.brand ? 0 : 1) - (b.brand ? 0 : 1) || (a.brand ?? '').localeCompare(b.brand ?? '', 'de', { sensitivity: 'base' }),
};

export function applyItemView(
  items: ClothingItem[],
  { category, filters, sort }: { category: Category | 'all'; filters: ItemFilters; sort: SortKey },
) {
  return items
    .filter((i) => (category === 'all' || i.category === category) && matches(i, filters))
    .sort(comparators[sort]);
}

/** Distinct brands, case-insensitive ("cos" = "COS", capitalised spelling preferred), alphabetically. */
export function brandsOf(items: ClothingItem[]) {
  const seen = new Map<string, string>();
  for (const i of items) {
    if (!i.brand) continue;
    const key = i.brand.toLowerCase();
    const current = seen.get(key);
    if (!current || (current === key && i.brand !== key)) seen.set(key, i.brand);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }));
}

export function colorsOf(items: ClothingItem[]) {
  return [...new Set(items.map((i) => i.color).filter((c): c is string => Boolean(c)))];
}
