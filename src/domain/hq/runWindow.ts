/**
 * The run window: the best time to run in the next day and a half, from a real forecast and your
 * calendar. Scored for feel (apparent temperature), rain, wind and light; anything clashing with a
 * timed event or your sleep is left out.
 */

export interface HourForecast {
  /** "YYYY-MM-DDTHH:00", local to the place. */
  time: string;
  feels: number;
  rain: number;
  wind: number;
  day: boolean;
}

export interface Busy {
  date: string;
  start: string;
  end: string | null;
}

export interface RunWindow {
  date: string;
  start: string;
  end: string;
  feels: number;
  rain: number;
  wind: number;
  score: number;
  why: string[];
}

interface OpenMeteo {
  hourly?: { time?: string[]; apparent_temperature?: number[]; precipitation_probability?: number[]; wind_speed_10m?: number[]; is_day?: number[] };
}

export function parseForecast(j: OpenMeteo): HourForecast[] {
  const h = j.hourly;
  if (!h?.time?.length) return [];
  return h.time.flatMap((time, i) => {
    const feels = h.apparent_temperature?.[i];
    if (typeof feels !== 'number') return [];
    return [{ time, feels, rain: h.precipitation_probability?.[i] ?? 0, wind: h.wind_speed_10m?.[i] ?? 0, day: h.is_day?.[i] === 1 }];
  });
}

const min = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);

/** Score out of 100 for one hour. */
export function hourScore(h: HourForecast): number {
  let s = 100;
  // Best around 8–14 °C feels-like; heat costs more than cold.
  if (h.feels > 14) s -= (h.feels - 14) * 3.2;
  if (h.feels < 8) s -= (8 - h.feels) * 1.8;
  s -= h.rain * 0.55;
  s -= Math.max(0, h.wind - 15) * 1.2;
  if (!h.day) s -= 8;
  return Math.max(0, Math.round(s));
}

/**
 * The best non-overlapping windows of `minutes` from now on, between waking and bedtime. `nowIso`
 * is the local time at the place. Busy times get a half-hour margin either side.
 */
export function runWindows(hours: HourForecast[], minutes: number, nowIso: string, busy: Busy[], awake: { from: string; to: string }, limit = 3): RunWindow[] {
  const len = Math.max(1, Math.ceil(minutes / 60));
  const fromMin = min(awake.from);
  const toMin = min(awake.to);
  const free = (date: string, startM: number) => {
    const endM = startM + minutes;
    if (startM < fromMin || endM > toMin) return false;
    return !busy.some((b) => b.date === date && startM < min(b.end ?? b.start) + 30 + (b.end ? 0 : 60) && endM > min(b.start) - 30);
  };
  const candidates: RunWindow[] = [];
  for (let i = 0; i + len <= hours.length; i++) {
    const first = hours[i];
    if (first.time < nowIso.slice(0, 13)) continue;
    const date = first.time.slice(0, 10);
    const hh = first.time.slice(11, 16);
    if (!free(date, min(hh))) continue;
    const slice = hours.slice(i, i + len);
    if (slice[slice.length - 1].time.slice(0, 10) !== date) continue;
    const score = Math.round(slice.reduce((n, h) => n + hourScore(h), 0) / slice.length);
    const feels = Math.round(slice.reduce((n, h) => n + h.feels, 0) / slice.length);
    const rain = Math.max(...slice.map((h) => h.rain));
    const wind = Math.round(Math.max(...slice.map((h) => h.wind)));
    const why: string[] = [`Feels like ${feels}°`];
    why.push(rain < 15 ? 'dry' : `${rain}% chance of rain`);
    if (wind > 20) why.push(`windy (${wind} km/h)`);
    if (!first.day) why.push('dark: wear something bright');
    const endM = min(hh) + minutes;
    candidates.push({ date, start: hh, end: `${String(Math.floor(endM / 60) % 24).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`, feels, rain, wind, score, why });
  }
  const picked: RunWindow[] = [];
  for (const c of candidates.sort((a, b) => b.score - a.score || (a.date + a.start).localeCompare(b.date + b.start))) {
    const clash = picked.some((p) => p.date === c.date && min(c.start) < min(p.end) + 60 && min(c.end) + 60 > min(p.start));
    if (!clash) picked.push(c);
    if (picked.length === limit) break;
  }
  return picked;
}
