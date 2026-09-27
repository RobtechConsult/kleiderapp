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
  name: string;
  category: Category;
  /** Primary color as hex, used for swatches and color analysis. */
  color: string;
  seasons: Season[];
  brand?: string;
  /** Local file URI or remote URL of the (background-removed) photo. */
  imageUri?: string;
  favorite?: boolean;
  wearCount: number;
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
