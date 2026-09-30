/** Calendar days are stored as local "YYYY-MM-DD" keys (no time zone shifts). */
export type DayKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayKey = () => toDayKey(new Date());

export const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

/** Monday-first, like German calendars. */
export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WEEKDAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/** e.g. "Dienstag, 29. September" */
export function formatDayLong(key: DayKey): string {
  const d = fromDayKey(key);
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}

/** Weeks of the month as rows of 7 cells; days outside the month are null. */
export function monthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function addDays(key: DayKey, days: number): DayKey {
  const d = fromDayKey(key);
  d.setDate(d.getDate() + days);
  return toDayKey(d);
}

/** Whole days from a to b (b later → positive). */
export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((fromDayKey(b).getTime() - fromDayKey(a).getTime()) / 86_400_000);
}

/** e.g. "3.–7. Oktober 2026", "29. Sep. – 2. Okt. 2026" */
export function formatRange(start: DayKey, end: DayKey): string {
  const a = fromDayKey(start);
  const b = fromDayKey(end);
  if (start === end) return `${a.getDate()}. ${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()}.–${b.getDate()}. ${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
  }
  const short = (d: Date) => `${d.getDate()}. ${MONTHS[d.getMonth()].slice(0, 3)}.`;
  return `${short(a)} – ${short(b)} ${b.getFullYear()}`;
}
