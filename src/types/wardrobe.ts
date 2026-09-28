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
  createdAt: string;
};

export type Outfit = {
  id: string;
  name: string;
  itemIds: string[];
  /** ISO date the outfit is planned for, if any. */
  plannedFor?: string;
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
