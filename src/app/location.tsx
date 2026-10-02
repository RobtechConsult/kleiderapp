import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentLocation } from '@/lib/current-location';
import { searchPlaces, type WeatherLocation } from '@/lib/weather';
import { useWardrobe } from '@/store/wardrobe-store';

type Place = WeatherLocation & { detail: string };

/** Chooses the place for the weather forecast. */
export default function LocationScreen() {
  const theme = useTheme();
  const { weatherLocation, setWeatherLocation } = useWardrobe();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string>();

  // Search as you type, but only after a short pause.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let active = true;
    const timer = setTimeout(() => {
      setSearching(true);
      searchPlaces(q)
        .then((r) => {
          if (!active) return;
          setResults(r);
          setError(r.length ? undefined : 'Kein Ort gefunden.');
        })
        .catch(() => active && setError('Suche nicht möglich – bist du online?'))
        .finally(() => active && setSearching(false));
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const choose = (place: WeatherLocation) => {
    setWeatherLocation({ name: place.name, latitude: place.latitude, longitude: place.longitude });
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  async function locateMe() {
    setLocating(true);
    setError(undefined);
    try {
      choose(await getCurrentLocation());
    } catch (e) {
      setError(
        e instanceof Error && e.message === 'permission-denied'
          ? 'Kein Zugriff auf den Standort. Erlaube ihn in den Einstellungen oder suche nach einem Ort.'
          : 'Standort konnte nicht ermittelt werden. Suche stattdessen nach einem Ort.',
      );
    } finally {
      setLocating(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {weatherLocation && (
          <ThemedView type="backgroundElement" style={styles.current}>
            <Icon ios="mappin.and.ellipse" md="location_on" color={theme.accent} />
            <View style={styles.grow}>
              <ThemedText type="small" themeColor="textSecondary">
                Aktuell gewählt
              </ThemedText>
              <ThemedText type="smallBold">{weatherLocation.name}</ThemedText>
            </View>
            <Pressable onPress={() => setWeatherLocation(undefined)} hitSlop={8}>
              <ThemedText type="small" style={{ color: theme.accent }}>
                Entfernen
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}

        <PrimaryButton
          label={locating ? 'Standort wird ermittelt …' : 'Aktuellen Standort verwenden'}
          icon={{ ios: 'location', md: 'my_location' }}
          disabled={locating}
          onPress={locateMe}
        />

        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          oder
        </ThemedText>

        <TextInput
          value={query}
          onChangeText={(q) => {
            setQuery(q);
            if (q.trim().length < 2) setResults([]);
          }}
          placeholder="Stadt suchen, z. B. Hamburg"
          placeholderTextColor={theme.textSecondary}
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />

        {searching && <ActivityIndicator />}
        {error && (
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
        )}

        {results.map((place) => (
          <Pressable
            key={`${place.latitude},${place.longitude}`}
            onPress={() => choose(place)}
            style={({ pressed }) => [styles.result, { borderBottomColor: theme.border }, pressed && styles.pressed]}>
            <ThemedText>{place.name}</ThemedText>
            {place.detail ? (
              <ThemedText type="small" themeColor="textSecondary">
                {place.detail}
              </ThemedText>
            ) : null}
          </Pressable>
        ))}

        <ThemedText type="small" themeColor="textSecondary" style={styles.credit}>
          Wetterdaten: Open-Meteo.com (CC BY 4.0)
        </ThemedText>
      </ScrollView>
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
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  grow: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  result: {
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.6,
  },
  credit: {
    marginTop: Spacing.four,
    textAlign: 'center',
  },
});
