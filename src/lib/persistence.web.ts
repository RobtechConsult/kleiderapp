import type { PersistedWardrobe } from './persistence';

export type { PersistedWardrobe } from './persistence';

// Web fallback for development: everything lives in localStorage (~5 MB limit).
const KEY = 'kleiderapp.wardrobe';

export async function loadWardrobe(): Promise<PersistedWardrobe | null> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PersistedWardrobe) : null;
  } catch {
    return null;
  }
}

export function saveWardrobe(data: PersistedWardrobe) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not save wardrobe (storage full?)', e);
  }
}

/** The web picker returns short-lived blob: URLs; inline them as data URLs. */
export async function persistPhoto(uri: string): Promise<string> {
  if (!uri.startsWith('blob:')) return uri;
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function deletePhoto() {}
