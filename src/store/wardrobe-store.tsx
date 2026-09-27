import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { deletePhoto, loadWardrobe, persistPhoto, saveWardrobe } from '@/lib/persistence';
import type { ClothingItem, Outfit } from '@/types/wardrobe';

type NewItem = Omit<ClothingItem, 'id' | 'createdAt' | 'wearCount'>;
type NewOutfit = Omit<Outfit, 'id' | 'createdAt'>;

type WardrobeState = {
  /** False until the saved wardrobe has been loaded from disk. */
  ready: boolean;
  items: ClothingItem[];
  outfits: Outfit[];
  addItem: (item: NewItem) => Promise<void>;
  removeItem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addOutfit: (outfit: NewOutfit) => void;
  removeOutfit: (id: string) => void;
};

/** Items needed before personal styling unlocks (onboarding goal on the start screen). */
export const ONBOARDING_GOAL = 5;

const WardrobeContext = createContext<WardrobeState | null>(null);

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  useEffect(() => {
    loadWardrobe().then((data) => {
      if (data) {
        setItems(data.items);
        setOutfits(data.outfits);
      }
      setReady(true);
    });
  }, []);

  // Save after every change, but never before loading finished (would overwrite the file).
  useEffect(() => {
    if (ready) saveWardrobe({ version: 1, items, outfits });
  }, [ready, items, outfits]);

  const value: WardrobeState = {
    ready,
    items,
    outfits,
    addItem: async (item) => {
      const id = newId();
      const imageUri = item.imageUri ? await persistPhoto(item.imageUri, id) : undefined;
      setItems((prev) => [
        { ...item, imageUri, id, wearCount: 0, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    },
    removeItem: (id) => {
      deletePhoto(items.find((i) => i.id === id)?.imageUri);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setOutfits((prev) =>
        prev
          .map((o) => ({ ...o, itemIds: o.itemIds.filter((itemId) => itemId !== id) }))
          .filter((o) => o.itemIds.length > 0),
      );
    },
    toggleFavorite: (id) =>
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i))),
    addOutfit: (outfit) =>
      setOutfits((prev) => [{ ...outfit, id: newId(), createdAt: new Date().toISOString() }, ...prev]),
    removeOutfit: (id) => setOutfits((prev) => prev.filter((o) => o.id !== id)),
  };

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error('useWardrobe must be used inside <WardrobeProvider>');
  return ctx;
}
