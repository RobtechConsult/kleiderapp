import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from './themed-view';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

/** Scrollable, safe-area-aware page container used by all tab screens. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    padding: Spacing.three,
    // The web tab bar floats above the content.
    paddingTop: Platform.OS === 'web' ? Spacing.six + Spacing.four : Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
});
