import { Alert, Platform } from 'react-native';

// Alert.alert is a no-op on react-native-web, so fall back to the browser dialogs.

/** Placeholder for features that are not built yet. */
export function comingSoon(feature: string) {
  if (Platform.OS === 'web') window.alert(`${feature}: Kommt bald.`);
  else Alert.alert(feature, 'Kommt bald.');
}

/** Asks before a destructive action; resolves to true when confirmed. */
export function confirmDestructive(title: string, message: string, action = 'Löschen') {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise<boolean>((resolve) =>
    Alert.alert(title, message, [
      { text: 'Abbrechen', style: 'cancel', onPress: () => resolve(false) },
      { text: action, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

/** Shows a short message with an OK button. */
export function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
