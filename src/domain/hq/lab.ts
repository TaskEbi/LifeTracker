/**
 * 研究室, the lab: what your own records say about you. Each hypothesis pairs two things across days,
 * says nothing until there are enough days, and never claims cause and effect. Also runs
 * self-experiments: a stretch of days compared with the same number of days just before it.
 */
import { addDays, daysBetween, weekdayIndex } from '../log/dates';
import type { ProgressInput } from '../progress/engine';
import { dayFacts } from '../progress/quests';
import type { CheckIn } from './checkin';

export interface DayRow {
  date: string;
  sleep: number | null;
  /** Bedtime in minutes after noon (so midnight doesn't break the maths). */
  bed: number | null;
  screen: number | null;
  mood: number | null;
  energy: number | null;
  /** Minutes logged, everything. */
  work: number;
  /** Study, coding, chess and uni prep. */
  brain: number;
  /** Sports and gym. */
  move: number;
  violin: number;
  reading: number;
}

export type Metric = 'sleep' | 'bed' | 'screen' | 'mood' | 'energy' | 'work' | 'brain' | 'move' | 'violin' | 'reading';

export const METRIC_LABEL: Record<Metric, string> = {
  sleep: 'Sleep',
  bed: 'Bedtime',
  screen: 'Screen time',
  mood: 'Inner weather',
  energy: 'Energy',
  work: 'Time logged',
  brain: 'Brain work',
  move: 'Movement',
  violin: 'Violin',
  reading: 'Reading',
};
/** What a self-experiment can watch. */
export const EXPERIMENT_METRICS: Metric[] = ['sleep', 'bed', 'mood', 'energy', 'screen', 'work', 'brain', 'violin'];

const pad = (n: number) => String(n).padStart(2, '0');

/** A value of a metric, ready to read. */
export function fmtMetric(metric: Metric, v: number): string {
  if (metric === 'mood' || metric === 'energy') return `${v.toFixed(1)}/5`;
  if (metric === 'bed') {
    const m = ((Math.round(v) + 720) % 1440 + 1440) % 1440;
    return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  }
  const m = Math.round(Math.abs(v));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
}

const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);

/** One row per day from the first day anything was logged (at most `maxDays` back) up to today. */
export function labRows(input: ProgressInput, checkIns: CheckIn[], maxDays = 365): DayRow[] {
  const days = dayFacts(input);
  const sleep = new Map<string, number>();
  const screen = new Map<string, number>();
  for (const m of input.metrics) {
    if (m.metric === 'sleep') sleep.set(m.date, m.minutes);
    if (m.metric === 'screen') screen.set(m.date, m.minutes);
  }
  const moods = new Map(checkIns.map((c) => [c.date, c]));
  const known = [...days.keys(), ...sleep.keys(), ...screen.keys(), ...moods.keys()].filter((d) => d <= input.today).sort();
  if (!known.length) return [];
  const from = known[0] > addDays(input.today, -maxDays) ? known[0] : addDays(input.today, -maxDays);
  return daysBetween(from, input.today).map((date) => {
    const f = days.get(date);
    const min = f?.min ?? {};
    const night = input.nights.get(date);
    const c = moods.get(date);
    return {
      date,
      sleep: sleep.get(date) ?? null,
      bed: night?.bed ? (toMin(night.bed) + 720) % 1440 : null,
      screen: screen.get(date) ?? null,
      mood: c?.mood ?? null,
      energy: c?.energy ?? null,
      work: f?.minutes ?? 0,
      brain: (min.study ?? 0) + (min.coding ?? 0) + (min.chess ?? 0) + (min.future ?? 0),
      move: (min.sports ?? 0) + (min.gym ?? 0),
      violin: min.violin ?? 0,
      reading: min.reading ?? 0,
    };
  });
}

export interface Hypothesis {
  id: string;
  x: Metric;
  y: Metric;
  /** Compare today's x with y this many days later. */
  lag: 0 | 1;
  title: string;
  /** "After more sleep" / "On days you moved" */
  hi: string;
  lo: string;
  /** x is really yes/no: did it happen at all? */
  binary?: boolean;
}

export const HYPOTHESES: Hypothesis[] = [
  { id: 'sleep-mood', x: 'sleep', y: 'mood', lag: 0, title: 'Sleep and your inner weather', hi: 'After more sleep', lo: 'After less sleep' },
  { id: 'sleep-energy', x: 'sleep', y: 'energy', lag: 0, title: 'Sleep and energy', hi: 'After more sleep', lo: 'After less sleep' },
  { id: 'sleep-work', x: 'sleep', y: 'work', lag: 0, title: 'Sleep and how much you get done', hi: 'After more sleep', lo: 'After less sleep' },
  { id: 'bed-work', x: 'bed', y: 'work', lag: 0, title: 'Bedtime and the next day', hi: 'After a later night', lo: 'After an earlier night' },
  { id: 'screen-brain', x: 'screen', y: 'brain', lag: 0, title: 'Screen time and brain work', hi: 'On high-screen days', lo: 'On low-screen days' },
  { id: 'screen-sleep', x: 'screen', y: 'sleep', lag: 1, title: 'Screen time and that night’s sleep', hi: 'After high-screen days', lo: 'After low-screen days' },
  { id: 'move-sleep', x: 'move', y: 'sleep', lag: 1, title: 'Exercise and that night’s sleep', hi: 'After days you moved', lo: 'After days you didn’t', binary: true },
  { id: 'move-mood', x: 'move', y: 'mood', lag: 1, title: 'Exercise and the next day’s weather', hi: 'The day after moving', lo: 'The day after not', binary: true },
  { id: 'violin-mood', x: 'violin', y: 'mood', lag: 0, title: 'Violin and your inner weather', hi: 'On days you played', lo: 'On days you didn’t', binary: true },
  { id: 'read-sleep', x: 'reading', y: 'sleep', lag: 1, title: 'Reading and that night’s sleep', hi: 'After reading', lo: 'After no reading', binary: true },
  { id: 'work-mood', x: 'work', y: 'mood', lag: 0, title: 'A full day and your inner weather', hi: 'On fuller days', lo: 'On lighter days' },
];

export const MIN_PAIRS = 14;
const MIN_GROUP = 4;

export type Strength = 'strong' | 'some' | 'none';

export interface Finding {
  hypothesis: Hypothesis;
  n: number;
  r: number;
  hiMean: number;
  loMean: number;
  diff: number;
  strength: Strength;
  /** Pairs for the small dot plot. */
  points: [number, number][];
  /** Split point of x (median, or 0 when binary). */
  split: number;
}
export interface Pending {
  hypothesis: Hypothesis;
  n: number;
}

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;

export function pearson(pairs: [number, number][]): number {
  const mx = mean(pairs.map((p) => p[0]));
  const my = mean(pairs.map((p) => p[1]));
  let a = 0;
  let b = 0;
  let c = 0;
  for (const [x, y] of pairs) {
    a += (x - mx) * (y - my);
    b += (x - mx) ** 2;
    c += (y - my) ** 2;
  }
  return b && c ? a / Math.sqrt(b * c) : 0;
}

const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};

function pairsOf(rows: DayRow[], h: Hypothesis): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i + h.lag < rows.length; i++) {
    const x = rows[i][h.x];
    const y = rows[i + h.lag][h.y];
    if (x != null && y != null) out.push([x, y]);
  }
  return out;
}

/** Everything testable, the clearest first; the rest say how far along they are. */
export function runLab(rows: DayRow[]): { findings: Finding[]; pending: Pending[] } {
  const findings: Finding[] = [];
  const pending: Pending[] = [];
  for (const h of HYPOTHESES) {
    const pairs = pairsOf(rows, h);
    if (pairs.length < MIN_PAIRS) {
      pending.push({ hypothesis: h, n: pairs.length });
      continue;
    }
    const xs = pairs.map((p) => p[0]);
    let split = h.binary ? 0 : median(xs);
    // Many tied values can leave nothing above the median: split just below it instead.
    if (!h.binary && xs.filter((x) => x > split).length < MIN_GROUP) split = Math.max(...xs.filter((x) => x < split), split - 1);
    const hi = pairs.filter((p) => p[0] > split).map((p) => p[1]);
    const lo = pairs.filter((p) => p[0] <= split).map((p) => p[1]);
    if (hi.length < MIN_GROUP || lo.length < MIN_GROUP) {
      pending.push({ hypothesis: h, n: Math.min(pairs.length, MIN_PAIRS - 1) });
      continue;
    }
    const r = pearson(pairs);
    const a = Math.abs(r);
    findings.push({ hypothesis: h, n: pairs.length, r, hiMean: mean(hi), loMean: mean(lo), diff: mean(hi) - mean(lo), strength: a >= 0.3 ? 'strong' : a >= 0.15 ? 'some' : 'none', points: pairs, split });
  }
  return { findings: findings.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)), pending: pending.sort((a, b) => b.n - a.n) };
}

/** Minutes logged and weather on average per weekday. */
export function weekdayProfile(rows: DayRow[]): { work: number[]; mood: (number | null)[] } {
  const work: number[][] = Array.from({ length: 7 }, () => []);
  const mood: number[][] = Array.from({ length: 7 }, () => []);
  for (const r of rows) {
    const w = weekdayIndex(r.date);
    work[w].push(r.work);
    if (r.mood != null) mood[w].push(r.mood);
  }
  return { work: work.map((a) => (a.length ? Math.round(mean(a)) : 0)), mood: mood.map((a) => (a.length ? mean(a) : null)) };
}

// ─── self-experiments ───────────────────────────────────────────────────────

export interface Experiment {
  id: string;
  title: string;
  start: string;
  days: number;
  metric: Metric;
}

export interface ExperimentResult {
  status: 'not-started' | 'running' | 'done';
  /** Day number within the experiment (1-based), or the length once done. */
  day: number;
  during: { mean: number; n: number } | null;
  before: { mean: number; n: number } | null;
  diff: number | null;
}

/** During the experiment against the same number of days just before it. */
export function experimentResult(rows: DayRow[], e: Experiment, today: string): ExperimentResult {
  const end = addDays(e.start, e.days - 1);
  const stat = (from: string, to: string) => {
    const vals = rows.filter((r) => r.date >= from && r.date <= to && r.date <= today).map((r) => r[e.metric]).filter((v): v is number => v != null);
    return vals.length ? { mean: mean(vals), n: vals.length } : null;
  };
  const during = stat(e.start, end);
  const before = stat(addDays(e.start, -e.days), addDays(e.start, -1));
  const status = today < e.start ? 'not-started' : today > end ? 'done' : 'running';
  const day = status === 'done' ? e.days : status === 'running' ? daysBetween(e.start, today).length : 0;
  return { status, day, during, before, diff: during && before ? during.mean - before.mean : null };
}
