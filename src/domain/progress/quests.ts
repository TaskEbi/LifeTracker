/**
 * Quests, derived like everything else. Each day, week and month draws three quests from a fixed
 * pool, seeded by the date, so every device shows the same ones and nothing is stored. Progress
 * comes from the records of that period; a quest completes on the day its count first reaches the
 * goal, and its XP is an event keyed by period and quest, so it can't be earned twice.
 */
import { addDays, monthEnd, monthStart, weekdayIndex, weekStart } from '../log/dates';
import { TIMED_SECTIONS, type SectionId } from '../../data/types';
import { bedDelta, RULES, sectionOf, wakeDelta, type ProgressInput, type XpEvent, type XpSection } from './engine';

export type QuestPeriod = 'daily' | 'weekly' | 'monthly';

/** Quests start here: earlier history earns no quest XP, so years of old logs don't flood the levels. */
export const QUESTS_FROM = '2026-10-01';

export const QUEST_XP: Record<QuestPeriod, number> = { daily: 15, weekly: 50, monthly: 150 };
/** Extra for finishing all three of a period. */
export const SWEEP_XP: Record<QuestPeriod, number> = { daily: 20, weekly: 60, monthly: 200 };
const PER_PERIOD = 3;

/** What one stretch of days added up to. */
export interface Facts {
  minutes: number;
  sessions: number;
  longest: number;
  /** Minutes and sessions per section (general included). */
  min: Partial<Record<XpSection, number>>;
  n: Partial<Record<XpSection, number>>;
  tasks: number;
  nights: number;
  bedKept: number;
  screens: number;
  screenUnder: number;
  cabinet: number;
  /** Days with anything logged (rest days don't count here). */
  activeDays: number;
  /** Sections touched: timed sections with a session, plus sleep/screen when logged. */
  sections: Set<SectionId>;
  /** Saturdays and Sundays with anything logged. */
  weekend: number;
  /** Mornings up no later than `WAKE_WINDOW` minutes after the planned wake. */
  wakeKept: number;
  /** Nights of `FULL_NIGHT` minutes or more. */
  fullNights: number;
  /** Gym sets marked done. */
  sets: number;
  /** Sports distance, km. */
  km: number;
  /** Coding problems solved (when the session says). */
  solved: number;
}

/** Up on time: no later than this many minutes after the planned wake. */
export const WAKE_WINDOW = 15;
/** A full night: 7½ hours or more. */
export const FULL_NIGHT = 450;

export interface QuestDef {
  id: string;
  title: string;
  desc: string;
  goal: number | ((input: ProgressInput, start: string) => number);
  /** Colour; quests about several sections use the general signal colour. */
  section?: SectionId;
  unit?: string;
  measure: (f: Facts) => number;
}

const sum = (f: Facts, ids: XpSection[], key: 'min' | 'n') => ids.reduce((s, id) => s + (f[key][id] ?? 0), 0);
const timedCount = (f: Facts) => [...f.sections].filter((s) => (TIMED_SECTIONS as readonly string[]).includes(s)).length;

/**
 * The first pools, frozen: a draw is a seeded shuffle of its pool and quest XP since QUESTS_FROM
 * comes from those draws, so changing these would rewrite past quests and current XP. Periods that
 * start before QUESTS_V2_FROM keep drawing from here.
 */
export const QUEST_POOLS_V1: Record<QuestPeriod, QuestDef[]> = {
  daily: [
    { id: 'show-up', title: 'Show up', desc: 'Log any session', goal: 1, measure: (f) => f.sessions },
    { id: 'focus', title: 'Deep focus', desc: '45 minutes logged in total', goal: 45, unit: 'min', measure: (f) => f.minutes },
    { id: 'double', title: 'Double track', desc: 'Activity in 2 different sections', goal: 2, measure: (f) => f.sections.size },
    { id: 'tasks', title: 'Tick two', desc: 'Complete 2 tasks', goal: 2, measure: (f) => f.tasks },
    { id: 'night', title: 'Night log', desc: "Log last night's sleep", goal: 1, section: 'sleep', measure: (f) => f.nights },
    { id: 'screen', title: 'Screen check', desc: "Log today's screen time", goal: 1, section: 'screen', measure: (f) => f.screens },
    { id: 'long', title: 'Long haul', desc: 'One session of 30 minutes or more', goal: 30, unit: 'min', measure: (f) => f.longest },
    { id: 'move', title: 'Get moving', desc: 'A sports or gym session', goal: 1, section: 'sports', measure: (f) => sum(f, ['sports', 'gym'], 'n') },
    { id: 'brain', title: 'Brain work', desc: '30 minutes of study, coding or chess', goal: 30, unit: 'min', section: 'study', measure: (f) => sum(f, ['study', 'coding', 'chess'], 'min') },
    { id: 'bow', title: 'Bow time', desc: '20 minutes of violin', goal: 20, unit: 'min', section: 'violin', measure: (f) => f.min.violin ?? 0 },
    { id: 'bed', title: 'On time', desc: 'In bed within 30 min of your plan', goal: 1, section: 'sleep', measure: (f) => f.bedKept },
  ],
  weekly: [
    { id: 'days', title: 'Five-day week', desc: 'Something logged on 5 days', goal: 5, unit: 'days', measure: (f) => f.activeDays },
    { id: 'hours', title: 'Five hours', desc: '5 hours logged this week', goal: 300, unit: 'min', measure: (f) => f.minutes },
    { id: 'rounded', title: 'Well rounded', desc: 'Activity in 4 different sections', goal: 4, measure: (f) => f.sections.size },
    { id: 'list', title: 'Clear the list', desc: 'Complete 8 tasks', goal: 8, measure: (f) => f.tasks },
    { id: 'nights', title: 'Sleep diary', desc: 'Log 5 nights', goal: 5, section: 'sleep', measure: (f) => f.nights },
    { id: 'steady', title: 'Steady bedtime', desc: '4 nights within 30 min of your plan', goal: 4, section: 'sleep', measure: (f) => f.bedKept },
    { id: 'workouts', title: 'Three workouts', desc: '3 sports or gym sessions', goal: 3, section: 'gym', measure: (f) => sum(f, ['sports', 'gym'], 'n') },
    { id: 'brain', title: 'Brain week', desc: '3 hours of study, coding or chess', goal: 180, unit: 'min', section: 'coding', measure: (f) => sum(f, ['study', 'coding', 'chess'], 'min') },
    { id: 'violin', title: 'Violin target', desc: "Reach this week's violin target", goal: (input, start) => (input.targetsAt ? input.targetsAt(start) : input.targets).violinWeek, unit: 'min', section: 'violin', measure: (f) => f.min.violin ?? 0 },
  ],
  monthly: [
    { id: 'days', title: 'Twenty days', desc: 'Something logged on 20 days', goal: 20, unit: 'days', measure: (f) => f.activeDays },
    { id: 'hours', title: 'Thirty hours', desc: '30 hours logged this month', goal: 1800, unit: 'min', measure: (f) => f.minutes },
    { id: 'spectrum', title: 'Full spectrum', desc: 'A session in all 6 timed sections', goal: 6, measure: timedCount },
    { id: 'nights', title: 'Night owl, tamed', desc: 'Log 20 nights', goal: 20, section: 'sleep', measure: (f) => f.nights },
    { id: 'tasks', title: 'Task machine', desc: 'Complete 25 tasks', goal: 25, measure: (f) => f.tasks },
    { id: 'sessions', title: 'Forty sessions', desc: '40 sessions logged', goal: 40, measure: (f) => f.sessions },
    { id: 'bedtime', title: 'Body clock', desc: '15 nights within 30 min of your plan', goal: 15, section: 'sleep', measure: (f) => f.bedKept },
  ],
};

/** Periods starting on or after this day draw from the current, larger pools. */
export const QUESTS_V2_FROM = '2026-10-30';

const v1 = (period: QuestPeriod) => QUEST_POOLS_V1[period];
const secs = (f: Facts, s: XpSection) => f.n[s] ?? 0;
const mins = (f: Facts, s: XpSection) => f.min[s] ?? 0;
/** Logged both sleep and screen time. */
const checkIns = (f: Facts) => Math.min(f.nights, 1) + Math.min(f.screens, 1);

/** The current pools: the first ones plus more. None depends on an optional target. */
export const QUEST_POOLS: Record<QuestPeriod, QuestDef[]> = {
  daily: [
    ...v1('daily'),
    { id: 'code', title: 'Compile', desc: 'A coding session', goal: 1, section: 'coding', measure: (f) => secs(f, 'coding') },
    { id: 'books', title: 'Hit the books', desc: '25 minutes of study', goal: 25, unit: 'min', section: 'study', measure: (f) => mins(f, 'study') },
    { id: 'board', title: 'Board time', desc: 'A chess session', goal: 1, section: 'chess', measure: (f) => secs(f, 'chess') },
    { id: 'iron', title: 'Iron call', desc: 'A gym session', goal: 1, section: 'gym', measure: (f) => secs(f, 'gym') },
    { id: 'out', title: 'Out the door', desc: 'A sports session', goal: 1, section: 'sports', measure: (f) => secs(f, 'sports') },
    { id: 'triple', title: 'Triple threat', desc: 'Activity in 3 different sections', goal: 3, measure: (f) => f.sections.size },
    { id: 'hour', title: 'The full hour', desc: '60 minutes logged in total', goal: 60, unit: 'min', measure: (f) => f.minutes },
    { id: 'ninety', title: 'Training arc', desc: '90 minutes logged in total', goal: 90, unit: 'min', measure: (f) => f.minutes },
    { id: 'again', title: 'Back for more', desc: 'Log 2 sessions', goal: 2, measure: (f) => f.sessions },
    { id: 'one-task', title: 'One down', desc: 'Complete a task', goal: 1, measure: (f) => f.tasks },
    { id: 'hat-trick', title: 'Hat-trick', desc: 'Complete 3 tasks', goal: 3, measure: (f) => f.tasks },
    { id: 'rise', title: 'Rise on time', desc: `Up within ${WAKE_WINDOW} min of your planned wake`, goal: 1, section: 'sleep', measure: (f) => f.wakeKept },
    { id: 'full-tank', title: 'Full tank', desc: 'A night of 7½ hours or more', goal: 1, section: 'sleep', measure: (f) => f.fullNights },
    { id: 'check-ins', title: 'Check-ins', desc: 'Log both your sleep and your screen time', goal: 2, measure: checkIns },
    { id: 'sets', title: 'Sets on sets', desc: '12 gym sets done', goal: 12, section: 'gym', measure: (f) => f.sets },
    { id: 'five-k', title: 'Five k', desc: '5 km of running, cycling or swimming', goal: 5, unit: 'km', section: 'sports', measure: (f) => f.km },
    { id: 'curio', title: 'Curio find', desc: 'Add something to the cabinet', goal: 1, section: 'cabinet', measure: (f) => f.cabinet },
    { id: 'long-bow', title: 'Long bow', desc: '30 minutes of violin', goal: 30, unit: 'min', section: 'violin', measure: (f) => mins(f, 'violin') },
    { id: 'deep-code', title: 'Deep code', desc: '45 minutes of coding', goal: 45, unit: 'min', section: 'coding', measure: (f) => mins(f, 'coding') },
    { id: 'tactics', title: 'Tactics', desc: '20 minutes of chess', goal: 20, unit: 'min', section: 'chess', measure: (f) => mins(f, 'chess') },
  ],
  weekly: [
    ...v1('weekly'),
    { id: 'six-days', title: 'Six-day week', desc: 'Something logged on 6 days', goal: 6, unit: 'days', measure: (f) => f.activeDays },
    { id: 'ten-hours', title: 'Ten hours', desc: '10 hours logged this week', goal: 600, unit: 'min', measure: (f) => f.minutes },
    { id: 'five-fronts', title: 'Five fronts', desc: 'Activity in 5 different sections', goal: 5, measure: (f) => f.sections.size },
    { id: 'weekend', title: 'Weekend warrior', desc: 'Something logged on Saturday and Sunday', goal: 2, unit: 'days', measure: (f) => f.weekend },
    { id: 'gym-two', title: 'Iron twice', desc: '2 gym sessions', goal: 2, section: 'gym', measure: (f) => secs(f, 'gym') },
    { id: 'twenty-k', title: 'Twenty k', desc: '20 km of running, cycling or swimming', goal: 20, unit: 'km', section: 'sports', measure: (f) => f.km },
    { id: 'coder', title: 'Coder week', desc: '3 coding sessions', goal: 3, section: 'coding', measure: (f) => secs(f, 'coding') },
    { id: 'study-block', title: 'Study block', desc: '2 hours of study', goal: 120, unit: 'min', section: 'study', measure: (f) => mins(f, 'study') },
    { id: 'boards', title: 'Three boards', desc: '3 chess sessions', goal: 3, section: 'chess', measure: (f) => secs(f, 'chess') },
    { id: 'bow-three', title: 'Three rehearsals', desc: '3 violin sessions', goal: 3, section: 'violin', measure: (f) => secs(f, 'violin') },
    { id: 'mornings', title: 'Morning discipline', desc: `Up within ${WAKE_WINDOW} min of your planned wake on 4 days`, goal: 4, section: 'sleep', measure: (f) => f.wakeKept },
    { id: 'rested', title: 'Rested week', desc: '4 nights of 7½ hours or more', goal: 4, section: 'sleep', measure: (f) => f.fullNights },
    { id: 'blitz', title: 'Task blitz', desc: 'Complete 12 tasks', goal: 12, measure: (f) => f.tasks },
    { id: 'forty-sets', title: 'Forty sets', desc: '40 gym sets done', goal: 40, section: 'gym', measure: (f) => f.sets },
    { id: 'twelve', title: 'Twelve sessions', desc: '12 sessions logged', goal: 12, measure: (f) => f.sessions },
    { id: 'screen-diary', title: 'Screen diary', desc: 'Log your screen time on 5 days', goal: 5, section: 'screen', measure: (f) => f.screens },
    { id: 'curios', title: 'Three curios', desc: 'Add 3 things to the cabinet', goal: 3, section: 'cabinet', measure: (f) => f.cabinet },
    { id: 'long-one', title: 'The long one', desc: 'One session of 90 minutes or more', goal: 90, unit: 'min', measure: (f) => f.longest },
  ],
  monthly: [
    ...v1('monthly'),
    { id: 'days25', title: 'Twenty-five days', desc: 'Something logged on 25 days', goal: 25, unit: 'days', measure: (f) => f.activeDays },
    { id: 'hours50', title: 'Fifty hours', desc: '50 hours logged this month', goal: 3000, unit: 'min', measure: (f) => f.minutes },
    { id: 'screen-log', title: 'Screen ledger', desc: 'Log your screen time on 20 days', goal: 20, section: 'screen', measure: (f) => f.screens },
    { id: 'weekends', title: 'Weekend regular', desc: 'Something logged on 6 weekend days', goal: 6, unit: 'days', measure: (f) => f.weekend },
    { id: 'gym8', title: 'Iron month', desc: '8 gym sessions', goal: 8, section: 'gym', measure: (f) => secs(f, 'gym') },
    { id: 'km60', title: 'Sixty k', desc: '60 km of running, cycling or swimming', goal: 60, unit: 'km', section: 'sports', measure: (f) => f.km },
    { id: 'violin10h', title: 'Ten hours of violin', desc: '10 hours of violin', goal: 600, unit: 'min', section: 'violin', measure: (f) => mins(f, 'violin') },
    { id: 'coding10h', title: 'Ten hours of code', desc: '10 hours of coding', goal: 600, unit: 'min', section: 'coding', measure: (f) => mins(f, 'coding') },
    { id: 'study10h', title: 'Ten hours of study', desc: '10 hours of study', goal: 600, unit: 'min', section: 'study', measure: (f) => mins(f, 'study') },
    { id: 'chess10', title: 'Ten boards', desc: '10 chess sessions', goal: 10, section: 'chess', measure: (f) => secs(f, 'chess') },
    { id: 'sports10', title: 'Ten outings', desc: '10 sports sessions', goal: 10, section: 'sports', measure: (f) => secs(f, 'sports') },
    { id: 'wake15', title: 'Dawn patrol', desc: `Up within ${WAKE_WINDOW} min of your planned wake on 15 days`, goal: 15, section: 'sleep', measure: (f) => f.wakeKept },
    { id: 'full15', title: 'Well charged', desc: '15 nights of 7½ hours or more', goal: 15, section: 'sleep', measure: (f) => f.fullNights },
    { id: 'sets150', title: 'Iron ledger', desc: '150 gym sets done', goal: 150, section: 'gym', measure: (f) => f.sets },
    { id: 'curio10', title: 'Collector', desc: 'Add 10 things to the cabinet', goal: 10, section: 'cabinet', measure: (f) => f.cabinet },
    { id: 'tasks40', title: 'Task engine', desc: 'Complete 40 tasks', goal: 40, measure: (f) => f.tasks },
  ],
};

/** The pool a period draws from: the first pools before QUESTS_V2_FROM, the current ones from then on. */
export const questPool = (period: QuestPeriod, start: string): QuestDef[] => (start >= QUESTS_V2_FROM ? QUEST_POOLS : QUEST_POOLS_V1)[period];

// ─── seeded draw ────────────────────────────────────────────────────────────

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The period's three quests: a seeded shuffle of its pool (`questPool`), the same on every device. */
export function drawQuests(period: QuestPeriod, start: string): QuestDef[] {
  let seed = hash(`${period}:${start}`);
  const rand = () => {
    seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return seed / 4294967296;
  };
  const pool = [...questPool(period, start)];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, PER_PERIOD);
}

// ─── facts per day ──────────────────────────────────────────────────────────

const empty = (): Facts => ({ minutes: 0, sessions: 0, longest: 0, min: {}, n: {}, tasks: 0, nights: 0, bedKept: 0, screens: 0, screenUnder: 0, cabinet: 0, activeDays: 0, sections: new Set(), weekend: 0, wakeKept: 0, fullNights: 0, sets: 0, km: 0, solved: 0 });

const factsMemo = new WeakMap<ProgressInput, Map<string, Facts>>();

/**
 * Facts for every day that has something, up to today. Worked out once per input (inputs are
 * treated as immutable): quests, bosses, achievements and the recap all start from them.
 */
export function dayFacts(input: ProgressInput): Map<string, Facts> {
  let days = factsMemo.get(input);
  if (!days) factsMemo.set(input, (days = buildDayFacts(input)));
  return days;
}

const positive = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

/** Gym sets marked done in a session's detail. */
export function doneSets(data: Record<string, unknown>): number {
  if (!Array.isArray(data.exercises)) return 0;
  let n = 0;
  for (const x of data.exercises as { sets?: { done?: boolean }[] }[]) if (Array.isArray(x?.sets)) for (const s of x.sets) if (s?.done) n++;
  return n;
}

function buildDayFacts(input: ProgressInput): Map<string, Facts> {
  const days = new Map<string, Facts>();
  const at = (d: string) => {
    let f = days.get(d);
    if (!f) days.set(d, (f = empty()));
    return f;
  };
  const seen = new Set<string>();
  for (const e of input.entries) {
    if (e.date > input.today || seen.has(e.id)) continue;
    seen.add(e.id);
    const f = at(e.date);
    const s = sectionOf(e, input);
    f.minutes += e.minutes;
    f.sessions++;
    f.longest = Math.max(f.longest, e.minutes);
    f.min[s] = (f.min[s] ?? 0) + e.minutes;
    f.n[s] = (f.n[s] ?? 0) + 1;
    if (s !== 'general' && s !== 'quests') f.sections.add(s);
    const detail = input.details.get(e.id);
    const data = detail && !detail.deleted_at ? detail.data : null;
    if (!data) continue;
    if (s === 'gym') f.sets += doneSets(data);
    else if (s === 'sports') f.km += positive(data.km);
    else if (s === 'coding') f.solved += positive(data.solved);
  }
  for (const m of input.metrics) {
    if (m.date > input.today) continue;
    const f = at(m.date);
    if (m.metric === 'sleep') {
      f.nights++;
      f.sections.add('sleep');
      const night = input.nights.get(m.date);
      if (night?.bed && !night.deleted_at && Math.abs(bedDelta({ date: m.date, bed: night.bed }, input.sleep)) <= RULES.bedtimeWindow) f.bedKept++;
      if (night?.wake && !night.deleted_at && wakeDelta({ date: m.date, wake: night.wake }, input.sleep) <= WAKE_WINDOW) f.wakeKept++;
      if (m.minutes >= FULL_NIGHT) f.fullNights++;
    } else if (m.metric === 'screen') {
      f.screens++;
      f.sections.add('screen');
      const goal = (input.targetsAt ? input.targetsAt(weekStart(m.date)) : input.targets).screenDay;
      if (goal != null && m.minutes <= goal) f.screenUnder++;
    }
  }
  for (const t of input.todos) {
    if (!t.done_at) continue;
    const d = input.dayOf(t.done_at);
    if (d <= input.today) at(d).tasks++;
  }
  for (const d of input.cabinetDays) if (d <= input.today) at(d).cabinet++;
  for (const [d, f] of days) {
    f.activeDays = 1;
    f.weekend = weekdayIndex(d) >= 5 ? 1 : 0;
  }
  return days;
}

function add(into: Facts, f: Facts) {
  into.minutes += f.minutes;
  into.sessions += f.sessions;
  into.longest = Math.max(into.longest, f.longest);
  for (const [k, v] of Object.entries(f.min) as [XpSection, number][]) into.min[k] = (into.min[k] ?? 0) + v;
  for (const [k, v] of Object.entries(f.n) as [XpSection, number][]) into.n[k] = (into.n[k] ?? 0) + v;
  into.tasks += f.tasks;
  into.nights += f.nights;
  into.bedKept += f.bedKept;
  into.screens += f.screens;
  into.screenUnder += f.screenUnder;
  into.cabinet += f.cabinet;
  into.activeDays += f.activeDays;
  into.weekend += f.weekend;
  into.wakeKept += f.wakeKept;
  into.fullNights += f.fullNights;
  into.sets += f.sets;
  into.km += f.km;
  into.solved += f.solved;
  for (const s of f.sections) into.sections.add(s);
}

// ─── quests of a period ─────────────────────────────────────────────────────

export interface Quest {
  key: string;
  id: string;
  period: QuestPeriod;
  title: string;
  desc: string;
  section?: SectionId;
  unit?: string;
  goal: number;
  progress: number;
  xp: number;
  /** The day it was completed, or null. */
  doneOn: string | null;
}

export interface QuestSet {
  period: QuestPeriod;
  start: string;
  end: string;
  quests: Quest[];
  /** The day all three were done, or null. */
  sweptOn: string | null;
}

export const periodStart = (period: QuestPeriod, date: string) => (period === 'daily' ? date : period === 'weekly' ? weekStart(date) : monthStart(date));
const periodEnd = (period: QuestPeriod, start: string) => (period === 'daily' ? start : period === 'weekly' ? addDays(start, 6) : monthEnd(start));
const nextStart = (period: QuestPeriod, start: string) => addDays(periodEnd(period, start), 1);

export function questSet(input: ProgressInput, period: QuestPeriod, start: string, days = dayFacts(input)): QuestSet {
  const end = periodEnd(period, start);
  const defs = drawQuests(period, start);
  const goals = defs.map((q) => (typeof q.goal === 'function' ? q.goal(input, start) : q.goal));
  const doneOn: (string | null)[] = defs.map(() => null);
  const acc = empty();
  const last = end < input.today ? end : input.today;
  for (let d = start; d <= last; d = addDays(d, 1)) {
    const f = days.get(d);
    if (!f) continue;
    add(acc, f);
    defs.forEach((q, i) => {
      if (!doneOn[i] && q.measure(acc) >= goals[i]) doneOn[i] = d;
    });
  }
  const quests = defs.map<Quest>((q, i) => ({
    key: `quest:${period}:${start}:${q.id}`,
    id: q.id,
    period,
    title: q.title,
    desc: q.desc,
    section: q.section,
    unit: q.unit,
    goal: goals[i],
    progress: Math.min(goals[i], q.measure(acc)),
    xp: QUEST_XP[period],
    doneOn: doneOn[i],
  }));
  const sweptOn = doneOn.every(Boolean) ? [...(doneOn as string[])].sort().at(-1)! : null;
  return { period, start, end, quests, sweptOn };
}

const historyMemo = new WeakMap<ProgressInput, QuestSet[]>();

/** Every quest set from QUESTS_FROM to today, oldest first. Worked out once per input. */
export function questHistory(input: ProgressInput, days?: Map<string, Facts>): QuestSet[] {
  let out = historyMemo.get(input);
  if (!out) historyMemo.set(input, (out = buildHistory(input, days ?? dayFacts(input))));
  return out;
}

function buildHistory(input: ProgressInput, days: Map<string, Facts>): QuestSet[] {
  const out: QuestSet[] = [];
  if (input.today < QUESTS_FROM) return out;
  for (const period of ['daily', 'weekly', 'monthly'] as const) {
    let start = periodStart(period, QUESTS_FROM);
    // Partial first periods don't count: a week or month starts on or after QUESTS_FROM.
    if (start < QUESTS_FROM) start = nextStart(period, start);
    for (; start <= input.today; start = nextStart(period, start)) out.push(questSet(input, period, start, days));
  }
  return out;
}

/** The XP quests have earned: one event per completed quest and per full sweep. */
export function questEvents(input: ProgressInput, history = questHistory(input)): XpEvent[] {
  const out: XpEvent[] = [];
  const label = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
  for (const set of history) {
    for (const q of set.quests) if (q.doneOn) out.push({ key: q.key, date: q.doneOn, section: 'quests', xp: q.xp, reason: `${label[set.period]} quest: ${q.title}` });
    if (set.sweptOn) out.push({ key: `quest:${set.period}:${set.start}:sweep`, date: set.sweptOn, section: 'quests', xp: SWEEP_XP[set.period], reason: `All ${label[set.period].toLowerCase()} quests done` });
  }
  return out;
}

/** Today's board: the current day, week and month. */
export function questBoard(input: ProgressInput): Record<QuestPeriod, QuestSet> {
  const days = dayFacts(input);
  return {
    daily: questSet(input, 'daily', input.today, days),
    weekly: questSet(input, 'weekly', weekStart(input.today), days),
    monthly: questSet(input, 'monthly', monthStart(input.today), days),
  };
}
