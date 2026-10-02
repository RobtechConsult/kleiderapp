import * as Location from 'expo-location';
import { Platform } from 'react-native';

import type { WeatherLocation } from '@/lib/weather';

/** Asks for permission and returns the device position, named after the city where possible. */
export async function getCurrentLocation(): Promise<WeatherLocation> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) throw new Error('permission-denied');
  const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

  let name = 'Aktueller Standort';
  // Reverse geocoding needs a Google API key on the web, so only try it natively.
  if (Platform.OS !== 'web') {
    try {
      const [place] = await Location.reverseGeocodeAsync(coords);
      name = place?.city ?? place?.subregion ?? place?.region ?? name;
    } catch {
      // keep the generic name
    }
  }
  return { name, latitude: coords.latitude, longitude: coords.longitude };
}
