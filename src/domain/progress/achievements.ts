/**
 * Achievements, derived from records like XP. Each reports progress towards its goal and the day
 * it was first reached (from the records' own dates), so nothing is stored and nothing repeats.
 */
import { addDays, weekdayIndex, weekStart } from '../log/dates';
import { activeDays, bedDelta, RULES, sectionOf, type ProgressInput } from './engine';

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  goal: number;
  progress: number;
  /** The day it was reached, or null while locked. */
  unlockedOn: string | null;
}

/** The day the running count reaches `goal`, given the dates of each counted thing. */
function nth(dates: string[], goal: number): string | null {
  const sorted = [...dates].sort();
  return sorted.length >= goal ? sorted[goal - 1] : null;
}

/** Longest run of consecutive keys (days or weeks), and the key where it first reached `goal`. */
function runs(keys: string[], step: (k: string) => string, goal: number): { best: number; reachedOn: string | null } {
  const set = new Set(keys);
  let best = 0;
  let reachedOn: string | null = null;
  for (const k of [...set].sort()) {
    // Count back to the run's start: the run length as of this key.
    let len = 1;
    for (let p = step(k); set.has(p); p = step(p)) len++;
    best = Math.max(best, len);
    if (len >= goal && !reachedOn) reachedOn = k;
  }
  return { best, reachedOn };
}
const prevDay = (d: string) => addDays(d, -1);
const prevWeek = (w: string) => addDays(w, -7);
/** A week counts as reached on its Sunday, or today while it's still going. */
const weekDone = (monday: string | null, today: string) => (monday ? (addDays(monday, 6) <= today ? addDays(monday, 6) : today) : null);

export function achievements(input: ProgressInput): Achievement[] {
  const entries = input.entries.filter((e) => e.date <= input.today);
  const by = (s: string) => entries.filter((e) => sectionOf(e, input) === s);
  const violin = by('violin');
  const gym = by('gym');
  const list: Achievement[] = [];
  const add = (id: string, title: string, desc: string, goal: number, progress: number, unlockedOn: string | null) =>
    list.push({ id, title, desc, goal, progress: Math.min(progress, goal), unlockedOn });

  const days = [...activeDays(input)].filter((d) => d <= input.today);
  add('first', 'First Entry', 'Logged your first activity', 1, days.length ? 1 : 0, nth(days, 1));

  const thursdays = [...new Set(violin.filter((e) => weekdayIndex(e.date) === 3).map((e) => e.date))];
  add('thursday', 'Thursday Regular', 'Violin on 6 different Thursdays', 6, thursdays.length, nth(thursdays, 6));

  const violinWeeks = new Map<string, number>();
  for (const e of violin) violinWeeks.set(weekStart(e.date), (violinWeeks.get(weekStart(e.date)) ?? 0) + e.minutes);
  const metWeeks = [...violinWeeks].filter(([, m]) => m >= input.targets.violinWeek).map(([w]) => w);
  for (const [id, goal, title] of [['target5', 5, 'Five at Target'], ['target8', 8, 'Eight at Target']] as const) {
    const r = runs(metWeeks, prevWeek, goal);
    add(id, title, `Violin weekly target ${goal} weeks running`, goal, r.best, weekDone(r.reachedOn, input.today));
  }

  const goodNights = input.metrics
    .filter((m) => m.metric === 'sleep')
    .map((m) => ({ m, night: input.nights.get(m.date) }))
    .filter(({ night }) => night?.bed && !night.deleted_at && Math.abs(bedDelta({ date: night.date, bed: night.bed }, input.sleep)) <= RULES.bedtimeWindow)
    .map(({ m }) => m.date);
  const rested = runs(goodNights, prevDay, 7);
  add('rested', 'Well Rested', '7 nights in a row within 30 min of your bedtime', 7, rested.best, rested.reachedOn);

  add('iron', 'Iron Habit', '12 gym sessions logged', 12, gym.length, nth(gym.map((e) => e.date), 12));

  // Rest counts: four planned rest days within any 30-day window.
  const rest = [...input.restDays].sort();
  let restBest = 0;
  let restOn: string | null = null;
  rest.forEach((d, i) => {
    const inWindow = rest.filter((x) => x <= d && x > addDays(d, -30)).length;
    restBest = Math.max(restBest, inWindow);
    if (inWindow >= 4 && !restOn) restOn = rest[i];
  });
  add('rest', 'Rest Counts', '4 planned rest days within a month', 4, restBest, restOn);

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
  const counts = [...weekSections].map(([w, s]) => [w, [...s].filter((x) => x !== 'general').length] as const);
  const balancedWeek = counts.filter(([, c]) => c >= 5).map(([w]) => w).sort()[0] ?? null;
  add('balanced', 'Balanced Week', 'Activity in 5 sections in one week', 5, Math.max(0, ...counts.map(([, c]) => c)), weekDone(balancedWeek, input.today));

  let acc = 0;
  let hundredOn: string | null = null;
  for (const e of [...entries].sort((a, b) => a.date.localeCompare(b.date))) {
    acc += e.minutes;
    if (acc >= 6000 && !hundredOn) hundredOn = e.date;
  }
  add('hundred', 'Hundred Hours', '100 hours of logged activity', 100, Math.floor(acc / 60), hundredOn);

  const scaleSessions = violin.filter((e) => {
    const d = input.details.get(e.id);
    return d && !d.deleted_at && Array.isArray(d.data.scales) && (d.data.scales as unknown[]).length > 0;
  });
  add('scales', 'Scale Ladder', 'Scales practised in 20 sessions', 20, scaleSessions.length, nth(scaleSessions.map((e) => e.date), 20));

  if (input.targets.screenDay != null) {
    const under = input.metrics.filter((m) => m.metric === 'screen' && m.minutes <= input.targets.screenDay!).map((m) => m.date);
    const r = runs(under, prevDay, 7);
    add('screen7', 'Screen Smart', '7 days in a row under your screen-time target', 7, r.best, r.reachedOn);
  }

  const done = input.todos.filter((t) => t.done_at).map((t) => input.dayOf(t.done_at!));
  add('tasks25', 'Clear Desk', '25 tasks completed', 25, done.length, nth(done, 25));

  add('cabinet100', 'Curator', '100 things in the cabinet', 100, input.cabinetDays.length, nth(input.cabinetDays, 100));

  const subTwo = by('sports').filter((e) => {
    const d = input.details.get(e.id)?.data;
    return d && d.sport === 'running' && Number(d.km) >= 21.0975 && e.minutes < 120;
  });
  add('sub2', 'Sub-2', 'A half marathon under 2 hours', 1, subTwo.length ? 1 : 0, nth(subTwo.map((e) => e.date), 1));

  return list;
}
