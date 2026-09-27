import { createContext, useContext, useState, type ReactNode } from 'react';

import type { ClothingItem, Outfit } from '@/types/wardrobe';

type NewItem = Omit<ClothingItem, 'id' | 'createdAt' | 'wearCount'>;

type WardrobeState = {
  items: ClothingItem[];
  outfits: Outfit[];
  addItem: (item: NewItem) => void;
  toggleFavorite: (id: string) => void;
  addOutfit: (outfit: Omit<Outfit, 'id' | 'createdAt'>) => void;
};

/** Items needed before personal styling unlocks (onboarding goal on the start screen). */
export const ONBOARDING_GOAL = 5;

const WardrobeContext = createContext<WardrobeState | null>(null);

const newId = () => Math.random().toString(36).slice(2, 10);

// In-memory for now; swap for local persistence / backend sync later (see README roadmap).
export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  const value: WardrobeState = {
    items,
    outfits,
    addItem: (item) =>
      setItems((prev) => [
        { ...item, id: newId(), wearCount: 0, createdAt: new Date().toISOString() },
        ...prev,
      ]),
    toggleFavorite: (id) =>
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i))),
    addOutfit: (outfit) =>
      setOutfits((prev) => [
        { ...outfit, id: newId(), createdAt: new Date().toISOString() },
        ...prev,
      ]),
  };

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error('useWardrobe must be used inside <WardrobeProvider>');
  return ctx;
}
