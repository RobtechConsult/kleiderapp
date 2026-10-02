import { File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

import { backupFileName, createBackup, pickBackupAsset } from '@/lib/backup-format';
import type { PersistedWardrobe } from '@/lib/persistence';

export { parseBackup } from '@/lib/backup-format';

/** Writes the backup to a file and opens the share sheet (Dateien, AirDrop, Mail, …). */
export async function exportBackup(data: PersistedWardrobe) {
  const file = new File(Paths.cache, backupFileName());
  if (file.exists) file.delete();
  file.write(await createBackup(data));
  await shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Sicherung speichern', UTI: 'public.json' });
}

/** Contents of the backup file the user picks, or null if cancelled. */
export async function pickBackupFile() {
  const asset = await pickBackupAsset();
  if (!asset) return null;
  return new File(asset.uri).text();
}
