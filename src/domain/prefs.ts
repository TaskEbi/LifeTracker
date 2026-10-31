/**
 * Synced preferences (lt_prefs rows). Each key has a default and a normaliser, so a missing or
 * older row never breaks a screen.
 */
import type { TimedSection } from '../data/types';

export interface Targets {
  /** Violin minutes per week; lessons and rehearsals count. */
  violinWeek: number;
  /** Gym sessions per week. */
  gymWeek: number;
  /** Sports sessions per week. */
  sportsWeek: number;
  /** Screen time per day, minutes. Optional: null turns it off. */
  screenDay: number | null;
  /** Uni prep minutes per week (Future). */
  futureWeek: number;
}

export interface SleepSchedule {
  /** Nights before a school day (Sunday–Thursday). */
  weekday: { bed: string; wake: string };
  /** Friday and Saturday nights. */
  weekend: { bed: string; wake: string };
  /** Minutes before bed for the wind-down reminder. */
  windDown: number;
  reminders: boolean;
}

/** Which Daily Log topic each timed section reads and writes. Null until chosen or created. */
export type SectionTopics = Record<TimedSection, string | null>;

export const DEFAULT_TARGETS: Targets = { violinWeek: 240, gymWeek: 2, sportsWeek: 3, screenDay: 210, futureWeek: 300 };
export const DEFAULT_SLEEP: SleepSchedule = {
  weekday: { bed: '22:45', wake: '06:30' },
  weekend: { bed: '23:30', wake: '08:00' },
  windDown: 30,
  reminders: false,
};
export const DEFAULT_SECTION_TOPICS: SectionTopics = { violin: null, coding: null, sports: null, gym: null, study: null, chess: null, future: null };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const num = (v: unknown, lo: number, hi: number, fallback: number) => (Number.isFinite(v) && (v as number) >= lo && (v as number) <= hi ? Math.round(v as number) : fallback);
const time = (v: unknown, fallback: string) => (typeof v === 'string' && TIME.test(v) ? v : fallback);

export function normaliseTargets(raw: unknown): Targets {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Targets>;
  return {
    violinWeek: num(r.violinWeek, 15, 3000, DEFAULT_TARGETS.violinWeek),
    gymWeek: num(r.gymWeek, 1, 7, DEFAULT_TARGETS.gymWeek),
    sportsWeek: num(r.sportsWeek, 1, 14, DEFAULT_TARGETS.sportsWeek),
    screenDay: r.screenDay === null ? null : num(r.screenDay, 15, 1440, DEFAULT_TARGETS.screenDay as number),
    futureWeek: num(r.futureWeek, 15, 3000, DEFAULT_TARGETS.futureWeek),
  };
}

/**
 * Target changes over time: each revision applies from its week (a Monday) on, so changing a
 * target never re-judges past weeks (and never takes back XP they earned).
 */
export type TargetsLog = { from: string; targets: Targets }[];

export function normaliseTargetsLog(raw: unknown): TargetsLog {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && typeof r === 'object' && typeof r.from === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.from))
    .map((r) => ({ from: r.from as string, targets: normaliseTargets(r.targets) }))
    .sort((a, b) => a.from.localeCompare(b.from));
}

/** The targets in force for the week starting `monday`: the latest revision on or before it, else the earliest known. */
export function targetsAt(log: TargetsLog, current: Targets, monday: string): Targets {
  if (!log.length) return current;
  let hit = log[0].targets;
  for (const r of log) if (r.from <= monday) hit = r.targets;
  return hit;
}

export function normaliseSleep(raw: unknown): SleepSchedule {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<SleepSchedule>;
  return {
    weekday: { bed: time(r.weekday?.bed, DEFAULT_SLEEP.weekday.bed), wake: time(r.weekday?.wake, DEFAULT_SLEEP.weekday.wake) },
    weekend: { bed: time(r.weekend?.bed, DEFAULT_SLEEP.weekend.bed), wake: time(r.weekend?.wake, DEFAULT_SLEEP.weekend.wake) },
    windDown: num(r.windDown, 0, 180, DEFAULT_SLEEP.windDown),
    reminders: r.reminders === true,
  };
}

export function normaliseSectionTopics(raw: unknown): SectionTopics {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<SectionTopics>;
  const out = { ...DEFAULT_SECTION_TOPICS };
  for (const k of Object.keys(out) as TimedSection[]) out[k] = typeof r[k] === 'string' && r[k] ? (r[k] as string) : null;
  return out;
}
