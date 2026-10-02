import type { Calendar, CalendarEntry, ClothingItem, Outfit, Trip } from '@/types/wardrobe';
import type { WeatherLocation } from '@/lib/weather';

/**
 * Change tracking for syncing between devices without a server: every item, outfit, packing
 * list and calendar day has a "last changed" time, and deletions leave a tombstone. Merging two
 * wardrobes keeps the newer version of each entry, so nothing is lost and deletions spread.
 * A server sync later can reuse the same data.
 *
 * Keys: "item:<id>", "outfit:<id>", "trip:<id>", "day:<YYYY-MM-DD>". Times are ISO strings.
 */
export type SyncMeta = {
  /** Random id of this installation. */
  deviceId: string;
  updated: Record<string, string>;
  deleted: Record<string, string>;
  /** Last time a sync file from another device was merged in. */
  lastSync?: { at: string; device: string };
};

/** The synced part of the wardrobe (same shape as PersistedWardrobe). */
export type SyncedWardrobe = {
  items: ClothingItem[];
  outfits: Outfit[];
  calendar?: Calendar;
  trips?: Trip[];
  weatherLocation?: WeatherLocation;
  sync?: SyncMeta;
};

export const newDeviceId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

export function emptyMeta(): SyncMeta {
  return { deviceId: newDeviceId(), updated: {}, deleted: {} };
}

/** Everything that can change, as key → object. Objects are compared by reference. */
export function entries(data: Pick<SyncedWardrobe, 'items' | 'outfits' | 'calendar' | 'trips'>) {
  const map = new Map<string, object>();
  data.items.forEach((i) => map.set(`item:${i.id}`, i));
  data.outfits.forEach((o) => map.set(`outfit:${o.id}`, o));
  (data.trips ?? []).forEach((t) => map.set(`trip:${t.id}`, t));
  Object.entries(data.calendar ?? {}).forEach(([day, e]) => map.set(`day:${day}`, e));
  return map;
}

/**
 * Records what changed between two states of the app (immutable updates: a changed entry is a
 * new object). Returns the updated meta; unchanged when nothing changed.
 */
export function trackChanges(meta: SyncMeta, before: Map<string, object>, after: Map<string, object>, now: string) {
  let next = meta;
  const edit = () => (next === meta ? (next = { ...meta, updated: { ...meta.updated }, deleted: { ...meta.deleted } }) : next);
  for (const [key, value] of after) {
    if (before.get(key) === value) continue;
    edit().updated[key] = now;
    delete next.deleted[key];
  }
  for (const key of before.keys()) {
    if (after.has(key)) continue;
    edit().deleted[key] = now;
    delete next.updated[key];
  }
  return next;
}

export type EntryKind = 'item' | 'outfit' | 'trip' | 'day';
type Counts = Record<EntryKind, number>;
/** What a merge changes, per kind of entry. */
export type MergeSummary = { added: Counts; changed: Counts; removed: Counts };

const zero = (): Counts => ({ item: 0, outfit: 0, trip: 0, day: 0 });
const kindOf = (key: string) => key.slice(0, key.indexOf(':')) as EntryKind;

type Side = { value?: object; time?: string; deletedAt?: string };

/** Fallback change time for data saved before change tracking existed. */
function createdTime(value?: object) {
  return (value as { createdAt?: string } | undefined)?.createdAt ?? '';
}

function side(key: string, map: Map<string, object>, meta?: SyncMeta): Side {
  const value = map.get(key);
  return {
    value,
    time: value ? (meta?.updated[key] ?? createdTime(value)) : undefined,
    deletedAt: meta?.deleted[key],
  };
}

/** Same order on every device, also for equal creation times. */
const newestFirst = (a: { id: string; createdAt: string }, b: { id: string; createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);

const sameJson = (a?: object, b?: object) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Merges another device's wardrobe into this one: per entry, the newest version or deletion
 * wins (ties keep the local state). Merging the same file twice changes nothing.
 */
export function mergeWardrobes(local: SyncedWardrobe, remote: SyncedWardrobe, localMeta: SyncMeta) {
  const remoteMeta = remote.sync;
  const localMap = entries(local);
  const remoteMap = entries(remote);
  const keys = new Set([
    ...localMap.keys(),
    ...remoteMap.keys(),
    ...Object.keys(localMeta.deleted),
    ...Object.keys(remoteMeta?.deleted ?? {}),
  ]);

  const meta: SyncMeta = { ...localMeta, updated: {}, deleted: {} };
  const result = new Map<string, object>();
  const summary: MergeSummary = { added: zero(), changed: zero(), removed: zero() };

  for (const key of keys) {
    const l = side(key, localMap, localMeta);
    const r = side(key, remoteMap, remoteMeta);
    // Candidates in order of preference on equal times.
    const candidates = [
      { kind: 'local' as const, time: l.time },
      { kind: 'remote' as const, time: r.time },
      { kind: 'deleted' as const, time: l.deletedAt },
      { kind: 'deleted' as const, time: r.deletedAt },
    ].filter((c): c is { kind: 'local' | 'remote' | 'deleted'; time: string } => c.time !== undefined);
    const winner = candidates.reduce((best, c) => (c.time > best.time ? c : best));

    if (winner.kind === 'deleted') {
      meta.deleted[key] = winner.time;
      if (l.value) summary.removed[kindOf(key)]++;
    } else {
      const value = winner.kind === 'local' ? l.value! : r.value!;
      result.set(key, value);
      meta.updated[key] = winner.time;
      if (winner.kind === 'remote') {
        if (!l.value) summary.added[kindOf(key)]++;
        else if (!sameJson(l.value, r.value)) summary.changed[kindOf(key)]++;
      }
    }
  }

  const pick = <T,>(prefix: string) =>
    [...result].filter(([k]) => k.startsWith(prefix)).map(([, v]) => v as T);
  const items = pick<ClothingItem>('item:').sort(newestFirst);
  const itemIds = new Set(items.map((i) => i.id));

  // Keep references valid: drop deleted items from outfits and packing lists, and days whose
  // outfit is gone. Both devices do the same, so they end up with the same data.
  const outfits = pick<Outfit>('outfit:')
    .map((o) => (o.itemIds.every((id) => itemIds.has(id)) ? o : { ...o, itemIds: o.itemIds.filter((id) => itemIds.has(id)) }))
    .filter((o) => o.itemIds.length > 0)
    .sort(newestFirst);
  const outfitIds = new Set(outfits.map((o) => o.id));
  const trips = pick<Trip>('trip:')
    .map((t) =>
      t.itemIds.every((id) => itemIds.has(id))
        ? t
        : {
            ...t,
            itemIds: t.itemIds.filter((id) => itemIds.has(id)),
            packedItemIds: t.packedItemIds.filter((id) => itemIds.has(id)),
          },
    )
    .sort((a, b) => newestFirst(b, a));
  const calendar: Calendar = {};
  for (const [key, value] of result) {
    const entry = value as CalendarEntry;
    if (key.startsWith('day:') && outfitIds.has(entry.outfitId)) calendar[key.slice(4)] = entry;
  }

  return {
    data: {
      items,
      outfits,
      calendar,
      trips,
      weatherLocation: local.weatherLocation ?? remote.weatherLocation,
    },
    meta,
    summary,
  };
}
