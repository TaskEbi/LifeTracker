/**
 * Progression, derived. XP, levels, streaks and achievements are computed from the records
 * themselves, never stored. Every award is an event with a stable key tied to the record (or week)
 * that earned it, so syncing, importing or re-saving can't count anything twice, and editing a
 * record changes its XP instead of adding more. The values are illustrative and easy to retune here.
 */
import { addDays, weekdayIndex, weekStart } from '../log/dates';
import type { LogDayMetric, LogEntry, LtDetail, LtNight, SectionId, Todo } from '../../data/types';
import type { SleepSchedule, Targets } from '../prefs';

export type XpSection = SectionId | 'general';

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
  targets: Targets;
  sleep: SleepSchedule;
}

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
} as const;

const SECTION_STEP = (n: number) => 80 + 20 * n;
const OVERALL_STEP = (n: number) => 200 + 60 * n;

/** Character forms and the overall level each one starts at. */
export const STAGES = [
  { level: 1, name: 'Core' },
  { level: 6, name: 'Ring' },
  { level: 16, name: 'Rotor' },
  { level: 28, name: 'Array' },
  { level: 45, name: 'Halo' },
] as const;

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
  const weekly = (section: XpSection, measure: (e: LogEntry) => number, target: number, xp: number, label: string) => {
    const byWeek = new Map<string, number>();
    for (const e of entries) if (e.date <= input.today && sectionOf(e, input) === section) byWeek.set(weekStart(e.date), (byWeek.get(weekStart(e.date)) ?? 0) + measure(e));
    for (const [week, total] of byWeek) {
      if (total >= target) out.push({ key: `week:${section}:${week}`, date: [6, 5, 4, 3, 2, 1, 0].map((i) => addDays(week, i)).find((d) => d <= input.today) ?? week, section, xp, reason: label });
    }
  };
  weekly('violin', (e) => e.minutes, input.targets.violinWeek, RULES.violinWeekTarget, 'Weekly violin target reached');
  weekly('gym', () => 1, input.targets.gymWeek, RULES.gymWeekTarget, `Weekly target: ${input.targets.gymWeek} gym sessions`);
  weekly('sports', () => 1, input.targets.sportsWeek, RULES.sportsWeekTarget, `Weekly target: ${input.targets.sportsWeek} sports sessions`);

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
      if (input.targets.screenDay != null && m.minutes <= input.targets.screenDay) {
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
  streak: { n: number; today: boolean; rest: boolean };
}

const ALL: XpSection[] = ['violin', 'coding', 'sports', 'gym', 'study', 'chess', 'sleep', 'screen', 'cabinet', 'general'];

export function computeProgress(input: ProgressInput): Progress {
  const events = xpEvents(input);
  const bySection = Object.fromEntries(ALL.map((s) => [s, 0])) as Record<XpSection, number>;
  for (const e of events) bySection[e.section] += e.xp;
  const total = events.reduce((n, e) => n + e.xp, 0);
  const o = overallLevel(total);
  const sections = Object.fromEntries(ALL.filter((s) => s !== 'general').map((s) => [s, sectionLevel(bySection[s])])) as Record<SectionId, LevelInfo>;
  const st = dayStreak(activeDays(input), input.today);
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
  const t = input.targets;
  const sleepDays = input.metrics.filter((m) => m.metric === 'sleep');
  const screenUnder = t.screenDay == null ? [] : input.metrics.filter((m) => m.metric === 'screen' && m.minutes <= t.screenDay!);
  return {
    violin: { n: weekStreak((w) => (violin.get(w) ?? 0) >= t.violinWeek, input.today), unit: 'w', label: `weeks at ${t.violinWeek} min` },
    gym: { n: weekStreak((w) => (gym.get(w) ?? 0) >= t.gymWeek, input.today), unit: 'w', label: `weeks with ${t.gymWeek} sessions` },
    sports: { n: weekStreak((w) => (sports.get(w) ?? 0) >= t.sportsWeek, input.today), unit: 'w', label: `weeks with ${t.sportsWeek}+ sessions` },
    coding: { n: days(of('coding')), unit: 'd', label: 'day streak' },
    study: { n: days(of('study')), unit: 'd', label: 'day streak' },
    chess: { n: days(of('chess')), unit: 'd', label: 'day streak' },
    sleep: { n: days(sleepDays), unit: 'n', label: 'nights logged in a row' },
    screen: { n: days(screenUnder), unit: 'd', label: 'days under target' },
  };
}
