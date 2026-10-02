/**
 * Weather from Open-Meteo (https://open-meteo.com): no API key, CORS-enabled, data CC BY 4.0.
 * Free for non-commercial use only – a commercial release needs an Open-Meteo API plan.
 */
import type { IconProps } from '@/components/icon';
import type { DayKey } from '@/lib/dates';

export type WeatherLocation = { name: string; latitude: number; longitude: number };

export type DayForecast = {
  date: DayKey;
  code: number;
  max: number;
  min: number;
  /** Highest precipitation probability of the day, in %. */
  rain: number;
};

export type Forecast = {
  current: { temperature: number; code: number };
  days: DayForecast[];
  fetchedAt: number;
};

type ForecastResponse = {
  current: { temperature_2m: number; weather_code: number };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
  };
};

type GeocodingResponse = {
  results?: { name: string; latitude: number; longitude: number; admin1?: string; country?: string }[];
};

const CACHE_MS = 30 * 60 * 1000;
const cache = new Map<string, Promise<Forecast>>();

export function fetchForecast({ latitude, longitude }: WeatherLocation): Promise<Forecast> {
  const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${latitude}&longitude=${longitude}` +
    '&current=temperature_2m,weather_code' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
    '&timezone=auto&forecast_days=7';

  const request = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`Weather request failed (${r.status})`);
      return r.json() as Promise<ForecastResponse>;
    })
    .then(({ current, daily }) => ({
      current: { temperature: current.temperature_2m, code: current.weather_code },
      days: daily.time.map((date, i) => ({
        date,
        code: daily.weather_code[i],
        max: daily.temperature_2m_max[i],
        min: daily.temperature_2m_min[i],
        rain: daily.precipitation_probability_max[i] ?? 0,
      })),
      fetchedAt: Date.now(),
    }));

  cache.set(key, request);
  request.catch(() => cache.delete(key));
  setTimeout(() => cache.delete(key), CACHE_MS);
  return request;
}

export async function searchPlaces(query: string): Promise<(WeatherLocation & { detail: string })[]> {
  const url =
    'https://geocoding-api.open-meteo.com/v1/search' +
    `?name=${encodeURIComponent(query)}&count=6&language=de&format=json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Place search failed (${r.status})`);
  const { results = [] } = (await r.json()) as GeocodingResponse;
  return results.map((p) => ({
    name: p.name,
    latitude: p.latitude,
    longitude: p.longitude,
    detail: [p.admin1, p.country].filter(Boolean).join(', '),
  }));
}

type WeatherKind = { label: string; icon: Pick<IconProps, 'ios' | 'md'> };

/** WMO weather interpretation codes (as used by Open-Meteo) → German label and icon. */
export function describeWeather(code: number): WeatherKind {
  if (code === 0) return { label: 'Sonnig', icon: { ios: 'sun.max', md: 'sunny' } };
  if (code <= 2) return { label: 'Leicht bewölkt', icon: { ios: 'cloud.sun', md: 'partly_cloudy_day' } };
  if (code === 3) return { label: 'Bewölkt', icon: { ios: 'cloud', md: 'cloud' } };
  if (code === 45 || code === 48) return { label: 'Nebel', icon: { ios: 'cloud.fog', md: 'foggy' } };
  if (code >= 51 && code <= 57) return { label: 'Nieselregen', icon: { ios: 'cloud.drizzle', md: 'rainy' } };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return { label: 'Regen', icon: { ios: 'cloud.rain', md: 'rainy' } };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { label: 'Schnee', icon: { ios: 'cloud.snow', md: 'weather_snowy' } };
  if (code >= 95) return { label: 'Gewitter', icon: { ios: 'cloud.bolt.rain', md: 'thunderstorm' } };
  return { label: 'Wechselhaft', icon: { ios: 'cloud.sun', md: 'partly_cloudy_day' } };
}

export const isWet = (code: number) => (code >= 51 && code <= 67) || (code >= 71 && code <= 86) || code >= 95;

export const formatTemp = (t: number) => `${Math.round(t)}°`;
