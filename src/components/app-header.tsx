import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from './icon';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

type AppHeaderProps = {
  title?: string;
  /** Replaces the title (e.g. a feed switcher). */
  left?: ReactNode;
  /** Shows a chevron next to the title (view switcher). */
  onTitlePress?: () => void;
  showCalendar?: boolean;
  /** Replaces the default calendar / bell / profile buttons. */
  right?: ReactNode;
};

/** Placeholder for features that are not built yet. */
export function comingSoon(feature: string) {
  // Alert.alert is a no-op on react-native-web.
  if (Platform.OS === 'web') window.alert(`${feature}: Kommt bald.`);
  else Alert.alert(feature, 'Kommt bald.');
}

export function AppHeader({ title, left, onTitlePress, showCalendar = true, right }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      {left ?? (
        <Pressable style={styles.title} onPress={onTitlePress} disabled={!onTitlePress}>
          <ThemedText type="subtitle" numberOfLines={1}>
            {title}
          </ThemedText>
          {onTitlePress && <Icon ios="chevron.down" md="keyboard_arrow_down" size={20} />}
        </Pressable>
      )}

      <View style={styles.actions}>
        {right ?? (
          <>
            {showCalendar && (
              <HeaderButton label="Kalender" onPress={() => comingSoon('Kalender')}>
                <Icon ios="calendar" md="calendar_today" />
              </HeaderButton>
            )}
            <HeaderButton label="Mitteilungen" onPress={() => comingSoon('Mitteilungen')}>
              <Icon ios="bell" md="notifications" />
            </HeaderButton>
            <HeaderButton label="Profil" onPress={() => router.push('/profile')}>
              <ThemedView type="backgroundElement" style={styles.avatar}>
                <Icon ios="person" md="person" size={20} />
              </ThemedView>
            </HeaderButton>
          </>
        )}
      </View>
    </View>
  );
}

export function HeaderButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
