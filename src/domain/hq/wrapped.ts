/**
 * 映写室, the projection room: your year so far as a film. Built only from the records of that year,
 * and any reel with nothing to show isn't played. The comparisons use real distances.
 */
import { TIMED_SECTIONS, type TimedSection } from '../../data/types';
import { activeDays, type ProgressInput } from '../progress/engine';
import { dayFacts } from '../progress/quests';
import type { CheckIn } from './checkin';
import { weatherOf } from './checkin';
import { ROAD_KM, journey } from './tokaido';

export interface YearReel {
  year: number;
  /** Through this date: today, in the current year. */
  through: string;
  minutes: number;
  days: number;
  sessions: number;
  sections: { id: TimedSection; minutes: number }[];
  bestMonth: { month: number; minutes: number } | null;
  bestDay: { date: string; minutes: number } | null;
  km: number;
  distanceLine: string | null;
  tasks: number;
  nights: number;
  avgSleep: number | null;
  screenAvg: number | null;
  moodDays: number;
  /** Most common weather. */
  weather: { kanji: string; name: string; share: number } | null;
  books: number;
  wishes: number;
  capsules: number;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthLabel = (m: number) => MONTHS[m];

/** A real-world feel for a distance. */
export function distanceFeel(km: number): string | null {
  if (km < 5) return null;
  if (km >= ROAD_KM) return `Edo to Kyoto and more: ${(km / ROAD_KM).toFixed(1)} times along the old Tōkaidō.`;
  const j = journey(km);
  if (j.passed === 0) return `On the Tōkaidō, you’re most of the way to ${j.next!.name}.`;
  return `On the old Tōkaidō from Edo, that gets you to ${j.last.name}.`;
}

export interface ReelContext {
  checkIns: CheckIn[];
  /** Finish dates of finished books. */
  bookDates: string[];
  wishDates: string[];
  capsulesSealed: string[];
}

export function yearReel(input: ProgressInput, year: number, ctx: ReelContext): YearReel {
  const y = String(year);
  const through = input.today.startsWith(y) ? input.today : `${y}-12-31`;
  const facts = [...dayFacts(input)].filter(([d]) => d.startsWith(y) && d <= through);
  const min = new Map<string, number>();
  const months = new Array<number>(12).fill(0);
  let minutes = 0;
  let sessions = 0;
  let km = 0;
  let tasks = 0;
  let bestDay: YearReel['bestDay'] = null;
  for (const [d, f] of facts) {
    minutes += f.minutes;
    sessions += f.sessions;
    km += f.km;
    tasks += f.tasks;
    months[+d.slice(5, 7) - 1] += f.minutes;
    if (f.minutes > 0 && (!bestDay || f.minutes > bestDay.minutes)) bestDay = { date: d, minutes: f.minutes };
    for (const [k, v] of Object.entries(f.min)) if (v) min.set(k, (min.get(k) ?? 0) + v);
  }
  const bestM = months.reduce((b, v, i) => (v > months[b] ? i : b), 0);
  const metric = (n: string) => input.metrics.filter((m) => m.metric === n && m.date.startsWith(y) && m.date <= through).map((m) => m.minutes);
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, z) => x + z, 0) / a.length) : null);
  const sleep = metric('sleep');
  const moods = ctx.checkIns.filter((c) => c.date.startsWith(y) && c.date <= through);
  const counts = new Map<number, number>();
  for (const c of moods) counts.set(c.mood, (counts.get(c.mood) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
  const w = top ? weatherOf(top[0]) : null;
  const inYear = (d: string) => d.startsWith(y) && d <= through;
  return {
    year,
    through,
    minutes,
    days: [...activeDays(input)].filter(inYear).length,
    sessions,
    sections: TIMED_SECTIONS.filter((s) => min.get(s)).map((s) => ({ id: s, minutes: min.get(s)! })).sort((a, b) => b.minutes - a.minutes),
    bestMonth: minutes ? { month: bestM, minutes: months[bestM] } : null,
    bestDay,
    km: Math.round(km * 10) / 10,
    distanceLine: distanceFeel(km),
    tasks,
    nights: sleep.length,
    avgSleep: avg(sleep),
    screenAvg: avg(metric('screen')),
    moodDays: moods.length,
    weather: w && top ? { kanji: w.kanji, name: w.name, share: top[1] / moods.length } : null,
    books: ctx.bookDates.filter(inYear).length,
    wishes: ctx.wishDates.filter(inYear).length,
    capsules: ctx.capsulesSealed.filter(inYear).length,
  };
}

export type ReelPanel = 'title' | 'time' | 'sections' | 'best' | 'miles' | 'nights' | 'weather' | 'trophies' | 'end';

/** Only the reels there's something to show for. */
export function reelPanels(r: YearReel): ReelPanel[] {
  const out: ReelPanel[] = ['title'];
  if (r.minutes > 0) out.push('time');
  if (r.sections.length) out.push('sections');
  if (r.bestDay) out.push('best');
  if (r.km > 0) out.push('miles');
  if (r.nights >= 3) out.push('nights');
  if (r.moodDays >= 3) out.push('weather');
  if (r.books || r.wishes || r.tasks) out.push('trophies');
  out.push('end');
  return out;
}

/** Years with anything in them, latest first. */
export function reelYears(input: ProgressInput, checkIns: CheckIn[]): number[] {
  const years = new Set<number>();
  for (const d of dayFacts(input).keys()) if (d <= input.today) years.add(+d.slice(0, 4));
  for (const c of checkIns) years.add(+c.date.slice(0, 4));
  return [...years].sort((a, b) => b - a);
}
