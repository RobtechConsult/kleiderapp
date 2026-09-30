import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Icon } from '@/components/icon';
import { OutfitCalendar } from '@/components/outfit-calendar';
import { TripList } from '@/components/trip-list';
import { ItemImage } from '@/components/item-tile';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWardrobe } from '@/store/wardrobe-store';
import type { Outfit } from '@/types/wardrobe';
import { confirmDestructive } from '@/lib/dialogs';

const SEGMENTS = ['Outfit', 'Packliste', 'Kalender'] as const;
type Segment = (typeof SEGMENTS)[number];

export default function OutfitsScreen() {
  const theme = useTheme();
  const { outfits } = useWardrobe();
  const [segment, setSegment] = useState<Segment>('Outfit');

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.padded}>
        <AppHeader title="Outfit" showCalendar={false} />
      </View>

      <View style={[styles.segments, { borderBottomColor: theme.border }]}>
        {SEGMENTS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setSegment(s)}
            style={[styles.segment, segment === s && { borderBottomColor: theme.text }]}>
            <ThemedText
              themeColor={segment === s ? 'text' : 'textSecondary'}
              type={segment === s ? 'smallBold' : 'small'}
              style={styles.segmentText}>
              {s}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={[styles.padded, styles.grid]}>
        {segment === 'Outfit' && (
          <>
            <IdeaCard />
            {outfits.map((o) => (
              <OutfitCard key={o.id} outfit={o} />
            ))}
          </>
        )}
        {segment === 'Packliste' && <TripList />}
        {segment === 'Kalender' && (
          <View style={styles.calendar}>
            <OutfitCalendar />
          </View>
        )}
      </View>
    </Screen>
  );
}

function IdeaCard() {
  const theme = useTheme();
  return (
    <Pressable style={styles.card} onPress={() => router.push('/create-outfit')}>
      <ThemedView type="backgroundElement" style={styles.cardInner}>
        <View style={[styles.plus, { backgroundColor: theme.backgroundSelected }]}>
          <Icon ios="plus" md="add" size={30} color={theme.textSecondary} />
        </View>
        <ThemedText>Füge Ideen für dein Outfit hinzu! 💫</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function OutfitCard({ outfit }: { outfit: Outfit }) {
  const { items, removeOutfit } = useWardrobe();
  const outfitItems = items.filter((i) => outfit.itemIds.includes(i.id)).slice(0, 4);

  async function askDelete() {
    if (await confirmDestructive('Outfit löschen?', `„${outfit.name}“ wird entfernt.`)) {
      removeOutfit(outfit.id);
    }
  }

  return (
    <Pressable style={styles.card} onLongPress={askDelete} delayLongPress={400}>
      <ThemedView type="backgroundElement" style={[styles.cardInner, styles.collage]}>
        {outfitItems.map((item) => (
          <ItemImage key={item.id} item={item} style={styles.collageItem} />
        ))}
      </ThemedView>
      <ThemedText type="small" numberOfLines={1}>
        {outfit.name}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    gap: Spacing.three,
  },
  padded: {
    paddingHorizontal: Spacing.three,
  },
  segments: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  segmentText: {
    fontSize: 18,
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
  cardInner: {
    aspectRatio: 1,
    borderRadius: Spacing.four,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  plus: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  collageItem: {
    width: '50%',
    height: '50%',
  },
  calendar: {
    width: '100%',
  },
});
