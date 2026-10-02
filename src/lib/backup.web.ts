import { backupFileName, createBackup, pickBackupAsset } from '@/lib/backup-format';
import type { PersistedWardrobe } from '@/lib/persistence';

export { parseBackup } from '@/lib/backup-format';

/** Downloads the backup as a file. */
export async function exportBackup(data: PersistedWardrobe) {
  const blob = new Blob([await createBackup(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = backupFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Contents of the backup file the user picks, or null if cancelled. */
export async function pickBackupFile() {
  const asset = await pickBackupAsset();
  if (!asset) return null;
  return asset.file ? asset.file.text() : (await fetch(asset.uri)).text();
}
