import { describe, expect, it } from 'vitest';
import type { LogDayMetric, LogEntry, LtBucket, LtDetail, LtNight, SectionId, Todo, TimedSection } from '../../data/types';
import { addDays } from '../log/dates';
import { DEFAULT_SLEEP, DEFAULT_TARGETS } from '../prefs';
import { bossHistory } from './boss';
import { computeProgress, type ProgressInput } from './engine';
import { momentLine, moments, type Moment } from './moments';
import { dayFacts } from './quests';

const T = '2026-10-29'; // a Thursday, in the first boss week
let n = 0;
const TOPICS: [string, SectionId][] = [['topic-violin', 'violin'], ['topic-gym', 'gym'], ['topic-coding', 'coding'], ['topic-study', 'study'], ['topic-chess', 'chess'], ['topic-sports', 'sports']];
const topicOf = (s: SectionId) => `topic-${s}`;

const entry = (date: string, minutes: number, section: SectionId = 'violin', id = `e${++n}`, created = `${date}T10:00:00Z`): LogEntry => ({
  id, date, topic_id: topicOf(section), subcategory_id: null, minutes, note: null, created_at: created, updated_at: created, deleted_at: null,
});
const detail = (e: LogEntry, section: TimedSection, data: Record<string, unknown>): [string, LtDetail] => [e.id, { id: e.id, section, data, created_at: e.created_at, updated_at: e.created_at, deleted_at: null }];
const metric = (date: string, m: LogDayMetric['metric'], minutes: number): LogDayMetric => ({ id: `${m}:${date}`, date, metric: m, minutes, created_at: date, updated_at: date, deleted_at: null });
const night = (date: string, bed: string, wake = '06:30'): [string, LtNight] => [date, { id: date, date, bed, wake, created_at: date, updated_at: date, deleted_at: null }];
const todo = (id: string, due: string | null, doneOn: string | null = null): Todo => ({
  id, title: id, priority: 'normal', due, done_at: doneOn ? `${doneOn}T12:00:00Z` : null, created_at: '2026-10-01', updated_at: '2026-10-01', deleted_at: null, section: null,
});

function input(p: Partial<ProgressInput> = {}): ProgressInput {
  return {
    today: T, entries: [], topicSection: new Map(TOPICS), details: new Map(), metrics: [], nights: new Map(), todos: [],
    dayOf: (iso) => iso.slice(0, 10), restDays: [], cabinetDays: [], targets: DEFAULT_TARGETS, sleep: DEFAULT_SLEEP, ...p,
  };
}

/** The same records plus what a save adds (todos/nights/metrics replace by id or date). */
function save(b: ProgressInput, add: { entries?: LogEntry[]; details?: [string, LtDetail][]; metrics?: LogDayMetric[]; nights?: [string, LtNight][]; todos?: Todo[]; restDays?: string[]; cabinetDays?: string[] }): ProgressInput {
  const replace = <X extends { id: string }>(list: X[], extra: X[] = []) => [...list.filter((x) => !extra.some((y) => y.id === x.id)), ...extra];
  return {
    ...b,
    entries: replace(b.entries, add.entries),
    details: new Map([...b.details, ...(add.details ?? [])]),
    metrics: replace(b.metrics, add.metrics),
    nights: new Map([...b.nights, ...(add.nights ?? [])]),
    todos: replace(b.todos, add.todos),
    restDays: [...b.restDays, ...(add.restDays ?? [])],
    cabinetDays: [...b.cabinetDays, ...(add.cabinetDays ?? [])],
  };
}

const types = (list: Moment[]) => list.map((m) => m.type);
const only = <K extends Moment['type']>(list: Moment[], type: K) => list.filter((m): m is Extract<Moment, { type: K }> => m.type === type);
/** Moments of a save, with today already active so the day's chapter doesn't get in the way. */
const ACTIVE_TODAY = { cabinetDays: [T] };

// ─── bucket list ────────────────────────────────────────────────────────────

const wish = (id: string, done: string | null): LtBucket => ({
  id, title: `Wish ${id}`, note: null, done_at: done ? `${done}T12:00:00Z` : null, sort_order: 1, data: {}, created_at: '2026-10-01T09:00:00Z', updated_at: '2026-10-01T09:00:00Z', deleted_at: null,
});

describe('bucket list', () => {
  it('fires for each thing crossed off in this save, not for old ones', () => {
    const before = input({ ...ACTIVE_TODAY, bucket: [wish('a', '2026-10-02'), wish('b', null), wish('c', null)] });
    const after = { ...before, bucket: [wish('a', '2026-10-02'), wish('b', T), wish('c', null)] };
    expect(only(moments(before, after), 'bucket')).toEqual([{ type: 'bucket', title: 'Wish b', done: 2, total: 3 }]);
    expect(momentLine({ type: 'bucket', title: 'Wish b', done: 2, total: 3 })).toBe('Bucket list · Wish b (2 of 3)');
    // adding to the list or editing it fires nothing
    expect(only(moments(after, { ...after, bucket: [...after.bucket!, wish('d', null)] }), 'bucket')).toEqual([]);
  });
});

describe('streak milestones with the buffer', () => {
  it('reaches 3 days across one missed day', () => {
    const b = input({ entries: [entry('2026-10-26', 20), entry('2026-10-28', 20)] }); // the 27th missed
    expect(types(moments(b, save(b, { entries: [entry(T, 20)] })))).toContain('streak');
  });
});

// ─── gym ────────────────────────────────────────────────────────────────────

const gym = (date: string, exercises: { name: string; sets: [number, number, boolean][]; unit?: 's' }[], id = `g${++n}`) => {
  const e = entry(date, 60, 'gym', id);
  return { entries: [e], details: [detail(e, 'gym', { name: 'Push', template: null, exercises: exercises.map((x) => ({ name: x.name, unit: x.unit, rest: 90, alts: [], sets: x.sets.map(([weight, reps, done]) => ({ weight, reps, done })) })) })] };
};

describe('lifting records', () => {
  const base = save(input(ACTIVE_TODAY), gym('2026-10-20', [{ name: 'Bench press', sets: [[60, 5, true], [65, 3, false]] }, { name: 'Squat', sets: [[80, 5, true]] }, { name: 'Row', sets: [[40, 10, true]] }]));

  it('fires when a done set beats the best, then not on the next save', () => {
    const after = save(base, gym(T, [{ name: 'Bench press', sets: [[62.5, 5, true]] }]));
    expect(only(moments(base, after), 'pr-lift')).toEqual([{ type: 'pr-lift', exercise: 'Bench press', weight: 62.5, reps: 5, previous: 60 }]);
    expect(momentLine(only(moments(base, after), 'pr-lift')[0])).toBe('New record · Bench press 62.5 kg × 5 (was 60)');
    const next = save(after, { entries: [entry(T, 20, 'violin')] });
    expect(only(moments(after, next), 'pr-lift')).toEqual([]);
    // re-saving the same session (an edit) fires nothing
    const edited = save(after, {});
    expect(moments(after, edited)).toEqual([]);
  });

  it('ignores the first time, undone sets, bodyweight and timed holds', () => {
    const after = save(base, gym(T, [
      { name: 'Deadlift', sets: [[100, 5, true]] },
      { name: 'Bench press', sets: [[70, 5, false]] },
      { name: 'Plank', unit: 's', sets: [[10, 60, true]] },
    ]));
    expect(only(moments(base, after), 'pr-lift')).toEqual([]);
    const bw = save(input(), gym('2026-10-20', [{ name: 'Chin-up', sets: [[0, 8, true]] }]));
    expect(only(moments(bw, save(bw, gym(T, [{ name: 'Chin-up', sets: [[0, 10, true], [5, 5, true]] }]))), 'pr-lift')).toEqual([]);
  });

  it('keeps the two biggest jumps', () => {
    const after = save(base, gym(T, [{ name: 'Bench press', sets: [[62.5, 5, true]] }, { name: 'squat', sets: [[90, 3, true]] }, { name: 'Row', sets: [[45, 8, true]] }]));
    expect(only(moments(base, after), 'pr-lift').map((m) => [m.exercise, m.weight - m.previous])).toEqual([['squat', 10], ['Row', 5]]);
  });
});

// ─── running ────────────────────────────────────────────────────────────────

const run = (date: string, km: number, minutes: number, sport = 'running', id = `r${++n}`) => {
  const e = entry(date, minutes, 'sports', id);
  return { entries: [e], details: [detail(e, 'sports', { sport, km })] };
};
const merge = (...parts: { entries: LogEntry[]; details: [string, LtDetail][] }[]) => ({ entries: parts.flatMap((p) => p.entries), details: parts.flatMap((p) => p.details) });

describe('running', () => {
  const base = save(input(ACTIVE_TODAY), merge(run('2026-10-10', 5.2, 26), run('2026-10-15', 10, 50), run('2026-10-18', 3, 12), run('2026-10-19', 30, 30, 'cycling')));

  it('pace record over the longest distance that fell', () => {
    const five = save(base, run(T, 5, 24));
    expect(only(moments(base, five), 'pr-run')).toEqual([{ type: 'pr-run', distance: '5k', pace: '4:48 /km', previous: '5:00 /km' }]);
    expect(only(moments(five, save(five, run(T, 4, 30))), 'pr-run')).toEqual([]);
    // 10.5 km at 4:40 beats both the 5K and 10K paces: the 10K is the one shown
    const ten = save(base, run(T, 10.5, 49));
    expect(only(moments(base, ten), 'pr-run').map((m) => m.distance)).toEqual(['10k']);
    // a first half marathon has nothing to beat at that distance (the 10K still falls)
    const half = save(base, run(T, 21.1, 100));
    expect(only(moments(base, half), 'pr-run').map((m) => m.distance)).toEqual(['10k']);
    // cycling and short runs don't count
    expect(only(moments(base, save(base, run(T, 20, 20, 'cycling'))), 'pr-run')).toEqual([]);
    expect(only(moments(base, save(base, run(T, 2, 7))), 'pr-run')).toEqual([]);
  });

  it('longest run, only once there was a 5 km one before', () => {
    const after = save(base, run(T, 12, 70));
    expect(only(moments(base, after), 'long-run')).toEqual([{ type: 'long-run', km: 12, previous: 10 }]);
    expect(only(moments(after, save(after, run(T, 6, 40))), 'long-run')).toEqual([]);
    const short = save(input(ACTIVE_TODAY), run('2026-10-10', 4, 25));
    expect(only(moments(short, save(short, run(T, 8, 45))), 'long-run')).toEqual([]);
  });

  it('total distance milestones', () => {
    const b = save(input(ACTIVE_TODAY), merge(...Array.from({ length: 19 }, (_, i) => run(addDays('2026-10-01', i), 5, 30)))); // 95 km
    const a = save(b, run(T, 6, 36));
    expect(only(moments(b, a), 'distance')).toEqual([{ type: 'distance', km: 100 }]);
    expect(only(moments(a, save(a, run(T, 6, 36))), 'distance')).toEqual([]);
    const big = save(input(ACTIVE_TODAY), merge(...Array.from({ length: 50 }, (_, i) => run(addDays('2026-01-01', i), 39, 300)))); // 1950 km
    expect(only(moments(big, save(big, run(T, 60, 600))), 'distance')).toEqual([{ type: 'distance', km: 2000 }]);
  });

  it('a marathon is a race, once', () => {
    const after = save(base, run(T, 42.2, 215, 'running', 'race1'));
    const list = moments(base, after);
    expect(only(list, 'race')).toEqual([{ type: 'race', km: 42.2, time: '3:35' }]);
    expect(types(list)).toContain('long-run');
    // editing its minutes (same id) doesn't race again
    expect(only(moments(after, save(after, run(T, 42.2, 210, 'running', 'race1'))), 'race')).toEqual([]);
  });
});

// ─── days, streaks, chapters ────────────────────────────────────────────────

describe('days', () => {
  const days = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => addDays(T, from + i));

  it('chapter: the first save of the day, numbered like Home', () => {
    const b = input({ cabinetDays: days(-10, -1), restDays: ['2026-09-01'] });
    const a = save(b, { entries: [entry(T, 30)] });
    expect(only(moments(b, a), 'chapter')).toEqual([{ type: 'chapter', n: 12 }]);
    const again = save(a, { entries: [entry(T, 30)] });
    expect(only(moments(a, again), 'chapter')).toEqual([]);
  });

  it('streak milestones as they are reached', () => {
    const b = input({ cabinetDays: days(-6, -1) });
    const a = save(b, { entries: [entry(T, 30)] });
    expect(only(moments(b, a), 'streak')).toEqual([{ type: 'streak', days: 7 }]);
    expect(only(moments(a, save(a, { entries: [entry(T, 30)] })), 'streak')).toEqual([]);
    const five = input({ cabinetDays: days(-5, -1) });
    expect(only(moments(five, save(five, ACTIVE_TODAY)), 'streak')).toEqual([]);
    const long = input({ cabinetDays: days(-399, -1) });
    expect(only(moments(long, save(long, ACTIVE_TODAY)), 'streak')).toEqual([{ type: 'streak', days: 400 }]);
  });

  it('rest day: the streak it keeps', () => {
    const b = input({ cabinetDays: days(-6, -1) });
    const a = save(b, { restDays: [T] });
    const list = moments(b, a);
    expect(only(list, 'rest')).toEqual([{ type: 'rest', streak: 7 }]);
    expect(types(list)).toEqual(expect.arrayContaining(['chapter', 'streak']));
    expect(only(moments(a, save(a, ACTIVE_TODAY)), 'rest')).toEqual([]);
  });

  it('comeback after five days or more with nothing', () => {
    const b = input({ cabinetDays: [addDays(T, -6)] }); // five empty days in between
    expect(only(moments(b, save(b, ACTIVE_TODAY)), 'comeback')).toEqual([{ type: 'comeback', gap: 5 }]);
    const near = input({ cabinetDays: [addDays(T, -5)] });
    expect(only(moments(near, save(near, ACTIVE_TODAY)), 'comeback')).toEqual([]);
    // the very first day isn't a comeback
    expect(only(moments(input(), save(input(), ACTIVE_TODAY)), 'comeback')).toEqual([]);
  });

  it('combo: three sections today, and each one after', () => {
    const b = input({ entries: [entry(T, 20, 'violin'), entry(T, 20, 'study')] });
    const a = save(b, { entries: [entry(T, 30, 'gym')] });
    expect(only(moments(b, a), 'combo')).toEqual([{ type: 'combo', sections: ['violin', 'gym', 'study'] }]);
    expect(only(moments(a, save(a, { entries: [entry(T, 30, 'violin')] })), 'combo')).toEqual([]);
    const four = save(a, { metrics: [metric(T, 'sleep', 450)] });
    expect(only(moments(a, four), 'combo')[0].sections).toEqual(['violin', 'gym', 'study', 'sleep']);
    // yesterday's sections don't count
    const y = input({ entries: [entry(addDays(T, -1), 20, 'violin'), entry(addDays(T, -1), 20, 'study'), entry(T, 20, 'chess')] });
    expect(only(moments(y, save(y, { entries: [entry(T, 30, 'gym')] })), 'combo')).toEqual([]);
  });
});

// ─── nights, screen, tasks, focus ───────────────────────────────────────────

describe('nights, screen time, tasks and focus', () => {
  it('good night: on time now, with the run of on-time nights', () => {
    // T is a Thursday: weekday plan, bed 22:45
    const b = input({ ...ACTIVE_TODAY, metrics: [metric(addDays(T, -1), 'sleep', 450), metric(addDays(T, -2), 'sleep', 450)], nights: new Map([night(addDays(T, -1), '23:00'), night(addDays(T, -2), '22:40')]) });
    const a = save(b, { metrics: [metric(T, 'sleep', 460)], nights: [night(T, '22:50')] });
    expect(only(moments(b, a), 'good-night')).toEqual([{ type: 'good-night', bed: '22:50', streak: 3 }]);
    // editing it to another on-time bed: nothing new
    expect(only(moments(a, save(a, { nights: [night(T, '22:30')] })), 'good-night')).toEqual([]);
    // late is late
    const late = save(b, { metrics: [metric(T, 'sleep', 400)], nights: [night(T, '00:30')] });
    expect(only(moments(b, late), 'good-night')).toEqual([]);
    // an old night edited into the window isn't a moment
    const old = input({ ...ACTIVE_TODAY, metrics: [metric('2026-10-01', 'sleep', 450)], nights: new Map([night('2026-10-01', '01:00')]) });
    expect(only(moments(old, save(old, { nights: [night('2026-10-01', '22:45')] })), 'good-night')).toEqual([]);
  });

  it('screen time under the target', () => {
    const b = input(ACTIVE_TODAY);
    const a = save(b, { metrics: [metric(T, 'screen', 150)] });
    expect(only(moments(b, a), 'screen-zen')).toEqual([{ type: 'screen-zen', minutes: 150, target: 210 }]);
    expect(only(moments(a, save(a, { metrics: [metric(T, 'screen', 140)] })), 'screen-zen')).toEqual([]);
    expect(only(moments(b, save(b, { metrics: [metric(T, 'screen', 300)] })), 'screen-zen')).toEqual([]);
    const none = input({ ...ACTIVE_TODAY, targets: { ...DEFAULT_TARGETS, screenDay: null } });
    expect(only(moments(none, save(none, { metrics: [metric(T, 'screen', 10)] })), 'screen-zen')).toEqual([]);
    // over, then brought under by an edit: that counts
    const over = save(b, { metrics: [metric(T, 'screen', 300)] });
    expect(types(moments(over, save(over, { metrics: [metric(T, 'screen', 200)] })))).toContain('screen-zen');
  });

  it('tasks: the tick that clears everything due', () => {
    const b = input({ ...ACTIVE_TODAY, todos: [todo('a', T, T), todo('b', addDays(T, -2)), todo('later', addDays(T, 3)), todo('old', '2026-09-01', '2026-09-01')] });
    const a = save(b, { todos: [todo('b', addDays(T, -2), T)] });
    expect(only(moments(b, a), 'tasks-clear')).toEqual([{ type: 'tasks-clear', count: 2 }]);
    // ticking a task that isn't due yet afterwards: nothing new
    expect(only(moments(a, save(a, { todos: [todo('later', addDays(T, 3), T)] })), 'tasks-clear')).toEqual([]);
    // still one open
    const two = input({ ...ACTIVE_TODAY, todos: [todo('x', T), todo('y', T)] });
    expect(only(moments(two, save(two, { todos: [todo('x', T, T)] })), 'tasks-clear')).toEqual([]);
    // nothing was due
    const free = input({ ...ACTIVE_TODAY, todos: [todo('z', null)] });
    expect(only(moments(free, save(free, { todos: [todo('z', null, T)] })), 'tasks-clear')).toEqual([]);
  });

  it('focus: the new session in the focus section', () => {
    const b = input(ACTIVE_TODAY);
    const since = `${T}T09:00:00.000Z`;
    const a = save(b, { entries: [entry(T, 42, 'study', 'f1', `${T}T09:05:00.000Z`)] });
    expect(only(moments(b, a, { focus: { section: 'study', since } }), 'focus')).toEqual([{ type: 'focus', section: 'study', minutes: 42 }]);
    expect(only(moments(b, a), 'focus')).toEqual([]);
    expect(only(moments(b, a, { focus: { section: 'violin', since } }), 'focus')).toEqual([]);
    expect(only(moments(b, a, { focus: { section: 'study', since: `${T}T09:10:00.000Z` } }), 'focus')).toEqual([]);
  });
});

// ─── boss and rank ──────────────────────────────────────────────────────────

describe('boss and rank', () => {
  it('a critical hit that leaves the boss standing', () => {
    const b = input({ entries: [entry('2026-10-27', 30, 'coding')] });
    const a = save(b, { entries: [entry(T, 70, 'chess')] }); // 70 min + 25 for the week's first chess
    const crit = only(moments(b, a), 'boss-crit');
    expect(crit).toHaveLength(1);
    expect(crit[0].damage).toBeGreaterThanOrEqual(95);
    expect(crit[0].boss).toBe(bossHistory(a).at(-1)!.boss.name);
    // a small hit isn't one
    expect(only(moments(a, save(a, { entries: [entry(T, 20, 'chess')] })), 'boss-crit')).toEqual([]);
    // the blow that defeats it has its own celebration
    const nearly = input({ entries: [entry('2026-10-27', 250, 'coding')] });
    const dead = save(nearly, { entries: [entry(T, 90, 'coding')] });
    expect(bossHistory(dead).at(-1)!.defeatedOn).toBe(T);
    expect(only(moments(nearly, dead), 'boss-crit')).toEqual([]);
  });

  it('rank: from the levels given, or worked out', () => {
    const b = input(ACTIVE_TODAY);
    const a = save(b, { entries: [entry(T, 30)] });
    expect(only(moments(b, a, { levels: [4, 5] }), 'rank')).toEqual([{ type: 'rank', from: 'Rookie', to: 'Initiate' }]);
    expect(only(moments(b, a, { levels: [5, 6] }), 'rank')).toEqual([]);
    expect(only(moments(b, a, { levels: [5, 4] }), 'rank')).toEqual([]);
    expect(only(moments(b, a), 'rank')).toEqual([]);
  });
});

// ─── nothing from old history, and speed ────────────────────────────────────

function twoYears(): ProgressInput {
  let seed = 11;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const entries: LogEntry[] = [];
  const details = new Map<string, LtDetail>();
  const metrics: LogDayMetric[] = [];
  const nights = new Map<string, LtNight>();
  const todos: Todo[] = [];
  const cabinetDays: string[] = [];
  const start = addDays(T, -729);
  for (let i = 0; i < 730; i++) {
    const d = addDays(start, i);
    const k = 2 + Math.floor(rand() * 5);
    for (let j = 0; j < k; j++) {
      const [topic, section] = TOPICS[Math.floor(rand() * TOPICS.length)];
      const e = { ...entry(d, 15 + Math.floor(rand() * 90), section, `p${i}-${j}`), topic_id: topic };
      entries.push(e);
      if (section === 'gym') details.set(...detail(e, 'gym', { name: 'Push', template: null, exercises: ['Bench', 'Press', 'Dips'].map((name) => ({ name, rest: 90, alts: [], sets: [0, 1, 2].map(() => ({ reps: 8, weight: 40 + Math.floor(rand() * 40), done: rand() > 0.1 })) })) }));
      if (section === 'sports') details.set(...detail(e, 'sports', { sport: ['running', 'cycling', 'swimming'][j % 3], km: Math.round(rand() * 200) / 10 }));
    }
    if (i >= 30) {
      metrics.push(metric(d, 'sleep', 400 + Math.floor(rand() * 120)));
      metrics.push(metric(d, 'screen', 60 + Math.floor(rand() * 240)));
      nights.set(...night(d, rand() > 0.3 ? '22:50' : '00:10'));
    }
    if (rand() > 0.3) todos.push(todo(`t${i}`, rand() > 0.5 ? addDays(d, 1) : null, d));
    if (rand() > 0.6) cabinetDays.push(d);
  }
  return input({ entries, details, metrics, nights, todos, cabinetDays });
}

describe('history and speed', () => {
  it('nothing fires between two copies of the same records, or for the same input', () => {
    const one = twoYears();
    expect(moments(one, one)).toEqual([]);
    expect(moments(one, twoYears())).toEqual([]);
    expect(moments(twoYears(), one, { levels: [30, 30] })).toEqual([]);
  });

  it('a small save on two years of records fires only what it changed, well under 30 ms', () => {
    const before = twoYears();
    const after = save(before, { entries: [entry(T, 5, 'violin')] });
    // the app's path: day facts and bosses already worked out for both (achievements need them), levels known
    for (const x of [before, after]) bossHistory(x, dayFacts(x));
    const levels: [number, number] = [computeProgress(before).overall.level, computeProgress(after).overall.level];
    moments(twoYears(), save(twoYears(), {}), { levels }); // warm up
    const t = performance.now();
    const list = moments(before, after, { levels });
    const ms = performance.now() - t;
    expect(types(list).filter((x) => x !== 'combo' && x !== 'boss-crit')).toEqual([]);
    expect(ms).toBeLessThan(30);
  });
});
