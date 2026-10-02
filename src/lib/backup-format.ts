import { getDocumentAsync } from 'expo-document-picker';
import { Platform } from 'react-native';

import { photoAsDataUrl, type PersistedWardrobe } from '@/lib/persistence';

/**
 * Backup file: the whole wardrobe as JSON, photos embedded as data URLs, so a single file
 * restores everything – on the same or another device, web or app. The same file is used to
 * sync devices: it carries the change times (data.sync), so it can be merged instead.
 */
type BackupFile = {
  app: 'kleiderapp';
  format: 1;
  exportedAt: string;
  /** Kind of device that exported it, e.g. "iPhone" or "Browser". */
  device?: string;
  data: PersistedWardrobe;
};

export type ParsedBackup = { data: PersistedWardrobe; device: string; exportedAt?: string };

/** "iPhone", "Android", "Browser auf dem iPhone", … */
export function deviceLabel() {
  if (Platform.OS === 'ios') return Platform.isPad ? 'iPad' : 'iPhone';
  if (Platform.OS === 'android') return 'Android';
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  if (/iPhone/.test(ua)) return 'Browser auf dem iPhone';
  if (/iPad|Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1) return 'Browser auf dem iPad';
  if (/Android/.test(ua)) return 'Browser auf Android';
  return 'Browser';
}

export async function createBackup(data: PersistedWardrobe) {
  const items = await Promise.all(
    data.items.map(async (i) => ({ ...i, imageUri: i.imageUri ? await photoAsDataUrl(i.imageUri) : undefined })),
  );
  const backup: BackupFile = {
    app: 'kleiderapp',
    format: 1,
    exportedAt: new Date().toISOString(),
    device: deviceLabel(),
    data: { ...data, items },
  };
  return JSON.stringify(backup);
}

/** Throws a German message if the file is not a Kleiderapp backup. */
export function parseBackup(text: string): ParsedBackup {
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
  const sync = data.sync;
  const validSync = sync && typeof sync.updated === 'object' && typeof sync.deleted === 'object' ? sync : undefined;
  return {
    device: typeof backup.device === 'string' ? backup.device : 'anderes Gerät',
    exportedAt: backup.exportedAt,
    data: {
      version: 1,
      items: data.items,
      outfits: data.outfits,
      calendar: data.calendar ?? {},
      trips: data.trips ?? [],
      weatherLocation: data.weatherLocation,
      sync: validSync,
    },
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
