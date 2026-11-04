/**
 * Special moments: the long comic scenes for the shape of a day (waking up, going to bed) and of
 * the calendar (a new week, month, season or year), plus a few events (the day's checklist done,
 * a stormy mood, closing the day, sealing the weekly review). Pure: the app decides when to ask,
 * this decides what plays. Nothing here is stored in the database.
 */
import type { SleepSchedule } from '../prefs';
import { addDays, weekStart } from '../log/dates';

export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';

export type Special =
  | { type: 'morning'; date: string; wake: string; todo: number }
  | { type: 'night'; bed: string; wake: string; hours: number }
  | { type: 'new-week'; boss: string; bossId?: string; lastWeekMinutes: number }
  | { type: 'new-month'; month: number; year: number; lastMonthMinutes: number }
  | { type: 'new-season'; season: SeasonId; year: number }
  | { type: 'new-year'; year: number; lastYearHours: number }
  | { type: 'day-complete'; items: number; minutes: number }
  | { type: 'storm'; notes: number }
  | { type: 'close-day'; first: string; bed: string }
  | { type: 'war-council'; theme: string; big: string[] };

export type SpecialType = Special['type'];

export const SPECIAL_TYPES: SpecialType[] = ['morning', 'night', 'new-week', 'new-month', 'new-season', 'new-year', 'day-complete', 'storm', 'close-day', 'war-council'];

/** Meteorological seasons (northern hemisphere): winter is December to February. */
export function seasonId(date: string): SeasonId {
  const m = Number(date.slice(5, 7));
  return m <= 2 || m === 12 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn';
}

export const SEASON_INFO: Record<SeasonId, { kanji: string; name: string; c: string }> = {
  spring: { kanji: '春', name: 'Spring', c: '#ff9fc4' },
  summer: { kanji: '夏', name: 'Summer', c: '#36c3ff' },
  autumn: { kanji: '秋', name: 'Autumn', c: '#ff7a2f' },
  winter: { kanji: '冬', name: 'Winter', c: '#bfe3ff' },
};

const toMin = (hhmm: string) => +hhmm.slice(0, 2) * 60 + +hhmm.slice(3, 5);
/** Minutes after noon, so an evening and the small hours after it compare in order. */
const fromNoon = (min: number) => (min - 720 + 1440) % 1440;

/** The night a moment belongs to: before 04:00 it's still the night that started yesterday. */
export const nightOf = (date: string, hour: number) => (hour < 4 ? addDays(date, -1) : date);

/** Bed and wake for the night starting on `night` (the schedule is keyed by the morning after). */
export function nightPlan(night: string, s: SleepSchedule): { bed: string; wake: string; hours: number } {
  const morning = addDays(night, 1);
  const plan = new Date(`${morning}T00:00:00Z`).getUTCDay() % 6 === 0 ? s.weekend : s.weekday;
  const mins = (toMin(plan.wake) - toMin(plan.bed) + 1440) % 1440;
  return { bed: plan.bed, wake: plan.wake, hours: Math.round((mins / 60) * 10) / 10 };
}

/** From the wind-down before bed until 04:00. */
export function isBedtime(hour: number, minute: number, night: string, s: SleepSchedule): boolean {
  const now = fromNoon(hour * 60 + minute);
  const start = fromNoon(toMin(nightPlan(night, s).bed) - s.windDown);
  return now >= start && now < fromNoon(4 * 60);
}

/** What this device has already seen (kept on the device; a per-viewer convenience). */
export interface Seen {
  /** The last day the app was opened. */
  lastDate: string | null;
  /** The last night the good-night scene played. */
  night: string | null;
}

/**
 * Which scenes to play as the app opens (or comes back to the front). At most two, so opening the
 * app never turns into a film: the time-of-day one first, then the biggest calendar one.
 */
export function onOpen(now: { date: string; hour: number; minute: number }, seen: Seen, s: SleepSchedule): SpecialType[] {
  const out: SpecialType[] = [];
  // A device's very first visit only starts the record: nothing plays out of nowhere.
  if (!seen.lastDate) return out;
  const night = nightOf(now.date, now.hour);
  const firstToday = seen.lastDate !== now.date;
  if (isBedtime(now.hour, now.minute, night, s)) {
    if (seen.night !== night) out.push('night');
  } else if (firstToday && now.hour >= 4 && now.hour < 14) out.push('morning');
  // Calendar scenes compare with the last visit, on a new day only.
  if (firstToday && seen.lastDate < now.date) {
    const last = seen.lastDate;
    if (now.date.slice(0, 4) !== last.slice(0, 4)) out.push('new-year');
    else if (now.date.slice(0, 7) !== last.slice(0, 7)) out.push(seasonId(now.date) !== seasonId(last) ? 'new-season' : 'new-month');
    else if (weekStart(now.date) !== weekStart(last)) out.push('new-week');
  }
  return out.slice(0, 2);
}
