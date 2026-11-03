/**
 * 影, your shadow rival: you against the you of the last four weeks, trying 5% harder. It runs the
 * same days of the week at the pace those weeks ran them, so a slow Monday isn't a defeat.
 */
import { addDays, weekdayIndex, weekStart } from '../log/dates';
import type { Facts } from '../progress/quests';

export interface ShadowRace {
  /** Minutes this week so far. */
  me: number;
  /** Where the shadow is at this moment of the week. */
  shadow: number;
  lead: number;
  /** Where the shadow finishes on Sunday night. */
  shadowTotal: number;
  /** Cumulative minutes at the end of each day, Monday first (null for days to come). */
  mine: (number | null)[];
  theirs: number[];
  /** How many past weeks it is made of. */
  weeks: number;
}

export const SHADOW_EDGE = 1.05;

/** `fraction` is how far through today it is (0–1). Null until there is a past week to race. */
export function shadowRace(days: Map<string, Facts>, today: string, fraction: number): ShadowRace | null {
  const monday = weekStart(today);
  const past: number[][] = [];
  for (let w = 1; w <= 4; w++) {
    const start = addDays(monday, -7 * w);
    let run = 0;
    const col = Array.from({ length: 7 }, (_, i) => (run += days.get(addDays(start, i))?.minutes ?? 0));
    // An empty week says nothing about your pace.
    if (run > 0) past.push(col);
  }
  if (!past.length) return null;
  const theirs = Array.from({ length: 7 }, (_, i) => Math.round((past.reduce((s, c) => s + c[i], 0) / past.length) * SHADOW_EDGE));
  const wd = weekdayIndex(today);
  let run = 0;
  const mine = Array.from({ length: 7 }, (_, i) => (i > wd ? null : (run += days.get(addDays(monday, i))?.minutes ?? 0)));
  const me = mine[wd] ?? 0;
  const before = wd === 0 ? 0 : theirs[wd - 1];
  const shadow = Math.round(before + (theirs[wd] - before) * Math.max(0, Math.min(1, fraction)));
  return { me, shadow, lead: me - shadow, shadowTotal: theirs[6], mine, theirs, weeks: past.length };
}
