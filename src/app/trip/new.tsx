import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateRangePicker } from '@/components/date-range-picker';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, daysBetween, formatRange, todayKey, type DayKey } from '@/lib/dates';
import { useWardrobe } from '@/store/wardrobe-store';

export default function NewTripScreen() {
  const theme = useTheme();
  const { addTrip, itemsPlannedBetween } = useWardrobe();
  const [name, setName] = useState('');
  const [start, setStart] = useState<DayKey>(todayKey());
  const [end, setEnd] = useState<DayKey | undefined>(addDays(todayKey(), 2));
  const [usePlanned, setUsePlanned] = useState(true);

  const planned = end ? itemsPlannedBetween(start, end) : [];

  function save() {
    if (!end) return;
    const id = addTrip({
      name: name.trim() || `Reise ${formatRange(start, end)}`,
      startDate: start,
      endDate: end,
      itemIds: usePlanned ? planned : [],
    });
    router.replace({ pathname: '/trip/[id]', params: { id } });
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name, z. B. Wochenende in Berlin"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          returnKeyType="done"
        />

        <View style={styles.section}>
          <ThemedText type="smallBold">Zeitraum</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {end
              ? `${formatRange(start, end)} · ${daysBetween(start, end) + 1} Tage`
              : 'Tippe auf den letzten Tag der Reise.'}
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <DateRangePicker
              start={start}
              end={end}
              onChange={(s, e) => {
                setStart(s);
                setEnd(e);
              }}
            />
          </ThemedView>
        </View>

        {planned.length > 0 && (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: usePlanned }}
            onPress={() => setUsePlanned((v) => !v)}
            style={styles.toggle}>
            <View
              style={[
                styles.checkbox,
                { borderColor: usePlanned ? theme.accent : theme.border },
                usePlanned && { backgroundColor: theme.accent },
              ]}>
              {usePlanned && <Icon ios="checkmark" md="check" size={14} color="#fff" />}
            </View>
            <ThemedText type="small" style={styles.grow}>
              {planned.length} Artikel aus den für diese Tage geplanten Outfits übernehmen
            </ThemedText>
          </Pressable>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <PrimaryButton label="Packliste erstellen" disabled={!end} onPress={save} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  input: {
    height: 48,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  section: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
