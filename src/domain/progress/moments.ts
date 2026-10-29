/**
 * Moments: things worth a celebration that aren't XP lines, found by comparing the records
 * before and after a save (personal records, streak milestones, combos, plan progress…).
 * Pure and derived; nothing stored. A moment fires only when this save changed it (false before,
 * true after), so old history never fires and re-saving the same thing fires nothing new.
 */
import { addDays, dayCount, weekStart } from '../log/dates';
import { SECTION_IDS, type SectionId } from '../../data/types';
import { planMoments } from '../plans/progress';
import { bossHistory } from './boss';
import { activeDays, bedDelta, computeProgress, dayStreak, rankFor, RULES, sectionOf, type ProgressInput } from './engine';
import { dayFacts } from './quests';

export type RunDistance = '5k' | '10k' | 'half' | 'marathon';

export type Moment =
  /** Heaviest completed set ever for an exercise (weighted only; the first time doesn't count). kg. */
  | { type: 'pr-lift'; exercise: string; weight: number; reps: number; previous: number }
  /** Fastest pace over a distance (run of at least that length). Paces as "4:30 /km". */
  | { type: 'pr-run'; distance: RunDistance; pace: string; previous: string }
  /** Longest run ever (km; the previous longest was at least 5 km). */
  | { type: 'long-run'; km: number; previous: number }
  /** Running kilometres in total passed a milestone (50, 100, 250, 500, 750, 1000, then every 500). */
  | { type: 'distance'; km: number }
  /** A marathon-length run logged; time as h:mm. */
  | { type: 'race'; km: number; time: string }
  /** A planned workout done; plan week/phase finished. */
  | { type: 'plan-session'; plan: 'marathon' | 'gym'; title: string; week: number }
  | { type: 'plan-week'; plan: 'marathon' | 'gym'; week: number; of: number }
  | { type: 'plan-phase'; phase: string; next: string | null }
  /** Day streak reached a milestone. */
  | { type: 'streak'; days: number }
  /** First thing logged today: chapter n (days with anything logged, rest days included — Home's 第N話). */
  | { type: 'chapter'; n: number }
  /** Three or more sections today (fires as the count grows past 2); in SECTION_IDS order. */
  | { type: 'combo'; sections: SectionId[] }
  /** Today marked a rest day; the day streak it keeps. */
  | { type: 'rest'; streak: number }
  /** Back after a gap of `gap` days with nothing logged. */
  | { type: 'comeback'; gap: number }
  /** A night within the bedtime window; `streak` on-time nights in a row (this one included). */
  | { type: 'good-night'; bed: string; streak: number }
  | { type: 'screen-zen'; minutes: number; target: number }
  /** Every task due today (or overdue) is done; `count` of them. */
  | { type: 'tasks-clear'; count: number }
  | { type: 'focus'; section: SectionId; minutes: number }
  /** One save hit this week's boss hard (damage ≥ BOSS_CRIT) without defeating it. */
  | { type: 'boss-crit'; damage: number; boss: string }
  /** Overall rank went up. */
  | { type: 'rank'; from: string; to: string };

export type MomentType = Moment['type'];

/** What the caller knows that the records don't say. */
export interface MomentContext {
  /** Overall level before and after (saves recomputing the XP when the caller has it). */
  levels?: [number, number];
  /** A finished focus session waiting to be logged: a new entry in this section created at or after `since` is from focus. */
  focus?: { section: SectionId; since: string } | null;
}

export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 250, 300, 365];
export const DISTANCE_MILESTONES = [50, 100, 250, 500, 750, 1000];
export const RUN_DISTANCES: { id: RunDistance; km: number }[] = [
  { id: '5k', km: 5 },
  { id: '10k', km: 10 },
  { id: 'half', km: 21.0975 },
  { id: 'marathon', km: 42.195 },
];
export const MARATHON_KM = 42.195;
/** Damage in one save that counts as a critical hit. */
export const BOSS_CRIT = 60;
/** Days with nothing logged before a comeback counts. */
export const COMEBACK_GAP = 5;
/** Most lift records shown for one save. */
const MAX_LIFT_PRS = 2;

/** Streak milestones: the list, then every 100 after it. */
const isStreakMilestone = (n: number) => STREAK_MILESTONES.includes(n) || (n > 365 && n % 100 === 0);
/** The highest distance milestone at or below km (0 if none). */
function distanceMilestone(km: number): number {
  if (km >= 1500) return Math.floor(km / 500) * 500;
  return DISTANCE_MILESTONES.filter((m) => km >= m).pop() ?? 0;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
/** Seconds per km as "4:30 /km". */
export const paceText = (secPerKm: number) => {
  const s = Math.round(secPerKm);
  return `${Math.floor(s / 60)}:${pad2(s % 60)} /km`;
};
export const hm = (minutes: number) => `${Math.floor(minutes / 60)}:${pad2(Math.round(minutes) % 60)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

// ─── per-input summary (worked out once per input) ──────────────────────────

interface Lift {
  name: string;
  weight: number;
  reps: number;
}

interface Summary {
  /** Heaviest done, weighted set per exercise (lower-cased name). */
  lifts: Map<string, Lift>;
  /** Best pace (s/km) over each distance, or null. */
  pace: Record<RunDistance, number | null>;
  longest: number;
  totalKm: number;
  /** Ids of runs of marathon length. */
  marathons: Set<string>;
  /** Ids of every live entry up to today. */
  ids: Set<string>;
  active: Set<string>;
}

const memo = new WeakMap<ProgressInput, Summary>();
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

function summary(input: ProgressInput): Summary {
  let s = memo.get(input);
  if (s) return s;
  s = { lifts: new Map(), pace: { '5k': null, '10k': null, half: null, marathon: null }, longest: 0, totalKm: 0, marathons: new Set(), ids: new Set(), active: activeDays(input) };
  for (const e of input.entries) {
    if (e.date > input.today) continue;
    s.ids.add(e.id);
    const d = input.details.get(e.id);
    if (!d || d.deleted_at || !d.data) continue;
    const section = sectionOf(e, input);
    if (section === 'gym' && Array.isArray(d.data.exercises)) {
      for (const x of d.data.exercises as { name?: unknown; unit?: unknown; sets?: unknown }[]) {
        if (!x || typeof x.name !== 'string' || x.unit === 's' || !Array.isArray(x.sets)) continue;
        const key = x.name.trim().toLowerCase();
        if (!key) continue;
        for (const set of x.sets as { weight?: unknown; reps?: unknown; done?: unknown }[]) {
          const w = num(set?.weight);
          if (!set?.done || !w) continue;
          const reps = num(set.reps);
          const best = s.lifts.get(key);
          if (!best || w > best.weight || (w === best.weight && reps > best.reps)) s.lifts.set(key, { name: x.name.trim(), weight: w, reps });
        }
      }
    } else if (section === 'sports' && d.data.sport === 'running') {
      const km = num(d.data.km);
      if (!km || e.minutes <= 0) continue;
      s.totalKm += km;
      s.longest = Math.max(s.longest, km);
      if (km >= MARATHON_KM) s.marathons.add(e.id);
      const pace = (e.minutes * 60) / km;
      for (const r of RUN_DISTANCES) if (km >= r.km && (s.pace[r.id] == null || pace < s.pace[r.id]!)) s.pace[r.id] = pace;
    }
  }
  memo.set(input, s);
  return s;
}

const levelMemo = new WeakMap<ProgressInput, number>();
function levelOf(input: ProgressInput): number {
  let l = levelMemo.get(input);
  if (l == null) levelMemo.set(input, (l = computeProgress(input).overall.level));
  return l;
}

const ontime = (input: ProgressInput, date: string): string | null => {
  const n = input.nights.get(date);
  if (!n || n.deleted_at || !n.bed) return null;
  return Math.abs(bedDelta({ date, bed: n.bed }, input.sleep)) <= RULES.bedtimeWindow ? n.bed : null;
};
const metricOn = (input: ProgressInput, metric: string, date: string) => input.metrics.find((m) => m.metric === metric && m.date === date);
const screenTarget = (input: ProgressInput, date: string) => (input.targetsAt ? input.targetsAt(weekStart(date)) : input.targets).screenDay;

/** Tasks that count for "all clear" today: due today or earlier, and either open or done today. */
function dueTasks(input: ProgressInput) {
  return input.todos.filter((t) => t.due && t.due <= input.today && (!t.done_at || input.dayOf(t.done_at) === input.today));
}

// ─── detection ──────────────────────────────────────────────────────────────

export function moments(before: ProgressInput, after: ProgressInput, ctx: MomentContext = {}): Moment[] {
  if (before === after) return [];
  const today = after.today;
  const a = summary(after);
  const b = summary(before);
  const out: Moment[] = [];

  // Chapter, comeback, rest, streak
  const madeActive = a.active.has(today) && !b.active.has(today);
  if (madeActive) {
    let n = 0;
    for (const d of a.active) if (d <= today) n++;
    out.push({ type: 'chapter', n });
    let last = '';
    for (const d of b.active) if (d < today && d > last) last = d;
    const gap = last ? dayCount(last, today) - 2 : 0;
    if (gap >= COMEBACK_GAP) out.push({ type: 'comeback', gap });
  }
  const streakA = dayStreak(a.active, today).n;
  const streakB = dayStreak(b.active, today).n;
  if (after.restDays.includes(today) && !before.restDays.includes(today)) out.push({ type: 'rest', streak: streakA });
  if (streakA > streakB) {
    const hit = [...Array(streakA - streakB).keys()].map((i) => streakB + 1 + i).filter(isStreakMilestone).pop();
    if (hit) out.push({ type: 'streak', days: hit });
  }

  // Combo: sections touched today
  const secA = dayFacts(after).get(today)?.sections;
  const secB = dayFacts(before).get(today)?.sections;
  if (secA && secA.size >= 3 && secA.size > (secB?.size ?? 0)) out.push({ type: 'combo', sections: SECTION_IDS.filter((s) => secA.has(s)) });

  // Lifting records: the biggest jumps, at most two
  const lifts: (Moment & { type: 'pr-lift' })[] = [];
  for (const [key, l] of a.lifts) {
    const prev = b.lifts.get(key);
    if (prev && l.weight > prev.weight) lifts.push({ type: 'pr-lift', exercise: l.name, weight: l.weight, reps: l.reps, previous: prev.weight });
  }
  lifts.sort((x, y) => y.weight - y.previous - (x.weight - x.previous));
  out.push(...lifts.slice(0, MAX_LIFT_PRS));

  // Running: the race, the longest distance whose pace record fell, the longest run, the total
  for (const id of a.marathons) {
    if (b.marathons.has(id)) continue;
    const e = after.entries.find((x) => x.id === id)!;
    out.push({ type: 'race', km: round2(num(after.details.get(id)!.data.km)), time: hm(e.minutes) });
    break;
  }
  for (const r of [...RUN_DISTANCES].reverse()) {
    const pa = a.pace[r.id];
    const pb = b.pace[r.id];
    if (pa != null && pb != null && pa < pb && paceText(pa) !== paceText(pb)) {
      out.push({ type: 'pr-run', distance: r.id, pace: paceText(pa), previous: paceText(pb) });
      break;
    }
  }
  if (a.longest > b.longest && b.longest >= 5) out.push({ type: 'long-run', km: round2(a.longest), previous: round2(b.longest) });
  const milestone = distanceMilestone(a.totalKm);
  if (milestone > distanceMilestone(b.totalKm)) out.push({ type: 'distance', km: milestone });

  // A good night: on time now and not before (last night or the two before it)
  for (let i = 0; i <= 2; i++) {
    const d = addDays(today, -i);
    const bed = ontime(after, d);
    if (!bed || ontime(before, d) || !metricOn(after, 'sleep', d)) continue;
    let streak = 1;
    for (let x = addDays(d, -1); ontime(after, x); x = addDays(x, -1)) streak++;
    out.push({ type: 'good-night', bed, streak });
    break;
  }

  // Screen time under the target (today or yesterday)
  for (let i = 0; i <= 1; i++) {
    const d = addDays(today, -i);
    const target = screenTarget(after, d);
    const m = metricOn(after, 'screen', d);
    if (target == null || !m || m.minutes > target) continue;
    const was = metricOn(before, 'screen', d);
    const wasTarget = screenTarget(before, d);
    if (was && wasTarget != null && was.minutes <= wasTarget) continue;
    out.push({ type: 'screen-zen', minutes: m.minutes, target });
    break;
  }

  // Tasks: a tick that leaves nothing due open
  const dueA = dueTasks(after);
  if (dueA.length && dueA.every((t) => t.done_at)) {
    const dueB = dueTasks(before);
    const doneNow = (id: string) => !before.todos.find((t) => t.id === id)?.done_at;
    if (dueB.some((t) => !t.done_at) && dueA.some((t) => doneNow(t.id))) out.push({ type: 'tasks-clear', count: dueA.length });
  }

  // Focus: a new session in the focus section, created after the focus finished
  if (ctx.focus) {
    const f = ctx.focus;
    const e = after.entries.find((x) => !b.ids.has(x.id) && a.ids.has(x.id) && x.created_at >= f.since && sectionOf(x, after) === f.section);
    if (e) out.push({ type: 'focus', section: f.section, minutes: e.minutes });
  }

  // Boss: a big hit that didn't finish it (defeat has its own celebration)
  const monday = weekStart(today);
  const fightA = bossHistory(after).find((f) => f.start === monday);
  const fightB = bossHistory(before).find((f) => f.start === monday);
  if (fightA && fightB && !fightA.defeatedOn && fightA.damage - fightB.damage >= BOSS_CRIT) out.push({ type: 'boss-crit', damage: fightA.damage - fightB.damage, boss: fightA.boss.name });

  // Rank
  const [lb, la] = ctx.levels ?? [levelOf(before), levelOf(after)];
  if (la > lb && rankFor(la) !== rankFor(lb)) out.push({ type: 'rank', from: rankFor(lb), to: rankFor(la) });

  out.push(...planMoments(before, after));
  return out;
}

/** One line per moment, for the reward box and screen readers. */
export function momentLine(m: Moment): string {
  switch (m.type) {
    case 'pr-lift':
      return `New record · ${m.exercise} ${m.weight} kg${m.reps ? ` × ${m.reps}` : ''} (was ${m.previous})`;
    case 'pr-run':
      return `New record · ${RUN_LABEL[m.distance]} pace ${m.pace} (was ${m.previous})`;
    case 'long-run':
      return `Longest run · ${m.km} km (was ${m.previous})`;
    case 'distance':
      return `${m.km} km run in total`;
    case 'race':
      return `Marathon · ${m.km} km in ${m.time}`;
    case 'plan-session':
      return `Plan · ${m.title} done (week ${m.week})`;
    case 'plan-week':
      return `Plan · week ${m.week} of ${m.of} complete`;
    case 'plan-phase':
      return `Plan · ${m.phase} phase complete${m.next ? `, next: ${m.next}` : ''}`;
    case 'streak':
      return `${m.days}-day streak`;
    case 'chapter':
      return `Chapter ${m.n}`;
    case 'combo':
      return `${m.sections.length}-section combo today`;
    case 'rest':
      return `Rest day · streak held at ${m.streak}`;
    case 'comeback':
      return `Back after ${m.gap} days`;
    case 'good-night':
      return `In bed on time · ${m.bed}${m.streak > 1 ? ` (${m.streak} nights running)` : ''}`;
    case 'screen-zen':
      return `Screen time under target · ${m.minutes} of ${m.target} min`;
    case 'tasks-clear':
      return `All due tasks done · ${m.count}`;
    case 'focus':
      return `Focus session · ${m.minutes} min`;
    case 'boss-crit':
      return `Critical hit · ${m.damage} damage to ${m.boss}`;
    case 'rank':
      return `Rank up · ${m.from} → ${m.to}`;
  }
}

export const RUN_LABEL: Record<RunDistance, string> = { '5k': '5K', '10k': '10K', half: 'Half marathon', marathon: 'Marathon' };