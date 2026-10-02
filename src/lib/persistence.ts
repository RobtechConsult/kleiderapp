import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { WeatherLocation } from '@/lib/weather';
import type { Calendar, ClothingItem, Outfit, Trip } from '@/types/wardrobe';

export type PersistedWardrobe = {
  version: 1;
  items: ClothingItem[];
  outfits: Outfit[];
  /** Missing in files saved before the calendar existed. */
  calendar?: Calendar;
  /** Missing in files saved before packing lists existed. */
  trips?: Trip[];
  /** Place used for the weather forecast. */
  weatherLocation?: WeatherLocation;
};

const root = new Directory(Paths.document, 'wardrobe');
const photos = new Directory(root, 'photos');
const dataFile = new File(root, 'wardrobe.json');

/**
 * Photos are stored relative to the photos directory, because the absolute
 * app container path can change between app updates on iOS.
 */
const PHOTO_PREFIX = 'photo:';
/** Camera photos are downscaled to this size before storing (12 MP photos are ~4 MB each). */
const MAX_PHOTO_SIDE = 1600;

function ensureDir(dir: Directory) {
  if (!dir.exists) dir.create({ intermediates: true });
}

function toStored(uri?: string) {
  return uri?.startsWith(photos.uri) ? PHOTO_PREFIX + uri.slice(photos.uri.length) : uri;
}

function fromStored(uri?: string) {
  return uri?.startsWith(PHOTO_PREFIX) ? new File(photos, uri.slice(PHOTO_PREFIX.length)).uri : uri;
}

export async function loadWardrobe(): Promise<PersistedWardrobe | null> {
  if (!dataFile.exists) return null;
  try {
    const data = JSON.parse(await dataFile.text()) as PersistedWardrobe;
    return {
      ...data,
      items: data.items.map((i) => ({ ...i, imageUri: fromStored(i.imageUri) })),
    };
  } catch (e) {
    console.warn('Could not read wardrobe data', e);
    return null;
  }
}

/** Throws if the file can't be written (e.g. disk full) – the app shows a warning then. */
export async function saveWardrobe(data: PersistedWardrobe) {
  ensureDir(root);
  const stored = { ...data, items: data.items.map((i) => ({ ...i, imageUri: toStored(i.imageUri) })) };
  dataFile.write(JSON.stringify(stored));
}

/** Writes a base64 data URL (from a backup) to a cache file. */
function fileFromDataUrl(url: string) {
  const match = /^data:image\/([\w+.-]+);base64,/.exec(url);
  if (!match) throw new Error('Unsupported photo data');
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const file = new File(Paths.cache, `restore-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
  file.write(url.slice(match[0].length), { encoding: 'base64' });
  return file;
}

/** Returns a smaller copy of large photos; cut-outs (PNG) keep their transparency. */
async function downscaled(file: File) {
  try {
    const image = await ImageManipulator.manipulate(file.uri).renderAsync();
    const scale = MAX_PHOTO_SIDE / Math.max(image.width, image.height);
    if (scale >= 1) return file;
    const resized = await ImageManipulator.manipulate(file.uri)
      .resize({ width: Math.round(image.width * scale), height: Math.round(image.height * scale) })
      .renderAsync();
    const transparent = /^\.?(png|webp)$/i.test(file.extension);
    const saved = await resized.saveAsync(
      transparent ? { format: SaveFormat.PNG } : { format: SaveFormat.JPEG, compress: 0.85 },
    );
    return new File(saved.uri);
  } catch (e) {
    console.warn('Could not downscale photo, storing the original', e);
    return file;
  }
}

/** Copies a picked photo (which lives in a purgeable cache) or a backup's photo into app storage. */
export async function persistPhoto(uri: string, id: string): Promise<string> {
  ensureDir(photos);
  const source = await downscaled(uri.startsWith('data:') ? fileFromDataUrl(uri) : new File(uri));
  const ext = source.extension.replace(/^\./, '') || 'jpg';
  const target = new File(photos, `${id}.${ext}`);
  await source.copy(target);
  return target.uri;
}

export function deletePhoto(uri?: string) {
  if (!uri?.startsWith(photos.uri)) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}

/** Bytes used by the wardrobe data and photos; app storage is never evicted. */
export async function storageInfo(): Promise<{ usage?: number; quota?: number; persisted: boolean }> {
  let usage = dataFile.exists ? (dataFile.size ?? 0) : 0;
  if (photos.exists) {
    for (const entry of photos.list()) if (entry instanceof File) usage += entry.size ?? 0;
  }
  return { usage, persisted: true };
}

/** A stored photo as data URL, for backups. */
export async function photoAsDataUrl(uri: string) {
  if (uri.startsWith('data:')) return uri;
  const file = new File(uri);
  const ext = file.extension.replace(/^\./, '').toLowerCase();
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext || 'jpeg'}`;
  return `data:${mime};base64,${await file.base64()}`;
}
