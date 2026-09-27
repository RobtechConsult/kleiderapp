import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconProps } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWardrobe } from '@/store/wardrobe-store';
import { Categories, CategoryLabels, type Category } from '@/types/wardrobe';

const COLORS = ['#1C1C1E', '#FFFFFF', '#8E8E93', '#1F2A44', '#5B7FA6', '#2E8B57', '#A67B5B', '#E8DCC8', '#C0392B', '#F4A7B9'];

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

export default function AddItemScreen() {
  const theme = useTheme();
  const { addItem } = useWardrobe();
  const [imageUri, setImageUri] = useState<string>();
  const [category, setCategory] = useState<Category>('tops');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState<string>();

  async function takePhoto() {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Kamera', 'Bitte erlaube den Kamerazugriff in den Einstellungen.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await addItem({ category, brand: brand.trim() || undefined, imageUri, color, seasons: [] });
      router.back();
    } catch (e) {
      console.warn(e);
      Alert.alert('Speichern fehlgeschlagen', 'Das Foto konnte nicht gespeichert werden.');
      setSaving(false);
    }
  }

  const canSave = Boolean(imageUri || color) && !saving;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedView type="backgroundElement" style={styles.photo}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="contain" />
              <Pressable style={styles.retake} onPress={() => setImageUri(undefined)}>
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
