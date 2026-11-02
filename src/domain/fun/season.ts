/** What Home's sky is doing: worked out from the date and the hour, nothing stored. */

export type SkyKind = 'snow' | 'sakura' | 'leaf' | 'rain' | 'firefly' | 'maple' | 'firework' | 'star' | 'bat';
export type TimeOfDay = 'night' | 'dawn' | 'day' | 'dusk';

export interface Season {
  kind: SkyKind;
  kanji: string;
  label: string;
}

const SPECIAL: Record<string, Season> = {
  '01-01': { kind: 'firework', kanji: '正月', label: 'New Year' },
  '01-02': { kind: 'firework', kanji: '正月', label: 'New Year' },
  '01-03': { kind: 'firework', kanji: '正月', label: 'New Year' },
  '07-07': { kind: 'star', kanji: '七夕', label: 'Tanabata' },
  '10-31': { kind: 'bat', kanji: '百鬼', label: 'Halloween' },
  '12-24': { kind: 'snow', kanji: '聖夜', label: 'Christmas Eve' },
  '12-25': { kind: 'snow', kanji: '聖夜', label: 'Christmas' },
  '12-31': { kind: 'firework', kanji: '大晦', label: "New Year's Eve" },
};

const MONTHS: Season[] = [
  { kind: 'snow', kanji: '雪', label: 'Snow' }, // Jan
  { kind: 'snow', kanji: '雪', label: 'Snow' },
  { kind: 'sakura', kanji: '桜', label: 'Cherry blossom' },
  { kind: 'sakura', kanji: '桜', label: 'Cherry blossom' },
  { kind: 'leaf', kanji: '若葉', label: 'New leaves' },
  { kind: 'rain', kanji: '梅雨', label: 'Plum rains' },
  { kind: 'firefly', kanji: '蛍', label: 'Fireflies' },
  { kind: 'firefly', kanji: '蛍', label: 'Fireflies' },
  { kind: 'maple', kanji: '秋', label: 'Autumn' },
  { kind: 'maple', kanji: '紅葉', label: 'Autumn leaves' },
  { kind: 'maple', kanji: '紅葉', label: 'Autumn leaves' },
  { kind: 'snow', kanji: '雪', label: 'Snow' }, // Dec
];

export const seasonOf = (date: string): Season => SPECIAL[date.slice(5)] ?? MONTHS[Number(date.slice(5, 7)) - 1];

export function timeOfDay(hour: number): TimeOfDay {
  if (hour < 5 || hour >= 20) return 'night';
  if (hour < 8) return 'dawn';
  if (hour < 17) return 'day';
  return 'dusk';
}

export const TOD_LABEL: Record<TimeOfDay, string> = { night: '夜', dawn: '暁', day: '昼', dusk: '夕' };

/** The hour now in a time zone (0–23). */
export function hourIn(timeZone: string, at = new Date()): number {
  try {
    return Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(at));
  } catch {
    return at.getHours();
  }
}

export type DroneMood = 'asleep' | 'worried' | 'proud' | 'idle';

/** How the drone feels: asleep in the small hours, worried while the streak buffer is holding, proud once today's training is done. */
export function droneMood(o: { hour: number; streakHeld: boolean; dailyDone: boolean }): DroneMood {
  if (o.hour >= 23 || o.hour < 5) return 'asleep';
  if (o.streakHeld) return 'worried';
  if (o.dailyDone) return 'proud';
  return 'idle';
}
