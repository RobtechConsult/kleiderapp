import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from './icon';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useWardrobe } from '@/store/wardrobe-store';

/** Warning at the bottom of every screen while changes can't be saved. */
export function StorageBanner() {
  const { saveError } = useWardrobe();
  const insets = useSafeAreaInsets();
  if (!saveError) return null;

  return (
    <View accessibilityRole="alert" style={[styles.banner, { paddingBottom: Spacing.two + insets.bottom }]}>
      <Icon ios="exclamationmark.triangle.fill" md="warning" size={20} color="#fff" />
      <ThemedText type="small" style={styles.text}>
        {saveError}
      </ThemedText>
      <Pressable onPress={() => router.push('/profile')} hitSlop={8}>
        <ThemedText type="smallBold" style={styles.link}>
          Profil
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    backgroundColor: '#B42318',
  },
  text: {
    flex: 1,
    color: '#fff',
  },
  link: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
});
