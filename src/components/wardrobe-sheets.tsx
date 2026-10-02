import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet } from './bottom-sheet';
import { Icon } from './icon';
import { PrimaryButton } from './primary-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { colorName } from '@/constants/garment-colors';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  applyItemView,
  brandsOf,
  colorsOf,
  NO_FILTERS,
  SortKeys,
  SortLabels,
  type ItemFilters,
  type SortKey,
} from '@/lib/item-filters';
import { SeasonLabels, Seasons, type Category, type ClothingItem } from '@/types/wardrobe';

export function SortSheet({
  visible,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  value: SortKey;
  onChange: (sort: SortKey) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <BottomSheet visible={visible} title="Sortieren" onClose={onClose}>
      <View>
        {SortKeys.map((key) => (
          <Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityState={{ checked: key === value }}
            onPress={() => {
              onChange(key);
              onClose();
            }}
            style={styles.option}>
            <ThemedText style={key === value && styles.bold}>{SortLabels[key]}</ThemedText>
            {key === value && <Icon ios="checkmark" md="check" color={theme.accent} />}
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

type FilterSheetProps = {
  visible: boolean;
  items: ClothingItem[];
  category: Category | 'all';
  sort: SortKey;
  value: ItemFilters;
  onApply: (filters: ItemFilters) => void;
  onClose: () => void;
};

/** Edits a draft of the filters; the button shows how many items the draft would leave. */
export function FilterSheet(props: FilterSheetProps) {
  // Remount on open so the draft starts from the applied filters.
  return props.visible ? <FilterSheetContent {...props} /> : null;
}

function FilterSheetContent({ visible, items, category, sort, value, onApply, onClose }: FilterSheetProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState(value);
  const colors = colorsOf(items);
  const brands = brandsOf(items);
  const count = applyItemView(items, { category, filters: draft, sort }).length;

  const toggleIn = <K extends 'colors' | 'seasons' | 'brands'>(key: K, entry: ItemFilters[K][number]) =>
    setDraft((d) => {
      const list = d[key] as string[];
      return { ...d, [key]: list.includes(entry) ? list.filter((x) => x !== entry) : [...list, entry] };
    });

  return (
    <BottomSheet
      visible={visible}
      title="Filter"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <Pressable onPress={() => setDraft(NO_FILTERS)} style={styles.reset}>
            <ThemedText type="small">Zurücksetzen</ThemedText>
          </Pressable>
          <View style={styles.grow}>
            <PrimaryButton
              label={count === 1 ? '1 Artikel anzeigen' : `${count} Artikel anzeigen`}
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            />
          </View>
        </View>
      }>
      <Section title="Allgemein">
        <View style={styles.chips}>
          <Chip label="Nur Favoriten" active={draft.favoritesOnly} onPress={() => setDraft((d) => ({ ...d, favoritesOnly: !d.favoritesOnly }))} />
          <Chip label="Nie getragen" active={draft.neverWorn} onPress={() => setDraft((d) => ({ ...d, neverWorn: !d.neverWorn }))} />
        </View>
      </Section>

      {colors.length > 0 && (
        <Section title="Farbe">
          <View style={styles.chips}>
            {colors.map((c) => {
              const active = draft.colors.includes(c);
              return (
                <Pressable
                  key={c}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={`Farbe ${colorName(c)}`}
                  onPress={() => toggleIn('colors', c)}
                  style={[
                    styles.swatch,
                    { backgroundColor: c, borderColor: active ? theme.accent : theme.border },
                    active && styles.swatchActive,
                  ]}
                />
              );
            })}
          </View>
        </Section>
      )}

      <Section title="Saison">
        <View style={styles.chips}>
          {Seasons.map((s) => (
            <Chip key={s} label={SeasonLabels[s]} active={draft.seasons.includes(s)} onPress={() => toggleIn('seasons', s)} />
          ))}
        </View>
      </Section>

      {brands.length > 0 && (
        <Section title="Marke">
          <View style={styles.chips}>
            {brands.map((b) => (
              <Chip key={b} label={b} active={draft.brands.includes(b)} onPress={() => toggleIn('brands', b)} />
            ))}
          </View>
        </Section>
      )}
    </BottomSheet>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: active }} onPress={onPress}>
      <ThemedView type={active ? 'primary' : 'backgroundElement'} style={styles.chip}>
        <ThemedText type="small" themeColor={active ? 'onPrimary' : 'text'}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  bold: {
    fontWeight: 700,
  },
  section: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  swatchActive: {
    borderWidth: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  reset: {
    paddingVertical: Spacing.two,
  },
  grow: {
    flex: 1,
  },
});
