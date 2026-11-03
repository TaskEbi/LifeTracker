/**
 * Timed drills and the mock-exam clock. Board vision: name-the-square practice, the way players learn
 * to see the board without counting. The clock: real exam timings, what question you should be on
 * right now, and which question ate your time.
 */

// ─── board vision ───────────────────────────────────────────────────────────

export const FILES = 'abcdefgh';
export type BoardView = 'white' | 'black';

/** The square at a position on the screen (row 0 is the top). */
export function squareAt(view: BoardView, row: number, col: number): string {
  return view === 'white' ? `${FILES[col]}${8 - row}` : `${FILES[7 - col]}${row + 1}`;
}

export const isDark = (square: string) => (FILES.indexOf(square[0]) + +square[1]) % 2 === 1;

/** A square from a 0–1 roll, never the same as the last one. */
export function nextSquare(roll: number, last: string | null): string {
  const n = Math.floor(roll * 63.9999);
  const all = Array.from({ length: 64 }, (_, i) => `${FILES[i % 8]}${Math.floor(i / 8) + 1}`).filter((s) => s !== last);
  return all[Math.min(n, all.length - 1)];
}

export const DRILL_SECONDS = 30;

export interface VisionScores {
  white: number;
  black: number;
  runs: { date: string; view: BoardView; score: number; misses: number }[];
}

export function normaliseVision(v: unknown): VisionScores {
  const r = (v && typeof v === 'object' ? v : {}) as Partial<VisionScores>;
  return { white: typeof r.white === 'number' ? r.white : 0, black: typeof r.black === 'number' ? r.black : 0, runs: Array.isArray(r.runs) ? r.runs.slice(-30) : [] };
}

// ─── mock-exam clock ────────────────────────────────────────────────────────

export type MockSection = 'study' | 'future' | 'coding';

export interface MockPreset {
  id: string;
  name: string;
  minutes: number;
  /** Questions, or marks for a paper counted in marks. */
  count: number;
  unit: 'questions' | 'marks' | 'problems';
  section: MockSection;
  note: string;
}

export const MOCK_PRESETS: MockPreset[] = [
  { id: 'sat-rw', name: 'SAT Reading and Writing, one module', minutes: 32, count: 27, unit: 'questions', section: 'future', note: 'Digital SAT. Two modules, a little over a minute a question.' },
  { id: 'sat-math', name: 'SAT Math, one module', minutes: 35, count: 22, unit: 'questions', section: 'future', note: 'Digital SAT. Two modules, about a minute and a half a question.' },
  { id: 'tmua', name: 'TMUA, one paper', minutes: 75, count: 20, unit: 'questions', section: 'future', note: 'Two papers of 20 multiple-choice questions.' },
  { id: 'alevel-2h', name: 'A-level paper, 2 hours', minutes: 120, count: 100, unit: 'marks', section: 'study', note: 'The rule of thumb: a little over a minute a mark. Check your board’s timings.' },
  { id: 'alevel-90', name: 'A-level paper, 90 minutes', minutes: 90, count: 75, unit: 'marks', section: 'study', note: 'Check your board’s timings.' },
  { id: 'contest', name: 'Contest, 3 hours', minutes: 180, count: 5, unit: 'problems', section: 'coding', note: 'Set your own length for the real round. Read every problem first.' },
];

export interface MockRun {
  name: string;
  minutes: number;
  count: number;
  unit: MockPreset['unit'];
  section: MockSection;
  startedAt: number;
  /** Seconds on the clock when each one was finished. */
  marks: number[];
}

export interface MockPace {
  elapsed: number;
  left: number;
  /** Where you should be by now. */
  shouldBe: number;
  done: number;
  /** Items ahead (+) or behind (−). */
  lead: number;
  /** The clock time to reach item n. */
  over: boolean;
}

export function mockPace(m: Pick<MockRun, 'minutes' | 'count' | 'marks'>, elapsed: number): MockPace {
  const total = m.minutes * 60;
  const shouldBe = Math.min(m.count, (elapsed / total) * m.count);
  const done = m.marks.length;
  return { elapsed, left: total - elapsed, shouldBe, done, lead: Math.round((done - shouldBe) * 10) / 10, over: elapsed >= total };
}

export interface MockReview {
  /** Time on each item, seconds. */
  each: number[];
  slowest: { n: number; seconds: number } | null;
  /** The pace the paper allows, seconds per item. */
  fair: number;
  /** Items that took more than twice the fair share. */
  sinks: number[];
}

export function mockReview(m: Pick<MockRun, 'minutes' | 'count' | 'marks'>): MockReview {
  const fair = (m.minutes * 60) / m.count;
  const each = m.marks.map((t, i) => t - (i ? m.marks[i - 1] : 0));
  const top = each.reduce<{ n: number; seconds: number } | null>((best, s, i) => (!best || s > best.seconds ? { n: i + 1, seconds: s } : best), null);
  return { each, slowest: top, fair, sinks: each.flatMap((s, i) => (s > fair * 2 ? [i + 1] : [])) };
}

export const clockText = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`;
};

// ─── the bouncer ────────────────────────────────────────────────────────────

export const URGE_SECONDS = 60;

export interface UrgeDay {
  date: string;
  /** Stayed off. */
  held: number;
  /** Went in anyway. */
  gave: number;
}

/** The numbers worth showing: this week against all time. */
export function urgeTotals(days: UrgeDay[], from: string): { held: number; gave: number; weekHeld: number; weekGave: number; rate: number | null } {
  const sum = (list: UrgeDay[], k: 'held' | 'gave') => list.reduce((n, d) => n + d[k], 0);
  const held = sum(days, 'held');
  const gave = sum(days, 'gave');
  const week = days.filter((d) => d.date >= from);
  return { held, gave, weekHeld: sum(week, 'held'), weekGave: sum(week, 'gave'), rate: held + gave ? held / (held + gave) : null };
}
