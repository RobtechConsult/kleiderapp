import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconProps } from './icon';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { preloadBackgroundRemoval, removeBackground } from '@/lib/background-removal';
import type { SegmentFailure } from '@/lib/background-removal/segment';
import {
  Categories,
  CategoryLabels,
  SeasonLabels,
  Seasons,
  type Category,
  type ClothingItem,
  type Season,
} from '@/types/wardrobe';

const COLORS = ['#1C1C1E', '#FFFFFF', '#8E8E93', '#1F2A44', '#5B7FA6', '#2E8B57', '#A67B5B', '#E8DCC8', '#C0392B', '#F4A7B9'];

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

const REMOVAL_FAILED: Record<SegmentFailure | 'error', string> = {
  'busy-background': 'Der Hintergrund ist zu unruhig. Am besten klappt es auf einer einfarbigen Fläche.',
  'no-subject': 'Kein Kleidungsstück erkannt.',
  error: 'Freistellen hat nicht geklappt.',
};

export type ItemFormValues = Pick<
  ClothingItem,
  'category' | 'brand' | 'imageUri' | 'color' | 'seasons' | 'price' | 'link'
>;

type ItemFormProps = {
  initial?: ItemFormValues;
  /** Wish-list item: also asks for price and shop link. */
  wishlist?: boolean;
  /** Shows a "several photos at once" link while no photo is chosen. */
  onImportMany?: () => void;
  /** Persists the values; the form shows an error if it throws. */
  onSubmit: (values: ItemFormValues) => Promise<void>;
};

/** Photo, category, brand, color and seasons of a clothing item (used for adding and editing). */
export function ItemForm({ initial, wishlist, onImportMany, onSubmit }: ItemFormProps) {
  const theme = useTheme();
  // The picked photo, its background-free version, and which of the two gets saved.
  const [photo, setPhoto] = useState(initial?.imageUri);
  const [cutout, setCutout] = useState<string>();
  const [useCutout, setUseCutout] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removalError, setRemovalError] = useState<string>();
  const removalRun = useRef(0);
  const imageUri = useCutout && cutout ? cutout : photo;

  useEffect(() => preloadBackgroundRemoval(), []);
  const [category, setCategory] = useState<Category>(initial?.category ?? 'tops');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [price, setPrice] = useState(initial?.price !== undefined ? String(initial.price).replace('.', ',') : '');
  const [link, setLink] = useState(initial?.link ?? '');
  const [color, setColor] = useState(initial?.color);
  const [seasons, setSeasons] = useState<Season[]>(initial?.seasons ?? []);

  const toggleSeason = (season: Season) =>
    setSeasons((prev) => (prev.includes(season) ? prev.filter((x) => x !== season) : [...prev, season]));

  async function takePhoto() {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Kamera', 'Bitte erlaube den Kamerazugriff in den Einstellungen.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) choosePhoto(result.assets[0].uri);
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled) choosePhoto(result.assets[0].uri);
  }

  function choosePhoto(uri: string | undefined) {
    setPhoto(uri);
    setCutout(undefined);
    setUseCutout(false);
    setRemovalError(undefined);
    if (uri) runRemoval(uri);
    else removalRun.current++;
  }

  async function runRemoval(uri: string) {
    const run = ++removalRun.current; // a newer photo makes older results obsolete
    setRemoving(true);
    setRemovalError(undefined);
    try {
      const result = await removeBackground(uri);
      if (run !== removalRun.current) return;
      if (result.ok) {
        setCutout(result.uri);
        setUseCutout(true);
      } else {
        setRemovalError(REMOVAL_FAILED[result.reason]);
      }
    } catch (e) {
      console.warn(e);
      if (run === removalRun.current) setRemovalError(REMOVAL_FAILED.error);
    } finally {
      if (run === removalRun.current) setRemoving(false);
    }
  }

  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const parsedPrice = Number.parseFloat(price.replace(',', '.'));
      await onSubmit({
        category,
        brand: brand.trim() || undefined,
        imageUri,
        color,
        seasons,
        price: wishlist && Number.isFinite(parsedPrice) ? parsedPrice : undefined,
        link: wishlist ? link.trim() || undefined : undefined,
      });
    } catch (e) {
      console.warn(e);
      Alert.alert('Speichern fehlgeschlagen', 'Das Foto konnte nicht gespeichert werden.');
      setSaving(false);
    }
  }

  const canSave = Boolean(imageUri || color) && !saving && !removing;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedView type="backgroundElement" style={styles.photo}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="contain" />
              {removing && (
                <View style={styles.removing}>
                  <ActivityIndicator color="#fff" />
                  <ThemedText type="small" style={styles.removingText}>
                    Hintergrund wird entfernt …
                  </ThemedText>
                </View>
              )}
              <Pressable
                accessibilityLabel="Anderes Foto wählen"
                style={styles.retake}
                onPress={() => choosePhoto(undefined)}>
                <ThemedView style={styles.retakeInner}>
                  <Icon ios="arrow.counterclockwise" md="refresh" size={18} />
                </ThemedView>
              </Pressable>
            </>
          ) : (
            <View style={styles.photoActions}>
              {Platform.OS !== 'web' && (
                <PhotoButton label="Foto aufnehmen" icon={{ ios: 'camera', md: 'photo_camera' }} onPress={takePhoto} />
              )}
              <PhotoButton label="Aus Galerie wählen" icon={{ ios: 'photo.on.rectangle', md: 'photo_library' }} onPress={pickFromLibrary} />
            </View>
          )}
        </ThemedView>

        {!photo && onImportMany && (
          <Pressable onPress={onImportMany} style={styles.removeButton}>
            <Icon ios="photo.stack" md="photo_library" size={18} />
            <ThemedText type="small">Mehrere Fotos auf einmal importieren (bis zu 15)</ThemedText>
          </Pressable>
        )}

        {photo && !removing && (
          <View style={styles.cutoutRow}>
            {cutout ? (
              <View style={styles.chips}>
                {[
                  { label: 'Freigestellt', value: true },
                  { label: 'Original', value: false },
                ].map((option) => (
                  <Pressable key={option.label} onPress={() => setUseCutout(option.value)}>
                    <ThemedView
                      type={useCutout === option.value ? 'primary' : 'backgroundElement'}
                      style={styles.chip}>
                      <ThemedText type="small" themeColor={useCutout === option.value ? 'onPrimary' : 'text'}>
                        {option.label}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                ))}
              </View>
            ) : removalError ? (
              <ThemedText type="small" themeColor="textSecondary">
                {removalError} Das Originalfoto wird verwendet.
              </ThemedText>
            ) : (
              <Pressable onPress={() => runRemoval(photo)} style={styles.removeButton}>
                <Icon ios="wand.and.stars" md="auto_fix_high" size={18} />
                <ThemedText type="small">Hintergrund entfernen</ThemedText>
              </Pressable>
            )}
          </View>
        )}

        <Field label="Kategorie">
          <View style={styles.chips}>
            {Categories.map((c) => (
              <Pressable key={c} onPress={() => setCategory(c)}>
                <ThemedView type={category === c ? 'primary' : 'backgroundElement'} style={styles.chip}>
                  <ThemedText type="small" themeColor={category === c ? 'onPrimary' : 'text'}>
                    {CategoryLabels[c]}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Marke">
          <TextInput
            value={brand}
            onChangeText={setBrand}
            placeholder="z. B. COS, Zara, Uniqlo"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            returnKeyType="done"
          />
        </Field>

        {wishlist && (
          <>
            <Field label="Preis (€)">
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="z. B. 49,90"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </Field>
            <Field label="Link zum Shop">
              <TextInput
                value={link}
                onChangeText={setLink}
                placeholder="https://…"
                placeholderTextColor={theme.textSecondary}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </Field>
          </>
        )}

        <Field label="Farbe">
          <View style={styles.chips}>
            {COLORS.map((c) => (
              <Pressable
                key={c}
                accessibilityLabel={`Farbe ${c}`}
                onPress={() => setColor(color === c ? undefined : c)}
                style={[
                  styles.color,
                  { backgroundColor: c, borderColor: color === c ? theme.accent : theme.border },
                  color === c && styles.colorSelected,
                ]}
              />
            ))}
          </View>
        </Field>

        <Field label="Saison">
          <View style={styles.chips}>
            {Seasons.map((season) => {
              const active = seasons.includes(season);
              return (
                <Pressable key={season} onPress={() => toggleSeason(season)}>
                  <ThemedView type={active ? 'primary' : 'backgroundElement'} style={styles.chip}>
                    <ThemedText type="small" themeColor={active ? 'onPrimary' : 'text'}>
                      {SeasonLabels[season]}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              );
            })}
          </View>
        </Field>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable
          disabled={!canSave}
          onPress={save}
          style={({ pressed }) => [
            styles.save,
            { backgroundColor: theme.primary },
            (!canSave || pressed) && styles.dimmed,
          ]}>
          <ThemedText style={{ color: theme.onPrimary }}>{saving ? 'Speichert …' : 'Speichern'}</ThemedText>
        </Pressable>
        {!imageUri && !color && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Füge ein Foto hinzu oder wähle eine Farbe.
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function PhotoButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: Pick<IconProps, 'ios' | 'md'>;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.photoButton, pressed && styles.dimmed]}>
      <ThemedView style={styles.photoButtonCircle}>
        <Icon ios={icon.ios} md={icon.md} size={28} />
      </ThemedView>
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
    </View>
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
  photo: {
    aspectRatio: 1,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: Spacing.five,
  },
  photoButton: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  photoButtonCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removing: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  removingText: {
    color: '#fff',
  },
  cutoutRow: {
    marginTop: -Spacing.two,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
  },
  retake: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
  },
  retakeInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
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
  input: {
    height: 48,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  color: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  colorSelected: {
    borderWidth: 3,
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.one,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  save: {
    height: 52,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.5,
  },
  hint: {
    textAlign: 'center',
  },
});
