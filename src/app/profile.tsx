import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { InstallHint } from '@/components/install-hint';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWardrobe } from '@/store/wardrobe-store';
import { Categories, CategoryLabels } from '@/types/wardrobe';
import { exportBackup, parseBackup, pickBackupFile } from '@/lib/backup';
import { comingSoon, confirmDestructive, showMessage } from '@/lib/dialogs';
import { storageInfo } from '@/lib/persistence';

export default function ProfileScreen() {
  const theme = useTheme();
  const { items, outfits, weatherLocation } = useWardrobe();
  const byCategory = Categories.map((c) => ({
    category: c,
    count: items.filter((i) => i.category === c).length,
  })).filter((c) => c.count > 0);

  return (
    <Screen>
      <View style={styles.section}>
        <ThemedText type="smallBold">Übersicht</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <Row label="Artikel" value={items.length} />
          <Row label="Outfits" value={outfits.length} />
          {byCategory.map((c) => (
            <Row key={c.category} label={CategoryLabels[c.category]} value={c.count} />
          ))}
          <Pressable onPress={() => router.push('/stats')}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Alle Stil-Statistiken ansehen
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">Einstellungen</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <Pressable onPress={() => router.push('/sync')} style={styles.row}>
            <ThemedText type="small">Konto & Synchronisierung</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Per Datei
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => router.push('/location')} style={styles.row}>
            <ThemedText type="small">Standort für Wetter</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {weatherLocation?.name ?? 'Nicht gewählt'}
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => comingSoon('Mitteilungen')}>
            <ThemedText type="small">Mitteilungen</ThemedText>
          </Pressable>
        </ThemedView>
      </View>

      <DataSection />
    </Screen>
  );
}

/** "12,3 MB" */
function formatBytes(bytes: number) {
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${mb.toFixed(1).replace('.', ',')} MB`;
}

/** Where the data lives, how much space it takes, and backup export/import. */
function DataSection() {
  const { snapshot, restore, items, wishlist, outfits } = useWardrobe();
  const [info, setInfo] = useState<Awaited<ReturnType<typeof storageInfo>>>();
  const [busy, setBusy] = useState<'export' | 'import'>();
  const count = items.length + wishlist.length;

  useEffect(() => {
    storageInfo().then(setInfo, () => {});
  }, [count, outfits.length]);

  async function onExport() {
    setBusy('export');
    try {
      await exportBackup(snapshot());
    } catch (e) {
      console.warn(e);
      showMessage('Sicherung fehlgeschlagen', 'Die Sicherung konnte nicht erstellt werden.');
    } finally {
      setBusy(undefined);
    }
  }

  async function onImport() {
    const text = await pickBackupFile().catch(() => null);
    if (text == null) return;
    let data;
    try {
      data = parseBackup(text).data;
    } catch (e) {
      showMessage('Import nicht möglich', e instanceof Error ? e.message : String(e));
      return;
    }
    const ok = await confirmDestructive(
      'Sicherung wiederherstellen?',
      `Die Sicherung enthält ${data.items.length} Artikel und ${data.outfits.length} Outfits. ` +
        'Alles, was gerade in der App ist, wird dadurch ersetzt.',
      'Wiederherstellen',
    );
    if (!ok) return;
    setBusy('import');
    try {
      await restore(data);
      showMessage('Wiederhergestellt', `${data.items.length} Artikel und ${data.outfits.length} Outfits wurden übernommen.`);
    } catch (e) {
      console.warn(e);
      showMessage('Import fehlgeschlagen', 'Die Sicherung konnte nicht übernommen werden. Deine bisherigen Daten sind unverändert.');
    } finally {
      setBusy(undefined);
    }
  }

  const where =
    Platform.OS === 'web'
      ? info?.persisted
        ? 'In diesem Browser, dauerhaft gespeichert'
        : 'In diesem Browser'
      : 'Auf diesem Gerät';

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">Daten & Sicherung</ThemedText>
      <InstallHint />
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.row}>
          <ThemedText type="small">Gespeichert</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {where}
          </ThemedText>
        </View>
        {info?.usage != null && (
          <View style={styles.row}>
            <ThemedText type="small">Belegt</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatBytes(info.usage)}
              {info.quota ? ` von ${formatBytes(info.quota)}` : ''}
            </ThemedText>
          </View>
        )}
        <ThemedText type="small" themeColor="textSecondary">
          Deine Kleider liegen nur auf diesem Gerät. Eine Sicherung enthält alle Artikel, Fotos, Outfits,
          Kalender und Packlisten – damit kannst du sie aufbewahren oder auf ein anderes Gerät umziehen.
        </ThemedText>
        <DataButton
          label={busy === 'export' ? 'Sicherung wird erstellt …' : 'Sicherung exportieren'}
          busy={busy === 'export'}
          disabled={!!busy}
          onPress={onExport}
        />
        <DataButton
          label={busy === 'import' ? 'Wird wiederhergestellt …' : 'Sicherung wiederherstellen'}
          busy={busy === 'import'}
          disabled={!!busy}
          onPress={onImport}
        />
      </ThemedView>
    </View>
  );
}

function DataButton({
  label,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { borderColor: theme.border }, (pressed || disabled) && styles.dimmed]}>
      {busy && <ActivityIndicator size="small" />}
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small">{label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  button: {
    height: 44,
    borderWidth: 1,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  dimmed: {
    opacity: 0.6,
  },
});
