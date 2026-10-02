import { useEffect, useState } from 'react';

import { fetchForecast, type Forecast } from '@/lib/weather';
import { useWardrobe } from '@/store/wardrobe-store';

type ForecastState = { forecast?: Forecast; error?: string; loading: boolean };

/** 7-day forecast for the saved weather location (undefined while no location is set). */
export function useForecast(): ForecastState {
  const { weatherLocation } = useWardrobe();
  const [state, setState] = useState<ForecastState>({ loading: false });
  const lat = weatherLocation?.latitude;
  const lon = weatherLocation?.longitude;

  useEffect(() => {
    if (lat === undefined || lon === undefined) return;
    let active = true;
    fetchForecast({ name: '', latitude: lat, longitude: lon })
      .then((forecast) => active && setState({ forecast, loading: false }))
      .catch(() => active && setState({ error: 'Wetter konnte nicht geladen werden.', loading: false }));
    return () => {
      active = false;
    };
  }, [lat, lon]);

  if (lat === undefined) return { loading: false };
  return state.forecast || state.error ? state : { loading: true };
}
