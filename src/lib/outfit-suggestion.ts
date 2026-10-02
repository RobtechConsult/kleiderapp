import type { DayForecast } from '@/lib/weather';
import { isWet } from '@/lib/weather';
import type { Category, ClothingItem, Season } from '@/types/wardrobe';

export type Suggestion = {
  /** e.g. "Jackenwetter" */
  title: string;
  /** Weather advice, e.g. about rain. */
  hint?: string;
  itemIds: string[];
  /** Categories that would complete the look but are missing in the wardrobe. */
  missing: Category[];
};

/** Daytime temperature the outfit should be made for (closer to the maximum than the minimum). */
export const dayTemperature = (day: DayForecast) => (2 * day.max + day.min) / 3;

/** Seasons whose clothes fit a temperature; items without seasons always fit. */
export function seasonsFor(temperature: number, month: number): Season[] {
  const transition: Season = month >= 2 && month <= 7 ? 'spring' : 'autumn';
  if (temperature < 5) return ['winter'];
  if (temperature < 12) return ['winter', transition];
  if (temperature < 18) return ['spring', 'autumn'];
  if (temperature < 23) return [transition, 'summer'];
  return ['summer'];
}

function titleFor(temperature: number) {
  if (temperature < 5) return 'Warm einpacken';
  if (temperature < 12) return 'Jackenwetter';
  if (temperature < 18) return 'Übergangs-Look';
  if (temperature < 23) return 'Leichter Lagen-Look';
  return 'Sommer-Look';
}

/**
 * Builds a look for the day's weather from the wardrobe: top + bottoms (or a dress when it's
 * warm), a jacket when it's cool or wet, shoes and a bag. Within each category it prefers
 * pieces that haven't been worn for a while; `variant` steps through alternatives ("Neu mischen").
 */
export function suggestOutfit(items: ClothingItem[], day: DayForecast, variant = 0): Suggestion {
  const temperature = dayTemperature(day);
  const month = new Date(`${day.date}T12:00:00`).getMonth();
  const seasons = seasonsFor(temperature, month);
  const wet = isWet(day.code) || day.rain >= 50;
  const snow = (day.code >= 71 && day.code <= 77) || day.code === 85 || day.code === 86;

  const fits = (i: ClothingItem) => i.seasons.length === 0 || i.seasons.some((s) => seasons.includes(s));
  const pick = (category: Category, offset = 0) => {
    const inCategory = items.filter((i) => i.category === category);
    const fitting = inCategory.filter(fits);
    const pool = (fitting.length ? fitting : inCategory).sort(
      // Least recently worn first; never-worn pieces count as long ago.
      (a, b) => (a.lastWornAt ?? '').localeCompare(b.lastWornAt ?? ''),
    );
    if (!pool.length) return undefined;
    // Alternate among the three freshest candidates, so suggestions stay sensible.
    return pool[(variant + offset) % Math.min(3, pool.length)];
  };

  const missing: Category[] = [];
  const chosen: ClothingItem[] = [];
  const add = (category: Category, offset = 0) => {
    const item = pick(category, offset);
    if (item) chosen.push(item);
    else missing.push(category);
  };

  const dresses = items.filter((i) => i.category === 'dresses' && fits(i));
  if (temperature >= 15 && dresses.length && variant % 2 === 1) {
    add('dresses');
  } else {
    add('tops');
    add('bottoms', 1);
  }
  if (temperature < 18 || wet) add('outerwear');
  add('shoes', 2);
  const bag = pick('bags');
  if (bag) chosen.push(bag);

  const hint = snow
    ? `Schnee möglich – warme, feste Schuhe.`
    : wet
      ? `Regen möglich (${Math.round(day.rain)} %) – Jacke und Schirm einpacken.`
      : temperature >= 25
        ? 'Heiß – luftige Stoffe und Sonnenschutz.'
        : undefined;

  return { title: titleFor(temperature), hint, itemIds: chosen.map((i) => i.id), missing };
}
