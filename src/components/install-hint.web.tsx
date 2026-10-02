import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from './icon';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const DISMISSED_KEY = 'kleiderapp.installHintDismissed';

/** iPhone/iPad browsers (all use WebKit) delete website data after 7 days without a visit. */
function isIosBrowser() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function isInstalled() {
  return (
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches
  );
}

function wasDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

/** Explains how to add the web app to the iPhone home screen, so Safari keeps its data. */
export function InstallHint({ dismissible = false }: { dismissible?: boolean }) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(() => !isIosBrowser() || isInstalled() || (dismissible && wasDismissed()));
  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, '1');
    } catch {}
  };

  return (
    <ThemedView type="tint" style={styles.card}>
      <Icon ios="square.and.arrow.up" md="ios_share" size={22} color={theme.accent} />
      <View style={styles.text}>
        <ThemedText type="smallBold">Zum Home-Bildschirm hinzufügen</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Tippe unten auf „Teilen“ und dann auf „Zum Home-Bildschirm“. So bleibt dein Kleiderschrank
          dauerhaft gespeichert – im Browser löscht das iPhone Website-Daten nach 7 Tagen ohne Besuch.
        </ThemedText>
      </View>
      {dismissible && (
        <Pressable onPress={dismiss} hitSlop={8} accessibilityLabel="Hinweis ausblenden">
          <Icon ios="xmark" md="close" size={18} color={theme.textSecondary} />
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  text: {
    flex: 1,
    gap: Spacing.one,
  },
});
