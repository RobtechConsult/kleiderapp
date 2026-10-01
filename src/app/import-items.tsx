import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/bottom-sheet';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { preloadBackgroundRemoval, removeBackground } from '@/lib/background-removal';
import { useWardrobe } from '@/store/wardrobe-store';
import { Categories, CategoryLabels, type Category } from '@/types/wardrobe';

const MAX_IMPORT = 15;

type Draft = {
  key: string;
  original: string;
  cutout?: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  useCutout: boolean;
  category: Category;
};

/** Imports up to 15 gallery photos at once; each is freed from its background in turn. */
export default function ImportItemsScreen() {
  const theme = useTheme();
  const { addItem } = useWardrobe();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const working = useRef(false);

  useEffect(() => preloadBackgroundRemoval(), []);

  const update = (key: string, changes: Partial<Draft>) =>
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...changes } : d)));

  // Free one photo at a time so the UI stays responsive and progress is visible.
  useEffect(() => {
    const next = drafts.find((d) => d.status === 'pending');
    if (!next || working.current) return;
    working.current = true;
    update(next.key, { status: 'processing' });
    removeBackground(next.original)
      .then((r) => update(next.key, r.ok ? { status: 'done', cutout: r.uri, useCutout: true } : { status: 'failed' }))
      .catch((e) => {
        console.warn(e);
        update(next.key, { status: 'failed' });
      })
      .finally(() => {
        working.current = false;
        setDrafts((prev) => [...prev]); // re-run this effect for the next photo
      });
  }, [drafts]);

  async function pick() {
    const room = MAX_IMPORT - drafts.length;
    if (room <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: room,
      quality: 0.8,
    });
    if (result.canceled) return;
    const picked = result.assets.slice(0, room);
    if (result.assets.length > room) {
      const msg = `Es werden nur ${room} weitere Fotos übernommen (höchstens ${MAX_IMPORT} pro Import).`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Zu viele Fotos', msg);
    }
    const category = drafts.at(-1)?.category ?? 'tops';
    setDrafts((prev) => [
      ...prev,
      ...picked.map((a, i) => ({
        key: `${Date.now()}-${i}`,
        original: a.uri,
        status: 'pending' as const,
        useCutout: false,
        category,
      })),
    ]);
  }

  async function saveAll() {
    setSaving(0);
    try {
      for (const [i, d] of drafts.entries()) {
        setSaving(i + 1);
        await addItem({
          category: d.category,
          imageUri: d.useCutout && d.cutout ? d.cutout : d.original,
          seasons: [],
        });
      }
      router.back();
    } catch (e) {
      console.warn(e);
      Alert.alert('Speichern fehlgeschlagen', 'Nicht alle Fotos konnten gespeichert werden.');
      setSaving(null);
    }
  }

  const processing = drafts.some((d) => d.status === 'pending' || d.status === 'processing');
  const doneCount = drafts.filter((d) => d.status === 'done' || d.status === 'failed').length;
  const editingDraft = drafts.find((d) => d.key === editing);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {drafts.length === 0 ? (
          <View style={styles.empty}>
            <Icon ios="photo.stack" md="photo_library" size={48} color={theme.textSecondary} />
            <ThemedText themeColor="textSecondary" style={styles.center}>
              Wähle bis zu {MAX_IMPORT} Fotos aus deiner Galerie. Der Hintergrund wird automatisch entfernt.
            </ThemedText>
            <PrimaryButton label="Fotos auswählen" icon={{ ios: 'photo.on.rectangle', md: 'photo_library' }} onPress={pick} />
          </View>
        ) : (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              {processing
                ? `Hintergrund wird entfernt … ${doneCount}/${drafts.length}`
                : `${drafts.length} ${drafts.length === 1 ? 'Foto' : 'Fotos'} bereit`}
            </ThemedText>

            <View style={styles.section}>
              <ThemedText type="smallBold">Kategorie für alle</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {Categories.map((c) => {
                  const all = drafts.every((d) => d.category === c);
                  return (
                    <Pressable key={c} onPress={() => setDrafts((prev) => prev.map((d) => ({ ...d, category: c })))}>
                      <ThemedView type={all ? 'primary' : 'backgroundElement'} style={styles.chip}>
                        <ThemedText type="small" themeColor={all ? 'onPrimary' : 'text'}>
                          {CategoryLabels[c]}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.grid}>
              {drafts.map((d, i) => (
                <View key={d.key} style={styles.card}>
                  <ThemedView type="backgroundElement" style={styles.image}>
                    <Image
                      source={{ uri: d.useCutout && d.cutout ? d.cutout : d.original }}
                      style={StyleSheet.absoluteFill}
                      contentFit="contain"
                    />
                    {(d.status === 'pending' || d.status === 'processing') && (
                      <View style={styles.overlay}>
                        {d.status === 'processing' ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <ThemedText type="small" style={styles.overlayText}>
                            wartet …
                          </ThemedText>
                        )}
                      </View>
                    )}
                    <Pressable
                      accessibilityLabel={`Foto ${i + 1} entfernen`}
                      hitSlop={8}
                      onPress={() => setDrafts((prev) => prev.filter((x) => x.key !== d.key))}
                      style={styles.remove}>
                      <ThemedView style={styles.removeInner}>
                        <Icon ios="xmark" md="close" size={14} />
                      </ThemedView>
                    </Pressable>
                  </ThemedView>
                  <Pressable onPress={() => setEditing(d.key)} style={styles.categoryButton}>
                    <ThemedText type="small" numberOfLines={1} style={styles.grow}>
                      {CategoryLabels[d.category]}
                    </ThemedText>
                    <Icon ios="chevron.down" md="keyboard_arrow_down" size={16} />
                  </Pressable>
                  {d.status === 'done' && (
                    <Pressable onPress={() => update(d.key, { useCutout: !d.useCutout })}>
                      <ThemedText type="small" style={{ color: theme.accent }}>
                        {d.useCutout ? 'Original verwenden' : 'Freigestellt verwenden'}
                      </ThemedText>
                    </Pressable>
                  )}
                  {d.status === 'failed' && (
                    <ThemedText type="small" themeColor="textSecondary">
                      Kein Freistellen möglich
                    </ThemedText>
                  )}
                </View>
              ))}
              {drafts.length < MAX_IMPORT && (
                <Pressable onPress={pick} style={styles.card}>
                  <ThemedView type="backgroundElement" style={[styles.image, styles.addMore, { borderColor: theme.border }]}>
                    <Icon ios="plus" md="add" size={28} color={theme.textSecondary} />
                    <ThemedText type="small" themeColor="textSecondary">
                      Weitere Fotos
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {drafts.length > 0 && (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <PrimaryButton
            label={
              saving !== null
                ? `Speichert … ${saving}/${drafts.length}`
                : processing
                  ? 'Bitte warten …'
                  : `${drafts.length} ${drafts.length === 1 ? 'Artikel' : 'Artikel'} speichern`
            }
            disabled={processing || saving !== null}
            onPress={saveAll}
          />
        </SafeAreaView>
      )}

      <BottomSheet visible={editingDraft !== undefined} title="Kategorie" onClose={() => setEditing(null)}>
        <View>
          {Categories.map((c) => (
            <Pressable
              key={c}
              onPress={() => {
                if (editingDraft) update(editingDraft.key, { category: c });
                setEditing(null);
              }}
              style={styles.option}>
              <ThemedText style={editingDraft?.category === c && styles.bold}>{CategoryLabels[c]}</ThemedText>
              {editingDraft?.category === c && <Icon ios="checkmark" md="check" color={theme.accent} />}
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.six,
  },
  center: {
    textAlign: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  chips: {
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
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
  image: {
    aspectRatio: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    color: '#fff',
  },
  remove: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
  },
  removeInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  grow: {
    flex: 1,
  },
  addMore: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  bold: {
    fontWeight: 700,
  },
});
