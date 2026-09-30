import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon, type IconProps } from '@/components/icon';
import { ItemImage } from '@/components/item-tile';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { packingProgress, ProgressBar } from '@/components/trip-card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysBetween, formatRange } from '@/lib/dates';
import { confirmDestructive } from '@/lib/dialogs';
import { useWardrobe } from '@/store/wardrobe-store';
import { Categories, CategoryLabels, type ClothingItem } from '@/types/wardrobe';

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export default function TripScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trips, items, updateTrip, removeTrip, togglePacked, itemsPlannedBetween } = useWardrobe();
  const [extraLabel, setExtraLabel] = useState('');
  const trip = trips.find((t) => t.id === id);

  if (!trip) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <Stack.Screen options={{ title: '' }} />
        <ThemedText themeColor="textSecondary">Packliste nicht gefunden.</ThemedText>
      </ThemedView>
    );
  }

  const { total, packed } = packingProgress(trip);
  const tripItems = items.filter((i) => trip.itemIds.includes(i.id));
  const fromCalendar = itemsPlannedBetween(trip.startDate, trip.endDate).filter((i) => !trip.itemIds.includes(i));

  function addExtra() {
    if (!trip) return;
    const label = extraLabel.trim();
    if (!label) return;
    updateTrip(trip.id, { extras: [...trip.extras, { id: newId(), label, packed: false }] });
    setExtraLabel('');
  }

  async function askDelete() {
    if (!trip) return;
    if (await confirmDestructive('Packliste löschen?', `„${trip.name}“ wird entfernt.`)) {
      if (router.canGoBack()) router.back();
      else router.replace('/outfits');
      removeTrip(trip.id);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: trip.name }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summary}>
          <ThemedText type="small" themeColor="textSecondary">
            {formatRange(trip.startDate, trip.endDate)} · {daysBetween(trip.startDate, trip.endDate) + 1} Tage
          </ThemedText>
          <ProgressBar value={total ? packed / total : 0} />
          <ThemedText type="smallBold">
            {total === 0 ? 'Noch nichts auf der Liste' : packed === total ? 'Alles gepackt 🎉' : `${packed} von ${total} gepackt`}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <ActionButton
            label="Artikel wählen"
            icon={{ ios: 'tshirt', md: 'checkroom' }}
            onPress={() => router.push({ pathname: '/trip/[id]/items', params: { id: trip.id } })}
          />
          {fromCalendar.length > 0 && (
            <ActionButton
              label={`Aus Kalender (+${fromCalendar.length})`}
              icon={{ ios: 'calendar', md: 'calendar_today' }}
              onPress={() => updateTrip(trip.id, { itemIds: [...trip.itemIds, ...fromCalendar] })}
            />
          )}
        </View>

        {Categories.map((category) => {
          const inCategory = tripItems.filter((i) => i.category === category);
          if (inCategory.length === 0) return null;
          return (
            <View key={category} style={styles.section}>
              <ThemedText type="smallBold">{CategoryLabels[category]}</ThemedText>
              {inCategory.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  packed={trip.packedItemIds.includes(item.id)}
                  onToggle={() => togglePacked(trip.id, item.id)}
                  onRemove={() => updateTrip(trip.id, { itemIds: trip.itemIds.filter((i) => i !== item.id) })}
                />
              ))}
            </View>
          );
        })}

        <View style={styles.section}>
          <ThemedText type="smallBold">Sonstiges</ThemedText>
          {trip.extras.map((extra) => (
            <View key={extra.id} style={styles.row}>
              <Checkbox checked={extra.packed} label={extra.label} onPress={() => togglePacked(trip.id, extra.id)} />
              <ThemedText
                style={[styles.grow, extra.packed && styles.done]}
                themeColor={extra.packed ? 'textSecondary' : 'text'}>
                {extra.label}
              </ThemedText>
              <RemoveButton
                label={`${extra.label} entfernen`}
                onPress={() => updateTrip(trip.id, { extras: trip.extras.filter((e) => e.id !== extra.id) })}
              />
            </View>
          ))}
          <View style={styles.row}>
            <TextInput
              value={extraLabel}
              onChangeText={setExtraLabel}
              onSubmitEditing={addExtra}
              placeholder="z. B. Ladekabel, Zahnbürste"
              placeholderTextColor={theme.textSecondary}
              returnKeyType="done"
              submitBehavior="submit"
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            <Pressable
              accessibilityLabel="Eintrag hinzufügen"
              disabled={!extraLabel.trim()}
              onPress={addExtra}
              style={[styles.addButton, { backgroundColor: theme.primary }, !extraLabel.trim() && styles.dimmed]}>
              <Icon ios="plus" md="add" size={20} color={theme.onPrimary} />
            </Pressable>
          </View>
        </View>

        <Pressable onPress={askDelete} style={styles.delete}>
          <Icon ios="trash" md="delete" color="#D70015" size={18} />
          <ThemedText type="small" style={styles.deleteText}>
            Packliste löschen
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function ItemRow({
  item,
  packed,
  onToggle,
  onRemove,
}: {
  item: ClothingItem;
  packed: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const label = item.brand || CategoryLabels[item.category];
  return (
    <Pressable onPress={onToggle} style={styles.row}>
      <Checkbox checked={packed} label={label} onPress={onToggle} />
      <ThemedView type="backgroundElement" style={[styles.thumb, packed && styles.faded]}>
        <ItemImage item={item} style={styles.thumbImage} />
      </ThemedView>
      <ThemedText style={[styles.grow, packed && styles.done]} themeColor={packed ? 'textSecondary' : 'text'} numberOfLines={1}>
        {label}
      </ThemedText>
      <RemoveButton label={`${label} von der Liste nehmen`} onPress={onRemove} />
    </Pressable>
  );
}

function Checkbox({ checked, label, onPress }: { checked: boolean; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={[
        styles.checkbox,
        { borderColor: checked ? theme.accent : theme.border },
        checked && { backgroundColor: theme.accent },
      ]}>
      {checked && <Icon ios="checkmark" md="check" size={14} color="#fff" />}
    </Pressable>
  );
}

function RemoveButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} hitSlop={8}>
      <Icon ios="xmark" md="close" size={16} color={theme.textSecondary} />
    </Pressable>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: Pick<IconProps, 'ios' | 'md'>;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, { borderColor: theme.border }, pressed && styles.dimmed]}>
      <Icon ios={icon.ios} md={icon.md} size={18} />
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  summary: {
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 44,
  },
  grow: {
    flex: 1,
  },
  done: {
    textDecorationLine: 'line-through',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  thumbImage: {
    flex: 1,
  },
  faded: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.5,
  },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.one,
    padding: Spacing.two,
  },
  deleteText: {
    color: '#D70015',
  },
});
