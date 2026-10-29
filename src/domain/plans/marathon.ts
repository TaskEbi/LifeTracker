/**
 * The marathon plan: 24 weeks from a Monday to race day (the Sunday of week 24), five phases,
 * step-back weeks every fourth week, paces worked out from the goal time. The plan itself is
 * fixed in code; whether a session is done is derived from what's logged (nothing stored).
 */
import { addDays, weekdayIndex } from '../log/dates';
import type { GymAdjust } from './gym';
import { PLAN_WORKOUTS } from './gym';
import { DEFAULT_GOAL, parseHms, type MarathonPlanPref, type PlanWorkoutId } from './types';

export const PLAN_WEEKS = 24;
export const MARATHON_KM = 42.195;
export const raceDate = (start: string) => addDays(start, PLAN_WEEKS * 7 - 1);
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── phases ─────────────────────────────────────────────────────────────────

export type PhaseId = 'base' | 'build' | 'specific' | 'peak' | 'taper';
export interface PhaseInfo {
  id: PhaseId;
  name: string;
  kanji: string;
  from: number;
  to: number;
  aim: string;
}
export const PHASES: PhaseInfo[] = [
  { id: 'base', name: 'Base', kanji: '基', from: 1, to: 6, aim: 'Easy kilometres, strides and a first taste of threshold. The legs get used to running most days.' },
  { id: 'build', name: 'Build', kanji: '築', from: 7, to: 12, aim: 'More volume, intervals and the first marathon-pace kilometres; a half-marathon tune-up closes it.' },
  { id: 'specific', name: 'Marathon-specific', kanji: '専', from: 13, to: 19, aim: 'Long runs to 32 km, long blocks at marathon pace, threshold to hold it together.' },
  { id: 'peak', name: 'Peak', kanji: '頂', from: 20, to: 21, aim: 'The last big efforts: 14 km at marathon pace and a final 30 km.' },
  { id: 'taper', name: 'Taper', kanji: '研', from: 22, to: 24, aim: 'Volume drops, sharpness stays. Arrive fresh on race day.' },
];
export const phaseOf = (week: number): PhaseInfo => PHASES.find((p) => week >= p.from && week <= p.to) ?? PHASES[0];
export const STEP_BACK = [4, 8, 12, 16, 20];

// ─── paces ──────────────────────────────────────────────────────────────────

/** Seconds per km. Ratios to marathon pace, set so a 4:10 goal gives easy 6:30–7:10, MP 5:55, T 5:15–5:20, I 4:55. */
export const PACE_RATIOS = { easy: [1.1, 1.21], long: [1.125, 1.21], t: [0.886, 0.9], i: 0.83, hmp: 0.94, strides: 0.76 } as const;
export interface Paces {
  mp: number;
  easy: [number, number];
  long: [number, number];
  t: [number, number];
  i: number;
  hmp: number;
  strides: number;
}
const r5 = (s: number) => Math.round(s / 5) * 5;
export function pacesFor(goal: string): Paces {
  const g = parseHms(goal) ?? parseHms(DEFAULT_GOAL)!;
  const mp = g / MARATHON_KM;
  const R = PACE_RATIOS;
  return {
    mp: r5(mp),
    easy: [r5(mp * R.easy[0]), r5(mp * R.easy[1])],
    long: [r5(mp * R.long[0]), r5(mp * R.long[1])],
    t: [r5(mp * R.t[0]), r5(mp * R.t[1])],
    i: r5(mp * R.i),
    hmp: r5(mp * R.hmp),
    strides: r5(mp * R.strides),
  };
}
export const fmtPace = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const range = (p: [number, number]) => `${fmtPace(p[0])}–${fmtPace(p[1])}`;

/** Riegel: a half-marathon time → marathon prediction (seconds). */
export const riegel = (halfSec: number) => halfSec * Math.pow(MARATHON_KM / (MARATHON_KM / 2), 1.06);
/** The half-marathon time that predicts this goal. */
export const halfForGoal = (goalSec: number) => goalSec / Math.pow(2, 1.06);

// ─── sessions ───────────────────────────────────────────────────────────────

export type RunType = 'easy' | 'strides' | 'fartlek' | 'threshold' | 'intervals' | 'hmp' | 'mp' | 'long' | 'tuneup' | 'shakeout' | 'race';
export const QUALITY: RunType[] = ['fartlek', 'threshold', 'intervals', 'hmp', 'mp'];
export interface PlanRun {
  kind: 'run';
  id: string;
  week: number;
  day: number;
  date: string;
  type: RunType;
  title: string;
  km: number;
  desc: string;
  /** The week's long run (or the tune-up/race): matched to the longest run of the week. */
  long: boolean;
  /** Counts toward the kilometres, not toward the week being done. */
  optional: boolean;
}
export interface PlanGym {
  kind: 'gym';
  id: string;
  week: number;
  day: number;
  date: string;
  workout: PlanWorkoutId;
  title: string;
  adjust?: GymAdjust;
}
export type PlanSession = PlanRun | PlanGym;
export interface PlanWeek {
  n: number;
  start: string;
  phase: PhaseInfo;
  stepBack: boolean;
  /** Planned running km. */
  km: number;
  runs: PlanRun[];
  gym: PlanGym[];
  note?: string;
}

type RunSpec = [day: number, type: RunType, km: number, a?: number, b?: number | string];
/** Draft by week: day (Mon 0 … Sun 6), type, km and the workout's numbers. */
const WEEKS: RunSpec[][] = [
  /* 1 */ [[1, 'strides', 7, 6], [2, 'easy', 6], [5, 'easy', 6], [6, 'long', 14]],
  /* 2 */ [[1, 'fartlek', 8, 8, 1], [2, 'easy', 7], [5, 'easy', 6], [6, 'long', 15]],
  /* 3 */ [[1, 'threshold', 9, 3, '8 min'], [2, 'easy', 7], [5, 'easy', 6], [6, 'long', 16]],
  /* 4 */ [[1, 'strides', 7, 6], [2, 'easy', 6], [5, 'easy', 6], [6, 'long', 12]],
  /* 5 */ [[1, 'intervals', 10, 5, '1 km'], [2, 'easy', 7], [5, 'easy', 7], [6, 'long', 18]],
  /* 6 */ [[1, 'threshold', 10, 1, '20 min'], [2, 'easy', 7], [5, 'easy', 7], [6, 'long', 19]],
  /* 7 */ [[1, 'intervals', 11, 6, '1 km'], [2, 'easy', 8], [5, 'mp', 7, 4], [6, 'long', 21]],
  /* 8 */ [[1, 'strides', 8, 6], [2, 'easy', 7], [5, 'easy', 6], [6, 'long', 15]],
  /* 9 */ [[1, 'threshold', 11, 3, '2 km'], [2, 'easy', 7], [4, 'easy', 5], [5, 'mp', 7, 5], [6, 'long', 22]],
  /* 10 */ [[1, 'intervals', 12, 5, '1.2 km'], [2, 'easy', 8], [4, 'easy', 5], [5, 'mp', 8, 6], [6, 'long', 24]],
  /* 11 */ [[1, 'threshold', 11, 1, '25 min'], [2, 'easy', 9], [4, 'easy', 6], [5, 'easy', 8], [6, 'long', 26, 5]],
  /* 12 */ [[1, 'strides', 7, 6], [2, 'easy', 6], [5, 'shakeout', 4], [6, 'tuneup', 23]],
  /* 13 */ [[1, 'threshold', 13, 4, '2 km'], [2, 'easy', 8], [4, 'easy', 6], [5, 'mp', 10, 8], [6, 'long', 27]],
  /* 14 */ [[1, 'hmp', 14, 6, '1.6 km'], [2, 'easy', 9], [4, 'easy', 6], [5, 'easy', 6], [6, 'long', 29, 8]],
  /* 15 */ [[1, 'threshold', 12, 1, '30 min'], [2, 'easy', 9], [4, 'easy', 6], [5, 'mp', 12, 10], [6, 'long', 24]],
  /* 16 */ [[1, 'strides', 8, 6], [2, 'easy', 7], [5, 'easy', 7], [6, 'long', 20]],
  /* 17 */ [[1, 'threshold', 12, 4, '2 km'], [2, 'easy', 9], [4, 'easy', 6], [5, 'easy', 8], [6, 'long', 32]],
  /* 18 */ [[1, 'intervals', 12, 6, '1 km'], [2, 'easy', 9], [4, 'easy', 6], [5, 'mp', 12, 10], [6, 'long', 26]],
  /* 19 */ [[1, 'threshold', 11, 1, '25 min'], [2, 'easy', 9], [4, 'easy', 6], [5, 'easy', 6], [6, 'long', 32, 10]],
  /* 20 */ [[1, 'strides', 8, 6], [2, 'easy', 8], [5, 'easy', 7], [6, 'long', 21, 14]],
  /* 21 */ [[1, 'hmp', 13, 6, '1.6 km'], [2, 'easy', 9], [4, 'easy', 6], [5, 'easy', 7], [6, 'long', 30]],
  /* 22 */ [[1, 'mp', 12, 3, '3 km'], [2, 'easy', 8], [5, 'easy', 5], [6, 'long', 24]],
  /* 23 */ [[1, 'mp', 10, 2, '3 km'], [2, 'easy', 7], [5, 'easy', 5], [6, 'long', 16]],
  /* 24 */ [[1, 'mp', 7, 3, '1 km'], [3, 'strides', 5, 4], [5, 'shakeout', 3], [6, 'race', MARATHON_KM]],
];

const WEEK_NOTES: Record<number, string> = {
  1: 'Week one: everything easy apart from a few strides. Run the easy days slower than feels necessary.',
  4: 'Step-back week: less running so the last three weeks sink in.',
  8: 'Step-back week. Same rhythm, less of it.',
  9: 'From this week an optional easy Friday run. Skip it if your legs feel heavy or there is a match.',
  12: 'Step-back week with a half-marathon on Sunday: race one or run a solo time trial.',
  16: 'Step-back week before the biggest block.',
  17: 'First 32 km. Practise race-morning breakfast and gels.',
  19: 'The key session of the plan: 32 km with the last 10 at marathon pace.',
  20: 'Step-back week in kilometres, but Sunday has 14 km at marathon pace.',
  22: 'Taper starts: running drops about a quarter, the Athletic day is halved.',
  23: 'Taper: less again. Sleep is training now.',
  24: 'Race week. Short and sharp, then rest. No gym in the two days before the race.',
};

function describe(spec: RunSpec, p: Paces, goal: string): { title: string; desc: string } {
  const [, type, km, a, b] = spec;
  const E = `${range(p.easy)}/km`;
  const MP = `${fmtPace(p.mp)}/km`;
  const T = `${range(p.t)}/km`;
  const I = `${fmtPace(p.i)}/km`;
  switch (type) {
    case 'easy':
      return { title: `Easy ${km} km`, desc: `${km} km easy at ${E}. Conversational: you could talk in full sentences.` };
    case 'strides':
      return { title: `Easy ${km} km + strides`, desc: `${km - 1} km easy at ${E}, then ${a}×20 s strides: fast but relaxed (about ${fmtPace(p.strides)}/km feel, not a sprint), walk back between. Easy to finish.` };
    case 'fartlek':
      return { title: `Fartlek ${a}×${b} min`, desc: `2 km easy, then ${a}×${b} min brisk (around ${fmtPace(p.t[0])}–${fmtPace(p.i)}/km, by feel) with 1–2 min easy jog between. Easy to ${km} km.` };
    case 'threshold':
      return a === 1
        ? { title: `Threshold ${b}`, desc: `2–3 km easy warm-up, ${b} continuous @T (${T}: comfortably hard, a few words at a time), cool down easy to ${km} km.` }
        : { title: `Threshold ${a}×${b}`, desc: `2–3 km easy warm-up, ${a}×${b} @T (${T}) with 2 min easy jog between, cool down easy to ${km} km.` };
    case 'intervals':
      return { title: `Intervals ${a}×${b}`, desc: `3 km easy with 4 strides, ${a}×${b} @I (${I}) with 2–3 min jog between, cool down easy to ${km} km.` };
    case 'hmp':
      return { title: `${a}×${b} @ half pace`, desc: `2–3 km easy, ${a}×${b} at half-marathon pace (${fmtPace(p.hmp)}/km) with 400 m jog between, cool down easy to ${km} km.` };
    case 'mp':
      return typeof b === 'string'
        ? { title: `${a}×${b} @MP`, desc: `2 km easy, ${a}×${b} at marathon pace (${MP}) with 3 min easy between, easy to ${km} km. Lock in the rhythm you will race at.` }
        : { title: `${km} km with ${a} @MP`, desc: `1–2 km easy, ${a} km at marathon pace (${MP}), easy to ${km} km. Practise drinking on the move.` };
    case 'long':
      return a
        ? { title: `Long ${km} km · last ${a} @MP`, desc: `${km - a} km easy at ${range(p.long)}/km, then the last ${a} km at marathon pace (${MP}). Gel and water every 35–45 min. If the MP part falls apart, finish easy — still a long run.` }
        : { title: `Long run ${km} km`, desc: `${km} km easy at ${range(p.long)}/km. Slow is the point.${km >= 20 ? ' Take water, and a gel every 35–45 min from the first hour.' : ''}` };
    case 'tuneup': {
      const half = halfForGoal(parseHms(goal) ?? 15000);
      return { title: 'Half-marathon tune-up', desc: `2 km easy warm-up, then 21.1 km hard but even (race one, or a solo time trial). About ${fmtHms(half)} or faster says ${goal.replace(/:00$/, '')} is on track. Easy week after.` };
    }
    case 'shakeout':
      return { title: `Shakeout ${km} km`, desc: `${km} km very easy (${fmtPace(p.easy[1])}/km or slower), 3–4 relaxed strides. Legs loose, nothing more.` };
    case 'race':
      return { title: 'RACE · marathon', desc: `42.2 km. Goal ${goal}: start at ${fmtPace(p.mp + 5)}/km for the first 5 km, settle at ${MP}, fuel every 30–40 min from the start. Run the first half with your head, the second with your heart.` };
  }
}
const fmtHms = (sec: number) => `${Math.floor(sec / 3600)}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}`;

function gymFor(week: number): { workout: PlanWorkoutId; day: number; adjust?: GymAdjust }[] {
  const base = PLAN_WORKOUTS.map((w) => ({ workout: w.id, day: w.day }));
  if (week <= 21) return base;
  if (week <= 23)
    return base.map((g) => (g.workout === 'athletic' ? { ...g, adjust: { half: true, note: 'Taper: half the sets, no box jumps.' } } : g));
  // Race week: upper days at two sets each, no Athletic, nothing in the last two days.
  return base.filter((g) => g.workout !== 'athletic').map((g) => ({ ...g, adjust: { maxSets: 2, note: 'Race week: 2 sets per exercise, nothing heavy.' } }));
}

/** The whole plan for a start Monday and goal. */
export function planWeeks(pref: Pick<MarathonPlanPref, 'start' | 'goal'>): PlanWeek[] {
  const p = pacesFor(pref.goal);
  return WEEKS.map((specs, i) => {
    const n = i + 1;
    const start = addDays(pref.start, 7 * i);
    const runs: PlanRun[] = specs.map((s) => {
      const { title, desc } = describe(s, p, pref.goal);
      return { kind: 'run', id: `m${n}-${s[0]}`, week: n, day: s[0], date: addDays(start, s[0]), type: s[1], title, km: s[2], desc, long: s[0] === 6, optional: s[0] === 4 && s[1] === 'easy' };
    });
    const gym: PlanGym[] = gymFor(n).map((g) => ({ kind: 'gym', id: `g${n}-${g.workout}`, week: n, day: g.day, date: addDays(start, g.day), workout: g.workout, title: PLAN_WORKOUTS.find((w) => w.id === g.workout)!.name, ...(g.adjust ? { adjust: g.adjust } : {}) }));
    return { n, start, phase: phaseOf(n), stepBack: STEP_BACK.includes(n), km: Math.round(runs.reduce((a, r) => a + r.km, 0) * 10) / 10, runs, gym, ...(WEEK_NOTES[n] ? { note: WEEK_NOTES[n] } : {}) };
  });
}

/** Week number (1–24) of a date in the plan, or null outside it. */
export function weekOf(start: string, date: string): number | null {
  if (date < start || date > raceDate(start)) return null;
  for (let n = 1; n <= PLAN_WEEKS; n++) if (date <= addDays(start, 7 * n - 1)) return n;
  return null;
}

// ─── matching what's logged ─────────────────────────────────────────────────

export interface LoggedRun {
  id: string;
  date: string;
  /** null when the run was logged without a distance. */
  km: number | null;
}
export interface LoggedGym {
  id: string;
  date: string;
  template: string | null;
  name: string;
}
export type SessionStatus = 'done' | 'missed' | 'today' | 'upcoming';
export interface SessionState {
  status: SessionStatus;
  /** The logged session it was matched to. */
  by?: { id: string; date: string; km?: number | null };
}

const dayDiff = (a: string, b: string) => Math.abs(weekdayIndex(a) - weekdayIndex(b));
const inWeek = (start: string, d: string) => d >= start && d <= addDays(start, 6);

/**
 * Planned runs of one week → the logged run each was matched to. The long run takes the longest
 * run of the week if it is at least 75% of the plan; then each required run takes a same-day run,
 * then the nearest unmatched one in the week (at least half the planned distance); optional runs last.
 */
export function matchRuns(week: Pick<PlanWeek, 'start' | 'runs'>, logged: LoggedRun[]): Map<string, LoggedRun> {
  const out = new Map<string, LoggedRun>();
  const pool = logged.filter((r) => inWeek(week.start, r.date)).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const used = new Set<string>();
  const take = (planId: string, r: LoggedRun) => (out.set(planId, r), used.add(r.id));
  const fits = (p: PlanRun, r: LoggedRun, sameDay: boolean) => (r.km == null ? sameDay : r.km >= p.km * 0.5);

  const long = week.runs.find((r) => r.long);
  if (long) {
    const longest = pool.filter((r) => r.km != null).reduce<LoggedRun | null>((m, r) => (!m || r.km! > m.km! ? r : m), null);
    if (longest && longest.km! >= long.km * 0.75) take(long.id, longest);
  }
  const rest = week.runs.filter((r) => !r.long);
  for (const group of [rest.filter((r) => !r.optional), rest.filter((r) => r.optional)]) {
    for (const p of group) {
      const same = pool.find((r) => !used.has(r.id) && r.date === p.date && fits(p, r, true));
      if (same) take(p.id, same);
    }
    // Moved runs: closest pairs first, so one far-off run doesn't take another day's nearer one.
    const pairs: { p: PlanRun; r: LoggedRun; d: number }[] = [];
    for (const p of group) if (!out.has(p.id)) for (const r of pool) if (!used.has(r.id) && fits(p, r, r.date === p.date)) pairs.push({ p, r, d: dayDiff(r.date, p.date) });
    pairs.sort((x, y) => x.d - y.d || x.p.day - y.p.day || x.r.date.localeCompare(y.r.date));
    for (const { p, r } of pairs) if (!out.has(p.id) && !used.has(r.id)) take(p.id, r);
  }
  return out;
}

/** Planned gym workouts of one week → the finished gym session made from that workout's template (or with its name). */
export function matchGym(start: string, planned: PlanGym[], logged: LoggedGym[], templates: Record<string, string>): Map<string, LoggedGym> {
  const out = new Map<string, LoggedGym>();
  const pool = logged.filter((g) => inWeek(start, g.date)).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const used = new Set<string>();
  const name = (w: PlanWorkoutId) => PLAN_WORKOUTS.find((x) => x.id === w)!.name.toLowerCase();
  const isIt = (p: PlanGym, g: LoggedGym) => (templates[p.workout] && g.template === templates[p.workout]) || g.name.trim().toLowerCase() === name(p.workout);
  for (const pass of [true, false])
    for (const p of planned) {
      if (out.has(p.id)) continue;
      const hit = pool.find((g) => !used.has(g.id) && isIt(p, g) && (!pass || g.date === p.date));
      if (hit) (out.set(p.id, hit), used.add(hit.id));
    }
  return out;
}

const stateOf = (date: string, today: string, by: SessionState['by']): SessionState =>
  by ? { status: 'done', by } : { status: date < today ? 'missed' : date === today ? 'today' : 'upcoming' };

export type WeekStatus = 'done' | 'partial' | 'missed' | 'now' | 'upcoming';
export interface WeekState {
  n: number;
  status: WeekStatus;
  /** Required sessions done / planned. */
  done: number;
  of: number;
  /** Running km logged that week. */
  km: number;
}
export type PhaseStatus = 'cleared' | 'active' | 'over' | 'ahead';
export interface PhaseState {
  phase: PhaseInfo;
  status: PhaseStatus;
  done: number;
  of: number;
}
export interface MarathonStatus {
  weeks: PlanWeek[];
  race: string;
  sessions: Map<string, SessionState>;
  week: Map<number, WeekState>;
  phases: PhaseState[];
  /** The plan week today is in (0 before the start, 25 after race day). */
  current: number;
}

export function weekStatus(start: string, done: number, of: number, today: string): WeekStatus {
  const end = addDays(start, 6);
  if (done >= of && of > 0) return 'done';
  if (today < start) return 'upcoming';
  if (today <= end) return 'now';
  return done === 0 ? 'missed' : 'partial';
}

/** Phase rule (shown on screen): cleared once its last long run is done and at least 80% of its runs are. */
export const PHASE_CLEAR = 0.8;

/** Everything about the marathon plan for what's logged, as of `today`. */
export function marathonStatus(pref: MarathonPlanPref, runs: LoggedRun[], gyms: LoggedGym[], templates: Record<string, string>, today: string): MarathonStatus {
  const weeks = planWeeks(pref);
  const sessions = new Map<string, SessionState>();
  const week = new Map<number, WeekState>();
  for (const w of weeks) {
    const m = matchRuns(w, runs);
    for (const r of w.runs) {
      const hit = m.get(r.id);
      sessions.set(r.id, stateOf(r.date, today, hit && { id: hit.id, date: hit.date, km: hit.km }));
    }
    const g = matchGym(w.start, w.gym, gyms, templates);
    for (const s of w.gym) {
      const hit = g.get(s.id);
      sessions.set(s.id, stateOf(s.date, today, hit && { id: hit.id, date: hit.date }));
    }
    const req = w.runs.filter((r) => !r.optional);
    const done = req.filter((r) => sessions.get(r.id)!.status === 'done').length;
    const km = runs.filter((r) => inWeek(w.start, r.date)).reduce((a, r) => a + (r.km ?? 0), 0);
    week.set(w.n, { n: w.n, status: weekStatus(w.start, done, req.length, today), done, of: req.length, km: Math.round(km * 10) / 10 });
  }
  const phases = PHASES.map((ph): PhaseState => {
    const ws = weeks.filter((w) => w.n >= ph.from && w.n <= ph.to);
    const req = ws.flatMap((w) => w.runs.filter((r) => !r.optional));
    const done = req.filter((r) => sessions.get(r.id)!.status === 'done').length;
    const lastLong = ws[ws.length - 1].runs.find((r) => r.long)!;
    const first = ws[0].start;
    const last = addDays(ws[ws.length - 1].start, 6);
    const cleared = sessions.get(lastLong.id)!.status === 'done' && done >= Math.ceil(req.length * PHASE_CLEAR);
    return { phase: ph, status: cleared ? 'cleared' : today < first ? 'ahead' : today > last ? 'over' : 'active', done, of: req.length };
  });
  const race = raceDate(pref.start);
  const current = today < pref.start ? 0 : today > race ? PLAN_WEEKS + 1 : weekOf(pref.start, today)!;
  return { weeks, race, sessions, week, phases, current };
}

// ─── court sessions ─────────────────────────────────────────────────────────

/**
 * A quality run or the Athletic day on the same day as, or the day before, a volleyball/tennis
 * session: worth a look (move one, or keep it easy).
 */
export function courtNotes(sessions: PlanSession[], courtDays: Set<string>): { id: string; date: string; text: string }[] {
  const out: { id: string; date: string; text: string }[] = [];
  for (const s of sessions) {
    const hard = s.kind === 'gym' ? s.workout === 'athletic' : QUALITY.includes(s.type) || s.type === 'tuneup' || s.type === 'race';
    if (!hard) continue;
    const same = courtDays.has(s.date);
    const before = courtDays.has(addDays(s.date, 1));
    if (!same && !before) continue;
    const what = s.kind === 'gym' ? 'The Athletic day' : s.title;
    out.push({ id: s.id, date: s.date, text: `${what} is ${same ? 'on a court day' : 'the day before a court session'}. Move one of them, or keep ${s.kind === 'gym' ? 'the jumps light' : 'it easy'} — jumping and quality running both load the same legs.` });
  }
  return out;
}
