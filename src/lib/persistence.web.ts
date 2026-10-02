import type { PersistedWardrobe } from './persistence';

export type { PersistedWardrobe } from './persistence';

/**
 * Web storage in IndexedDB (hundreds of MB instead of localStorage's ~5 MB). The wardrobe JSON
 * is one record; each photo is its own record so a change doesn't rewrite every image. Items
 * reference stored photos as "idb-photo:<key>"; in memory they carry the data URL.
 */
const DB_NAME = 'kleiderapp';
const DATA = 'data';
const PHOTOS = 'photos';
const WARDROBE_KEY = 'wardrobe';
const PHOTO_PREFIX = 'idb-photo:';
const LEGACY_KEY = 'kleiderapp.wardrobe';
/** Originals are downscaled to this size; cut-outs are already small. */
const MAX_PHOTO_SIDE = 1200;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb() {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(DATA);
      request.result.createObjectStore(PHOTOS);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const request = run(t.objectStore(store));
    t.oncomplete = () => resolve(request.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error ?? new Error('IndexedDB transaction aborted'));
  });
}

// data URL → photo key, so saving can store references instead of the images themselves.
// Photo records are only removed on the next start (see removeUnusedPhotos), so a key stays
// valid all session – even when several items share the same picture.
const keyByUrl = new Map<string, string>();

/** Asks the browser not to evict our data under storage pressure (best effort). */
let persistRequested = false;
function requestPersistence() {
  if (persistRequested) return;
  persistRequested = true;
  navigator.storage?.persist?.().catch(() => {});
}

export async function loadWardrobe(): Promise<PersistedWardrobe | null> {
  let data = (await tx<PersistedWardrobe | undefined>(DATA, 'readonly', (s) => s.get(WARDROBE_KEY))) ?? null;

  // One-time migration from the old localStorage storage (photos were inlined there).
  if (!data) {
    try {
      const raw = window.localStorage.getItem(LEGACY_KEY);
      if (raw) {
        const legacy = JSON.parse(raw) as PersistedWardrobe;
        data = legacy;
        const items = await Promise.all(
          legacy.items.map(async (i) => ({
            ...i,
            imageUri: i.imageUri?.startsWith('data:') ? await persistPhoto(i.imageUri, i.id) : i.imageUri,
          })),
        );
        data = { ...legacy, items };
        await saveWardrobe(data);
        window.localStorage.removeItem(LEGACY_KEY);
      }
    } catch (e) {
      // Keep using the old data from memory; the old key stays until a migration succeeds.
      console.warn('Could not migrate old wardrobe data', e);
    }
    return data;
  }

  const items = await Promise.all(
    data.items.map(async (i) => {
      if (!i.imageUri?.startsWith(PHOTO_PREFIX)) return i;
      const key = i.imageUri.slice(PHOTO_PREFIX.length);
      const url = await tx<string | undefined>(PHOTOS, 'readonly', (s) => s.get(key));
      if (!url) return { ...i, imageUri: undefined };
      keyByUrl.set(url, key);
      return { ...i, imageUri: url };
    }),
  );
  await removeUnusedPhotos(data).catch(() => {});
  return { ...data, items };
}

/** Throws if the data can't be stored (e.g. storage full) – the app shows a warning then. */
export async function saveWardrobe(data: PersistedWardrobe) {
  requestPersistence();
  const stored = {
    ...data,
    items: data.items.map((i) => {
      const key = i.imageUri ? keyByUrl.get(i.imageUri) : undefined;
      return key ? { ...i, imageUri: PHOTO_PREFIX + key } : i;
    }),
  };
  await tx(DATA, 'readwrite', (s) => s.put(stored, WARDROBE_KEY));
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}

/** Downscales large photos and turns them into a data URL (cut-outs keep their transparency). */
async function toStorableDataUrl(uri: string) {
  const transparent = /^data:image\/(png|webp)/.test(uri);
  const img = await loadImage(uri);
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  if (uri.startsWith('data:') && scale === 1) return uri;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  if (transparent) {
    const webp = canvas.toDataURL('image/webp', 0.9);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
  }
  return canvas.toDataURL('image/jpeg', 0.85);
}

/** Stores a picked or cut-out photo and returns the URL to display it with. */
export async function persistPhoto(uri: string, id: string): Promise<string> {
  const url = await toStorableDataUrl(uri);
  await tx(PHOTOS, 'readwrite', (s) => s.put(url, id));
  keyByUrl.set(url, id);
  return url;
}

/** Deleted photos are cleaned up on the next start, see removeUnusedPhotos. */
export function deletePhoto(_uri?: string) {}

/** Deletes photos of removed items. Runs while loading, before anything new can be stored. */
async function removeUnusedPhotos(data: PersistedWardrobe) {
  const used = new Set(data.items.map((i) => i.imageUri?.startsWith(PHOTO_PREFIX) && i.imageUri.slice(PHOTO_PREFIX.length)));
  const keys = await tx<IDBValidKey[]>(PHOTOS, 'readonly', (s) => s.getAllKeys());
  const unused = keys.filter((k) => !used.has(String(k)));
  if (unused.length) await tx(PHOTOS, 'readwrite', (s) => (unused.forEach((k) => s.delete(k)), s.count()));
}

/** Photos are kept as data URLs on the web already. */
export async function photoAsDataUrl(uri: string) {
  return uri;
}

/** Used/available bytes and whether the browser promised to keep the data. */
export async function storageInfo() {
  const estimate = await navigator.storage?.estimate?.().catch(() => undefined);
  const persisted = await navigator.storage?.persisted?.().catch(() => false);
  return { usage: estimate?.usage, quota: estimate?.quota, persisted: Boolean(persisted) };
}
