/**
 * Looking back: a week's recap ("previously on…") and minutes per day for the training heatmap.
 * Both come straight from the day facts, like quests, so they always match the records.
 */
import { addDays, weekStart } from '../log/dates';
import type { SectionId } from '../../data/types';
import { BOSS_FROM, bossFight } from './boss';
import type { ProgressInput, XpSection } from './engine';
import { dayFacts, type Facts, type QuestSet } from './quests';

export interface WeekRecap {
  start: string;
  end: string;
  minutes: number;
  /** The week before, for the change. */
  prevMinutes: number;
  sessions: number;
  activeDays: number;
  /** Minutes per section, most first (sections with time only). */
  sections: { id: XpSection; minutes: number }[];
  bestDay: { date: string; minutes: number } | null;
  longest: number;
  tasks: number;
  nights: number;
  quests: number;
  boss: { name: string; defeatedOn: string | null; hp: number; damage: number } | null;
}

function weekMinutes(monday: string, days: Map<string, Facts>): number {
  let n = 0;
  for (let i = 0; i < 7; i++) n += days.get(addDays(monday, i))?.minutes ?? 0;
  return n;
}

export function weekRecap(input: ProgressInput, monday: string, quests: QuestSet[] = [], days = dayFacts(input)): WeekRecap {
  const end = addDays(monday, 6);
  const min: Partial<Record<XpSection, number>> = {};
  let sessions = 0;
  let active = 0;
  let longest = 0;
  let tasks = 0;
  let nights = 0;
  let bestDay: WeekRecap['bestDay'] = null;
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    const f = days.get(d);
    if (!f) continue;
    active++;
    sessions += f.sessions;
    longest = Math.max(longest, f.longest);
    tasks += f.tasks;
    nights += f.nights;
    for (const [k, v] of Object.entries(f.min) as [XpSection, number][]) min[k] = (min[k] ?? 0) + v;
    if (f.minutes > 0 && (!bestDay || f.minutes > bestDay.minutes)) bestDay = { date: d, minutes: f.minutes };
  }
  const sections = (Object.entries(min) as [XpSection, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([id, minutes]) => ({ id, minutes }));
  const questsDone = quests.reduce((n, set) => n + set.quests.filter((q) => q.doneOn && q.doneOn >= monday && q.doneOn <= end).length, 0);
  const fight = monday >= BOSS_FROM ? bossFight(input, monday, days) : null;
  return {
    start: monday,
    end,
    minutes: weekMinutes(monday, days),
    prevMinutes: weekMinutes(addDays(monday, -7), days),
    sessions,
    activeDays: active,
    sections,
    bestDay,
    longest,
    tasks,
    nights,
    quests: questsDone,
    boss: fight ? { name: fight.boss.name, defeatedOn: fight.defeatedOn, hp: fight.hp, damage: fight.damage } : null,
  };
}

/** Last week's recap (the week before the one containing today). */
export const lastWeekRecap = (input: ProgressInput, quests: QuestSet[] = [], days = dayFacts(input)) => weekRecap(input, addDays(weekStart(input.today), -7), quests, days);

export interface HeatDay {
  date: string;
  minutes: number;
  /** 0 nothing · 1 something but no time · 2–5 by minutes. */
  level: 0 | 1 | 2 | 3 | 4 | 5;
  rest: boolean;
  sections: SectionId[];
}

/** Bands for the heatmap, in minutes. */
export const HEAT_BANDS = [1, 30, 60, 120] as const;

const levelOf = (f: Facts | undefined): HeatDay['level'] => {
  if (!f) return 0;
  const m = f.minutes;
  if (m >= HEAT_BANDS[3]) return 5;
  if (m >= HEAT_BANDS[2]) return 4;
  if (m >= HEAT_BANDS[1]) return 3;
  if (m >= HEAT_BANDS[0]) return 2;
  return 1;
};

/** Whole weeks (Monday first) ending with the current week; future days are left out. */
export function heatmap(input: ProgressInput, weeks: number, days = dayFacts(input)): HeatDay[][] {
  const rest = new Set(input.restDays);
  const first = addDays(weekStart(input.today), -7 * (weeks - 1));
  const out: HeatDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(first, w * 7 + i);
      if (date > input.today) break;
      const f = days.get(date);
      col.push({ date, minutes: f?.minutes ?? 0, level: levelOf(f), rest: rest.has(date), sections: f ? [...f.sections] : [] });
    }
    out.push(col);
  }
  return out;
}
