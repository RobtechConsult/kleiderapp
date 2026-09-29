import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { OutfitCollage } from '@/components/outfit-collage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDayLong, todayKey } from '@/lib/dates';
import { useWardrobe } from '@/store/wardrobe-store';

/** Picks an outfit for one calendar day (?date=YYYY-MM-DD, defaults to today). */
export default function PlanOutfitScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ date?: string }>();
  const day = params.date ?? todayKey();
  const { outfits, calendar, planOutfit } = useWardrobe();
  const current = calendar[day]?.outfitId;

  // Replace this modal, so saving the new outfit returns straight to the calendar.
  const createNew = () => router.replace({ pathname: '/create-outfit', params: { date: day } });

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: formatDayLong(day) }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">
          {outfits.length ? 'Wähle ein Outfit für diesen Tag.' : 'Du hast noch keine Outfits gespeichert.'}
        </ThemedText>

        <View style={styles.grid}>
          <Pressable onPress={createNew} style={styles.card}>
            <ThemedView type="backgroundElement" style={[styles.newCard, { borderColor: theme.border }]}>
              <Icon ios="plus" md="add" size={30} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                Neues Outfit
              </ThemedText>
            </ThemedView>
          </Pressable>

          {outfits.map((outfit) => {
            const isCurrent = outfit.id === current;
            return (
              <Pressable
                key={outfit.id}
                accessibilityLabel={outfit.name}
                accessibilityState={{ selected: isCurrent }}
                onPress={() => {
                  planOutfit(day, outfit.id);
                  router.back();
                }}
                style={styles.card}>
                <OutfitCollage
                  outfit={outfit}
                  style={[styles.collage, { borderColor: isCurrent ? theme.accent : 'transparent' }]}
                />
                <ThemedText type="small" numberOfLines={1}>
                  {outfit.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </ThemedView>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    width: '47%',
    gap: Spacing.one,
  },
  newCard: {
    aspectRatio: 1,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  collage: {
    borderWidth: 2,
  },
});
