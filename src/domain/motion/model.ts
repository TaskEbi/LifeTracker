/**
 * What the Motion page's 3D scenes draw: each section's level and time, and a year of days.
 * Derived from the Daily Log and the progress engine; nothing is stored. When there is too little
 * logged to draw anything, sample numbers stand in and `sample` says so (the page labels it).
 */
import type { LogEntry, SectionId } from '../../data/types';
import { addDays, weekStart } from '../log/dates';
import { SECTIONS } from '../sections';

export interface MotionSection {
  id: SectionId;
  name: string;
  kanji: string;
  code: string;
  level: number;
  /** 0–1 of the way to the next level. */
  pct: number;
  xp: number;
  /** Minutes logged in the year shown. */
  minutes: number;
  /** Minutes logged in the last seven days. */
  week: number;
}

export interface MotionDay {
  date: string;
  minutes: number;
  /** The section with the most time that day. */
  top: SectionId | null;
  /** After today (the rest of this week): drawn empty. */
  future: boolean;
}

export interface MotionData {
  sections: MotionSection[];
  /** WEEKS × 7 days, oldest first, Monday first, ending on this week's Sunday. */
  days: MotionDay[];
  /** Minutes a week for each section with any, oldest week first (WEEKS long). */
  weekly: Partial<Record<SectionId, number[]>>;
  level: number;
  pct: number;
  streak: number;
  /** Minutes in the year shown. */
  total: number;
  /** Days in the year shown with anything logged. */
  active: number;
  sample: boolean;
}

export const WEEKS = 53;
/** Fewer logged days than this in the last year and the scenes use sample numbers. */
export const MIN_REAL_DAYS = 5;

export interface MotionInput {
  today: string;
  entries: Pick<LogEntry, 'date' | 'minutes' | 'topic_id'>[];
  topicSection: Map<string, SectionId>;
  sections: Record<SectionId, { level: number; pct: number; xp: number }>;
  overall: { level: number; pct: number };
  streak: number;
}

const gridStart = (today: string) => addDays(weekStart(today), -(WEEKS - 1) * 7);

function daysFrom(today: string, perDay: Map<string, Map<SectionId | 'other', number>>): MotionDay[] {
  const start = gridStart(today);
  const out: MotionDay[] = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const date = addDays(start, i);
    const by = perDay.get(date);
    let minutes = 0;
    let top: SectionId | null = null;
    let best = 0;
    if (by)
      for (const [k, m] of by) {
        minutes += m;
        if (k !== 'other' && m > best) {
          best = m;
          top = k;
        }
      }
    out.push({ date, minutes, top, future: date > today });
  }
  return out;
}

function weeklyFrom(today: string, perDay: Map<string, Map<SectionId | 'other', number>>): Partial<Record<SectionId, number[]>> {
  const start = gridStart(today);
  const out: Partial<Record<SectionId, number[]>> = {};
  for (let i = 0; i < WEEKS * 7; i++) {
    const by = perDay.get(addDays(start, i));
    if (!by) continue;
    for (const [k, m] of by) {
      if (k === 'other') continue;
      (out[k] ??= new Array<number>(WEEKS).fill(0))[Math.floor(i / 7)] += m;
    }
  }
  return out;
}

function totals(days: MotionDay[]) {
  let total = 0;
  let active = 0;
  for (const d of days)
    if (d.minutes > 0) {
      total += d.minutes;
      active++;
    }
  return { total, active };
}

export function buildMotion(input: MotionInput): MotionData {
  const start = gridStart(input.today);
  const weekAgo = addDays(input.today, -6);
  const perDay = new Map<string, Map<SectionId | 'other', number>>();
  const minutes = new Map<SectionId, number>();
  const week = new Map<SectionId, number>();
  for (const e of input.entries) {
    if (e.date < start || e.date > input.today || !(e.minutes > 0)) continue;
    const s = input.topicSection.get(e.topic_id) ?? 'other';
    let by = perDay.get(e.date);
    if (!by) perDay.set(e.date, (by = new Map()));
    by.set(s, (by.get(s) ?? 0) + e.minutes);
    if (s !== 'other') {
      minutes.set(s, (minutes.get(s) ?? 0) + e.minutes);
      if (e.date >= weekAgo) week.set(s, (week.get(s) ?? 0) + e.minutes);
    }
  }
  const days = daysFrom(input.today, perDay);
  const { total, active } = totals(days);
  if (active < MIN_REAL_DAYS) return sampleMotion(input.today);
  return {
    sections: SECTIONS.map((s) => ({
      id: s.id,
      name: s.name,
      kanji: s.kanji,
      code: s.code,
      level: input.sections[s.id].level,
      pct: Math.max(0, Math.min(1, input.sections[s.id].pct)),
      xp: input.sections[s.id].xp,
      minutes: minutes.get(s.id) ?? 0,
      week: week.get(s.id) ?? 0,
    })),
    days,
    weekly: weeklyFrom(input.today, perDay),
    level: input.overall.level,
    pct: Math.max(0, Math.min(1, input.overall.pct)),
    streak: input.streak,
    total,
    active,
    sample: false,
  };
}

/** A small repeatable generator, so the sample year is the same every time. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** How much of a sample year each section takes; sleep, screen and cabinet have no timed sessions. */
const SAMPLE_WEIGHT: Partial<Record<SectionId, number>> = { violin: 1, coding: 0.9, study: 1.2, sports: 0.55, gym: 0.5, maths: 0.6, chess: 0.35, reading: 0.45, future: 0.15 };

export function sampleMotion(today: string): MotionData {
  const rand = rng(20261113);
  const start = gridStart(today);
  const perDay = new Map<string, Map<SectionId | 'other', number>>();
  const minutes = new Map<SectionId, number>();
  const week = new Map<SectionId, number>();
  const weekAgo = addDays(today, -6);
  const ids = Object.keys(SAMPLE_WEIGHT) as SectionId[];
  for (let i = 0; i < WEEKS * 7; i++) {
    const date = addDays(start, i);
    if (date > today) break;
    // a slow swell over the year, quieter weekends, the odd day off
    const swell = 0.55 + 0.45 * Math.sin(i / 23) * Math.sin(i / 61 + 1);
    const weekend = i % 7 >= 5 ? 0.7 : 1;
    if (rand() < 0.08) continue;
    const by = new Map<SectionId | 'other', number>();
    for (const id of ids) {
      if (rand() > 0.3 + 0.35 * SAMPLE_WEIGHT[id]!) continue;
      const m = Math.round((20 + rand() * 75) * SAMPLE_WEIGHT[id]! * (0.6 + swell) * weekend);
      if (m < 10) continue;
      by.set(id, m);
      minutes.set(id, (minutes.get(id) ?? 0) + m);
      if (date >= weekAgo) week.set(id, (week.get(id) ?? 0) + m);
    }
    if (by.size) perDay.set(date, by);
  }
  const days = daysFrom(today, perDay);
  const { total, active } = totals(days);
  return {
    sections: SECTIONS.map((s, i) => {
      const m = minutes.get(s.id) ?? 0;
      const level = m ? 3 + Math.round(Math.sqrt(m) / 9) : 6 + ((i * 5) % 9);
      return { id: s.id, name: s.name, kanji: s.kanji, code: s.code, level, pct: 0.15 + ((i * 37) % 70) / 100, xp: level * level * 40, minutes: m, week: week.get(s.id) ?? 0 };
    }),
    days,
    weekly: weeklyFrom(today, perDay),
    level: 27,
    pct: 0.62,
    streak: 41,
    total,
    active,
    sample: true,
  };
}

/** 95 → "1h 35m", 40 → "40m", 120 → "2h". */
export function fmtSpan(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m}m`;
  return m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`;
}

/** Whole hours with a thousands comma, for a year's total. */
export const fmtHours = (minutes: number) => `${Math.round(minutes / 60).toLocaleString('en-GB')}h`;
