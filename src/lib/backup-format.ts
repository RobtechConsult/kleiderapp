import { getDocumentAsync } from 'expo-document-picker';

import { photoAsDataUrl, type PersistedWardrobe } from '@/lib/persistence';

/**
 * Backup file: the whole wardrobe as JSON, photos embedded as data URLs, so a single file
 * restores everything – on the same or another device, web or app.
 */
type BackupFile = {
  app: 'kleiderapp';
  format: 1;
  exportedAt: string;
  data: PersistedWardrobe;
};

export async function createBackup(data: PersistedWardrobe) {
  const items = await Promise.all(
    data.items.map(async (i) => ({ ...i, imageUri: i.imageUri ? await photoAsDataUrl(i.imageUri) : undefined })),
  );
  const backup: BackupFile = {
    app: 'kleiderapp',
    format: 1,
    exportedAt: new Date().toISOString(),
    data: { ...data, items },
  };
  return JSON.stringify(backup);
}

/** Throws a German message if the file is not a Kleiderapp backup. */
export function parseBackup(text: string): PersistedWardrobe {
  let backup: Partial<BackupFile>;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error('Die Datei ist keine Kleiderapp-Sicherung.');
  }
  const data = backup?.data;
  if (backup?.app !== 'kleiderapp' || !data || !Array.isArray(data.items) || !Array.isArray(data.outfits)) {
    throw new Error('Die Datei ist keine Kleiderapp-Sicherung.');
  }
  if (backup.format !== 1) throw new Error('Diese Sicherung stammt aus einer neueren App-Version.');
  return {
    version: 1,
    items: data.items,
    outfits: data.outfits,
    calendar: data.calendar ?? {},
    trips: data.trips ?? [],
    weatherLocation: data.weatherLocation,
  };
}

export function backupFileName() {
  return `kleiderapp-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
}

/** Lets the user choose a backup file; null if cancelled. */
export async function pickBackupAsset() {
  const result = await getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  return result.canceled ? null : (result.assets[0] ?? null);
}
