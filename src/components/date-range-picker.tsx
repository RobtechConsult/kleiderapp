import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from './icon';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fromDayKey, MONTHS, monthGrid, toDayKey, todayKey, WEEKDAYS_SHORT, type DayKey } from '@/lib/dates';

type DateRangePickerProps = {
  start: DayKey;
  /** Undefined while the user is picking the end day. */
  end?: DayKey;
  onChange: (start: DayKey, end?: DayKey) => void;
};

/** Month grid: first tap sets the start, second tap the end (tapping before the start restarts). */
export function DateRangePicker({ start, end, onChange }: DateRangePickerProps) {
  const theme = useTheme();
  const today = todayKey();
  const [month, setMonth] = useState(() => {
    const d = fromDayKey(start);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const shiftMonth = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const d = new Date(year, m + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const tap = (day: DayKey) => {
    if (end !== undefined || day < start) onChange(day, undefined);
    else onChange(start, day);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Vorheriger Monat" hitSlop={8} onPress={() => shiftMonth(-1)}>
          <Icon ios="chevron.left" md="chevron_left" />
        </Pressable>
        <ThemedText type="smallBold" style={styles.title}>
          {MONTHS[month.month]} {month.year}
        </ThemedText>
        <Pressable accessibilityLabel="Nächster Monat" hitSlop={8} onPress={() => shiftMonth(1)}>
          <Icon ios="chevron.right" md="chevron_right" />
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
          {week.map((date, j) => {
            if (!date) return <View key={j} style={styles.cell} />;
            const day = toDayKey(date);
            const isEdge = day === start || day === end;
            const inRange = end !== undefined && day > start && day < end;
            return (
              <Pressable
                key={j}
                accessibilityLabel={`${date.getDate()}. ${MONTHS[date.getMonth()]}`}
                accessibilityState={{ selected: isEdge || inRange }}
                onPress={() => tap(day)}
                style={[styles.cell, inRange && { backgroundColor: theme.backgroundSelected }]}>
                <View style={[styles.dayCircle, isEdge && { backgroundColor: theme.primary }]}>
                  <ThemedText
                    type="small"
                    style={[
                      isEdge && { color: theme.onPrimary },
                      !isEdge && day === today && { color: theme.accent, fontWeight: 700 },
                    ]}>
                    {date.getDate()}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 16,
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
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
