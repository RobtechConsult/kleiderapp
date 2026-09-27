import { createContext, useContext, useState, type ReactNode } from 'react';

import { sampleItems, sampleOutfits } from '@/data/sample-wardrobe';
import type { ClothingItem, Outfit } from '@/types/wardrobe';

type WardrobeState = {
  items: ClothingItem[];
  outfits: Outfit[];
  addItem: (item: Omit<ClothingItem, 'id' | 'createdAt' | 'wearCount'>) => void;
  toggleFavorite: (id: string) => void;
  addOutfit: (outfit: Omit<Outfit, 'id' | 'createdAt'>) => void;
};

const WardrobeContext = createContext<WardrobeState | null>(null);

const newId = () => Math.random().toString(36).slice(2, 10);

// In-memory for now; swap for local persistence / backend sync later (see README roadmap).
export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>(sampleItems);
  const [outfits, setOutfits] = useState<Outfit[]>(sampleOutfits);

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
