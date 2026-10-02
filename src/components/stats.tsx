import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Bar } from '@/lib/stats';

/** Label · big value · optional note (e.g. a share). */
export function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.tile} accessible accessibilityLabel={`${label}: ${value}${note ? `, ${note}` : ''}`}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.tileValue}>{value}</ThemedText>
      {note && (
        <ThemedText type="small" themeColor="textSecondary">
          {note}
        </ThemedText>
      )}
    </ThemedView>
  );
}

/**
 * Horizontal bars, one hue (magnitude). Values sit at the bar tip in text colour; an optional
 * swatch dot carries the garment colour, the bar itself never does.
 */
export function BarList({ bars, unit = '' }: { bars: Bar[]; unit?: string }) {
  const theme = useTheme();
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <View style={styles.bars}>
      {bars.map((b) => (
        <View key={b.key} style={styles.barRow} accessible accessibilityLabel={`${b.label}: ${b.value}${unit}`}>
          <View style={styles.barLabel}>
            {b.swatch && <View style={[styles.swatch, { backgroundColor: b.swatch, borderColor: theme.textSecondary }]} />}
            <ThemedText type="small" numberOfLines={1} style={styles.grow}>
              {b.label}
            </ThemedText>
          </View>
          <View style={styles.barTrack}>
            {b.value > 0 && (
              <View style={[styles.bar, { width: `${(b.value / max) * 85}%`, backgroundColor: theme.accent }]} />
            )}
            <ThemedText type="small" themeColor="textSecondary" style={styles.barValue}>
              {b.value}
              {unit}
            </ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

export function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View>
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          {title}
        </ThemedText>
        {note && (
          <ThemedText type="small" themeColor="textSecondary">
            {note}
          </ThemedText>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: 2,
  },
  tileValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 600,
  },
  bars: {
    gap: Spacing.two,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  barLabel: {
    width: '36%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  grow: {
    flex: 1,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  barTrack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  // Thin bar, square at the baseline, 4px rounded data-end.
  bar: {
    height: 12,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  barValue: {
    fontVariant: ['tabular-nums'],
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
});
