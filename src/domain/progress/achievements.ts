/**
 * Achievements, derived from records like XP. Each reports progress towards its goal and the day
 * it was first reached (from the records' own dates), so nothing is stored and nothing repeats.
 *
 * This runs on every store change and twice per save, so everything is worked out from lists
 * built once here (entries per section in date order, day facts, sorted XP events): no
 * achievement walks the records more than once, and none compares records pairwise.
 */
import { addDays, dayCount, monthEnd, monthStart, weekdayIndex, weekStart } from '../log/dates';
import { SECTION_IDS, TIMED_SECTIONS, type LogEntry, type SectionId } from '../../data/types';
import { activeDays, allXpEvents, bedDelta, RULES, sectionLevel, sectionOf, STAGES, xpForLevel, xpForSectionLevel, type ProgressInput, type XpEvent, type XpSection } from './engine';
import { BOSSES, bossHistory, type BossFight } from './boss';
import { sectionOf as bucketSectionOf } from '../bucket/sections';
import { dayFacts, doneSets, questHistory, WAKE_WINDOW, type Facts, type QuestSet } from './quests';
import type { AchievementGroup, Glyph } from './glyphs';

export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';
export const TIERS: Tier[] = ['bronze', 'silver', 'gold', 'platinum'];

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  tier: Tier;
  /** Section colour, when it belongs to one. */
  section?: SectionId;
  goal: number;
  progress: number;
  /** The day it was reached, or null while locked. */
  unlockedOn: string | null;
  /** The emblem's drawing (see glyphs.ts). */
  glyph: Glyph;
  group: AchievementGroup;
  /** Hidden until unlocked: the title and description show as ??? while locked. */
  secret?: boolean;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const byDate = <T extends { date: string }>(a: T, b: T) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

/** The day the running count reaches `goal`, given the dates of each counted thing. */
function nth(dates: string[], goal: number): string | null {
  const sorted = [...dates].sort();
  return sorted.length >= goal ? sorted[goal - 1] : null;
}
/** The same for dates already in order. */
const nthSorted = (sorted: string[], goal: number): string | null => (sorted.length >= goal ? sorted[goal - 1] : null);

/** Runs of consecutive keys (days or weeks): the longest, and the key where a run first reached each length. */
interface Streaks {
  best: number;
  at: (goal: number) => string | null;
}
function streaks(keys: Iterable<string>, step: (k: string) => string): Streaks {
  const firstAt: string[] = [];
  let len = 0;
  let prev: string | null = null;
  for (const k of [...new Set(keys)].sort()) {
    len = prev !== null && step(k) === prev ? len + 1 : 1;
    if (len > firstAt.length) firstAt.push(k);
    prev = k;
  }
  return { best: firstAt.length, at: (goal) => firstAt[goal - 1] ?? null };
}
/** The same for days, where up to `slack` missed days between two don't break the run (the streak buffer). */
function bufferedRuns(days: Iterable<string>, slack: number): Streaks {
  const firstAt: string[] = [];
  let len = 0;
  let prev: string | null = null;
  for (const d of [...new Set(days)].sort()) {
    len = prev !== null && d <= addDays(prev, slack + 1) ? len + 1 : 1;
    if (len > firstAt.length) firstAt.push(d);
    prev = d;
  }
  return { best: firstAt.length, at: (goal) => firstAt[goal - 1] ?? null };
}
/** Longest run of consecutive keys, and the key where it first reached `goal`. */
function runs(keys: string[], step: (k: string) => string, goal: number): { best: number; reachedOn: string | null } {
  const s = streaks(keys, step);
  return { best: s.best, reachedOn: s.at(goal) };
}
/** Each key's predecessor: the day before (the key itself steps forward one day at a time). */
const prevDay = (d: string) => addDays(d, -1);
const prevWeek = (w: string) => addDays(w, -7);
/** A week counts as reached on its Sunday, or today while it's still going. */
const weekDone = (monday: string | null, today: string) => (monday ? (addDays(monday, 6) <= today ? addDays(monday, 6) : today) : null);

/** A running total over dated amounts (in date order), and the day it first reached a threshold. */
interface Tally {
  total: number;
  reach: (x: number) => string | null;
}
function tally(items: Iterable<readonly [string, number]>): Tally {
  const dates: string[] = [];
  const cum: number[] = [];
  let total = 0;
  for (const [d, v] of items) {
    total += Math.max(0, v);
    dates.push(d);
    cum.push(total);
  }
  return {
    total,
    reach: (x) => {
      if (!dates.length || cum[cum.length - 1] < x) return null;
      let lo = 0;
      let hi = cum.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cum[mid] >= x) hi = mid;
        else lo = mid + 1;
      }
      return dates[lo];
    },
  };
}

/** Overall level for a total. */
function levelOf(xp: number): number {
  let lv = 1;
  while (xp >= xpForLevel(lv + 1)) lv++;
  return lv;
}

const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Already-computed pieces, so callers that have them don't pay twice. */
export interface AchievementExtras {
  events?: XpEvent[];
  quests?: QuestSet[];
  bosses?: BossFight[];
}

const SECTION_NAME: Record<SectionId, string> = {
  violin: 'Violin', coding: 'Coding', sports: 'Sports', gym: 'Gym', study: 'Study', chess: 'Chess', sleep: 'Sleep', screen: 'Screen time', cabinet: 'Cabinet', future: 'Future',
};
/** Section level emblems: titles and glyphs for levels 5, 10, 20 and 30. */
const SECTION_LEVELS: Record<SectionId, [string, Glyph][]> = {
  violin: [['Bow Initiate', 'note'], ['Bow Adept', 'violin'], ['Maestro', 'violin'], ['Virtuoso', 'crown']],
  coding: [['Code Initiate', 'code'], ['Code Ninja', 'chip'], ['Algorithm Sage', 'chip'], ['Legendary Coder', 'crown']],
  sports: [['Trail Rookie', 'shoe'], ['Pathfinder', 'compass'], ['Peak Chaser', 'mountain'], ['Summit Legend', 'flag']],
  gym: [['Iron Initiate', 'dumbbell'], ['Iron Adept', 'kettlebell'], ['Iron Titan', 'kettlebell'], ['Iron God', 'crown']],
  study: [['Diligent', 'pencil'], ['Scholar', 'book'], ['Sage', 'book'], ['Professor', 'crown']],
  chess: [['Pawn Promoted', 'pawn'], ['Knight Errant', 'knight'], ['Rook Lord', 'knight'], ['Chess King', 'king']],
  sleep: [['Dreamer', 'zzz'], ['Moon Child', 'moon'], ['Dream Walker', 'bed'], ['Sleep Sage', 'crown']],
  screen: [['Mindful', 'phone'], ['Unplugged', 'lotus'], ['Zen Mind', 'lotus'], ['Enlightened', 'crown']],
  cabinet: [['Finder', 'key'], ['Archivist', 'chest'], ['Keeper of Curios', 'cabinet'], ['Grand Curator', 'crown']],
  future: [['Ticket Holder', 'scroll'], ['Navigator', 'compass'], ['Pathmaker', 'flag'], ['Visionary', 'crown']],
};
/** The sections there were before Future, for emblems that count every section: a new section never takes one back. */
const RENAISSANCE: SectionId[] = ['violin', 'coding', 'sports', 'gym', 'study', 'chess'];
const CLASSIC_SECTIONS = SECTION_IDS.filter((s) => s !== 'future');
const LEVEL_TIERS: [number, Tier][] = [[5, 'bronze'], [10, 'bronze'], [20, 'silver'], [30, 'gold']];

/** A rung of a ladder: id, goal, tier, glyph, title. */
type Rung = readonly [string, number, Tier, Glyph, string];

const memo = new WeakMap<ProgressInput, Achievement[]>();

/**
 * Every achievement for an input. Worked out once per input (inputs are treated as immutable);
 * `extras` only saves work, since they are derived from the same input.
 */
export function achievements(input: ProgressInput, extras: AchievementExtras = {}): Achievement[] {
  let list = memo.get(input);
  if (!list) memo.set(input, (list = compute(input, extras)));
  return list;
}

function compute(input: ProgressInput, extras: AchievementExtras): Achievement[] {
  const today = input.today;
  const list: Achievement[] = [];
  let group: AchievementGroup = 'start';
  let section: SectionId | undefined;
  /** Sets the group (and section colour) for the achievements added after it. */
  const inGroup = (g: AchievementGroup, s?: SectionId) => {
    group = g;
    section = s;
  };
  const add = (id: string, tier: Tier, glyph: Glyph, title: string, desc: string, goal: number, progress: number, unlockedOn: string | null, secret = false) => {
    const a: Achievement = { id, title, desc, tier, section, goal, progress: Math.max(0, Math.min(progress, goal)), unlockedOn, glyph, group };
    if (secret) a.secret = true;
    list.push(a);
  };
  /** Something that happens once: unlocked on the first of these (sorted) dates. */
  const once = (id: string, tier: Tier, glyph: Glyph, title: string, desc: string, sortedDates: string[], secret = false) =>
    add(id, tier, glyph, title, desc, 1, sortedDates.length ? 1 : 0, sortedDates[0] ?? null, secret);
  /** A count ladder over sorted dates. */
  const counts = (rungs: Rung[], sortedDates: string[], desc: (goal: number) => string) => {
    for (const [id, goal, tier, glyph, title] of rungs) add(id, tier, glyph, title, desc(goal), goal, sortedDates.length, nthSorted(sortedDates, goal));
  };
  /** A ladder over a running total, in `unit`s (e.g. 60 for hours). */
  const totals = (rungs: Rung[], t: Tally, unit: number, desc: (goal: number) => string) => {
    for (const [id, goal, tier, glyph, title] of rungs) add(id, tier, glyph, title, desc(goal), goal, Math.floor(t.total / unit), t.reach(goal * unit));
  };
  /** A ladder over runs; `on` turns the key that reached it into the day (weeks → their day). */
  const streakLadder = (rungs: Rung[], s: Streaks, desc: (goal: number) => string, on: (key: string | null) => string | null = (k) => k) => {
    for (const [id, goal, tier, glyph, title] of rungs) add(id, tier, glyph, title, desc(goal), goal, s.best, on(s.at(goal)));
  };

  // ── the lists everything below works from ──
  const entries = input.entries.filter((e) => e.date <= today).sort(byDate);
  const per = new Map<XpSection, LogEntry[]>();
  for (const e of entries) {
    const s = sectionOf(e, input);
    let l = per.get(s);
    if (!l) per.set(s, (l = []));
    l.push(e);
  }
  const by = (s: XpSection): LogEntry[] => per.get(s) ?? [];
  const dataOf = (e: LogEntry) => {
    const d = input.details.get(e.id);
    return d && !d.deleted_at ? d.data : null;
  };
  const datesOf = (l: { date: string }[]) => l.map((e) => e.date);
  const minutesOf = (l: LogEntry[]) => tally(l.map((e) => [e.date, e.minutes] as const));
  const where = (s: XpSection, test: (data: Record<string, unknown>, e: LogEntry) => boolean) =>
    by(s).filter((e) => {
      const d = dataOf(e);
      return !!d && test(d, e);
    });
  const targetsFor = (monday: string) => (input.targetsAt ? input.targetsAt(monday) : input.targets);

  const facts = dayFacts(input);
  const factDays = [...facts.keys()].sort();
  /** Days (sorted) whose facts pass a test. */
  const daysWhere = (test: (f: Facts, d: string) => boolean) => factDays.filter((d) => test(facts.get(d)!, d));
  const maxOver = (get: (f: Facts) => number) => factDays.reduce((m, d) => Math.max(m, get(facts.get(d)!)), 0);
  /** Per Monday–Sunday week, a running sum of a day measure: the best week and the first day a week reached `x`. */
  const weekSum = (get: (f: Facts) => number) => {
    const sums = new Map<string, number>();
    const firstReach = (x: number) => {
      const run = new Map<string, number>();
      for (const d of factDays) {
        const w = weekStart(d);
        const v = (run.get(w) ?? 0) + get(facts.get(d)!);
        run.set(w, v);
        if (v >= x) return d;
      }
      return null;
    };
    for (const d of factDays) sums.set(weekStart(d), (sums.get(weekStart(d)) ?? 0) + get(facts.get(d)!));
    return { best: Math.max(0, ...sums.values()), firstReach };
  };

  const days = [...activeDays(input)].filter((d) => d <= today).sort();

  // ── getting started ──
  inGroup('start');
  add('first', 'bronze', 'spark', 'First Entry', 'Logged your first activity', 1, days.length ? 1 : 0, nthSorted(days, 1));

  const timed = RENAISSANCE.filter((s) => by(s).length > 0);
  const firstIn = RENAISSANCE.map((s) => by(s)[0]?.date).filter(Boolean) as string[];
  add('explorer', 'silver', 'compass', 'Explorer', 'A session in all 6 timed sections', 6, timed.length, timed.length === 6 ? firstIn.sort().at(-1)! : null);

  const weekSections = new Map<string, Set<string>>();
  for (const e of entries) {
    const w = weekStart(e.date);
    if (!weekSections.has(w)) weekSections.set(w, new Set());
    weekSections.get(w)!.add(sectionOf(e, input));
  }
  for (const m of input.metrics) {
    const w = weekStart(m.date);
    if (!weekSections.has(w)) weekSections.set(w, new Set());
    if (m.metric !== 'sleep_score') weekSections.get(w)!.add(m.metric);
  }
  const sectionCounts = [...weekSections].map(([w, s]) => [w, [...s].filter((x) => x !== 'general').length] as const);
  const fiveWeeks = sectionCounts.filter(([, c]) => c >= 5).map(([w]) => w).sort();
  add('balanced', 'silver', 'star', 'Balanced Week', 'Activity in 5 sections in one week', 5, Math.max(0, ...sectionCounts.map(([, c]) => c)), weekDone(fiveWeeks[0] ?? null, today));
  add('balanced10', 'silver', 'sakura', 'Steady Spread', '10 weeks with activity in 5 sections', 10, fiveWeeks.length, weekDone(fiveWeeks[9] ?? null, today));

  const timedIn = (f: Facts) => TIMED_SECTIONS.reduce((n, s) => n + (f.sections.has(s) ? 1 : 0), 0);
  add('spread', 'bronze', 'fist', 'Four Styles', 'Sessions in 4 timed sections on one day', 4, maxOver(timedIn), daysWhere((f) => timedIn(f) >= 4)[0] ?? null);

  // All six timed sections inside one Monday–Sunday week: the day the sixth showed up.
  const weekTimed = new Map<string, Set<string>>();
  let allRoundOn: string | null = null;
  let allRoundBest = 0;
  for (const d of factDays) {
    const w = weekStart(d);
    let set = weekTimed.get(w);
    if (!set) weekTimed.set(w, (set = new Set()));
    for (const s of RENAISSANCE) if (facts.get(d)!.sections.has(s)) set.add(s);
    allRoundBest = Math.max(allRoundBest, set.size);
    if (!allRoundOn && set.size === 6) allRoundOn = d;
  }
  add('allround', 'gold', 'shield', 'All-Rounder', 'All 6 timed sections in one week', 6, allRoundBest, allRoundOn);

  const comebacks = days.filter((d, i) => i > 0 && d > addDays(days[i - 1], 7));
  once('comeback', 'bronze', 'fist', 'Comeback Arc', 'Logged again after 7 or more days with nothing', comebacks);

  const sessionDays = new Set(entries.map((e) => e.date));
  const weekends = [...sessionDays].filter((d) => weekdayIndex(d) === 6 && sessionDays.has(addDays(d, -1))).sort();
  counts([['weekend1', 1, 'bronze', 'calendar', 'Weekend Warrior'], ['weekend10', 10, 'silver', 'sword', 'Weekend Ronin']], weekends, (g) =>
    g === 1 ? 'A session on both Saturday and Sunday of a weekend' : `Sessions on both days of ${g} weekends`,
  );
  add('busy', 'bronze', 'bolt', 'Packed Day', '5 sessions in one day', 5, maxOver((f) => f.sessions), daysWhere((f) => f.sessions >= 5)[0] ?? null);

  // ── streaks ──
  inGroup('streaks');
  const dayRuns = bufferedRuns(days, RULES.streakBuffer);
  const streakRungs: Rung[] = [
    ['streak3', 3, 'bronze', 'spark', 'Kindling'],
    ['streak7', 7, 'bronze', 'flame', 'On a Roll'],
    ['streak14', 14, 'bronze', 'flame', 'Fortnight Fire'],
    ['streak30', 30, 'silver', 'flame', 'Unbroken'],
    ['streak60', 60, 'gold', 'flame', 'Burning Spirit'],
    ['streak100', 100, 'gold', 'flame', 'Centurion'],
    ['streak200', 200, 'platinum', 'dragon', 'Eternal Flame'],
    ['streak365', 365, 'platinum', 'sun', 'Year of Days'],
  ];
  streakLadder(streakRungs, dayRuns, (g) => `A ${g}-day streak (rest days count)`);

  // Rest counts: four planned rest days within any 30-day window.
  const rest = [...input.restDays].sort();
  let restBest = 0;
  let restOn: string | null = null;
  let lo = 0;
  rest.forEach((d, i) => {
    while (rest[lo] <= addDays(d, -30)) lo++;
    let hi = i;
    while (hi + 1 < rest.length && rest[hi + 1] === d) hi++;
    const inWindow = hi - lo + 1;
    restBest = Math.max(restBest, inWindow);
    if (inWindow >= 4 && !restOn) restOn = rest[i];
  });
  add('rest', 'bronze', 'leaf', 'Rest Counts', '4 planned rest days within a month', 4, restBest, restOn);

  // Weeks with something on 5+ days (rest days count), reached on the fifth day.
  const weekFifth = new Map<string, string>();
  const weekDays = new Map<string, number>();
  for (const d of days) {
    const w = weekStart(d);
    const n = (weekDays.get(w) ?? 0) + 1;
    weekDays.set(w, n);
    if (n === 5) weekFifth.set(w, d);
  }
  streakLadder(
    [
      ['weeks4', 4, 'bronze', 'shield', 'Iron Will'],
      ['weeks12', 12, 'silver', 'shield', 'Season of Effort'],
      ['weeks26', 26, 'gold', 'mountain', 'Half-Year Grind'],
      ['weeks52', 52, 'platinum', 'dragon', 'Year Unbroken'],
    ],
    streaks(weekFifth.keys(), prevWeek),
    (g) => `${g} weeks running with something on 5 or more days`,
    (w) => (w ? weekFifth.get(w)! : null),
  );

  const monthDays = new Map<string, number>();
  for (const d of days) monthDays.set(monthStart(d), (monthDays.get(monthStart(d)) ?? 0) + 1);
  const fullMonths = [...monthDays].filter(([m, n]) => n === dayCount(m, monthEnd(m))).map(([m]) => monthEnd(m)).sort();
  once('fullmonth', 'silver', 'moon', 'Full Moon', 'Something logged every day of a calendar month (rest days count)', fullMonths);

  // ── time ──
  inGroup('time');
  add('marathon', 'bronze', 'hourglass', 'In the Zone', 'One session of 2 hours or more', 1, entries.some((e) => e.minutes >= 120) ? 1 : 0, entries.find((e) => e.minutes >= 120)?.date ?? null);
  add('session3h', 'bronze', 'hourglass', 'Iron Focus', 'One session of 3 hours or more', 1, entries.some((e) => e.minutes >= 180) ? 1 : 0, entries.find((e) => e.minutes >= 180)?.date ?? null);
  counts([['zone10', 10, 'silver', 'hourglass', 'Zone Regular']], datesOf(entries.filter((e) => e.minutes >= 120)), (g) => `${g} sessions of 2 hours or more`);

  const allMinutes = minutesOf(entries);
  totals(
    [
      ['hours10', 10, 'bronze', 'clock', 'Warming Up'],
      ['hours50', 50, 'bronze', 'clock', 'Fifty Hours'],
      ['hundred', 100, 'gold', 'clock', 'Hundred Hours'],
      ['hours250', 250, 'gold', 'clock', 'Training Arc'],
      ['hours500', 500, 'platinum', 'hourglass', 'Five Hundred Hours'],
      ['hours1000', 1000, 'platinum', 'infinity', 'Thousand-Hour Master'],
    ],
    allMinutes,
    60,
    (g) => `${g} hours of logged activity`,
  );
  add('day5h', 'bronze', 'bolt', 'Training Camp', '5 hours logged in one day', 5, Math.floor(maxOver((f) => f.minutes) / 60), daysWhere((f) => f.minutes >= 300)[0] ?? null);
  add('day8h', 'gold', 'bolt', 'Time Chamber', '8 hours logged in one day', 8, Math.floor(maxOver((f) => f.minutes) / 60), daysWhere((f) => f.minutes >= 480)[0] ?? null);
  const weekMin = weekSum((f) => f.minutes);
  add('week10h', 'bronze', 'calendar', 'Ten-Hour Week', '10 hours logged in one week', 10, Math.floor(weekMin.best / 60), weekMin.firstReach(600));
  add('week20h', 'gold', 'calendar', 'Twenty-Hour Week', '20 hours logged in one week', 20, Math.floor(weekMin.best / 60), weekMin.firstReach(1200));

  counts(
    [
      ['chap10', 10, 'bronze', 'scroll', 'Chapter 10'],
      ['chap50', 50, 'bronze', 'scroll', 'Chapter 50'],
      ['chap100', 100, 'silver', 'scroll', 'Chapter 100'],
      ['chap250', 250, 'gold', 'scroll', 'Chapter 250'],
      ['chap500', 500, 'platinum', 'scroll', 'Chapter 500'],
    ],
    factDays,
    (g) => `Something logged on ${g} days`,
  );
  counts(
    [
      ['sessions10', 10, 'bronze', 'check', 'Ten Sessions'],
      ['sessions100', 100, 'bronze', 'check', 'Hundred Sessions'],
      ['sessions500', 500, 'silver', 'star', 'Five Hundred Sessions'],
      ['sessions1000', 1000, 'platinum', 'star', 'Thousand Sessions'],
    ],
    datesOf(entries),
    (g) => `${g} sessions logged`,
  );

  /** Sessions and hours ladders for a timed section. */
  const sessionsAndHours = (s: SectionId, sessions: Rung[], hours: Rung[]) => {
    const name = SECTION_NAME[s].toLowerCase();
    counts(sessions, datesOf(by(s)), (g) => (g === 1 ? `Your first ${name} session` : `${g} ${name} sessions`));
    totals(hours, minutesOf(by(s)), 60, (g) => `${g} hours of ${name} logged`);
  };
  /** Weeks running at a weekly session target, reached on the day the target was met. */
  const sessionWeeks = (s: SectionId, target: (monday: string) => number) => {
    const n = new Map<string, number>();
    const metOn = new Map<string, string>();
    for (const e of by(s)) {
      const w = weekStart(e.date);
      const c = (n.get(w) ?? 0) + 1;
      n.set(w, c);
      if (c === target(w)) metOn.set(w, e.date);
    }
    return { runs: streaks(metOn.keys(), prevWeek), on: (w: string | null) => (w ? metOn.get(w)! : null) };
  };

  // ── violin ──
  inGroup('violin', 'violin');
  const violin = by('violin');
  const thursdays = [...new Set(violin.filter((e) => weekdayIndex(e.date) === 3).map((e) => e.date))];
  add('thursday', 'silver', 'calendar', 'Thursday Regular', 'Violin on 6 different Thursdays', 6, thursdays.length, nth(thursdays, 6));

  const violinWeeks = new Map<string, number>();
  for (const e of violin) violinWeeks.set(weekStart(e.date), (violinWeeks.get(weekStart(e.date)) ?? 0) + e.minutes);
  const metWeeks = [...violinWeeks].filter(([, m]) => m >= input.targets.violinWeek).map(([w]) => w);
  streakLadder(
    [
      ['target2', 2, 'bronze', 'target', 'Two at Target'],
      ['target5', 5, 'silver', 'target', 'Five at Target'],
      ['target8', 8, 'gold', 'target', 'Eight at Target'],
      ['target12', 12, 'platinum', 'target', 'Twelve at Target'],
    ],
    streaks(metWeeks, prevWeek),
    (g) => `Violin weekly target ${g} weeks running`,
    (w) => weekDone(w, today),
  );

  const scaleSessions = where('violin', (d) => Array.isArray(d.scales) && (d.scales as unknown[]).length > 0);
  counts(
    [
      ['scales', 20, 'silver', 'note', 'Scale Ladder'],
      ['scales100', 100, 'silver', 'note', 'Scale Master'],
    ],
    datesOf(scaleSessions),
    (g) => `Scales practised in ${g} sessions`,
  );
  sessionsAndHours(
    'violin',
    [
      ['v1', 1, 'bronze', 'note', 'First Note'],
      ['v10', 10, 'bronze', 'violin', 'Practice Habit'],
      ['v50', 50, 'silver', 'violin', 'Fifty Bows'],
      ['v100', 100, 'silver', 'violin', 'Hundred Bows'],
    ],
    [
      ['violin10h', 10, 'bronze', 'hourglass', 'Ten Hours of Violin'],
      ['violin50', 50, 'gold', 'violin', 'Fifty Hours of Violin'],
      ['violin100', 100, 'platinum', 'violin', 'Hundred Hours of Violin'],
    ],
  );
  counts([['lesson10', 10, 'bronze', 'book', 'Student of the Bow']], datesOf(where('violin', (d) => d.type === 'lesson')), (g) => `${g} violin lessons`);
  counts([['ensemble5', 5, 'bronze', 'note', 'Ensemble']], datesOf(where('violin', (d) => d.type === 'orchestra' || d.type === 'trio')), (g) => `${g} orchestra or trio sessions`);
  const pieces = new Set<string>();
  let repertoireOn: string | null = null;
  for (const e of violin) {
    const d = dataOf(e);
    if (d && Array.isArray(d.pieces)) for (const p of d.pieces) if (typeof p === 'string') pieces.add(p);
    if (!repertoireOn && pieces.size >= 10) repertoireOn = e.date;
  }
  add('repertoire', 'bronze', 'scroll', 'Repertoire', '10 different pieces practised', 10, pieces.size, repertoireOn);
  streakLadder([['violin7', 7, 'silver', 'flame', 'Daily Bow']], streaks(datesOf(violin), prevDay), (g) => `Violin ${g} days in a row`);

  // ── coding ──
  inGroup('coding', 'coding');
  sessionsAndHours(
    'coding',
    [
      ['code1', 1, 'bronze', 'code', 'Hello, World'],
      ['code10', 10, 'bronze', 'code', 'Debugger'],
      ['code50', 50, 'silver', 'code', 'Grinding'],
      ['coding100', 100, 'gold', 'chip', 'Grinder'],
      ['code250', 250, 'platinum', 'chip', 'Code Machine'],
    ],
    [
      ['code10h', 10, 'bronze', 'clock', 'Ten Hours of Code'],
      ['code50h', 50, 'silver', 'code', 'Fifty Hours of Code'],
      ['code100h', 100, 'gold', 'chip', 'Hundred Hours of Code'],
    ],
  );
  streakLadder(
    [
      ['code7', 7, 'bronze', 'flame', 'Daily Commit'],
      ['code30', 30, 'gold', 'flame', 'Commit Streak'],
    ],
    streaks(datesOf(by('coding')), prevDay),
    (g) => `Coding ${g} days in a row`,
  );
  counts(
    [
      ['contest1', 1, 'bronze', 'flag', 'Contest Debut'],
      ['contest10', 10, 'silver', 'sword', 'Rated Warrior'],
      ['contest25', 25, 'silver', 'sword', 'Contest Veteran'],
    ],
    datesOf(where('coding', (d) => d.kind === 'Contest')),
    (g) => (g === 1 ? 'Your first contest' : `${g} contests`),
  );
  totals(
    [
      ['solved50', 50, 'bronze', 'check', 'Fifty Solved'],
      ['solved250', 250, 'silver', 'sword', 'Problem Slayer'],
      ['solved1000', 1000, 'platinum', 'dragon', 'Thousand Problems'],
    ],
    tally(by('coding').map((e) => [e.date, num(dataOf(e)?.solved)] as const)),
    1,
    (g) => `${g} problems solved`,
  );
  counts([['upsolve10', 10, 'bronze', 'fist', 'Never Again']], datesOf(where('coding', (d) => d.kind === 'Upsolve')), (g) => `${g} upsolve sessions`);

  // ── sports ──
  inGroup('sports', 'sports');
  sessionsAndHours(
    'sports',
    [
      ['sp1', 1, 'bronze', 'shoe', 'First Steps'],
      ['sp10', 10, 'bronze', 'shoe', 'Lacing Up'],
      ['sports25', 25, 'silver', 'shoe', 'Endurance'],
      ['sp50', 50, 'silver', 'flag', 'Road Warrior'],
      ['sp100', 100, 'silver', 'flag', 'Hundred Outings'],
    ],
    [
      ['sports10h', 10, 'bronze', 'clock', 'Ten Hours Moving'],
      ['sports50h', 50, 'silver', 'compass', 'Fifty Hours Moving'],
    ],
  );
  const sportData = by('sports').map((e) => ({ e, d: dataOf(e) }));
  const kmOf = (d: Record<string, unknown> | null) => (d ? num(d.km) : 0);
  const subTwo = sportData.filter(({ e, d }) => d && d.sport === 'running' && Number(d.km) >= 21.0975 && e.minutes < 120).map(({ e }) => e.date);
  add('sub2', 'platinum', 'flag', 'Sub-2', 'A half marathon under 2 hours', 1, subTwo.length ? 1 : 0, nthSorted(subTwo, 1));
  totals(
    [
      ['km50', 50, 'bronze', 'compass', 'Fifty k'],
      ['km250', 250, 'silver', 'compass', 'Long Road'],
      ['km1000', 1000, 'gold', 'mountain', 'Thousand k'],
      ['km2500', 2500, 'platinum', 'mountain', 'Ultra Legend'],
    ],
    tally(sportData.map(({ e, d }) => [e.date, kmOf(d)] as const)),
    1,
    (g) => `${g} km of running, cycling and swimming`,
  );
  const sportOver = (sport: string, km: number) => sportData.filter(({ d }) => d && d.sport === sport && kmOf(d) >= km).map(({ e }) => e.date);
  once('run10k', 'bronze', 'shoe', 'Ten k', 'A run of 10 km or more', sportOver('running', 10));
  once('run21k', 'silver', 'flag', 'Half Way There', 'A run of half-marathon distance (21.1 km)', sportOver('running', 21.0975));
  once('run42k', 'platinum', 'mountain', 'Marathoner', 'A run of marathon distance (42.2 km)', sportOver('running', 42.195));
  once('century', 'gold', 'wing', 'Century Ride', 'A ride of 100 km or more', sportOver('cycling', 100));
  once('swim1k', 'bronze', 'wave', 'Into the Deep', 'A swim of 1 km or more', sportOver('swimming', 1));
  const sportsSeen = new Set<string>();
  let multiOn: string | null = null;
  for (const { e, d } of sportData) {
    if (d && str(d.sport)) sportsSeen.add(str(d.sport));
    if (!multiOn && sportsSeen.size >= 3) multiOn = e.date;
  }
  add('multisport', 'bronze', 'compass', 'Multi-Sport', '3 different sports', 3, sportsSeen.size, multiOn);
  counts([['matches10', 10, 'bronze', 'flag', 'Match Day']], sportData.filter(({ d }) => d?.type === 'match').map(({ e }) => e.date), (g) => `${g} matches played`);
  const sportsTarget = sessionWeeks('sports', (w) => targetsFor(w).sportsWeek);
  streakLadder([['sportsweek4', 4, 'silver', 'calendar', 'Training Block']], sportsTarget.runs, (g) => `Sports weekly target ${g} weeks running`, sportsTarget.on);

  // ── gym ──
  inGroup('gym', 'gym');
  const gym = by('gym');
  counts(
    [
      ['gym1', 1, 'bronze', 'dumbbell', 'First Rep'],
      ['iron', 12, 'silver', 'dumbbell', 'Iron Habit'],
      ['gym25', 25, 'bronze', 'dumbbell', 'Gym Rat'],
      ['gym50', 50, 'silver', 'kettlebell', 'Iron Body'],
      ['gym100', 100, 'gold', 'kettlebell', 'Hundred Sessions of Iron'],
    ],
    datesOf(gym),
    (g) => (g === 1 ? 'Your first gym session' : `${g} gym sessions logged`),
  );
  const gymData = gym.map((e) => ({ e, d: dataOf(e) }));
  totals(
    [
      ['sets100', 100, 'bronze', 'dumbbell', 'Hundred Sets'],
      ['sets500', 500, 'bronze', 'dumbbell', 'Five Hundred Sets'],
      ['sets1000', 1000, 'silver', 'kettlebell', 'Thousand Sets'],
      ['sets5000', 5000, 'platinum', 'dragon', 'Endless Sets'],
    ],
    tally(gymData.map(({ e, d }) => [e.date, d ? doneSets(d) : 0] as const)),
    1,
    (g) => `${g} gym sets done`,
  );
  type Set_ = { reps?: unknown; weight?: unknown; done?: unknown };
  type Ex = { name?: unknown; unit?: unknown; sets?: Set_[] };
  /** Weighted sets marked done in a session (timed holds don't count). */
  const weighted = (d: Record<string, unknown> | null): { name: string; reps: number; weight: number }[] => {
    if (!d || !Array.isArray(d.exercises)) return [];
    const out: { name: string; reps: number; weight: number }[] = [];
    for (const x of d.exercises as Ex[]) {
      if (!x || x.unit === 's' || !Array.isArray(x.sets)) continue;
      const name = str(x.name).toLowerCase();
      for (const s of x.sets) if (s?.done && num(s.weight) > 0) out.push({ name, reps: num(s.reps), weight: num(s.weight) });
    }
    return out;
  };
  const gymSets = gymData.map(({ e, d }) => ({ date: e.date, sets: weighted(d) }));
  totals(
    [
      ['vol10t', 10, 'bronze', 'kettlebell', 'Ten Tonnes'],
      ['vol100t', 100, 'silver', 'kettlebell', 'Hundred Tonnes'],
      ['vol1000t', 1000, 'platinum', 'mountain', 'Thousand Tonnes'],
    ],
    tally(gymSets.map(({ date, sets }) => [date, sets.reduce((n, s) => n + s.reps * s.weight, 0)] as const)),
    1000,
    (g) => `${g} tonnes lifted in total (reps × weight of done sets)`,
  );
  // A personal best: an exercise's heaviest done set beats every earlier session of it.
  const best = new Map<string, number>();
  const prs: string[] = [];
  for (const { date, sets } of gymSets) {
    const top = new Map<string, number>();
    for (const s of sets) if (s.name) top.set(s.name, Math.max(top.get(s.name) ?? 0, s.weight));
    for (const [name, w] of top) {
      const before = best.get(name);
      if (before != null && w > before) prs.push(date);
      if (before == null || w > before) best.set(name, w);
    }
  }
  counts(
    [
      ['pr1', 1, 'bronze', 'fist', 'Personal Best'],
      ['pr10', 10, 'silver', 'fist', 'Breaking Limits'],
      ['pr50', 50, 'gold', 'bolt', 'Beyond the Limit'],
    ],
    prs,
    (g) => (g === 1 ? 'Lift more on an exercise than in any earlier session' : `${g} personal bests (more than any earlier session of that exercise)`),
  );
  once('heavy100', 'gold', 'kettlebell', 'Plate Club', 'A done set at 100 kg or more', gymSets.filter(({ sets }) => sets.some((s) => s.weight >= 100)).map(({ date }) => date));
  const gymTarget = sessionWeeks('gym', (w) => targetsFor(w).gymWeek);
  streakLadder(
    [
      ['gymweek4', 4, 'silver', 'calendar', 'Iron Routine'],
      ['gymweek12', 12, 'gold', 'shield', 'Iron Season'],
    ],
    gymTarget.runs,
    (g) => `Gym weekly target ${g} weeks running`,
    gymTarget.on,
  );
  counts([['checkin10', 10, 'bronze', 'eye', 'Listening to the Body']], gymData.filter(({ d }) => d && (d.effort != null || d.soreness != null || d.pain === true)).map(({ e }) => e.date), (g) => `${g} gym check-ins recorded`);

  // ── study ──
  inGroup('study', 'study');
  sessionsAndHours(
    'study',
    [
      ['st1', 1, 'bronze', 'pencil', 'First Lesson'],
      ['st10', 10, 'bronze', 'pencil', 'Study Habit'],
      ['st50', 50, 'silver', 'book', 'Diligent Student'],
      ['st100', 100, 'silver', 'book', 'Honour Roll'],
    ],
    [
      ['study10h', 10, 'bronze', 'clock', 'Ten Hours of Study'],
      ['study50', 50, 'gold', 'book', 'Bookworm'],
      ['study100h', 100, 'gold', 'book', 'Hundred Hours of Study'],
    ],
  );
  streakLadder(
    [
      ['study7', 7, 'silver', 'flame', 'Study Streak'],
      ['study30', 30, 'gold', 'flame', 'Unbreakable Focus'],
    ],
    streaks(datesOf(by('study')), prevDay),
    (g) => `Study ${g} days in a row`,
  );
  const subjects = new Set<string>();
  let polyOn: string | null = null;
  for (const e of by('study')) {
    const s = str(dataOf(e)?.subject).toLowerCase();
    if (s) subjects.add(s);
    if (!polyOn && subjects.size >= 4) polyOn = e.date;
  }
  add('subjects4', 'bronze', 'book', 'Polymath', 'Study sessions in 4 different subjects', 4, subjects.size, polyOn);
  counts([['pastpaper10', 10, 'bronze', 'pencil', 'Exam Ready']], datesOf(where('study', (d) => d.kind === 'Past paper')), (g) => `${g} past-paper sessions`);

  // ── chess ──
  inGroup('chess', 'chess');
  sessionsAndHours(
    'chess',
    [
      ['ch1', 1, 'bronze', 'pawn', 'First Move'],
      ['ch10', 10, 'bronze', 'pawn', 'Opening Moves'],
      ['chess30', 30, 'silver', 'knight', 'Opening Book'],
      ['ch100', 100, 'gold', 'king', 'Hundred Boards'],
    ],
    [
      ['chess10h', 10, 'bronze', 'clock', 'Ten Hours at the Board'],
      ['chess50h', 50, 'silver', 'knight', 'Fifty Hours at the Board'],
    ],
  );
  streakLadder(
    [
      ['chess7', 7, 'silver', 'flame', 'Daily Tactics'],
      ['chess30d', 30, 'gold', 'flame', 'Board Every Day'],
    ],
    streaks(datesOf(by('chess')), prevDay),
    (g) => `Chess ${g} days in a row`,
  );
  counts([['puzzles25', 25, 'silver', 'eye', 'Puzzle Rush']], datesOf(where('chess', (d) => d.kind === 'Puzzles')), (g) => `${g} puzzle sessions`);
  totals([['games100', 100, 'silver', 'king', 'Hundred Games']], tally(by('chess').map((e) => [e.date, num(dataOf(e)?.games)] as const)), 1, (g) => `${g} chess games played`);
  counts([['otb5', 5, 'bronze', 'pawn', 'Over the Board']], datesOf(where('chess', (d) => d.kind === 'Over the board')), (g) => `${g} over-the-board sessions`);

  // ── sleep ──
  inGroup('sleep', 'sleep');
  const nights = input.metrics.filter((m) => m.metric === 'sleep' && m.date <= today).map((m) => m.date).sort();
  counts(
    [
      ['nights7', 7, 'bronze', 'moon', 'Sleep Diary'],
      ['nights30', 30, 'silver', 'moon', 'Night Watch'],
      ['nights100', 100, 'silver', 'moon', 'Hundred Nights'],
      ['nights365', 365, 'platinum', 'moon', 'Year of Nights'],
    ],
    nights,
    (g) => `${g} nights logged`,
  );
  const goodNights = input.metrics
    .filter((m) => m.metric === 'sleep')
    .map((m) => ({ m, night: input.nights.get(m.date) }))
    .filter(({ night }) => night?.bed && !night.deleted_at && Math.abs(bedDelta({ date: night.date, bed: night.bed }, input.sleep)) <= RULES.bedtimeWindow)
    .map(({ m }) => m.date);
  streakLadder(
    [
      ['rested', 7, 'gold', 'bed', 'Well Rested'],
      ['rested30', 30, 'platinum', 'bed', 'Perfect Rhythm'],
    ],
    streaks(goodNights, prevDay),
    (g) => `${g} nights in a row within 30 min of your bedtime`,
  );
  counts(
    [
      ['bed10', 10, 'bronze', 'bed', 'Lights Out'],
      ['bed50', 50, 'silver', 'clock', 'Body Clock'],
      ['bed150', 150, 'silver', 'clock', 'Clockwork'],
    ],
    daysWhere((f) => f.bedKept > 0),
    (g) => `${g} nights in bed within ${RULES.bedtimeWindow} min of your plan`,
  );
  counts(
    [
      ['wake10', 10, 'bronze', 'sun', 'Early Riser'],
      ['wake50', 50, 'silver', 'sun', 'Rising Sun'],
    ],
    daysWhere((f) => f.wakeKept > 0),
    (g) => `Up within ${WAKE_WINDOW} min of your planned wake on ${g} mornings`,
  );
  counts(
    [
      ['full10', 10, 'bronze', 'zzz', 'Full Tank'],
      ['full50', 50, 'silver', 'zzz', 'Well Charged'],
    ],
    daysWhere((f) => f.fullNights > 0),
    (g) => `${g} nights of 7½ hours or more`,
  );
  streakLadder(
    [
      ['diary14', 14, 'silver', 'zzz', 'Night Log Streak'],
      ['diary60', 60, 'gold', 'moon', 'Moon Keeper'],
    ],
    streaks(nights, prevDay),
    (g) => `Sleep logged ${g} nights in a row`,
  );

  // ── screen time ──
  inGroup('screen', 'screen');
  const screens = input.metrics.filter((m) => m.metric === 'screen' && m.date <= today).sort(byDate);
  if (input.targets.screenDay != null) {
    const under = input.metrics.filter((m) => m.metric === 'screen' && m.minutes <= input.targets.screenDay!).map((m) => m.date);
    const r = runs(under, prevDay, 7);
    add('screen7', 'silver', 'phone', 'Screen Smart', '7 days in a row under your screen-time target', 7, r.best, r.reachedOn);
  }
  counts(
    [
      ['screenlog7', 7, 'bronze', 'phone', 'Screen Check'],
      ['screenlog30', 30, 'silver', 'phone', 'Screen Ledger'],
      ['screenlog100', 100, 'silver', 'eye', 'Hundred Check-ins'],
    ],
    datesOf(screens),
    (g) => `Screen time logged on ${g} days`,
  );
  // Under the target in force that week (days without a target don't count).
  const underDays = daysWhere((f) => f.screenUnder > 0);
  counts(
    [
      ['under10', 10, 'bronze', 'lotus', 'Under Control'],
      ['under50', 50, 'silver', 'lotus', 'Self-Control'],
      ['under150', 150, 'gold', 'shield', 'Iron Discipline'],
    ],
    underDays,
    (g) => `${g} days under your screen-time target`,
  );
  streakLadder([['screen30', 30, 'platinum', 'lotus', 'Master of Restraint']], streaks(underDays, prevDay), (g) => `${g} days in a row under your screen-time target`);
  once('detox', 'bronze', 'leaf', 'Digital Detox', 'A day with 1 hour of screen time or less', datesOf(screens.filter((m) => m.minutes <= 60)));
  streakLadder([['monk', 7, 'gold', 'lotus', 'Monk Mode']], streaks(datesOf(screens.filter((m) => m.minutes < 120)), prevDay), (g) => `${g} days in a row under 2 hours of screen time`);

  // ── tasks ──
  inGroup('tasks');
  const doneTodos = input.todos.filter((t) => t.done_at);
  const tasksDone = doneTodos.map((t) => input.dayOf(t.done_at!)).sort();
  counts(
    [
      ['task1', 1, 'bronze', 'check', 'First Task'],
      ['tasks10', 10, 'bronze', 'check', 'Ten Down'],
      ['tasks25', 25, 'silver', 'check', 'Clear Desk'],
      ['tasks100', 100, 'silver', 'check', 'Hundred Down'],
      ['tasks250', 250, 'gold', 'sword', 'Task Slayer'],
      ['tasks500', 500, 'platinum', 'crown', 'Task Overlord'],
    ],
    tasksDone,
    (g) => (g === 1 ? 'Complete your first task' : `${g} tasks completed`),
  );
  const perTaskDay = new Map<string, number>();
  const taskDayOn = (goal: number) => {
    perTaskDay.clear();
    for (const d of tasksDone) {
      const n = (perTaskDay.get(d) ?? 0) + 1;
      perTaskDay.set(d, n);
      if (n >= goal) return d;
    }
    return null;
  };
  const busiest = tasksDone.reduce((m, d, i) => {
    let j = i;
    while (j + 1 < tasksDone.length && tasksDone[j + 1] === d) j++;
    return Math.max(m, j - i + 1);
  }, 0);
  add('taskday5', 'bronze', 'bolt', 'Task Rush', '5 tasks completed in one day', 5, busiest, taskDayOn(5));
  add('taskday10', 'silver', 'bolt', 'Unstoppable', '10 tasks completed in one day', 10, busiest, taskDayOn(10));
  const dueDays = (test: (done: string, due: string) => boolean) =>
    doneTodos.filter((t) => t.due && test(input.dayOf(t.done_at!), t.due)).map((t) => input.dayOf(t.done_at!)).sort();
  counts([['early10', 10, 'silver', 'hourglass', 'Ahead of Time']], dueDays((done, due) => done < due), (g) => `${g} tasks completed before their due day`);
  counts([['ontime50', 50, 'gold', 'target', 'Deadline Keeper']], dueDays((done, due) => done <= due), (g) => `${g} tasks completed by their due day`);
  counts([['high25', 25, 'silver', 'target', 'Priority One']], doneTodos.filter((t) => t.priority === 'high').map((t) => input.dayOf(t.done_at!)).sort(), (g) => `${g} high-priority tasks completed`);

  // ── cabinet ──
  inGroup('cabinet', 'cabinet');
  const cabinet = [...input.cabinetDays].sort();
  counts(
    [
      ['cab1', 1, 'bronze', 'key', 'First Curio'],
      ['cab10', 10, 'bronze', 'cabinet', 'Cabinet of Ten'],
      ['cab50', 50, 'silver', 'cabinet', 'Collector'],
      ['cabinet100', 100, 'gold', 'cabinet', 'Curator'],
      ['cab250', 250, 'gold', 'chest', 'Grand Collection'],
      ['cab500', 500, 'platinum', 'chest', 'Museum'],
    ],
    cabinet,
    (g) => (g === 1 ? 'Your first thing in the cabinet' : `${g} things in the cabinet`),
  );
  let haulOn: string | null = null;
  let haulBest = 0;
  for (let i = 0; i < cabinet.length; ) {
    let j = i;
    while (j + 1 < cabinet.length && cabinet[j + 1] === cabinet[i]) j++;
    haulBest = Math.max(haulBest, j - i + 1);
    if (!haulOn && j - i + 1 >= 10) haulOn = cabinet[i];
    i = j + 1;
  }
  add('haul10', 'silver', 'chest', 'The Haul', '10 things added to the cabinet in one day', 10, haulBest, haulOn);
  counts([['cabdays30', 30, 'bronze', 'key', "Collector's Habit"]], [...new Set(cabinet)], (g) => `Things added to the cabinet on ${g} different days`);

  // ── bucket list ──
  inGroup('bucket');
  const bucket = input.bucket ?? [];
  const crossed = bucket.filter((b) => b.done_at).map((b) => input.dayOf(b.done_at!)).sort();
  counts(
    [
      ['bucket1', 1, 'bronze', 'star', 'Wish Granted'],
      ['bucket5', 5, 'silver', 'wing', 'Dream Chaser'],
      ['bucket10', 10, 'gold', 'mountain', 'Summit of Dreams'],
      ['bucket25', 25, 'gold', 'torii', 'Pilgrim'],
      ['bucket50', 50, 'platinum', 'crown', 'A Life Well Lived'],
    ],
    crossed,
    (g) => (g === 1 ? 'Cross the first thing off your bucket list' : `${g} things crossed off your bucket list`),
  );
  counts(
    [
      ['bucketlist10', 10, 'bronze', 'scroll', 'Dreamer'],
      ['bucketlist50', 50, 'silver', 'scroll', 'Big Dreamer'],
    ],
    bucket.map((b) => input.dayOf(b.created_at)).sort(),
    (g) => `${g} things on your bucket list`,
  );
  const perMonth = new Map<string, number>();
  let busyOn: string | null = null;
  for (const d of crossed) {
    const n = (perMonth.get(d.slice(0, 7)) ?? 0) + 1;
    perMonth.set(d.slice(0, 7), n);
    if (n === 3 && !busyOn) busyOn = d;
  }
  add('bucketmonth', 'silver', 'sun', 'Busy Living', '3 bucket-list things crossed off in one month', 3, Math.max(0, ...perMonth.values()), busyOn);
  // spread: crossed off in 5 different bucket-list sections; a list that spans 8 of them
  const spread = (list: typeof bucket, at: (b: (typeof bucket)[number]) => string, goal: number) => {
    const seen = new Set<string>();
    let on: string | null = null;
    for (const b of [...list].sort((x, y) => at(x).localeCompare(at(y)))) {
      seen.add(bucketSectionOf(b));
      if (!on && seen.size >= goal) on = input.dayOf(at(b));
    }
    return [seen.size, on] as const;
  };
  const [paths, pathsOn] = spread(bucket.filter((b) => b.done_at), (b) => b.done_at!, 5);
  add('bucketpaths', 'gold', 'compass', 'Many Paths', 'Bucket-list things crossed off in 5 different sections', 5, paths, pathsOn);
  const [wide, wideOn] = spread(bucket, (b) => b.created_at, 8);
  add('bucketwide', 'bronze', 'sakura', 'Wide Dreamer', 'Something on your bucket list in 8 different sections', 8, wide, wideOn);

  // ── levels and forms ──
  const events = extras.events ?? allXpEvents(input);
  const sortedEvents = [...events].sort(byDate);
  const overall = tally(sortedEvents.map((e) => [e.date, e.xp] as const));
  const bySection = new Map<string, XpEvent[]>();
  for (const e of sortedEvents) {
    let l = bySection.get(e.section);
    if (!l) bySection.set(e.section, (l = []));
    l.push(e);
  }
  const sectionTally = new Map(SECTION_IDS.map((s) => [s, tally((bySection.get(s) ?? []).map((e) => [e.date, e.xp] as const))]));
  const sectionReach = (s: SectionId, lv: number) => sectionTally.get(s)!.reach(xpForSectionLevel(lv));

  inGroup('levels');
  for (const [id, lv, title, tier, glyph] of [
    ['lv5', 5, 'Initiate', 'bronze', 'star'],
    ['lv10', 10, 'Double Digits', 'silver', 'star'],
    ['lv15', 15, 'Adept', 'silver', 'star'],
    ['lv20', 20, 'Rising Star', 'silver', 'star'],
    ['lv25', 25, 'Quarter Century', 'gold', 'crown'],
    ['lv30', 30, 'Expert', 'gold', 'crown'],
    ['lv40', 40, 'Veteran', 'gold', 'crown'],
    ['lv50', 50, 'Half Century', 'platinum', 'crown'],
    ['lv75', 75, 'Grandmaster', 'platinum', 'gem'],
    ['lv100', 100, 'Legend', 'platinum', 'gem'],
  ] as const) {
    const on = overall.reach(xpForLevel(lv));
    add(id, tier, glyph, title, `Reach overall level ${lv}`, lv, on ? lv : levelOf(overall.total), on);
  }
  for (const [id, form, title, tier, glyph] of [
    ['form2', 1, 'First Upgrade', 'bronze', 'drone'],
    ['form3', 2, 'Spin Up', 'bronze', 'drone'],
    ['form5', 4, 'Metamorphosis', 'gold', 'drone'],
    ['form7', 6, 'Ronin Path', 'silver', 'sword'],
    ['form10', 9, 'Ten Forms', 'gold', 'drone'],
    ['form15', 14, 'Dragon Rising', 'platinum', 'dragon'],
    ['form20', 19, 'Ascension', 'platinum', 'wing'],
  ] as const) {
    const on = overall.reach(xpForLevel(STAGES[form].level));
    add(id, tier, glyph, title, `Transform into form ${form + 1}, ${STAGES[form].name}`, 1, on ? 1 : 0, on);
  }
  const ten = SECTION_IDS.map((s) => sectionReach(s, 10));
  const tenOn = ten.filter(Boolean) as string[];
  add('specialist', 'silver', 'gem', 'Specialist', 'Any section at level 10', 1, tenOn.length ? 1 : 0, [...tenOn].sort()[0] ?? null);
  // the six timed sections there were when this emblem was made, so a new section never takes it back
  const five = RENAISSANCE.map((s) => sectionReach(s, 5));
  add('renaissance', 'gold', 'sakura', 'Renaissance', 'All 6 timed sections at level 5', 6, five.filter(Boolean).length, five.every(Boolean) ? (five as string[]).sort().at(-1)! : null);
  add('mastery', 'platinum', 'gem', 'Master of All', `All ${SECTION_IDS.length} sections at level 10`, SECTION_IDS.length, tenOn.length, ten.every(Boolean) ? [...tenOn].sort().at(-1)! : null);

  // Section levels, in each section's own group.
  for (const s of SECTION_IDS) {
    inGroup(s, s);
    const t = sectionTally.get(s)!;
    const now = sectionLevel(t.total).level;
    LEVEL_TIERS.forEach(([lv, tier], i) => {
      const [title, glyph] = SECTION_LEVELS[s][i];
      add(`${s}-lv${lv}`, tier, glyph, title, `${SECTION_NAME[s]} at level ${lv}`, lv, now, sectionReach(s, lv));
    });
  }

  // ── quests ──
  inGroup('quests');
  const history = extras.quests ?? questHistory(input);
  const questsDone = history.flatMap((set) => set.quests.filter((q) => q.doneOn).map((q) => q.doneOn!)).sort();
  const sweptBy = (p: QuestSet['period']) => history.filter((s) => s.period === p && s.sweptOn);
  const dailySweeps = sweptBy('daily');
  const sweeps = dailySweeps.map((s) => s.sweptOn!).sort();
  const weekSweeps = sweptBy('weekly').map((s) => s.sweptOn!).sort();
  const monthSweeps = sweptBy('monthly').map((s) => s.sweptOn!).sort();
  counts(
    [
      ['quest1', 1, 'bronze', 'scroll', 'Quest Taker'],
      ['quest10', 10, 'bronze', 'scroll', 'Errand Runner'],
      ['quest50', 50, 'gold', 'scroll', 'Questmaster'],
      ['quest100', 100, 'silver', 'torii', 'Quest Hero'],
      ['quest250', 250, 'platinum', 'torii', 'Quest Legend'],
    ],
    questsDone,
    (g) => (g === 1 ? 'Complete your first quest' : `Complete ${g} quests`),
  );
  add('sweep', 'silver', 'check', 'Clean Sweep', 'All three daily quests in one day', 1, sweeps.length ? 1 : 0, nthSorted(sweeps, 1));
  counts(
    [
      ['sweep7', 7, 'gold', 'check', 'Seven Sweeps'],
      ['sweep30', 30, 'gold', 'star', 'Thirty Sweeps'],
    ],
    sweeps,
    (g) => `Clear the daily quests on ${g} days`,
  );
  const sweepRuns = streaks(dailySweeps.map((s) => s.start), prevDay);
  streakLadder(
    [
      ['sweeprun3', 3, 'silver', 'flame', 'Daily Grind'],
      ['sweeprun7', 7, 'gold', 'flame', 'Perfect Week of Quests'],
    ],
    sweepRuns,
    (g) => `Clear the daily quests ${g} days in a row`,
  );
  add('wsweep', 'silver', 'calendar', 'Week Conquered', 'All three weekly quests in one week', 1, weekSweeps.length ? 1 : 0, nthSorted(weekSweeps, 1));
  counts([['wsweep5', 5, 'gold', 'calendar', 'Five Weeks Conquered']], weekSweeps, (g) => `Clear the weekly quests in ${g} weeks`);
  add('month', 'platinum', 'crown', 'Month Conquered', 'All three monthly quests in one month', 1, monthSweeps.length ? 1 : 0, nthSorted(monthSweeps, 1));
  counts([['month3', 3, 'platinum', 'crown', 'Season Conquered']], monthSweeps, (g) => `Clear the monthly quests in ${g} months`);
  const slam = [sweeps[0], weekSweeps[0], monthSweeps[0]];
  add('slam', 'silver', 'target', 'Grand Slam', 'Clear all the quests of a day, of a week and of a month', 3, slam.filter(Boolean).length, slam.every(Boolean) ? (slam as string[]).sort().at(-1)! : null);

  // ── bosses ──
  inGroup('bosses');
  const fights = extras.bosses ?? bossHistory(input);
  const won = fights.filter((f) => f.defeatedOn);
  const downs = won.map((f) => f.defeatedOn!).sort();
  counts(
    [
      ['boss1', 1, 'bronze', 'oni', 'First Hunt'],
      ['boss5', 5, 'silver', 'oni', 'Oni Hunter'],
      ['boss10', 10, 'silver', 'sword', 'Demon Slayer'],
      ['boss20', 20, 'gold', 'oni', 'Yōkai Bane'],
      ['boss50', 50, 'platinum', 'dragon', 'Yōkai King'],
    ],
    downs,
    (g) => (g === 1 ? 'Defeat a weekly boss' : `Defeat ${g} weekly bosses`),
  );
  const firstDown = new Map<string, string>();
  for (const f of won) if (!firstDown.has(f.boss.id)) firstDown.set(f.boss.id, f.defeatedOn!);
  add('bestiary', 'platinum', 'torii', 'Full Bestiary', `Defeat all ${BOSSES.length} bosses at least once`, BOSSES.length, firstDown.size, firstDown.size === BOSSES.length ? [...firstDown.values()].sort().at(-1)! : null);
  const wonOn = new Map(won.map((f) => [f.start, f.defeatedOn!]));
  streakLadder(
    [
      ['bossrun4', 4, 'gold', 'shield', 'Raid Streak'],
      ['bossrun8', 8, 'platinum', 'shield', 'Unbroken Raid'],
    ],
    streaks(wonOn.keys(), prevWeek),
    (g) => `Defeat ${g} weekly bosses in a row`,
    (w) => (w ? wonOn.get(w)! : null),
  );
  // Hit its weak section on or before the day it fell.
  const exploited = won.filter((f) => f.hits.some((h) => h.weak && h.date <= f.defeatedOn!));
  once('weak1', 'bronze', 'mask', 'Weak Spot', "Defeat a boss in a week you hit its weak section", exploited.map((f) => f.defeatedOn!).sort());
  const weakFirst = new Map<string, string>();
  for (const f of exploited) if (!weakFirst.has(f.boss.id)) weakFirst.set(f.boss.id, f.defeatedOn!);
  add('weak8', 'gold', 'mask', 'Know Thy Enemy', `Defeat each of the ${BOSSES.length} bosses after hitting its weak section`, BOSSES.length, weakFirst.size, weakFirst.size === BOSSES.length ? [...weakFirst.values()].sort().at(-1)! : null);
  once('swift', 'gold', 'sword', 'Swift Blade', 'Defeat a weekly boss by Wednesday', won.filter((f) => f.defeatedOn! <= addDays(f.start, 2)).map((f) => f.defeatedOn!).sort());
  const overkill = fights
    .map((f) => {
      let dmg = 0;
      for (const h of [...f.hits].reverse()) {
        dmg += h.dmg;
        if (dmg >= 2 * f.hp) return h.date;
      }
      return null;
    })
    .filter(Boolean) as string[];
  once('overkill', 'silver', 'fist', 'Overkill', "Deal twice a boss's HP in its week", overkill.sort());

  // ── secret ──
  inGroup('secret');
  const sessionsOn = (test: (d: string) => boolean) => [...sessionDays].filter(test).sort();
  once('answer', 'bronze', 'eye', 'The Answer', 'A session of exactly 42 minutes', datesOf(entries.filter((e) => e.minutes === 42)), true);
  once('newyear', 'bronze', 'sun', 'First Light', 'Something logged on 1 January', factDays.filter((d) => d.slice(5) === '01-01'), true);
  once('halloween', 'bronze', 'mask', 'Yōkai Night', 'A session on 31 October', sessionsOn((d) => d.slice(5) === '10-31'), true);
  once('piday', 'bronze', 'infinity', 'Pi Day', 'A session on 14 March', sessionsOn((d) => d.slice(5) === '03-14'), true);
  once('mirror', 'bronze', 'eye', 'Mirror Date', 'A session on a day whose number matches its month (1 Jan, 2 Feb … 12 Dec)', sessionsOn((d) => d.slice(5, 7) === d.slice(8, 10)), true);
  once('friday13', 'silver', 'oni', 'Unlucky for Some', 'A session on a Friday the 13th', sessionsOn((d) => d.slice(8) === '13' && weekdayIndex(d) === 4), true);
  once('leap', 'gold', 'wing', 'Leap Day', 'A session on 29 February', sessionsOn((d) => d.slice(5) === '02-29'), true);
  add('over9000', 'gold', 'bolt', "It's Over 9000!", 'More than 9,000 XP in total', 9001, overall.total, overall.reach(9001), true);
  const sectionsOnDay = (f: Facts) => CLASSIC_SECTIONS.reduce((n, s) => n + ((s === 'cabinet' ? f.cabinet > 0 : f.sections.has(s)) ? 1 : 0), 0);
  add('everything', 'platinum', 'gem', 'Everything, Everywhere', `All ${CLASSIC_SECTIONS.length} original sections on one day`, CLASSIC_SECTIONS.length, maxOver(sectionsOnDay), daysWhere((f) => sectionsOnDay(f) === CLASSIC_SECTIONS.length)[0] ?? null, true);
  // A full week (something every day) touching 7 different sections: reached on its Sunday.
  const sevenWeeks = new Map<string, { n: number; s: Set<string> }>();
  for (const d of factDays) {
    const w = weekStart(d);
    let x = sevenWeeks.get(w);
    if (!x) sevenWeeks.set(w, (x = { n: 0, s: new Set() }));
    const f = facts.get(d)!;
    x.n++;
    for (const s of f.sections) x.s.add(s);
    if (f.cabinet > 0) x.s.add('cabinet');
  }
  const seven = [...sevenWeeks].filter(([, x]) => x.n === 7 && x.s.size >= 7).map(([w]) => addDays(w, 6)).sort();
  once('seven', 'gold', 'torii', 'Seven Paths', 'Something logged every day of a week, across 7 different sections', seven, true);
  once('oneshot', 'platinum', 'sword', 'One-Shot', 'Defeat a weekly boss on its Monday', won.filter((f) => f.defeatedOn === f.start).map((f) => f.defeatedOn!).sort(), true);

  return list;
}
