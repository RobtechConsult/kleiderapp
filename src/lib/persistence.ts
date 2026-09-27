import { Directory, File, Paths } from 'expo-file-system';

import type { ClothingItem, Outfit } from '@/types/wardrobe';

export type PersistedWardrobe = {
  version: 1;
  items: ClothingItem[];
  outfits: Outfit[];
};

const root = new Directory(Paths.document, 'wardrobe');
const photos = new Directory(root, 'photos');
const dataFile = new File(root, 'wardrobe.json');

/**
 * Photos are stored relative to the photos directory, because the absolute
 * app container path can change between app updates on iOS.
 */
const PHOTO_PREFIX = 'photo:';

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

export function saveWardrobe(data: PersistedWardrobe) {
  ensureDir(root);
  const stored = { ...data, items: data.items.map((i) => ({ ...i, imageUri: toStored(i.imageUri) })) };
  dataFile.write(JSON.stringify(stored));
}

/** Copies a picked photo (which lives in a purgeable cache) into app storage. */
export async function persistPhoto(uri: string, id: string): Promise<string> {
  ensureDir(photos);
  const source = new File(uri);
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
