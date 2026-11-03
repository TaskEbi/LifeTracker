/**
 * 次の一手, the next move: given how long you have and how you feel, the most useful thing to do now.
 * Every suggestion is worked out from the records and says why. Nothing is stored or awarded.
 */
import { dayCount, weekdayIndex, weekStart, addDays } from '../log/dates';
import { scheduleFor, sectionOf, type ProgressInput } from '../progress/engine';
import { TIMED_SECTIONS, type SectionId, type TimedSection } from '../../data/types';

export type Energy = 'low' | 'ok' | 'high';

export type MoveAction =
  | { type: 'focus'; section: Exclude<TimedSection, 'gym'>; goal: number }
  | { type: 'sheet'; sheet: string; extra?: Record<string, unknown> }
  | { type: 'route'; route: string; rest?: string[] };

export interface Move {
  id: string;
  title: string;
  why: string[];
  section: SectionId | null;
  minutes: number;
  action: MoveAction;
  score: number;
}

export interface MoveContext {
  /** Minutes since midnight in the Daily Log time zone. */
  nowMin: number;
  minutes: number;
  energy: Energy;
  deadlines: { section: SectionId | null; title: string; date: string }[];
  cardsDue: number;
  bigThree: { text: string; section: SectionId | null }[];
  /** An active niggle of moderate or worse on the legs or feet. */
  legsHurt: boolean;
  planRun: { title: string; km: number | null } | null;
  bossWeak: SectionId | null;
  /** Open daily quests with a section. */
  quests: { title: string; section: SectionId }[];
  overdueTasks: number;
  sleepLogged: boolean;
}

const NAMES: Record<TimedSection, string> = { violin: 'Violin', coding: 'Coding', sports: 'Sport', gym: 'Gym', study: 'Study', chess: 'Chess', future: 'Uni prep', reading: 'Reading' };
/** How hard each is on a tired head or body (1 easy, 3 hard). */
const EFFORT: Record<TimedSection, number> = { violin: 2, coding: 3, sports: 3, gym: 3, study: 3, chess: 2, future: 2, reading: 1 };
/** Shortest stretch that is worth starting. */
const MIN_FIT: Record<TimedSection, number> = { violin: 10, coding: 20, sports: 20, gym: 30, study: 15, chess: 10, future: 15, reading: 5 };

const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m} min`);

/** Late: within 30 minutes of the planned bedtime, or in the small hours. */
export function isBedtime(input: ProgressInput, nowMin: number): boolean {
  const bed = toMin(scheduleFor(addDays(input.today, 1), input.sleep).bed);
  // Counted from noon, so the night runs in one piece across midnight, ending at 05:00.
  const fromNoon = (m: number) => (m + 720) % 1440;
  const now = fromNoon(nowMin);
  return now >= fromNoon(bed) - 30 && now < fromNoon(300);
}

export function nextMoves(input: ProgressInput, ctx: MoveContext, limit = 3): Move[] {
  const { today } = input;
  const monday = weekStart(today);
  const dayNo = weekdayIndex(today) + 1;
  const last = new Map<TimedSection, string>();
  const week = new Map<TimedSection, { min: number; n: number }>();
  let todaySections = new Set<string>();
  for (const e of input.entries) {
    if (e.date > today) continue;
    const s = sectionOf(e, input);
    if (!(TIMED_SECTIONS as readonly string[]).includes(s)) continue;
    const t = s as TimedSection;
    if (!last.has(t) || e.date > last.get(t)!) last.set(t, e.date);
    if (e.date >= monday) {
      const v = week.get(t) ?? { min: 0, n: 0 };
      week.set(t, { min: v.min + e.minutes, n: v.n + 1 });
    }
    if (e.date === today) todaySections = todaySections.add(t);
  }

  const out: Move[] = [];
  const late = isBedtime(input, ctx.nowMin);
  if (late) {
    out.push({
      id: 'bed',
      title: 'Go to bed',
      why: [`Your plan says bed by ${scheduleFor(addDays(today, 1), input.sleep).bed}. Tomorrow’s you does more with sleep than tonight’s you does with this hour.`],
      section: 'sleep',
      minutes: 0,
      action: { type: 'route', route: 'sleep' },
      score: 1000,
    });
  }

  for (const s of TIMED_SECTIONS) {
    if (ctx.minutes < MIN_FIT[s]) continue;
    if (late && EFFORT[s] >= 2) continue;
    const why: string[] = [];
    let score = 10;
    const w = week.get(s) ?? { min: 0, n: 0 };
    const target = s === 'violin' ? input.targets.violinWeek : s === 'future' ? input.targets.futureWeek : s === 'reading' ? input.targets.readingWeek : null;
    if (target != null) {
      const behind = Math.round((target * dayNo) / 7 - w.min);
      if (behind > 0) {
        score += Math.min(36, (behind / target) * 60);
        why.push(`${fmt(behind)} behind this week’s pace`);
      }
    }
    const sessionTarget = s === 'sports' ? input.targets.sportsWeek : s === 'gym' ? input.targets.gymWeek : null;
    if (sessionTarget != null && w.n < sessionTarget) {
      const left = sessionTarget - w.n;
      score += 8 * left * (dayNo / 7);
      why.push(`${left} more ${left === 1 ? 'session' : 'sessions'} to this week’s target`);
    }
    const lastDate = last.get(s);
    if (lastDate) {
      const gap = dayCount(lastDate, today) - 1;
      if (gap >= 3) {
        score += Math.min(20, gap * 3);
        why.push(`${gap} days since the last one`);
      }
    }
    const deadlineSection = ctx.deadlines.filter((d) => d.section === s && d.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (deadlineSection) {
      const left = dayCount(today, deadlineSection.date) - 1;
      if (left <= 30) {
        score += ((30 - left) / 30) * 40 + 6;
        why.unshift(left === 0 ? `${deadlineSection.title} is today` : `${deadlineSection.title} in ${left} ${left === 1 ? 'day' : 'days'}`);
      }
    }
    if (ctx.bossWeak === s) {
      score += 8;
      why.push('The boss takes double damage from it');
    }
    const quest = ctx.quests.find((q) => q.section === s);
    if (quest) {
      score += 10;
      why.push(`Clears today’s training: ${quest.title}`);
    }
    const big = ctx.bigThree.find((b) => b.section === s);
    if (big) {
      score += 12;
      why.push(`On your Big Three: ${big.text}`);
    }
    const effort = EFFORT[s];
    if (ctx.energy === 'low') score -= (effort - 1) * 12;
    if (ctx.energy === 'high') score += (effort - 1) * 4;
    if (todaySections.has(s)) score -= 15;
    if (s === 'sports' && ctx.legsHurt) {
      score -= 40;
      why.push('Careful: your legs have a niggle logged');
    }
    if (!why.length) why.push(lastDate ? 'Keeps it ticking over' : 'You haven’t started this one yet');
    const goal = [15, 25, 45, 60, 90].filter((g) => g <= ctx.minutes).pop() ?? 15;
    out.push({
      id: s,
      title: NAMES[s],
      why,
      section: s,
      minutes: Math.min(ctx.minutes, goal),
      action: s === 'gym' ? { type: 'route', route: 'gym' } : { type: 'focus', section: s, goal },
      score,
    });
  }

  if (ctx.planRun && ctx.minutes >= 20 && !late && !ctx.legsHurt) {
    out.push({
      id: 'plan-run',
      title: ctx.planRun.title,
      why: ['It’s today’s run in your marathon plan'],
      section: 'sports',
      minutes: ctx.minutes,
      action: { type: 'sheet', sheet: 'sports', extra: { sport: 'running', km: ctx.planRun.km ?? undefined, planned: ctx.planRun.title } },
      score: 62 + (ctx.energy === 'low' ? -20 : ctx.energy === 'high' ? 8 : 0),
    });
  }
  if (ctx.cardsDue > 0) {
    out.push({
      id: 'recall',
      title: `Recall ${ctx.cardsDue} ${ctx.cardsDue === 1 ? 'card' : 'cards'}`,
      why: ['Reviewing on the day it’s due is what makes it stick', `About ${Math.max(1, Math.round(ctx.cardsDue / 3))} min`],
      section: 'study',
      minutes: Math.max(1, Math.round(ctx.cardsDue / 3)),
      action: { type: 'route', route: 'base', rest: ['dojo'] },
      score: 18 + Math.min(30, ctx.cardsDue) + (ctx.energy === 'low' ? 12 : 0),
    });
  }
  if (ctx.overdueTasks > 0) {
    out.push({
      id: 'tasks',
      title: `Clear ${ctx.overdueTasks} overdue ${ctx.overdueTasks === 1 ? 'task' : 'tasks'}`,
      why: ['Late tasks take up room in your head until they’re gone'],
      section: null,
      minutes: Math.min(ctx.minutes, 20),
      action: { type: 'route', route: 'tasks' },
      score: 22 + Math.min(20, ctx.overdueTasks * 4) + (ctx.energy === 'low' ? 8 : 0),
    });
  }
  if (!ctx.sleepLogged && ctx.nowMin < 720) {
    out.push({ id: 'sleep-log', title: 'Log last night', why: ['Ten seconds now keeps the sleep numbers honest'], section: 'sleep', minutes: 1, action: { type: 'sheet', sheet: 'sleep', extra: { date: today } }, score: 16 });
  }

  // A planned run and "Sport" are the same move.
  const hasPlanRun = out.some((m) => m.id === 'plan-run');
  return out
    .filter((m) => !(hasPlanRun && m.id === 'sports'))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
