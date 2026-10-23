/**
 * Sleep nights from the records: duration (and score) from log_metrics, bed and wake times from
 * lt_nights when they were given. A night is named after the morning you wake (Curio Cabinet's rule).
 */
import { addDays } from '../../domain/log/dates';
import { bedDelta, RULES, scheduleFor } from '../../domain/progress/engine';
import type { SleepSchedule } from '../../domain/prefs';
import type { LogDayMetric, LtNight } from '../../data/types';

export interface Night {
  date: string;
  minutes: number;
  bed: string | null;
  wake: string | null;
  score: number | null;
}

export const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
export const fromMin = (m: number) => {
  const v = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
};
/** Minutes asleep from bed to wake, across midnight. */
export const durationOf = (bed: string, wake: string) => {
  const d = toMin(wake) - toMin(bed);
  return d <= 0 ? d + 1440 : d;
};

export function nightsFrom(metrics: Iterable<LogDayMetric>, nights: Iterable<LtNight>): Night[] {
  const by = new Map<string, Night>();
  const get = (date: string) => by.get(date) ?? by.set(date, { date, minutes: 0, bed: null, wake: null, score: null }).get(date)!;
  for (const m of metrics) {
    if (m.deleted_at) continue;
    if (m.metric === 'sleep') get(m.date).minutes = m.minutes;
    if (m.metric === 'sleep_score') get(m.date).score = m.minutes;
  }
  for (const n of nights) {
    if (n.deleted_at || !by.has(n.date)) continue; // times without a duration are leftovers of a cleared night
    const x = by.get(n.date)!;
    x.bed = n.bed;
    x.wake = n.wake;
  }
  return [...by.values()].filter((n) => n.minutes > 0).sort((a, b) => a.date.localeCompare(b.date));
}

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
/** Minutes after noon, so bedtimes either side of midnight average correctly. */
const fromNoon = (t: string) => (toMin(t) + 720) % 1440;

export interface SleepStats {
  nights: number;
  avgMinutes: number | null;
  /** Average bedtime (HH:MM) over nights that have one. */
  avgBed: string | null;
  /** Standard deviation of bedtimes in minutes: lower is steadier. */
  spread: number | null;
  /** Nights within the bedtime window, out of nights with a bedtime. */
  inWindow: number;
  withBed: number;
  avgScore: number | null;
}

/** Statistics over the nights from `from` to `to` (wake dates, inclusive). */
export function sleepStats(all: Night[], from: string, to: string, schedule: SleepSchedule): SleepStats {
  const ns = all.filter((n) => n.date >= from && n.date <= to);
  const beds = ns.filter((n) => n.bed).map((n) => fromNoon(n.bed!));
  const mean = avg(beds);
  const spread = mean == null || beds.length < 2 ? null : Math.round(Math.sqrt(avg(beds.map((b) => (b - mean) ** 2))!));
  const scores = ns.filter((n) => n.score != null).map((n) => n.score!);
  return {
    nights: ns.length,
    avgMinutes: avg(ns.map((n) => n.minutes)),
    avgBed: mean == null ? null : fromMin(mean - 720),
    spread,
    inWindow: ns.filter((n) => n.bed && Math.abs(bedDelta({ date: n.date, bed: n.bed }, schedule)) <= RULES.bedtimeWindow).length,
    withBed: beds.length,
    avgScore: scores.length ? Math.round(avg(scores)!) : null,
  };
}

/** The window planned for the night before `date`. */
export const plannedFor = (date: string, s: SleepSchedule) => scheduleFor(date, s);

/** Wind-down time tonight: before the bedtime planned for the night that ends tomorrow morning. */
export const windDownAt = (today: string, s: SleepSchedule) => fromMin(toMin(scheduleFor(addDays(today, 1), s).bed) - s.windDown);
