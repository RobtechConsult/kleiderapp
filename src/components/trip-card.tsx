import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from './icon';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysBetween, formatRange, todayKey } from '@/lib/dates';
import type { Trip } from '@/types/wardrobe';

export function packingProgress(trip: Trip) {
  const total = trip.itemIds.length + trip.extras.length;
  const packed = trip.packedItemIds.length + trip.extras.filter((e) => e.packed).length;
  return { total, packed };
}

export function ProgressBar({ value }: { value: number }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundSelected" style={styles.track}>
      <View style={[styles.fill, { width: `${Math.round(value * 100)}%`, backgroundColor: theme.accent }]} />
    </ThemedView>
  );
}

function tripStatus(trip: Trip) {
  const today = todayKey();
  if (trip.endDate < today) return 'Vorbei';
  if (trip.startDate <= today) return 'Läuft gerade';
  const days = daysBetween(today, trip.startDate);
  return days === 1 ? 'Morgen' : `In ${days} Tagen`;
}

export function TripCard({ trip }: { trip: Trip }) {
  const theme = useTheme();
  const { total, packed } = packingProgress(trip);

  return (
    <Pressable onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } })}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.grow}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {trip.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatRange(trip.startDate, trip.endDate)} · {tripStatus(trip)}
            </ThemedText>
          </View>
          <Icon ios="chevron.right" md="chevron_right" color={theme.textSecondary} />
        </View>
        <ProgressBar value={total ? packed / total : 0} />
        <ThemedText type="small" themeColor="textSecondary">
          {total === 0 ? 'Noch nichts auf der Liste' : packed === total ? `Alles gepackt (${total})` : `${packed}/${total} gepackt`}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  grow: {
    flex: 1,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
