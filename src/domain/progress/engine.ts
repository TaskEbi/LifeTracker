/**
 * Progression, derived. XP, levels, streaks and achievements are computed from the records
 * themselves, never stored. Every award is an event with a stable key tied to the record (or week)
 * that earned it, so syncing, importing or re-saving can't count anything twice, and editing a
 * record changes its XP instead of adding more. The values are illustrative and easy to retune here.
 */
import { addDays, weekdayIndex, weekStart } from '../log/dates';
import type { LogDayMetric, LogEntry, LtBucket, LtDetail, LtNight, LtRecord, SectionId, Todo } from '../../data/types';
import type { SleepSchedule, Targets } from '../prefs';
import type { PlansState } from '../plans/types';
import { futureXp } from '../future/plan';
import { bossEvents } from './boss';
import { questEvents } from './quests';

/** Where XP comes from: a section, Daily Log topics no section uses, or quests. */
export type XpSection = SectionId | 'general' | 'quests';

export interface XpEvent {
  /** Stable identity: the same record always produces the same key. */
  key: string;
  date: string;
  section: XpSection;
  xp: number;
  reason: string;
}

export interface ProgressInput {
  today: string;
  /** Live entries only. */
  entries: LogEntry[];
  /** Section of each Daily Log topic id (subcategories included); unmapped topics are general. */
  topicSection: Map<string, SectionId>;
  details: Map<string, LtDetail>;
  /** Live metrics only. */
  metrics: LogDayMetric[];
  nights: Map<string, LtNight>;
  /** Live tasks only. */
  todos: Todo[];
  /** Local calendar day of a timestamp (the Daily Log time zone). */
  dayOf: (iso: string) => string;
  restDays: string[];
  /** Creation days of cabinet items (live, not examples). */
  cabinetDays: string[];
  /** Current targets (for display). */
  targets: Targets;
  /** Targets in force in the week starting this Monday (past weeks keep theirs). */
  targetsAt?: (monday: string) => Targets;
  sleep: SleepSchedule;
  /** The user's training plans (lt_prefs 'plans'); absent in old fixtures. */
  plans?: PlansState;
  /** Live bucket-list items; absent in old fixtures. */
  bucket?: LtBucket[];
  /** Live Future records (shortlist, tests, essays, plans); absent in old fixtures. */
  future?: LtRecord[];
}

const targetsFor = (input: ProgressInput, date: string) => (input.targetsAt ? input.targetsAt(weekStart(date)) : input.targets);

// ─── the rules ──────────────────────────────────────────────────────────────

export const RULES = {
  /** 1 XP per this many minutes… */
  minutesPerXp: 2,
  /** …capped per entry, so a longer session isn't always better. */
  timeCapPerEntry: 45,
  /** And per section per day, across entries. */
  timeCapPerDay: 60,
  entryLogged: 10,
  gymCompleted: 40,
  gymSetsCap: 20,
  gymCheckIn: 5,
  violinWeekTarget: 30,
  gymWeekTarget: 15,
  sportsWeekTarget: 15,
  nightLogged: 10,
  bedtimeKept: 10,
  bedtimeWindow: 30,
  screenLogged: 5,
  screenUnderTarget: 10,
  taskDone: 5,
  cabinetItem: 2,
  cabinetPerDay: 10,
  bucketDone: 50,
  /** Weekly uni-prep target (Future) reached. */
  futureWeekTarget: 25,
  /** Missed days in a row the day streak absorbs: one missed day never breaks it, two do. */
  streakBuffer: 1,
} as const;

/** XP to go from level n to n + 1. Small steps early, so the first levels come quickly. */
const SECTION_STEP = (n: number) => 60 + 15 * n;
const OVERALL_STEP = (n: number) => 120 + 25 * n;

/**
 * The character's forms and the overall level each one starts at. Each form adds hardware and a
 * colour (`c`, `c2`) the drone wears.
 */
export const STAGES = [
  { level: 1, name: 'Core', c: '#f2541b', c2: '#ffb347' },
  { level: 3, name: 'Ring', c: '#0ea5a4', c2: '#5eead4' },
  { level: 6, name: 'Rotor', c: '#2563eb', c2: '#7dd3fc' },
  { level: 10, name: 'Array', c: '#7c3aed', c2: '#c4b5fd' },
  { level: 15, name: 'Halo', c: '#e0a100', c2: '#fde68a' },
  { level: 20, name: 'Prism', c: '#db2777', c2: '#67e8f9' },
  { level: 25, name: 'Ronin', c: '#dc2626', c2: '#f5f5f4' },
  { level: 30, name: 'Nova', c: '#ef4444', c2: '#fbbf24' },
  { level: 36, name: 'Blade', c: '#64748b', c2: '#38bdf8' },
  { level: 42, name: 'Aurora', c: '#10b981', c2: '#a78bfa' },
  { level: 48, name: 'Oni', c: '#b91c1c', c2: '#fb923c' },
  { level: 55, name: 'Titan', c: '#475569', c2: '#f59e0b' },
  { level: 62, name: 'Kitsune', c: '#f97316', c2: '#fef3c7' },
  { level: 70, name: 'Raijin', c: '#6366f1', c2: '#facc15' },
  { level: 78, name: 'Ryu', c: '#059669', c2: '#fde047' },
  { level: 86, name: 'Phoenix', c: '#ea580c', c2: '#fde047' },
  { level: 95, name: 'Shogun', c: '#1e293b', c2: '#eab308' },
  { level: 105, name: 'Eclipse', c: '#be123c', c2: '#fda4af' },
  { level: 115, name: 'Singularity', c: '#8b5cf6', c2: '#f472b6' },
  { level: 125, name: 'Kami', c: '#d4a017', c2: '#fffbea' },
] as const;

/** Overall rank titles by level. */
export const RANKS = [
  { level: 1, name: 'Rookie' },
  { level: 5, name: 'Initiate' },
  { level: 10, name: 'Apprentice' },
  { level: 15, name: 'Adept' },
  { level: 20, name: 'Specialist' },
  { level: 30, name: 'Expert' },
  { level: 40, name: 'Veteran' },
  { level: 50, name: 'Elite' },
  { level: 65, name: 'Master' },
  { level: 80, name: 'Grandmaster' },
  { level: 100, name: 'Legend' },
] as const;

/** Section rank titles by section level. */
export const SECTION_RANKS = [
  { level: 1, name: 'Novice' },
  { level: 5, name: 'Apprentice' },
  { level: 10, name: 'Adept' },
  { level: 15, name: 'Expert' },
  { level: 25, name: 'Master' },
  { level: 40, name: 'Grandmaster' },
  { level: 60, name: 'Legend' },
] as const;

const byLevel = <T extends { level: number }>(list: readonly T[], level: number): T => list.reduce((r, x) => (level >= x.level ? x : r), list[0]);
export const rankFor = (level: number) => byLevel(RANKS, level).name;
export const sectionRankFor = (level: number) => byLevel(SECTION_RANKS, level).name;

export interface LevelInfo {
  level: number;
  xp: number;
  into: number;
  need: number;
  pct: number;
  toNext: number;
}

function levelInfo(xp: number, step: (n: number) => number): LevelInfo {
  let level = 1;
  let floor = 0;
  while (xp >= floor + step(level)) {
    floor += step(level);
    level++;
  }
  const need = step(level);
  return { level, xp, into: xp - floor, need, pct: (xp - floor) / need, toNext: floor + need - xp };
}
export const sectionLevel = (xp: number) => levelInfo(xp, SECTION_STEP);
export const overallLevel = (xp: number) => levelInfo(xp, OVERALL_STEP);
export const stageFor = (level: number) => STAGES.reduce((s, st, i) => (level >= st.level ? i : s), 0);

const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
/** Minutes after noon, so 23:30 and 00:10 compare the right way round. */
const fromNoon = (t: string) => (toMin(t) + 12 * 60) % (24 * 60);
/** School nights are the ones before Monday–Friday; `date` is the morning you wake. */
export const scheduleFor = (date: string, s: SleepSchedule) => (weekdayIndex(date) >= 5 ? s.weekend : s.weekday);
/** Minutes between the bedtime and the plan's bedtime for that night (positive = later). */
export const bedDelta = (night: { date: string; bed: string }, s: SleepSchedule) => fromNoon(night.bed) - fromNoon(scheduleFor(night.date, s).bed);
/** Minutes between the wake time and the plan's wake that morning (positive = later). */
export const wakeDelta = (night: { date: string; wake: string }, s: SleepSchedule) => toMin(night.wake) - toMin(scheduleFor(night.date, s).wake);

export function sectionOf(e: LogEntry, input: Pick<ProgressInput, 'topicSection' | 'details'>): XpSection {
  const d = input.details.get(e.id);
  if (d && !d.deleted_at) return d.section;
  return input.topicSection.get(e.topic_id) ?? 'general';
}

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// ─── events ─────────────────────────────────────────────────────────────────

export function xpEvents(input: ProgressInput): XpEvent[] {
  const out: XpEvent[] = [];
  const timeByDay = new Map<string, number>();

  const entries = [...input.entries].sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  for (const e of entries) {
    if (e.date > input.today) continue;
    const section = sectionOf(e, input);
    const detail = input.details.get(e.id);
    const data = detail && !detail.deleted_at ? detail.data : null;

    if (section === 'gym' && data && Array.isArray(data.exercises)) {
      const sets = (data.exercises as { sets?: { done?: boolean }[] }[]).reduce((n, x) => n + (x.sets ?? []).filter((s) => s.done).length, 0);
      out.push({ key: `entry:${e.id}:gym`, date: e.date, section, xp: RULES.gymCompleted, reason: `${String(data.name ?? 'Gym session')} completed` });
      if (sets) out.push({ key: `entry:${e.id}:sets`, date: e.date, section, xp: Math.min(sets, RULES.gymSetsCap), reason: `${count(sets, 'set')} done (capped at the plan)` });
      if (data.effort != null || data.soreness != null || data.pain === true) out.push({ key: `entry:${e.id}:checkin`, date: e.date, section, xp: RULES.gymCheckIn, reason: 'Check-in recorded' });
      continue;
    }

    const dayKey = `${section}|${e.date}`;
    const used = timeByDay.get(dayKey) ?? 0;
    const time = Math.min(Math.round(e.minutes / RULES.minutesPerXp), RULES.timeCapPerEntry, RULES.timeCapPerDay - used);
    timeByDay.set(dayKey, used + Math.max(0, time));
    if (time > 0) out.push({ key: `entry:${e.id}:time`, date: e.date, section, xp: time, reason: `${e.minutes} min logged` });
    out.push({ key: `entry:${e.id}:logged`, date: e.date, section, xp: RULES.entryLogged, reason: 'Session logged' });
  }

  // Weekly targets: one bonus per week that reached it (the current week too, once reached).
  const weekly = (section: XpSection, measure: (e: LogEntry) => number, target: (t: Targets) => number, xp: number, label: (n: number) => string) => {
    const byWeek = new Map<string, number>();
    for (const e of entries) if (e.date <= input.today && sectionOf(e, input) === section) byWeek.set(weekStart(e.date), (byWeek.get(weekStart(e.date)) ?? 0) + measure(e));
    for (const [week, total] of byWeek) {
      const goal = target(targetsFor(input, week));
      if (total >= goal) out.push({ key: `week:${section}:${week}`, date: [6, 5, 4, 3, 2, 1, 0].map((i) => addDays(week, i)).find((d) => d <= input.today) ?? week, section, xp, reason: label(goal) });
    }
  };
  weekly('violin', (e) => e.minutes, (t) => t.violinWeek, RULES.violinWeekTarget, () => 'Weekly violin target reached');
  weekly('gym', () => 1, (t) => t.gymWeek, RULES.gymWeekTarget, (n) => `Weekly target: ${n} gym sessions`);
  weekly('sports', () => 1, (t) => t.sportsWeek, RULES.sportsWeekTarget, (n) => `Weekly target: ${n} sports sessions`);
  weekly('future', (e) => e.minutes, (t) => t.futureWeek, RULES.futureWeekTarget, () => 'Weekly uni prep target reached');

  // Sleep: logging the night counts; so does keeping near the planned bedtime. Never less sleep.
  for (const m of input.metrics) {
    if (m.date > input.today) continue;
    if (m.metric === 'sleep') {
      out.push({ key: `night:${m.date}:logged`, date: m.date, section: 'sleep', xp: RULES.nightLogged, reason: 'Night logged' });
      const night = input.nights.get(m.date);
      if (night?.bed && !night.deleted_at && Math.abs(bedDelta({ date: m.date, bed: night.bed }, input.sleep)) <= RULES.bedtimeWindow) {
        out.push({ key: `night:${m.date}:bedtime`, date: m.date, section: 'sleep', xp: RULES.bedtimeKept, reason: `Bedtime within ${RULES.bedtimeWindow} min of plan` });
      }
    } else if (m.metric === 'screen') {
      out.push({ key: `screen:${m.date}:logged`, date: m.date, section: 'screen', xp: RULES.screenLogged, reason: 'Daily total logged' });
      const screenTarget = targetsFor(input, m.date).screenDay;
      if (screenTarget != null && m.minutes <= screenTarget) {
        out.push({ key: `screen:${m.date}:under`, date: m.date, section: 'screen', xp: RULES.screenUnderTarget, reason: 'Under your target' });
      }
    }
  }

  for (const t of input.todos) {
    if (!t.done_at) continue;
    out.push({ key: `task:${t.id}`, date: input.dayOf(t.done_at), section: t.section ?? 'general', xp: RULES.taskDone, reason: 'Task completed' });
  }

  const perDay = new Map<string, number>();
  for (const d of [...input.cabinetDays].sort()) {
    const n = (perDay.get(d) ?? 0) + 1;
    perDay.set(d, n);
    if (n * RULES.cabinetItem <= RULES.cabinetPerDay) out.push({ key: `cabinet:${d}:${n}`, date: d, section: 'cabinet', xp: RULES.cabinetItem, reason: 'Added to the cabinet' });
  }

  for (const b of input.bucket ?? []) {
    if (b.done_at) out.push({ key: `bucket:${b.id}`, date: input.dayOf(b.done_at), section: 'general', xp: RULES.bucketDone, reason: `Bucket list: ${b.title}` });
  }
  for (const x of futureXp(input.future ?? [])) if (x.date <= input.today) out.push({ ...x, section: 'future' });
  // One award per key, whatever reaches us: a record that arrives twice still counts once.
  return [...new Map(out.map((e) => [e.key, e])).values()];
}

// ─── streaks ────────────────────────────────────────────────────────────────

/** Days with any activity at all, plus planned rest days. */
export function activeDays(input: ProgressInput): Set<string> {
  const days = new Set<string>(input.restDays);
  for (const e of input.entries) days.add(e.date);
  for (const m of input.metrics) days.add(m.date);
  for (const t of input.todos) if (t.done_at) days.add(input.dayOf(t.done_at));
  for (const d of input.cabinetDays) days.add(d);
  for (const b of input.bucket ?? []) if (b.done_at) days.add(input.dayOf(b.done_at));
  return days;
}

/**
 * Consecutive active days up to today. Today not logged yet doesn't break it: the run is counted
 * up to yesterday until the day is over.
 */
export function dayStreak(days: Set<string>, today: string): { n: number; today: boolean } {
  const hasToday = days.has(today);
  let d = hasToday ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return { n, today: hasToday };
}

export interface BufferedStreak {
  n: number;
  today: boolean;
  /** Yesterday was missed and the buffer is holding the streak: today has to count, or it ends. */
  held: boolean;
  /** Missed days the buffer covered in this run. */
  saved: number;
}

/**
 * The overall day streak, with a buffer: up to `buffer` missed days in a row don't break it (they
 * don't add to it either). Today not logged yet doesn't count as missed until the day is over.
 */
export function bufferedStreak(days: Set<string>, today: string, buffer: number = RULES.streakBuffer): BufferedStreak {
  const hasToday = days.has(today);
  let d = hasToday ? today : addDays(today, -1);
  let n = 0;
  let saved = 0;
  let gap = 0;
  for (;;) {
    if (days.has(d)) {
      n++;
      saved += gap;
      gap = 0;
    } else if (++gap > buffer) break;
    d = addDays(d, -1);
  }
  const held = n > 0 && !hasToday && !days.has(addDays(today, -1));
  return { n, today: hasToday, held, saved };
}

/** Consecutive weeks meeting a weekly test, counting the current week only once it passes. */
export function weekStreak(passes: (monday: string) => boolean, today: string): number {
  const current = weekStart(today);
  let n = passes(current) ? 1 : 0;
  for (let w = addDays(current, -7); passes(w); w = addDays(w, -7)) n++;
  return n;
}

// ─── the whole picture ──────────────────────────────────────────────────────

export interface Progress {
  events: XpEvent[];
  total: number;
  bySection: Record<XpSection, number>;
  overall: LevelInfo & { stage: number };
  sections: Record<SectionId, LevelInfo>;
  streak: BufferedStreak & { rest: boolean };
}

const ALL: XpSection[] = ['violin', 'coding', 'sports', 'gym', 'study', 'chess', 'sleep', 'screen', 'cabinet', 'future', 'general', 'quests'];

/** Total XP needed to reach an overall level. */
export function xpForLevel(level: number): number {
  let xp = 0;
  for (let n = 1; n < level; n++) xp += OVERALL_STEP(n);
  return xp;
}
export function xpForSectionLevel(level: number): number {
  let xp = 0;
  for (let n = 1; n < level; n++) xp += SECTION_STEP(n);
  return xp;
}

/** Every XP event: records first, then quests and bosses. */
export const allXpEvents = (input: ProgressInput): XpEvent[] => [...xpEvents(input), ...questEvents(input), ...bossEvents(input)];

export function computeProgress(input: ProgressInput): Progress {
  const events = allXpEvents(input);
  const bySection = Object.fromEntries(ALL.map((s) => [s, 0])) as Record<XpSection, number>;
  for (const e of events) bySection[e.section] += e.xp;
  const total = events.reduce((n, e) => n + e.xp, 0);
  const o = overallLevel(total);
  const sections = Object.fromEntries(ALL.filter((s) => s !== 'general' && s !== 'quests').map((s) => [s, sectionLevel(bySection[s])])) as Record<SectionId, LevelInfo>;
  const st = bufferedStreak(activeDays(input), input.today);
  return { events, total, bySection, overall: { ...o, stage: stageFor(o.level) }, sections, streak: { ...st, rest: input.restDays.includes(input.today) } };
}

/** What changed between two snapshots: new or bigger awards, level-ups and a new form. */
export interface Reward {
  lines: { reason: string; xp: number; section: XpSection }[];
  total: number;
  sectionUps: { section: SectionId; from: number; to: number }[];
  overallUp: { from: number; to: number } | null;
  evolved: { from: number; to: number } | null;
  streakUp: boolean;
  streak: number;
}

export function rewardBetween(before: Progress, after: Progress): Reward {
  const old = new Map(before.events.map((e) => [e.key, e.xp]));
  const lines = after.events
    .filter((e) => (old.get(e.key) ?? 0) < e.xp)
    .map((e) => ({ reason: e.reason, xp: e.xp - (old.get(e.key) ?? 0), section: e.section }));
  const sectionUps = (Object.keys(after.sections) as SectionId[])
    .filter((s) => after.sections[s].level > before.sections[s].level)
    .map((s) => ({ section: s, from: before.sections[s].level, to: after.sections[s].level }));
  const overallUp = after.overall.level > before.overall.level ? { from: before.overall.level, to: after.overall.level } : null;
  const evolved = after.overall.stage > before.overall.stage ? { from: before.overall.stage, to: after.overall.stage } : null;
  return {
    lines,
    total: Math.max(0, after.total - before.total),
    sectionUps,
    overallUp,
    evolved,
    streakUp: after.streak.n > before.streak.n,
    streak: after.streak.n,
  };
}

// ─── section streaks ────────────────────────────────────────────────────────

export interface SectionStreak {
  n: number;
  /** Days, weeks or nights. */
  unit: 'd' | 'w' | 'n';
  label: string;
}

export function sectionStreaks(input: ProgressInput): Partial<Record<SectionId, SectionStreak>> {
  const entries = input.entries.filter((e) => e.date <= input.today);
  const of = (s: string) => entries.filter((e) => sectionOf(e, input) === s);
  const weekTotals = (list: LogEntry[], measure: (e: LogEntry) => number) => {
    const m = new Map<string, number>();
    for (const e of list) m.set(weekStart(e.date), (m.get(weekStart(e.date)) ?? 0) + measure(e));
    return m;
  };
  const days = (list: { date: string }[]) => dayStreak(new Set(list.map((x) => x.date)), input.today).n;

  const violin = weekTotals(of('violin'), (e) => e.minutes);
  const gym = weekTotals(of('gym'), () => 1);
  const sports = weekTotals(of('sports'), () => 1);
  const future = weekTotals(of('future'), (e) => e.minutes);
  const t = input.targets;
  const at = (w: string) => targetsFor(input, w);
  const sleepDays = input.metrics.filter((m) => m.metric === 'sleep');
  const screenUnder = input.metrics.filter((m) => {
    const goal = targetsFor(input, m.date).screenDay;
    return m.metric === 'screen' && goal != null && m.minutes <= goal;
  });
  return {
    violin: { n: weekStreak((w) => (violin.get(w) ?? 0) >= at(w).violinWeek, input.today), unit: 'w', label: 'weeks at target' },
    gym: { n: weekStreak((w) => (gym.get(w) ?? 0) >= at(w).gymWeek, input.today), unit: 'w', label: `weeks with ${t.gymWeek} sessions` },
    sports: { n: weekStreak((w) => (sports.get(w) ?? 0) >= at(w).sportsWeek, input.today), unit: 'w', label: `weeks with ${t.sportsWeek}+ sessions` },
    future: { n: weekStreak((w) => (future.get(w) ?? 0) >= at(w).futureWeek, input.today), unit: 'w', label: 'weeks at target' },
    coding: { n: days(of('coding')), unit: 'd', label: 'day streak' },
    study: { n: days(of('study')), unit: 'd', label: 'day streak' },
    chess: { n: days(of('chess')), unit: 'd', label: 'day streak' },
    sleep: { n: days(sleepDays), unit: 'n', label: 'nights logged in a row' },
    screen: { n: days(screenUnder), unit: 'd', label: 'days under target' },
  };
}
