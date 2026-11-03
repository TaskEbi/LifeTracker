/**
 * 誓約, the oath: a promise with a date and a price, checked by your own records. Writing down what
 * it will cost you if you break it is what makes it different from a goal. Nobody enforces the price
 * but you; the app only keeps the score. Rows are lt_records (`hq_oath`).
 */
import type { LtRecord, TimedSection } from '../../data/types';
import { TIMED_SECTIONS } from '../../data/types';
import { dayCount, daysBetween } from '../log/dates';
import type { Facts } from '../progress/quests';

export type OathMetric = 'minutes' | 'sessions' | 'km' | 'tasks' | 'nights' | 'bedKept';

export const OATH_METRICS: { id: OathMetric; label: string; unit: string; needsSection?: boolean }[] = [
  { id: 'minutes', label: 'Minutes of…', unit: 'min', needsSection: true },
  { id: 'sessions', label: 'Sessions of…', unit: 'sessions', needsSection: true },
  { id: 'km', label: 'Distance', unit: 'km' },
  { id: 'tasks', label: 'Tasks done', unit: 'tasks' },
  { id: 'nights', label: 'Nights logged', unit: 'nights' },
  { id: 'bedKept', label: 'Bed on time', unit: 'nights' },
];

export interface Oath {
  id: string;
  metric: OathMetric;
  section: TimedSection | null;
  target: number;
  from: string;
  until: string;
  /** What you'll do if you break it. */
  stake: string;
  /** The stake was paid, for a broken oath. */
  paidOn: string | null;
}

export function oathOf(r: LtRecord): Oath | null {
  if (r.deleted_at || r.kind !== 'hq_oath') return null;
  const d = r.data;
  if (!OATH_METRICS.some((m) => m.id === d.metric) || typeof d.from !== 'string' || typeof d.until !== 'string' || typeof d.target !== 'number') return null;
  return {
    id: r.id,
    metric: d.metric as OathMetric,
    section: (TIMED_SECTIONS as readonly string[]).includes(d.section as string) ? (d.section as TimedSection) : null,
    target: d.target,
    from: d.from,
    until: d.until,
    stake: typeof d.stake === 'string' ? d.stake : '',
    paidOn: typeof d.paidOn === 'string' ? d.paidOn : null,
  };
}

export type OathStatus = 'kept' | 'ahead' | 'behind' | 'broken' | 'not-started';

export interface OathProgress {
  done: number;
  pct: number;
  status: OathStatus;
  daysLeft: number;
  /** How much a day it now takes, while it's still open. */
  perDay: number;
}

const measure = (f: Facts, o: Pick<Oath, 'metric' | 'section'>): number => {
  switch (o.metric) {
    case 'minutes':
      return o.section ? f.min[o.section] ?? 0 : f.minutes;
    case 'sessions':
      return o.section ? f.n[o.section] ?? 0 : f.sessions;
    case 'km':
      return f.km;
    case 'tasks':
      return f.tasks;
    case 'nights':
      return f.nights;
    case 'bedKept':
      return f.bedKept;
  }
};

export function oathProgress(o: Oath, days: Map<string, Facts>, today: string): OathProgress {
  const span = daysBetween(o.from, o.until);
  const done = Math.round(span.filter((d) => d <= today).reduce((n, d) => n + (days.get(d) ? measure(days.get(d)!, o) : 0), 0) * 10) / 10;
  const pct = o.target > 0 ? done / o.target : 1;
  const daysLeft = today > o.until ? 0 : Math.max(0, dayCount(today < o.from ? o.from : today, o.until));
  let status: OathStatus;
  if (pct >= 1) status = 'kept';
  else if (today > o.until) status = 'broken';
  else if (today < o.from) status = 'not-started';
  else status = pct >= (dayCount(o.from, today) - 1) / span.length ? 'ahead' : 'behind';
  return { done, pct, status, daysLeft, perDay: daysLeft ? Math.max(0, o.target - done) / daysLeft : 0 };
}

/** "120 minutes of violin" */
export function oathWords(o: Pick<Oath, 'metric' | 'section' | 'target'>): string {
  const sec = o.section ? o.section : 'anything';
  switch (o.metric) {
    case 'minutes':
      return `${o.target} minutes of ${sec}`;
    case 'sessions':
      return `${o.target} ${o.target === 1 ? 'session' : 'sessions'} of ${sec}`;
    case 'km':
      return `${o.target} km`;
    case 'tasks':
      return `${o.target} tasks done`;
    case 'nights':
      return `${o.target} nights logged`;
    case 'bedKept':
      return `${o.target} nights in bed on time`;
  }
}
