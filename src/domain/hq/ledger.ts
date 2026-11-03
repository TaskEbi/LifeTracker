/**
 * 帳場, the ledger: a week is 168 hours, and this is where they went. Also holds you to your own word:
 * rank what matters to you, and it puts that beside where your time actually goes.
 */
import { TIMED_SECTIONS, type LtEvent, type TimedSection } from '../../data/types';
import { occurrences } from '../calendar/occurrences';
import { addDays, dayCount } from '../log/dates';
import type { ProgressInput } from '../progress/engine';
import { dayFacts } from '../progress/quests';

export interface LedgerLine {
  id: string;
  label: string;
  minutes: number;
}

export interface WeekLedger {
  start: string;
  /** Days of it that have happened. */
  days: number;
  total: number;
  lines: LedgerLine[];
  /** Hours nothing was logged against. */
  unaccounted: number;
  /** Nights with no sleep logged, so the sleep line reads low. */
  nightsMissing: number;
  screenDaysMissing: number;
}

const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);

export function weekLedger(input: ProgressInput, events: Iterable<LtEvent>, monday: string): WeekLedger {
  const facts = dayFacts(input);
  const end = addDays(monday, 6);
  const last = end < input.today ? end : input.today;
  const days = last < monday ? 0 : dayCount(monday, last);
  const inWeek = (d: string) => d >= monday && d <= last;
  const metric = (name: string) => input.metrics.filter((m) => m.metric === name && inWeek(m.date));
  const sleep = metric('sleep');
  const screen = metric('screen');
  const by = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const f = facts.get(addDays(monday, i));
    if (!f) continue;
    for (const [k, v] of Object.entries(f.min)) if (v) by.set(k, (by.get(k) ?? 0) + v);
  }
  // Calendar time that isn't training: school, exams, appointments. Sessions would count twice.
  const fixed = occurrences(events, monday, last)
    .filter((o) => !o.cancelled && o.start && o.end && o.event.kind !== 'session')
    .reduce((n, o) => n + Math.max(0, toMin(o.end!) - toMin(o.start!)), 0);
  const lines: LedgerLine[] = [
    { id: 'sleep', label: 'Sleep', minutes: sleep.reduce((n, m) => n + m.minutes, 0) },
    ...TIMED_SECTIONS.filter((s) => by.get(s)).map((s) => ({ id: s, label: s[0].toUpperCase() + s.slice(1), minutes: by.get(s)! })),
    ...(by.get('general') ? [{ id: 'general', label: 'Other logged', minutes: by.get('general')! }] : []),
    { id: 'screen', label: 'Screen', minutes: screen.reduce((n, m) => n + m.minutes, 0) },
    { id: 'fixed', label: 'Calendar', minutes: fixed },
  ].filter((l) => l.minutes > 0);
  const total = days * 1440;
  const counted = lines.reduce((n, l) => n + l.minutes, 0);
  return { start: monday, days, total, lines: lines.sort((a, b) => b.minutes - a.minutes), unaccounted: Math.max(0, total - counted), nightsMissing: days - sleep.length, screenDaysMissing: days - screen.length };
}

export interface PriorityRow {
  section: TimedSection;
  /** Where you ranked it, 1 is first. */
  rank: number;
  /** Where its time puts it. */
  actual: number;
  minutes: number;
  share: number;
  /** Positive: it gets less than you say it deserves. */
  gap: number;
}

/** Your ranking beside the last four weeks. */
export function priorityGap(input: ProgressInput, ranking: TimedSection[], days = 28): PriorityRow[] {
  const facts = dayFacts(input);
  const from = addDays(input.today, -(days - 1));
  const totals = new Map<TimedSection, number>(TIMED_SECTIONS.map((s) => [s, 0]));
  for (const [d, f] of facts) {
    if (d < from || d > input.today) continue;
    for (const s of TIMED_SECTIONS) totals.set(s, (totals.get(s) ?? 0) + (f.min[s] ?? 0));
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  const actualOrder = [...TIMED_SECTIONS].sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0));
  return ranking.map((section, i) => {
    const actual = actualOrder.indexOf(section) + 1;
    const minutes = totals.get(section) ?? 0;
    return { section, rank: i + 1, actual, minutes, share: sum ? minutes / sum : 0, gap: actual - (i + 1) };
  });
}

export function normaliseRanking(v: unknown): TimedSection[] {
  const given = Array.isArray(v) ? (v as string[]).filter((s): s is TimedSection => (TIMED_SECTIONS as readonly string[]).includes(s)) : [];
  return [...new Set(given), ...TIMED_SECTIONS.filter((s) => !given.includes(s))];
}
