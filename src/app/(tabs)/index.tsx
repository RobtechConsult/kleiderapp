import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Icon } from '@/components/icon';
import { ItemImage } from '@/components/item-tile';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ONBOARDING_GOAL, useWardrobe } from '@/store/wardrobe-store';

export default function StartScreen() {
  const { items, ready } = useWardrobe();
  const unlocked = items.length >= ONBOARDING_GOAL;

  return (
    <Screen scroll={false}>
      <AppHeader title="Hallo, Guest" />

      <ScrollView
        style={styles.grow}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View>
          <ThemedText type="smallBold" style={styles.heading}>
            Erstelle deinen Kleiderschrank
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Foto machen – Verschönern und taggen, alles per KI
          </ThemedText>
        </View>

        <Illustration />

        {items.length > 0 && (
          <View style={styles.recent}>
            <ThemedText type="smallBold">Zuletzt hinzugefügt</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
              {items.slice(0, 10).map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}>
                  <ThemedView type="backgroundElement" style={styles.recentItem}>
                    <ItemImage item={item} style={StyleSheet.absoluteFill} />
                  </ThemedView>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {ready && !unlocked && <OnboardingCard count={items.length} />}
    </Screen>
  );
}

/** Mock phone showing the "add to closet" flow, like the onboarding hero. */
function Illustration() {
  const theme = useTheme();

  return (
    <ThemedView type="tint" style={styles.illustration}>
      <ThemedView style={[styles.phone, { borderColor: theme.border }]}>
        <ThemedText type="smallBold" style={styles.phoneTitle}>
          Zum Kleiderschrank hinzufügen
        </ThemedText>
        <ThemedView type="backgroundElement" style={styles.phonePhoto}>
          <Icon ios="camera" md="photo_camera" size={36} color={theme.textSecondary} />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

function OnboardingCard({ count }: { count: number }) {
  const theme = useTheme();
  const progress = Math.min(count / ONBOARDING_GOAL, 1);

  return (
    <ThemedView style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.sparkles}>✨</ThemedText>
        <ThemedText type="smallBold" style={styles.cardTitle}>
          Füge {ONBOARDING_GOAL} Artikel hinzu, um dein persönliches Styling freizuschalten
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.counter}>
        {count} / {ONBOARDING_GOAL}
      </ThemedText>
      <ThemedView type="backgroundSelected" style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.max(progress * 100, 4)}%`, backgroundColor: theme.accent },
          ]}
        />
      </ThemedView>
      <Pressable
        onPress={() => router.push('/add-item')}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: theme.primary },
          pressed && styles.pressed,
        ]}>
        <Icon ios="plus" md="add" color={theme.onPrimary} />
        <ThemedText style={{ color: theme.onPrimary }}>Artikel hinzufügen</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  grow: {
    flex: 1,
  },
  scroll: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  heading: {
    fontSize: 20,
    lineHeight: 28,
  },
  illustration: {
    height: 240,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    alignItems: 'flex-end',
    paddingTop: Spacing.four,
    paddingRight: Spacing.four,
  },
  phone: {
    width: '60%',
    flex: 1,
    borderWidth: 6,
    borderBottomWidth: 0,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  phoneTitle: {
    textAlign: 'center',
    fontSize: 12,
  },
  phonePhoto: {
    width: 96,
    height: 96,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recent: {
    gap: Spacing.two,
  },
  recentRow: {
    gap: Spacing.two,
  },
  recentItem: {
    width: 88,
    height: 88,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  card: {
    borderRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.two,
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  sparkles: {
    fontSize: 28,
    lineHeight: 34,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
  },
  counter: {
    textAlign: 'right',
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  primaryButton: {
    marginTop: Spacing.two,
    height: 52,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.8,
  },
});
