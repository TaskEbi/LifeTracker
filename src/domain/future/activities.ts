/**
 * Activity-list suggestions from what LifeTracker already knows: time logged per section (and per
 * sport), performances and competitions in the calendar. Real numbers only: hours a week over the
 * weeks something was actually done in the last year, and how many weeks that was.
 */
import { addDays, weekStart } from '../log/dates';
import type { Activity } from './model';

export interface LoggedSession {
  section: string;
  date: string;
  minutes: number;
  /** Sport id for sports sessions. */
  sport?: string;
}
export interface DatedEvent {
  title: string;
  date: string;
  section: string | null;
  kind: string;
}

export type ActivityDraft = Omit<Activity, 'id' | 'order'> & { key: string };

const TITLES: Record<string, { title: string; role: string; desc: string }> = {
  violin: { title: 'Violin', role: 'Violinist', desc: 'Solo and orchestral playing' },
  coding: { title: 'Competitive programming', role: 'Competitor', desc: 'Training for informatics olympiads' },
  chess: { title: 'Chess', role: 'Player', desc: 'Online and over-the-board play' },
  gym: { title: 'Strength training', role: '', desc: 'Structured gym programme' },
  running: { title: 'Running', role: 'Runner', desc: 'Distance running and races' },
  cycling: { title: 'Cycling', role: 'Cyclist', desc: 'Road cycling' },
  swimming: { title: 'Swimming', role: 'Swimmer', desc: '' },
  volleyball: { title: 'Volleyball', role: 'Libero', desc: '' },
  tennis: { title: 'Tennis', role: 'Player', desc: '' },
};
/** Sections whose time isn't an activity of its own. */
const SKIP = new Set(['study', 'future', 'sleep', 'screen', 'cabinet']);

/** UK school year (10–13) a day falls in, counting back from the autumn the user starts university. */
export function schoolYear(date: string, entry: number): number | null {
  const y = Number(date.slice(0, 4));
  const start = Number(date.slice(5, 7)) >= 9 ? y : y - 1;
  const year = 13 - (entry - 1 - start);
  return year >= 10 && year <= 13 ? year : null;
}

const half = (n: number) => Math.round(n * 2) / 2;

export function suggestActivities(sessions: LoggedSession[], events: DatedEvent[], today: string, entry: number, existing: Pick<Activity, 'source' | 'title'>[]): ActivityDraft[] {
  const from = addDays(today, -364);
  const groups = new Map<string, LoggedSession[]>();
  for (const s of sessions) {
    if (SKIP.has(s.section) || s.date > today) continue;
    const key = s.section === 'sports' ? (s.sport ?? 'sports') : s.section;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  const taken = new Set(existing.map((a) => a.source).filter(Boolean));
  const titles = new Set(existing.map((a) => a.title.toLowerCase()));
  const out: ActivityDraft[] = [];
  for (const [key, list] of groups) {
    const meta = TITLES[key] ?? { title: key[0].toUpperCase() + key.slice(1), role: '', desc: '' };
    if (taken.has(key) || titles.has(meta.title.toLowerCase())) continue;
    const recent = list.filter((s) => s.date >= from);
    const weeks = new Map<string, number>();
    for (const s of recent) weeks.set(weekStart(s.date), (weeks.get(weekStart(s.date)) ?? 0) + s.minutes);
    if (weeks.size < 4) continue;
    const minutes = [...weeks.values()].reduce((a, b) => a + b, 0);
    const years = [...new Set(list.map((s) => schoolYear(s.date, entry)).filter((y): y is number => y !== null))].sort();
    const perf = key === 'violin' ? events.filter((e) => e.kind === 'performance' && e.date >= from && e.date <= today).length : 0;
    out.push({
      key,
      type: 'activity',
      title: meta.title,
      org: '',
      role: meta.role,
      desc: [meta.desc, perf ? `${perf} performance${perf === 1 ? '' : 's'} in the last year` : ''].filter(Boolean).join('; '),
      hoursPerWeek: Math.max(0.5, half(minutes / weeks.size / 60)),
      weeksPerYear: weeks.size,
      years,
      level: '',
      source: key,
    });
  }
  for (const e of events) {
    if (e.kind !== 'competition' || e.date > today) continue;
    const key = `event:${e.title}:${e.date}`;
    if (taken.has(key) || titles.has(e.title.toLowerCase())) continue;
    const y = schoolYear(e.date, entry);
    out.push({ key, type: 'honor', title: e.title, org: '', role: '', desc: 'Add the result or placing', hoursPerWeek: null, weeksPerYear: null, years: y ? [y] : [], level: '', source: key });
  }
  return out.sort((a, b) => (a.type === b.type ? (b.hoursPerWeek ?? 0) * (b.weeksPerYear ?? 0) - (a.hoursPerWeek ?? 0) * (a.weeksPerYear ?? 0) : a.type === 'activity' ? -1 : 1));
}
