import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing, type ThemeColor } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  /** Set to false when the screen manages its own scrolling. */
  scroll?: boolean;
  background?: ThemeColor;
  contentStyle?: ViewStyle;
};

/** Safe-area-aware page container used by all tab screens. */
export function Screen({ children, scroll = true, background, contentStyle }: ScreenProps) {
  return (
    <ThemedView type={background} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {scroll ? (
          <ScrollView contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView>
        ) : (
          <ThemedView type={background} style={[styles.content, styles.fill, contentStyle]}>
            {children}
          </ThemedView>
        )}
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
    gap: Spacing.four,
  },
  fill: {
    flex: 1,
  },
});
