import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from './icon';
import { ItemImage } from './item-tile';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useForecast } from '@/hooks/use-forecast';
import { useTheme } from '@/hooks/use-theme';
import { formatDayLong, todayKey } from '@/lib/dates';
import { suggestOutfit } from '@/lib/outfit-suggestion';
import { describeWeather, formatTemp } from '@/lib/weather';
import { useWardrobe } from '@/store/wardrobe-store';
import { CategoryLabels } from '@/types/wardrobe';

/** Start screen: today's weather and a matching outfit from the wardrobe. */
export function WeatherCard() {
  const theme = useTheme();
  const { weatherLocation, items, calendar, addOutfit, planOutfit } = useWardrobe();
  const { forecast, error, loading } = useForecast();
  const [variant, setVariant] = useState(0);
  const today = todayKey();

  if (!weatherLocation) {
    return (
      <Pressable onPress={() => router.push('/location')}>
        <ThemedView type="tint" style={[styles.card, styles.setup]}>
          <Icon ios="cloud.sun" md="partly_cloudy_day" size={32} color={theme.accent} />
          <View style={styles.grow}>
            <ThemedText type="smallBold">Outfits passend zum Wetter</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Standort wählen, dann gibt es jeden Tag einen Vorschlag aus deinem Kleiderschrank.
            </ThemedText>
          </View>
          <Icon ios="chevron.right" md="chevron_right" color={theme.textSecondary} />
        </ThemedView>
      </Pressable>
    );
  }

  const day = forecast?.days.find((d) => d.date === today) ?? forecast?.days[0];
  if (!forecast || !day) {
    return (
      <ThemedView type="tint" style={[styles.card, styles.setup]}>
        {loading ? <ActivityIndicator /> : <Icon ios="exclamationmark.triangle" md="warning" color={theme.textSecondary} />}
        <ThemedText type="small" themeColor="textSecondary" style={styles.grow}>
          {loading ? `Wetter für ${weatherLocation.name} wird geladen …` : error}
        </ThemedText>
      </ThemedView>
    );
  }

  const weather = describeWeather(forecast.current.code);
  const suggestion = suggestOutfit(items, day, variant);
  const looks = suggestion.itemIds.map((id) => items.find((i) => i.id === id)).filter((i) => i !== undefined);
  const plannedToday = Boolean(calendar[today]);

  function planToday() {
    const id = addOutfit({ name: suggestion.title, itemIds: suggestion.itemIds });
    planOutfit(today, id);
  }

  return (
    <ThemedView type="tint" style={styles.card}>
      <Pressable onPress={() => router.push('/location')} style={styles.weatherRow} accessibilityLabel="Standort ändern">
        <Icon ios={weather.icon.ios} md={weather.icon.md} size={36} color={theme.accent} />
        <View style={styles.grow}>
          <ThemedText type="smallBold">
            {formatTemp(forecast.current.temperature)} · {weather.label}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatTemp(day.max)} / {formatTemp(day.min)} · Regen {Math.round(day.rain)} % · {weatherLocation.name}
          </ThemedText>
        </View>
      </Pressable>

      <View>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDayLong(day.date)}
        </ThemedText>
        <ThemedText type="smallBold" style={styles.title}>
          {suggestion.title}
        </ThemedText>
        {suggestion.hint && (
          <ThemedText type="small" themeColor="textSecondary">
            {suggestion.hint}
          </ThemedText>
        )}
      </View>

      {looks.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.looks}>
          {looks.map((item) => (
            <Pressable
              key={item.id}
              accessibilityLabel={item.brand || CategoryLabels[item.category]}
              onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}>
              <ThemedView style={styles.look}>
                <ItemImage item={item} style={styles.fill} />
              </ThemedView>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          Füge Kleidung hinzu, dann stellen wir dir hier ein passendes Outfit zusammen.
        </ThemedText>
      )}

      {looks.length > 0 && suggestion.missing.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Es fehlen noch: {suggestion.missing.map((c) => CategoryLabels[c]).join(', ')}
        </ThemedText>
      )}

      {looks.length > 0 && (
        <View style={styles.actions}>
          <Pressable
            onPress={() => setVariant((v) => v + 1)}
            style={({ pressed }) => [styles.secondary, { borderColor: theme.border }, pressed && styles.pressed]}>
            <Icon ios="arrow.triangle.2.circlepath" md="autorenew" size={16} />
            <ThemedText type="small">Neu mischen</ThemedText>
          </Pressable>
          <Pressable
            disabled={plannedToday}
            onPress={planToday}
            style={({ pressed }) => [
              styles.primary,
              { backgroundColor: theme.primary },
              (pressed || plannedToday) && styles.pressed,
            ]}>
            <Icon ios={plannedToday ? 'checkmark' : 'calendar.badge.plus'} md={plannedToday ? 'check' : 'calendar_add_on'} size={16} color={theme.onPrimary} />
            <ThemedText type="small" style={{ color: theme.onPrimary }}>
              {plannedToday ? 'Für heute geplant' : 'Für heute planen'}
            </ThemedText>
          </Pressable>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  setup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grow: {
    flex: 1,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  looks: {
    gap: Spacing.two,
  },
  look: {
    width: 76,
    height: 76,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    height: 40,
  },
  primary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: 20,
    height: 40,
  },
  pressed: {
    opacity: 0.6,
  },
});
