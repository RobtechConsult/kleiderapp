import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { exportBackup, parseBackup, pickBackupFile } from '@/lib/backup';
import { deviceLabel } from '@/lib/backup-format';
import { confirmAction, showMessage } from '@/lib/dialogs';
import type { EntryKind, MergeSummary } from '@/lib/sync';
import { useWardrobe } from '@/store/wardrobe-store';

const KindLabels: Record<EntryKind, [string, string]> = {
  item: ['Artikel', 'Artikel'],
  outfit: ['Outfit', 'Outfits'],
  trip: ['Packliste', 'Packlisten'],
  day: ['Kalendertag', 'Kalendertage'],
};

/** "Neu: 14 Artikel, 1 Outfit. Gelöscht: 1 Artikel." – empty when nothing changes. */
function describe(summary: MergeSummary) {
  const part = (title: string, counts: MergeSummary['added']) => {
    const list = (Object.keys(KindLabels) as EntryKind[])
      .filter((k) => counts[k] > 0)
      .map((k) => `${counts[k]} ${KindLabels[k][counts[k] === 1 ? 0 : 1]}`);
    return list.length ? `${title}: ${list.join(', ')}.` : '';
  };
  return [part('Neu', summary.added), part('Geändert', summary.changed), part('Gelöscht', summary.removed)]
    .filter(Boolean)
    .join(' ');
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())} Uhr`;
}

/**
 * Syncing between devices without an account: one device shares a sync file, the other merges
 * it in (newer changes win, deletions carry over).
 */
export default function SyncScreen() {
  const theme = useTheme();
  const { snapshot, previewMerge, merge, lastSync } = useWardrobe();
  const [busy, setBusy] = useState<'share' | 'merge'>();

  async function share() {
    setBusy('share');
    try {
      await exportBackup(snapshot());
    } catch (e) {
      console.warn(e);
      showMessage('Teilen fehlgeschlagen', 'Die Sync-Datei konnte nicht erstellt werden.');
    } finally {
      setBusy(undefined);
    }
  }

  async function readFile() {
    const text = await pickBackupFile().catch(() => null);
    if (text == null) return;
    let parsed;
    try {
      parsed = parseBackup(text);
    } catch (e) {
      showMessage('Abgleich nicht möglich', e instanceof Error ? e.message : String(e));
      return;
    }
    const preview = previewMerge(parsed.data);
    const changes = describe(preview);
    if (!changes) {
      showMessage('Schon aktuell', `Dieses Gerät hat bereits alles aus der Datei (${parsed.device}).`);
      return;
    }
    const ok = await confirmAction(
      'Geräte abgleichen?',
      `Aus der Datei (${parsed.device}${parsed.exportedAt ? `, ${formatWhen(parsed.exportedAt)}` : ''}): ${changes} ` +
        'Was du hier geändert hast und neuer ist, bleibt erhalten.',
      'Abgleichen',
    );
    if (!ok) return;
    setBusy('merge');
    try {
      const summary = await merge(parsed.data, parsed.device);
      showMessage('Abgeglichen', describe(summary) || 'Keine Änderungen.');
    } catch (e) {
      console.warn(e);
      showMessage('Abgleich fehlgeschlagen', 'Die Datei konnte nicht übernommen werden. Deine Daten sind unverändert.');
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.row}>
            <ThemedText type="small">Dieses Gerät</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {deviceLabel()}
            </ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText type="small">Zuletzt abgeglichen</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.value}>
              {lastSync ? `${formatWhen(lastSync.at)}\nmit ${lastSync.device}` : 'Noch nie'}
            </ThemedText>
          </View>
        </ThemedView>

        <View style={styles.section}>
          <ThemedText type="smallBold">Zwei Geräte abgleichen</ThemedText>
          <Step n={1}>
            Auf dem einen Gerät „Sync-Datei teilen“ tippen und die Datei zum anderen schicken – per AirDrop,
            Mail, Messenger oder über einen Cloud-Ordner.
          </Step>
          <Step n={2}>
            Auf dem anderen Gerät „Sync-Datei einlesen“. Neue und geänderte Teile, Outfits, Kalendertage und
            Packlisten kommen dazu, Gelöschtes wird auch dort gelöscht. Wurde etwas auf beiden Geräten
            geändert, gilt die neuere Änderung.
          </Step>
          <Step n={3}>Danach in die andere Richtung wiederholen, damit beide Geräte gleich sind.</Step>
        </View>

        <PrimaryButton
          label={busy === 'share' ? 'Datei wird erstellt …' : 'Sync-Datei teilen'}
          icon={{ ios: 'square.and.arrow.up', md: 'ios_share' }}
          disabled={!!busy}
          onPress={share}
        />
        <Pressable
          disabled={!!busy}
          onPress={readFile}
          style={({ pressed }) => [styles.secondary, { borderColor: theme.border }, (pressed || !!busy) && styles.dimmed]}>
          {busy === 'merge' ? (
            <ActivityIndicator size="small" />
          ) : (
            <Icon ios="square.and.arrow.down" md="download" size={18} />
          )}
          <ThemedText>{busy === 'merge' ? 'Wird abgeglichen …' : 'Sync-Datei einlesen'}</ThemedText>
        </Pressable>

        <ThemedView type="tint" style={styles.note}>
          <Icon ios="person.crop.circle" md="account_circle" size={22} color={theme.accent} />
          <View style={styles.grow}>
            <ThemedText type="smallBold">Konto kommt später</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Ein Konto mit automatischem Abgleich über einen Server ist geplant. Bis dahin liegen deine Daten nur
              auf deinen Geräten – niemand sonst kann sie sehen.
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

function Step({ n, children }: { n: number; children: string }) {
  const theme = useTheme();
  return (
    <View style={styles.step}>
      <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
        <ThemedText type="smallBold" style={styles.stepNumberText}>
          {n}
        </ThemedText>
      </View>
      <ThemedText type="small" style={styles.grow}>
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
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
  value: {
    textAlign: 'right',
  },
  section: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 16,
  },
  grow: {
    flex: 1,
  },
  secondary: {
    height: 52,
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
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
});
