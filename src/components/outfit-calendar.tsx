import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from './icon';
import { ItemImage } from './item-tile';
import { OutfitCollage } from './outfit-collage';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useForecast } from '@/hooks/use-forecast';
import { useTheme } from '@/hooks/use-theme';
import { formatDayLong, MONTHS, monthGrid, toDayKey, todayKey, WEEKDAYS_SHORT, type DayKey } from '@/lib/dates';
import { describeWeather, formatTemp } from '@/lib/weather';
import { useWardrobe } from '@/store/wardrobe-store';

/** Month view with one planned outfit per day and a panel for the selected day. */
export function OutfitCalendar() {
  const theme = useTheme();
  const today = todayKey();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selected, setSelected] = useState<DayKey>(today);

  const shiftMonth = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const d = new Date(year, m + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const goToday = () => {
    const now = new Date();
    setMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelected(today);
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthHeader}>
        <Pressable accessibilityLabel="Vorheriger Monat" hitSlop={8} onPress={() => shiftMonth(-1)}>
          <Icon ios="chevron.left" md="chevron_left" />
        </Pressable>
        <ThemedText type="smallBold" style={styles.monthTitle}>
          {MONTHS[month.month]} {month.year}
        </ThemedText>
        <Pressable accessibilityLabel="Nächster Monat" hitSlop={8} onPress={() => shiftMonth(1)}>
          <Icon ios="chevron.right" md="chevron_right" />
        </Pressable>
        <Pressable onPress={goToday} style={[styles.todayButton, { borderColor: theme.border }]}>
          <ThemedText type="small">Heute</ThemedText>
        </Pressable>
      </View>

      <View style={styles.week}>
        {WEEKDAYS_SHORT.map((d) => (
          <ThemedText key={d} type="small" themeColor="textSecondary" style={styles.weekday}>
            {d}
          </ThemedText>
        ))}
      </View>

      {monthGrid(month.year, month.month).map((week, i) => (
        <View key={i} style={styles.week}>
          {week.map((date, j) =>
            date ? (
              <DayCell
                key={j}
                day={toDayKey(date)}
                isToday={toDayKey(date) === today}
                isSelected={toDayKey(date) === selected}
                onPress={() => setSelected(toDayKey(date))}
              />
            ) : (
              <View key={j} style={styles.cell} />
            ),
          )}
        </View>
      ))}

      <DayPanel day={selected} isPastOrToday={selected <= today} />
    </View>
  );
}

function DayCell({
  day,
  isToday,
  isSelected,
  onPress,
}: {
  day: DayKey;
  isToday: boolean;
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { calendar, outfits, items } = useWardrobe();
  const entry = calendar[day];
  const outfit = entry && outfits.find((o) => o.id === entry.outfitId);
  const firstItem = outfit && items.find((i) => i.id === outfit.itemIds[0]);

  return (
    <Pressable
      accessibilityLabel={`${formatDayLong(day)}${outfit ? `, ${outfit.name}` : ''}`}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={styles.cell}>
      <ThemedView
        type={isSelected ? 'backgroundSelected' : 'background'}
        style={[styles.cellInner, isToday && { borderColor: theme.accent, borderWidth: 1.5 }]}>
        <ThemedText
          type="small"
          style={[styles.dayNumber, isToday && { color: theme.accent, fontWeight: 700 }]}>
          {Number(day.slice(8))}
        </ThemedText>
        {firstItem ? (
          <ItemImage item={firstItem} style={styles.cellThumb} />
        ) : (
          outfit && <View style={[styles.dot, { backgroundColor: theme.accent }]} />
        )}
        {entry?.worn && (
          <View style={[styles.wornBadge, { backgroundColor: theme.accent }]}>
            <Icon ios="checkmark" md="check" size={8} color="#fff" />
          </View>
        )}
      </ThemedView>
    </Pressable>
  );
}

function DayPanel({ day, isPastOrToday }: { day: DayKey; isPastOrToday: boolean }) {
  const theme = useTheme();
  const { calendar, outfits, unplanDay, markDayWorn } = useWardrobe();
  const entry = calendar[day];
  const outfit = entry && outfits.find((o) => o.id === entry.outfitId);
  const plan = () => router.push({ pathname: '/plan-outfit', params: { date: day } });

  return (
    <ThemedView type="backgroundElement" style={styles.panel}>
      <View style={styles.panelHeader}>
        <ThemedText type="smallBold">{formatDayLong(day)}</ThemedText>
        <DayWeather day={day} />
      </View>

      {outfit ? (
        <View style={styles.planned}>
          <OutfitCollage outfit={outfit} style={styles.panelCollage} />
          <View style={styles.plannedInfo}>
            <ThemedText numberOfLines={2}>{outfit.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {outfit.itemIds.length} Artikel
            </ThemedText>
            <View style={styles.actions}>
              <SmallButton label="Ändern" onPress={plan} />
              <SmallButton label="Entfernen" onPress={() => unplanDay(day)} />
            </View>
          </View>
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          Für diesen Tag ist noch nichts geplant.
        </ThemedText>
      )}

      {outfit && isPastOrToday && (
        <Pressable
          disabled={entry.worn}
          onPress={() => markDayWorn(day)}
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: entry.worn ? theme.backgroundSelected : theme.primary },
            pressed && styles.pressed,
          ]}>
          <Icon ios="checkmark" md="check" size={18} color={entry.worn ? theme.text : theme.onPrimary} />
          <ThemedText type="small" style={{ color: entry.worn ? theme.text : theme.onPrimary }}>
            {entry.worn ? 'Getragen' : 'Als getragen markieren'}
          </ThemedText>
        </Pressable>
      )}

      {!outfit && (
        <Pressable
          onPress={plan}
          style={({ pressed }) => [styles.primary, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
          <Icon ios="plus" md="add" size={18} color={theme.onPrimary} />
          <ThemedText type="small" style={{ color: theme.onPrimary }}>
            Outfit planen
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

/** Forecast for the day, if it is within the next 7 days and a location is set. */
function DayWeather({ day }: { day: DayKey }) {
  const theme = useTheme();
  const { forecast } = useForecast();
  const f = forecast?.days.find((d) => d.date === day);
  if (!f) return null;
  const weather = describeWeather(f.code);
  return (
    <View style={styles.dayWeather} accessible accessibilityLabel={`${weather.label}, ${formatTemp(f.max)} bis ${formatTemp(f.min)}`}>
      <Icon ios={weather.icon.ios} md={weather.icon.md} size={18} color={theme.accent} />
      <ThemedText type="small" themeColor="textSecondary">
        {formatTemp(f.max)} / {formatTemp(f.min)}
      </ThemedText>
    </View>
  );
}

function SmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.small, { borderColor: theme.border }, pressed && styles.pressed]}>
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  monthTitle: {
    fontSize: 18,
    minWidth: 150,
    textAlign: 'center',
  },
  todayButton: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    aspectRatio: 0.8,
    padding: 2,
  },
  cellInner: {
    flex: 1,
    borderRadius: Spacing.two,
    alignItems: 'center',
    paddingTop: 2,
    overflow: 'hidden',
  },
  dayNumber: {
    fontSize: 13,
    lineHeight: 18,
  },
  cellThumb: {
    flex: 1,
    width: '90%',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: Spacing.one,
  },
  wornBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    marginTop: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  dayWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  planned: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  panelCollage: {
    width: 104,
  },
  plannedInfo: {
    flex: 1,
    gap: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 'auto',
  },
  small: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  primary: {
    height: 44,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
