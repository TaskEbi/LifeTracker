/**
 * 金庫, the vault: a letter to future you, sealed with a snapshot of who you are today, that the app
 * won't show until the day comes. Plus "on this day": what you were doing a week, a month, a year ago.
 */
import type { LtRecord, TimedSection } from '../../data/types';
import { TIMED_SECTIONS } from '../../data/types';
import { addDays, addMonths, dayCount } from '../log/dates';
import { sectionOf, type ProgressInput } from '../progress/engine';

export interface Snapshot {
  level: number;
  rank: string;
  form: string;
  streak: number;
  hours: Partial<Record<TimedSection, number>>;
  totalHours: number;
  km: number;
  books: number;
  wishes: number;
  emblems: number;
}

export interface Capsule {
  id: string;
  title: string;
  letter: string;
  sealedOn: string;
  opensOn: string;
  openedOn: string | null;
  snapshot: Snapshot | null;
  /** What you wrote back when it opened. */
  reply: string;
}

export function capsuleOf(r: LtRecord): Capsule | null {
  if (r.deleted_at || r.kind !== 'hq_capsule') return null;
  const d = r.data;
  if (typeof d.letter !== 'string' || typeof d.opensOn !== 'string') return null;
  return {
    id: r.id,
    title: typeof d.title === 'string' ? d.title : '',
    letter: d.letter,
    sealedOn: typeof d.sealedOn === 'string' ? d.sealedOn : r.created_at.slice(0, 10),
    opensOn: d.opensOn,
    openedOn: typeof d.openedOn === 'string' ? d.openedOn : null,
    snapshot: d.snapshot && typeof d.snapshot === 'object' ? (d.snapshot as Snapshot) : null,
    reply: typeof d.reply === 'string' ? d.reply : '',
  };
}

export const canOpen = (c: Capsule, today: string) => c.opensOn <= today;
export const daysUntil = (c: Capsule, today: string) => Math.max(0, dayCount(today, c.opensOn) - 1);

export function hoursBySection(input: ProgressInput): { hours: Partial<Record<TimedSection, number>>; total: number; km: number } {
  const hours: Partial<Record<TimedSection, number>> = {};
  let total = 0;
  let km = 0;
  for (const e of input.entries) {
    if (e.date > input.today) continue;
    total += e.minutes;
    const s = sectionOf(e, input);
    if ((TIMED_SECTIONS as readonly string[]).includes(s)) hours[s as TimedSection] = (hours[s as TimedSection] ?? 0) + e.minutes / 60;
    const d = input.details.get(e.id);
    const dist = d && !d.deleted_at ? (d.data as { km?: unknown }).km : null;
    if (typeof dist === 'number') km += dist;
  }
  return { hours, total: total / 60, km };
}

export interface ThenNow {
  label: string;
  then: string;
  now: string;
  /** Change, for the arrow. Zero when it didn't move. */
  delta: number;
}

const h = (v: number | undefined) => `${Math.round(v ?? 0)} h`;

/** The two snapshots side by side, only where something can be said. */
export function compareSnapshots(a: Snapshot, b: Snapshot): ThenNow[] {
  const rows: ThenNow[] = [
    { label: 'Level', then: String(a.level), now: String(b.level), delta: b.level - a.level },
    { label: 'Rank', then: a.rank, now: b.rank, delta: a.rank === b.rank ? 0 : 1 },
    { label: 'Form', then: a.form, now: b.form, delta: a.form === b.form ? 0 : 1 },
    { label: 'Hours logged', then: h(a.totalHours), now: h(b.totalHours), delta: b.totalHours - a.totalHours },
    ...TIMED_SECTIONS.filter((s) => (b.hours[s] ?? 0) >= 1).map((s) => ({ label: s[0].toUpperCase() + s.slice(1), then: h(a.hours[s]), now: h(b.hours[s]), delta: (b.hours[s] ?? 0) - (a.hours[s] ?? 0) })),
    { label: 'Distance', then: `${Math.round(a.km)} km`, now: `${Math.round(b.km)} km`, delta: b.km - a.km },
    { label: 'Books finished', then: String(a.books), now: String(b.books), delta: b.books - a.books },
    { label: 'Wishes crossed off', then: String(a.wishes), now: String(b.wishes), delta: b.wishes - a.wishes },
    { label: 'Emblems', then: String(a.emblems), now: String(b.emblems), delta: b.emblems - a.emblems },
  ];
  return rows.filter((r) => r.then !== r.now || r.delta !== 0);
}

/** Dates worth offering when sealing, soonest first. */
export function capsulePresets(today: string, known: { label: string; date: string }[] = []): { label: string; date: string }[] {
  const later = (months: number) => {
    const first = addMonths(today, months);
    const day = +today.slice(8);
    return addDays(first, Math.min(day, 28) - 1);
  };
  const out = [
    { label: 'In 1 month', date: later(1) },
    { label: 'In 3 months', date: later(3) },
    { label: 'In 6 months', date: later(6) },
    { label: 'In 1 year', date: later(12) },
    { label: 'In 5 years', date: later(60) },
    ...known.filter((k) => k.date > today),
  ];
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export interface Memory {
  ago: string;
  date: string;
  lines: { section: string; text: string }[];
}

const AGOS: [string, number][] = [['A week ago', 7], ['A month ago', 30], ['Three months ago', 91], ['Six months ago', 182], ['A year ago', 365], ['Two years ago', 730]];

/** What was going on on these days, from the entries' own notes and minutes. */
export function onThisDay(input: ProgressInput): Memory[] {
  const out: Memory[] = [];
  for (const [ago, days] of AGOS) {
    const date = addDays(input.today, -days);
    const entries = input.entries.filter((e) => e.date === date);
    if (!entries.length) continue;
    const lines = entries.map((e) => {
      const s = sectionOf(e, input);
      const d = input.details.get(e.id);
      const km = d && !d.deleted_at ? (d.data as { km?: unknown }).km : null;
      return {
        section: s,
        text: `${e.minutes} min${typeof km === 'number' ? ` · ${km} km` : ''}${e.note ? ` · ${e.note}` : ''}`,
      };
    });
    out.push({ ago, date, lines });
  }
  return out;
}
