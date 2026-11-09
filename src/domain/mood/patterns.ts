/**
 * Mood patterns from the daily check-in (the Hideout's inner weather, plus energy, stress and tags).
 * Pure functions; tested in mood.test.ts. Patterns, never cause and effect.
 */
import type { CheckIn } from '../hq/checkin';
import { addDays, daysBetween, weekdayIndex } from '../log/dates';

const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
const vals = (list: CheckIn[], k: 'mood' | 'energy' | 'stress') => list.map((c) => c[k]).filter((v): v is number => v != null);

export interface Averages {
  mood: number | null;
  energy: number | null;
  stress: number | null;
  n: number;
}

/** Averages over check-ins from `from` to `to`, inclusive. */
export function averages(list: CheckIn[], from: string, to: string): Averages {
  const in_ = list.filter((c) => c.date >= from && c.date <= to);
  return { mood: mean(vals(in_, 'mood')), energy: mean(vals(in_, 'energy')), stress: mean(vals(in_, 'stress')), n: in_.length };
}

/** The last seven days against the seven before. */
export function weekOnWeek(list: CheckIn[], today: string): { now: Averages; before: Averages } {
  return { now: averages(list, addDays(today, -6), today), before: averages(list, addDays(today, -13), addDays(today, -7)) };
}

/** Days in a row with a check-in, ending today (or yesterday, if today isn't done yet). */
export function checkInStreak(list: CheckIn[], today: string): number {
  const days = new Set(list.map((c) => c.date));
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export interface DayPoint {
  date: string;
  mood: number | null;
  energy: number | null;
  stress: number | null;
}
/** One point per day for the last `days` days, gaps as nulls. */
export function series(list: CheckIn[], today: string, days = 30): DayPoint[] {
  const by = new Map(list.map((c) => [c.date, c]));
  return daysBetween(addDays(today, -(days - 1)), today).map((date) => {
    const c = by.get(date);
    return { date, mood: c?.mood ?? null, energy: c?.energy ?? null, stress: c?.stress ?? null };
  });
}

export interface TagEffect {
  tag: string;
  n: number;
  mood: number;
  moodWithout: number;
  stress: number | null;
  stressWithout: number | null;
}
/** For each tag on at least `minDays` days: the average weather and stress with it and without it. */
export function tagEffects(list: CheckIn[], minDays = 3): TagEffect[] {
  const tags = new Set(list.flatMap((c) => c.tags ?? []));
  const out: TagEffect[] = [];
  for (const tag of tags) {
    const on = list.filter((c) => c.tags?.includes(tag));
    const off = list.filter((c) => !c.tags?.includes(tag));
    if (on.length < minDays || off.length < minDays) continue;
    out.push({ tag, n: on.length, mood: mean(vals(on, 'mood'))!, moodWithout: mean(vals(off, 'mood'))!, stress: mean(vals(on, 'stress')), stressWithout: mean(vals(off, 'stress')) });
  }
  return out.sort((a, b) => Math.abs(b.mood - b.moodWithout) - Math.abs(a.mood - a.moodWithout));
}

/** A day's overall score: weather counts double, energy helps and stress hurts. */
export const dayScore = (c: CheckIn) => c.mood * 2 + (c.energy ?? 3) - (c.stress ?? 3);

/** The best and hardest days, newest first among equals. */
export function bestAndHard(list: CheckIn[], n = 3): { best: CheckIn[]; hard: CheckIn[] } {
  const by = [...list].sort((a, b) => dayScore(b) - dayScore(a) || b.date.localeCompare(a.date));
  if (by.length < n * 2) return { best: [], hard: [] };
  return { best: by.slice(0, n), hard: by.slice(-n).reverse() };
}

/** Average weather and stress per weekday, Monday first. */
export function weekdayMoods(list: CheckIn[]): { mood: (number | null)[]; stress: (number | null)[] } {
  const mood: number[][] = Array.from({ length: 7 }, () => []);
  const stress: number[][] = Array.from({ length: 7 }, () => []);
  for (const c of list) {
    const w = weekdayIndex(c.date);
    mood[w].push(c.mood);
    if (c.stress != null) stress[w].push(c.stress);
  }
  return { mood: mood.map(mean), stress: stress.map(mean) };
}
