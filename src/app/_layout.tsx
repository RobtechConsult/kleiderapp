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
          <Stack.Screen name="profile" options={{ title: 'Profil' }} />
        </Stack>
      </WardrobeProvider>
    </ThemeProvider>
  );
}
