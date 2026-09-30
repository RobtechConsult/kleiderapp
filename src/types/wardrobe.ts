export type Category =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'bags'
  | 'accessories';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type ClothingItem = {
  id: string;
  category: Category;
  brand?: string;
  /** Local file URI or remote URL of the photo. */
  imageUri?: string;
  /** Primary color as hex; shown as a swatch when there is no photo. */
  color?: string;
  seasons: Season[];
  favorite?: boolean;
  wearCount: number;
  /** ISO date of the last time it was marked as worn. */
  lastWornAt?: string;
  /** On the wish list: wanted, not owned yet. Kept out of the wardrobe, outfits and packing lists. */
  wishlist?: boolean;
  /** Price in euros (wish list). */
  price?: number;
  /** Shop link (wish list). */
  link?: string;
  createdAt: string;
};

export type Outfit = {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: string;
};

/** An outfit planned for one calendar day. */
export type CalendarEntry = {
  outfitId: string;
  /** Set once the day's outfit was marked as worn (counted into the items' wear counts). */
  worn?: boolean;
};

/** Keyed by local day ("YYYY-MM-DD"). */
export type Calendar = Record<string, CalendarEntry>;

/** Something to pack that is not part of the wardrobe ("Ladekabel", "Zahnbürste"). */
export type PackingExtra = { id: string; label: string; packed: boolean };

/** A packing list for a trip. */
export type Trip = {
  id: string;
  name: string;
  /** Local days ("YYYY-MM-DD"), inclusive. */
  startDate: string;
  endDate: string;
  itemIds: string[];
  /** Subset of itemIds already in the suitcase. */
  packedItemIds: string[];
  extras: PackingExtra[];
  createdAt: string;
};

export const CategoryLabels: Record<Category, string> = {
  tops: 'Oberteile',
  bottoms: 'Hosen & Röcke',
  dresses: 'Kleider',
  outerwear: 'Jacken & Mäntel',
  shoes: 'Schuhe',
  bags: 'Taschen',
  accessories: 'Accessoires',
};

export const Categories = Object.keys(CategoryLabels) as Category[];

export const SeasonLabels: Record<Season, string> = {
  spring: 'Frühling',
  summer: 'Sommer',
  autumn: 'Herbst',
  winter: 'Winter',
};

export const Seasons = Object.keys(SeasonLabels) as Season[];
