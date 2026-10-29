/**
 * Quests, derived like everything else. Each day, week and month draws three quests from a fixed
 * pool, seeded by the date, so every device shows the same ones and nothing is stored. Progress
 * comes from the records of that period; a quest completes on the day its count first reaches the
 * goal, and its XP is an event keyed by period and quest, so it can't be earned twice.
 */
import { addDays, monthEnd, monthStart, weekStart } from '../log/dates';
import { TIMED_SECTIONS, type SectionId } from '../../data/types';
import { bedDelta, RULES, sectionOf, type ProgressInput, type XpEvent, type XpSection } from './engine';

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
}

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

export const QUEST_POOLS: Record<QuestPeriod, QuestDef[]> = {
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

// ─── seeded draw ────────────────────────────────────────────────────────────

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The period's three quests: a seeded shuffle of the pool, the same on every device. */
export function drawQuests(period: QuestPeriod, start: string): QuestDef[] {
  let seed = hash(`${period}:${start}`);
  const rand = () => {
    seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return seed / 4294967296;
  };
  const pool = [...QUEST_POOLS[period]];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, PER_PERIOD);
}

// ─── facts per day ──────────────────────────────────────────────────────────

const empty = (): Facts => ({ minutes: 0, sessions: 0, longest: 0, min: {}, n: {}, tasks: 0, nights: 0, bedKept: 0, screens: 0, screenUnder: 0, cabinet: 0, activeDays: 0, sections: new Set() });

/** Facts for every day that has something, up to today. */
export function dayFacts(input: ProgressInput): Map<string, Facts> {
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
  }
  for (const m of input.metrics) {
    if (m.date > input.today) continue;
    const f = at(m.date);
    if (m.metric === 'sleep') {
      f.nights++;
      f.sections.add('sleep');
      const night = input.nights.get(m.date);
      if (night?.bed && !night.deleted_at && Math.abs(bedDelta({ date: m.date, bed: night.bed }, input.sleep)) <= RULES.bedtimeWindow) f.bedKept++;
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
  for (const f of days.values()) f.activeDays = 1;
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

/** Every quest set from QUESTS_FROM to today, oldest first. */
export function questHistory(input: ProgressInput, days = dayFacts(input)): QuestSet[] {
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
