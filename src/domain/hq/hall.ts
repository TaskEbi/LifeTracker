/**
 * 殿堂, the hall of records: your all-time bests, each with its date, found in the records. "Chase"
 * says how close the last 30 days came, so a record is something to go after and not only a plaque.
 */
import { addDays, weekStart } from '../log/dates';
import { sectionOf, type ProgressInput } from '../progress/engine';
import { dayFacts } from '../progress/quests';
import { bufferedStreak, activeDays } from '../progress/engine';
import type { SectionId } from '../../data/types';

export interface HallRecord {
  id: string;
  label: string;
  value: string;
  date: string;
  section: SectionId | null;
  /** Share of the record reached in the last 30 days (0–1), or null when that doesn't apply. */
  chase: number | null;
}

const mins = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`);
const pace = (secPerKm: number) => `${Math.floor(secPerKm / 60)}:${String(Math.round(secPerKm % 60)).padStart(2, '0')} /km`;

/** Longest stretch of consecutive days, one missed day allowed (same rule as the streak). */
function bestStreak(days: Set<string>): { n: number; date: string } | null {
  const sorted = [...days].sort();
  if (!sorted.length) return null;
  let best = { n: 0, date: sorted[0] };
  let n = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev && (d === addDays(prev, 1) || d === addDays(prev, 2))) n++;
    else n = 1;
    if (n > best.n) best = { n, date: d };
    prev = d;
  }
  return best;
}

export function hallOfRecords(input: ProgressInput): HallRecord[] {
  const out: HallRecord[] = [];
  const { today } = input;
  const recent = addDays(today, -29);
  const facts = dayFacts(input);
  const add = (id: string, label: string, value: string, date: string, section: SectionId | null, chase: number | null) => out.push({ id, label, value, date, section, chase });

  // ── single sessions ──
  const live = input.entries.filter((e) => e.date <= today);
  const longest = live.reduce<(typeof live)[number] | null>((a, e) => (!a || e.minutes > a.minutes ? e : a), null);
  if (longest) {
    const s = sectionOf(longest, input);
    const rec = Math.max(0, ...live.filter((e) => e.date >= recent).map((e) => e.minutes));
    add('longest-session', 'Longest session', mins(longest.minutes), longest.date, s === 'general' || s === 'quests' ? null : s, rec / longest.minutes);
  }

  // ── days and weeks ──
  let bestDay: { d: string; m: number } | null = null;
  let mostSections: { d: string; n: number } | null = null;
  let mostTasks: { d: string; n: number } | null = null;
  const weekMin = new Map<string, number>();
  const weekKm = new Map<string, number>();
  for (const [d, f] of facts) {
    if (d > today) continue;
    if (!bestDay || f.minutes > bestDay.m) bestDay = { d, m: f.minutes };
    if (!mostSections || f.sections.size > mostSections.n) mostSections = { d, n: f.sections.size };
    if (f.tasks > 0 && (!mostTasks || f.tasks > mostTasks.n)) mostTasks = { d, n: f.tasks };
    const w = weekStart(d);
    weekMin.set(w, (weekMin.get(w) ?? 0) + f.minutes);
    weekKm.set(w, (weekKm.get(w) ?? 0) + f.km);
  }
  const lastDays = [...facts.entries()].filter(([d]) => d >= recent && d <= today);
  if (bestDay && bestDay.m > 0) add('best-day', 'Biggest day', mins(bestDay.m), bestDay.d, null, Math.max(0, ...lastDays.map(([, f]) => f.minutes)) / bestDay.m);
  if (mostSections && mostSections.n > 1) add('most-sections', 'Most sections in a day', String(mostSections.n), mostSections.d, null, Math.max(0, ...lastDays.map(([, f]) => f.sections.size)) / mostSections.n);
  if (mostTasks) add('most-tasks', 'Most tasks in a day', String(mostTasks.n), mostTasks.d, null, Math.max(0, ...lastDays.map(([, f]) => f.tasks)) / mostTasks.n);
  const bestWeek = [...weekMin].sort((a, b) => b[1] - a[1])[0];
  if (bestWeek && bestWeek[1] > 0) add('best-week', 'Biggest week', mins(bestWeek[1]), bestWeek[0], null, (weekMin.get(weekStart(today)) ?? 0) / bestWeek[1]);
  const bestKmWeek = [...weekKm].sort((a, b) => b[1] - a[1])[0];
  if (bestKmWeek && bestKmWeek[1] > 0) add('km-week', 'Most distance in a week', `${Math.round(bestKmWeek[1] * 10) / 10} km`, bestKmWeek[0], 'sports', (weekKm.get(weekStart(today)) ?? 0) / bestKmWeek[1]);

  // ── streak ──
  const streak = bestStreak(activeDays(input));
  if (streak && streak.n > 1) add('streak', 'Longest streak', `${streak.n} days`, streak.date, null, bufferedStreak(activeDays(input), today).n / streak.n);

  // ── running ──
  let longestRun: { d: string; km: number } | null = null;
  let fastest: { d: string; pace: number } | null = null;
  let recentLong = 0;
  let recentPace = Infinity;
  for (const e of live) {
    const det = input.details.get(e.id);
    const d = det && !det.deleted_at ? (det.data as { sport?: unknown; km?: unknown }) : null;
    if (d?.sport !== 'running' || typeof d.km !== 'number' || d.km <= 0) continue;
    if (!longestRun || d.km > longestRun.km) longestRun = { d: e.date, km: d.km };
    if (e.date >= recent) recentLong = Math.max(recentLong, d.km);
    if (d.km >= 5) {
      const p = (e.minutes * 60) / d.km;
      if (!fastest || p < fastest.pace) fastest = { d: e.date, pace: p };
      if (e.date >= recent) recentPace = Math.min(recentPace, p);
    }
  }
  if (longestRun) add('long-run', 'Longest run', `${longestRun.km} km`, longestRun.d, 'sports', recentLong / longestRun.km);
  if (fastest) add('fast-run', 'Fastest run (5 km+)', pace(fastest.pace), fastest.d, 'sports', recentPace === Infinity ? 0 : fastest.pace / recentPace);

  // ── gym: the heaviest completed set ──
  let heaviest: { d: string; kg: number; name: string } | null = null;
  for (const e of live) {
    const det = input.details.get(e.id);
    const ex = det && !det.deleted_at ? (det.data as { exercises?: unknown }).exercises : null;
    if (!Array.isArray(ex)) continue;
    for (const x of ex as { name?: string; sets?: { weight?: number; done?: boolean }[] }[]) {
      for (const set of x.sets ?? []) if (set.done && typeof set.weight === 'number' && (!heaviest || set.weight > heaviest.kg)) heaviest = { d: e.date, kg: set.weight, name: x.name ?? '' };
    }
  }
  if (heaviest) add('heavy', `Heaviest lift${heaviest.name ? ` · ${heaviest.name}` : ''}`, `${heaviest.kg} kg`, heaviest.d, 'gym', null);

  // ── sleep and screens ──
  const sleep = input.metrics.filter((m) => m.metric === 'sleep');
  if (sleep.length) {
    const s = sleep.reduce((a, b) => (b.minutes > a.minutes ? b : a));
    add('longest-sleep', 'Longest night', mins(s.minutes), s.date, 'sleep', null);
  }
  const screen = input.metrics.filter((m) => m.metric === 'screen');
  if (screen.length) {
    const s = screen.reduce((a, b) => (b.minutes < a.minutes ? b : a));
    add('low-screen', 'Quietest screen day', mins(s.minutes), s.date, 'screen', null);
  }
  return out;
}
