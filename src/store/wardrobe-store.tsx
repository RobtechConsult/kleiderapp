import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { deletePhoto, loadWardrobe, persistPhoto, saveWardrobe } from '@/lib/persistence';
import { fromDayKey, type DayKey } from '@/lib/dates';
import type { Calendar, ClothingItem, Outfit } from '@/types/wardrobe';

type NewItem = Omit<ClothingItem, 'id' | 'createdAt' | 'wearCount'>;
type NewOutfit = Omit<Outfit, 'id' | 'createdAt'>;

type WardrobeState = {
  /** False until the saved wardrobe has been loaded from disk. */
  ready: boolean;
  items: ClothingItem[];
  outfits: Outfit[];
  addItem: (item: NewItem) => Promise<void>;
  updateItem: (id: string, changes: Partial<NewItem>) => Promise<void>;
  removeItem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  /** Increments the wear count and remembers today as the last wear date. */
  markWorn: (id: string) => void;
  /** Returns the new outfit's id. */
  addOutfit: (outfit: NewOutfit) => string;
  removeOutfit: (id: string) => void;
  calendar: Calendar;
  planOutfit: (day: DayKey, outfitId: string) => void;
  unplanDay: (day: DayKey) => void;
  /** Counts every item of the day's outfit as worn on that day (once per day). */
  markDayWorn: (day: DayKey) => void;
};

/** Items needed before personal styling unlocks (onboarding goal on the start screen). */
export const ONBOARDING_GOAL = 5;

const WardrobeContext = createContext<WardrobeState | null>(null);

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [calendar, setCalendar] = useState<Calendar>({});

  useEffect(() => {
    loadWardrobe().then((data) => {
      if (data) {
        setItems(data.items);
        setOutfits(data.outfits);
        setCalendar(data.calendar ?? {});
      }
      setReady(true);
    });
  }, []);

  // Save after every change, but never before loading finished (would overwrite the file).
  useEffect(() => {
    if (ready) saveWardrobe({ version: 1, items, outfits, calendar });
  }, [ready, items, outfits, calendar]);

  /** Drops calendar days whose outfit no longer exists. */
  const pruneCalendar = (remaining: Outfit[]) =>
    setCalendar((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([, entry]) => remaining.some((o) => o.id === entry.outfitId)),
      ),
    );

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
    updateItem: async (id, changes) => {
      const current = items.find((i) => i.id === id);
      if (!current) return;
      let { imageUri } = current;
      if ('imageUri' in changes && changes.imageUri !== current.imageUri) {
        // New file name per photo, so image caches never show the old one.
        imageUri = changes.imageUri ? await persistPhoto(changes.imageUri, `${id}-${Date.now()}`) : undefined;
        deletePhoto(current.imageUri);
      }
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes, imageUri } : i)));
    },
    removeItem: (id) => {
      deletePhoto(items.find((i) => i.id === id)?.imageUri);
      setItems((prev) => prev.filter((i) => i.id !== id));
      const remaining = outfits
        .map((o) => ({ ...o, itemIds: o.itemIds.filter((itemId) => itemId !== id) }))
        .filter((o) => o.itemIds.length > 0);
      setOutfits(remaining);
      pruneCalendar(remaining);
    },
    toggleFavorite: (id) =>
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i))),
    markWorn: (id) =>
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, wearCount: i.wearCount + 1, lastWornAt: new Date().toISOString() } : i,
        ),
      ),
    addOutfit: (outfit) => {
      const id = newId();
      setOutfits((prev) => [{ ...outfit, id, createdAt: new Date().toISOString() }, ...prev]);
      return id;
    },
    removeOutfit: (id) => {
      const remaining = outfits.filter((o) => o.id !== id);
      setOutfits(remaining);
      pruneCalendar(remaining);
    },
    calendar,
    planOutfit: (day, outfitId) => setCalendar((prev) => ({ ...prev, [day]: { outfitId } })),
    unplanDay: (day) =>
      setCalendar((prev) => {
        const { [day]: _removed, ...rest } = prev;
        return rest;
      }),
    markDayWorn: (day) => {
      const entry = calendar[day];
      const outfit = entry && outfits.find((o) => o.id === entry.outfitId);
      if (!entry || entry.worn || !outfit) return;
      const wornAt = fromDayKey(day).toISOString();
      setItems((prev) =>
        prev.map((i) =>
          outfit.itemIds.includes(i.id)
            ? {
                ...i,
                wearCount: i.wearCount + 1,
                lastWornAt: !i.lastWornAt || i.lastWornAt < wornAt ? wornAt : i.lastWornAt,
              }
            : i,
        ),
      );
      setCalendar((prev) => ({ ...prev, [day]: { ...entry, worn: true } }));
    },
  };

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error('useWardrobe must be used inside <WardrobeProvider>');
  return ctx;
}
