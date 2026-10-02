import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { WardrobeProvider } from '@/store/wardrobe-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WardrobeProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-item"
            options={{ title: 'Artikel hinzufügen', presentation: 'modal' }}
          />
          <Stack.Screen
            name="create-outfit"
            options={{ title: 'Outfit erstellen', presentation: 'modal' }}
          />
          <Stack.Screen name="item/[id]/index" options={{ title: '' }} />
          <Stack.Screen
            name="item/[id]/edit"
            options={{ title: 'Artikel bearbeiten', presentation: 'modal' }}
          />
          <Stack.Screen name="calendar" options={{ title: 'Kalender' }} />
          <Stack.Screen name="plan-outfit" options={{ title: 'Outfit planen', presentation: 'modal' }} />
          <Stack.Screen name="trip/new" options={{ title: 'Neue Packliste', presentation: 'modal' }} />
          <Stack.Screen name="trip/[id]/index" options={{ title: '' }} />
          <Stack.Screen name="trip/[id]/items" options={{ title: 'Artikel wählen', presentation: 'modal' }} />
          <Stack.Screen name="import-items" options={{ title: 'Artikel importieren', presentation: 'modal' }} />
          <Stack.Screen name="wishlist" options={{ title: 'Wunschliste' }} />
          <Stack.Screen name="stats" options={{ title: 'Stil-Statistiken' }} />
          <Stack.Screen name="location" options={{ title: 'Standort für Wetter', presentation: 'modal' }} />
          <Stack.Screen name="profile" options={{ title: 'Profil' }} />
        </Stack>
      </WardrobeProvider>
    </ThemeProvider>
  );
}
