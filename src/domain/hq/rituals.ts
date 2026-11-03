/**
 * 日課, rituals: small things done on a cue ("after I wake up, stretch my calves"). The rule is
 * "never miss twice": one missed day leaves the chain whole, the second breaks it, the same rule as
 * the streak buffer. Rituals are lt_records (`hq_ritual`); each day is one row (`hq_ritual_day`).
 */
import type { LtRecord } from '../../data/types';
import { addDays, weekdayIndex } from '../log/dates';

export type RitualSlot = 'morning' | 'day' | 'evening';
export const SLOTS: { id: RitualSlot; label: string; kanji: string }[] = [
  { id: 'morning', label: 'Morning', kanji: '朝' },
  { id: 'day', label: 'Daytime', kanji: '昼' },
  { id: 'evening', label: 'Evening', kanji: '夜' },
];

export interface Ritual {
  id: string;
  title: string;
  /** The trigger: "After I wake up". */
  cue: string;
  slot: RitualSlot;
  /** Weekdays it applies, 0 = Monday. Empty means every day. */
  days: number[];
  since: string;
  archived: boolean;
}

export const RITUAL_IDEAS: { title: string; cue: string; slot: RitualSlot }[] = [
  { title: 'Calf raises and shin stretch', cue: 'While the kettle boils', slot: 'morning' },
  { title: 'Glass of water', cue: 'As soon as I’m up', slot: 'morning' },
  { title: 'Daylight for five minutes', cue: 'Before I check my phone', slot: 'morning' },
  { title: 'Plan the day’s one big thing', cue: 'Before school starts', slot: 'morning' },
  { title: 'Shoulder and neck release', cue: 'After I put the violin down', slot: 'day' },
  { title: 'Wipe the rosin off the strings', cue: 'Before the violin goes in its case', slot: 'day' },
  { title: 'One problem from the upsolve list', cue: 'After school', slot: 'day' },
  { title: 'Five recall cards', cue: 'On the way home', slot: 'day' },
  { title: 'Phone charges outside the bedroom', cue: 'When I start winding down', slot: 'evening' },
  { title: 'Pack the bag for tomorrow', cue: 'After dinner', slot: 'evening' },
  { title: 'Ten pages before sleep', cue: 'Once I’m in bed', slot: 'evening' },
  { title: 'Write one line about today', cue: 'Before lights out', slot: 'evening' },
];

export function ritualOf(r: LtRecord): Ritual | null {
  if (r.deleted_at || r.kind !== 'hq_ritual') return null;
  const d = r.data;
  if (typeof d.title !== 'string') return null;
  return {
    id: r.id,
    title: d.title,
    cue: typeof d.cue === 'string' ? d.cue : '',
    slot: d.slot === 'morning' || d.slot === 'evening' ? d.slot : 'day',
    days: Array.isArray(d.days) ? (d.days as number[]).filter((x) => x >= 0 && x <= 6) : [],
    since: typeof d.since === 'string' ? d.since : r.created_at.slice(0, 10),
    archived: !!r.archived_at,
  };
}

export const appliesOn = (r: Ritual, date: string) => date >= r.since && (!r.days.length || r.days.includes(weekdayIndex(date)));

export interface Chain {
  /** Days done in a row, not breaking for one missed day. */
  n: number;
  /** Today isn't done yet but the chain is safe. */
  held: boolean;
  /** Done / due over the last 30 scheduled days. */
  rate: number;
  /** The last 14 days: true done, false missed, null not scheduled. */
  recent: (boolean | null)[];
}

export function chainOf(r: Ritual, done: Map<string, Set<string>>, today: string): Chain {
  const isDone = (d: string) => done.get(d)?.has(r.id) ?? false;
  let n = 0;
  let misses = 0;
  let held = false;
  let d = today;
  // Today not done yet isn't a miss; look further back.
  if (appliesOn(r, today) && !isDone(today)) d = addDays(today, -1);
  for (let i = 0; i < 800 && d >= r.since; i++, d = addDays(d, -1)) {
    if (!appliesOn(r, d)) continue;
    if (isDone(d)) {
      n++;
      misses = 0;
    } else {
      misses++;
      if (misses >= 2) break;
      if (n === 0) held = true;
    }
  }
  // Nothing done before the miss means there's no chain to hold.
  if (n === 0) held = false;
  let due = 0;
  let hit = 0;
  for (let i = 0, x = today; i < 30; i++, x = addDays(x, -1)) {
    if (!appliesOn(r, x)) continue;
    if (x === today && !isDone(x)) continue;
    due++;
    if (isDone(x)) hit++;
  }
  const recent = Array.from({ length: 14 }, (_, i) => {
    const x = addDays(today, i - 13);
    if (!appliesOn(r, x)) return null;
    return isDone(x);
  });
  return { n, held, rate: due ? hit / due : 0, recent };
}

/** Which slot to show first at this hour. */
export const slotAt = (hour: number): RitualSlot => (hour < 11 ? 'morning' : hour < 18 ? 'day' : 'evening');

export const doneIdsOf = (r: LtRecord): string[] => (Array.isArray(r.data.done) ? (r.data.done as string[]) : []);
