import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { deletePhoto, loadWardrobe, persistPhoto, saveWardrobe } from '@/lib/persistence';
import { fromDayKey, type DayKey } from '@/lib/dates';
import type { WeatherLocation } from '@/lib/weather';
import type { Calendar, ClothingItem, Outfit, Trip } from '@/types/wardrobe';

type NewItem = Omit<ClothingItem, 'id' | 'createdAt' | 'wearCount'>;
type NewOutfit = Omit<Outfit, 'id' | 'createdAt'>;
type NewTrip = Pick<Trip, 'name' | 'startDate' | 'endDate' | 'itemIds'>;

type WardrobeState = {
  /** False until the saved wardrobe has been loaded from disk. */
  ready: boolean;
  /** Owned items (the wardrobe). */
  items: ClothingItem[];
  /** Wanted items, see ClothingItem.wishlist. */
  wishlist: ClothingItem[];
  /** Any item by id, owned or on the wish list. */
  getItem: (id: string) => ClothingItem | undefined;
  /** "Gekauft": moves a wish-list item into the wardrobe. */
  moveToWardrobe: (id: string) => void;
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
  trips: Trip[];
  /** Returns the new trip's id. */
  addTrip: (trip: NewTrip) => string;
  updateTrip: (id: string, changes: Partial<Omit<Trip, 'id' | 'createdAt'>>) => void;
  removeTrip: (id: string) => void;
  /** Checks or unchecks a wardrobe item or an extra on the packing list. */
  togglePacked: (tripId: string, entryId: string) => void;
  /** Wardrobe items of all outfits planned in the calendar between two days (inclusive). */
  itemsPlannedBetween: (start: DayKey, end: DayKey) => string[];
  weatherLocation?: WeatherLocation;
  setWeatherLocation: (location: WeatherLocation | undefined) => void;
};

/** Items needed before personal styling unlocks (onboarding goal on the start screen). */
export const ONBOARDING_GOAL = 5;

const WardrobeContext = createContext<WardrobeState | null>(null);

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [allItems, setItems] = useState<ClothingItem[]>([]);
  const items = allItems.filter((i) => !i.wishlist);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [calendar, setCalendar] = useState<Calendar>({});
  const [trips, setTrips] = useState<Trip[]>([]);
  const [weatherLocation, setWeatherLocation] = useState<WeatherLocation>();

  useEffect(() => {
    loadWardrobe().then((data) => {
      if (data) {
        setItems(data.items);
        setOutfits(data.outfits);
        setCalendar(data.calendar ?? {});
        setTrips(data.trips ?? []);
        setWeatherLocation(data.weatherLocation);
      }
      setReady(true);
    });
  }, []);

  // Save after every change, but never before loading finished (would overwrite the file).
  useEffect(() => {
    if (ready) saveWardrobe({ version: 1, items: allItems, outfits, calendar, trips, weatherLocation });
  }, [ready, allItems, outfits, calendar, trips, weatherLocation]);

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
    wishlist: allItems.filter((i) => i.wishlist),
    getItem: (id) => allItems.find((i) => i.id === id),
    moveToWardrobe: (id) =>
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, wishlist: false, createdAt: new Date().toISOString() } : i,
        ),
      ),
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
      const current = allItems.find((i) => i.id === id);
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
      deletePhoto(allItems.find((i) => i.id === id)?.imageUri);
      setItems((prev) => prev.filter((i) => i.id !== id));
      const remaining = outfits
        .map((o) => ({ ...o, itemIds: o.itemIds.filter((itemId) => itemId !== id) }))
        .filter((o) => o.itemIds.length > 0);
      setOutfits(remaining);
      pruneCalendar(remaining);
      setTrips((prev) =>
        prev.map((t) => ({
          ...t,
          itemIds: t.itemIds.filter((itemId) => itemId !== id),
          packedItemIds: t.packedItemIds.filter((itemId) => itemId !== id),
        })),
      );
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
    weatherLocation,
    setWeatherLocation,
    trips,
    addTrip: (trip) => {
      const id = newId();
      setTrips((prev) => [
        ...prev,
        { ...trip, id, packedItemIds: [], extras: [], createdAt: new Date().toISOString() },
      ]);
      return id;
    },
    updateTrip: (id, changes) =>
      setTrips((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const next = { ...t, ...changes };
          // Items taken off the list can't stay checked.
          return { ...next, packedItemIds: next.packedItemIds.filter((i) => next.itemIds.includes(i)) };
        }),
      ),
    removeTrip: (id) => setTrips((prev) => prev.filter((t) => t.id !== id)),
    togglePacked: (tripId, entryId) =>
      setTrips((prev) =>
        prev.map((t) => {
          if (t.id !== tripId) return t;
          if (t.itemIds.includes(entryId)) {
            const packed = t.packedItemIds.includes(entryId);
            return {
              ...t,
              packedItemIds: packed
                ? t.packedItemIds.filter((i) => i !== entryId)
                : [...t.packedItemIds, entryId],
            };
          }
          return { ...t, extras: t.extras.map((e) => (e.id === entryId ? { ...e, packed: !e.packed } : e)) };
        }),
      ),
    itemsPlannedBetween: (start, end) => {
      const ids = new Set<string>();
      for (const [day, entry] of Object.entries(calendar)) {
        if (day < start || day > end) continue;
        outfits.find((o) => o.id === entry.outfitId)?.itemIds.forEach((i) => ids.add(i));
      }
      return [...ids];
    },
  };

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error('useWardrobe must be used inside <WardrobeProvider>');
  return ctx;
}
