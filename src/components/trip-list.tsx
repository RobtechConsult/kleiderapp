import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from './icon';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { TripCard } from './trip-card';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayKey } from '@/lib/dates';
import { useWardrobe } from '@/store/wardrobe-store';

/** "Packliste" tab: upcoming and running trips first, past ones below. */
export function TripList() {
  const theme = useTheme();
  const { trips } = useWardrobe();
  const today = todayKey();
  const upcoming = trips.filter((t) => t.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = trips.filter((t) => t.endDate < today).sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/trip/new')}>
        <ThemedView type="backgroundElement" style={[styles.newTrip, { borderColor: theme.border }]}>
          <Icon ios="suitcase" md="luggage" size={28} color={theme.textSecondary} />
          <View style={styles.grow}>
            <ThemedText type="smallBold">Neue Packliste</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Reise anlegen und Kleidung abhaken
            </ThemedText>
          </View>
          <Icon ios="plus" md="add" color={theme.textSecondary} />
        </ThemedView>
      </Pressable>

      {upcoming.map((t) => (
        <TripCard key={t.id} trip={t} />
      ))}

      {past.length > 0 && (
        <>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.pastTitle}>
            Vergangene Reisen
          </ThemedText>
          {past.map((t) => (
            <TripCard key={t.id} trip={t} />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.three,
  },
  newTrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  grow: {
    flex: 1,
  },
  pastTitle: {
    marginTop: Spacing.two,
  },
});
