import { describe, expect, it } from 'vitest';
import type { LogDayMetric, LogEntry, LtDetail, LtNight, SectionId, Todo } from '../../data/types';
import { addDays, weekdayIndex } from '../log/dates';
import { DEFAULT_SLEEP, DEFAULT_TARGETS } from '../prefs';
import { achievements, type Achievement } from './achievements';
import { allXpEvents, type ProgressInput } from './engine';
import { bossHistory } from './boss';
import { questHistory } from './quests';
import { ACHIEVEMENT_GROUPS, GLYPHS } from './glyphs';

const T = '2026-10-29'; // a Thursday
let n = 0;
const entry = (date: string, minutes: number, topic = 'topic-violin', id = `e${++n}`): LogEntry => ({
  id, date, topic_id: topic, subcategory_id: null, minutes, note: null,
  created_at: `${date}T10:00:00Z`, updated_at: `${date}T10:00:00Z`, deleted_at: null,
});
const detail = (e: LogEntry, section: LtDetail['section'], data: Record<string, unknown>): [string, LtDetail] => [
  e.id, { id: e.id, section, data, created_at: e.created_at, updated_at: e.updated_at, deleted_at: null } as LtDetail,
];
const metric = (date: string, m: LogDayMetric['metric'], minutes: number): LogDayMetric => ({
  id: `${m}:${date}`, date, metric: m, minutes, created_at: date, updated_at: date, deleted_at: null,
});
const night = (date: string, bed: string, wake: string): [string, LtNight] => [date, { id: date, date, bed, wake, created_at: date, updated_at: date, deleted_at: null }];
const todo = (id: string, doneDay: string | null, due: string | null = null, priority: Todo['priority'] = 'normal'): Todo => ({
  id, title: id, priority, due, done_at: doneDay ? `${doneDay}T12:00:00Z` : null, created_at: '2024-01-01', updated_at: '2024-01-01', deleted_at: null, section: null,
});
const TOPICS: [string, SectionId][] = [['topic-violin', 'violin'], ['topic-gym', 'gym'], ['topic-coding', 'coding'], ['topic-study', 'study'], ['topic-chess', 'chess'], ['topic-sports', 'sports']];

function input(p: Partial<ProgressInput> = {}): ProgressInput {
  return {
    today: T, entries: [], topicSection: new Map(TOPICS), details: new Map(), metrics: [], nights: new Map(), todos: [],
    dayOf: (iso) => iso.slice(0, 10), restDays: [], cabinetDays: [], targets: DEFAULT_TARGETS, sleep: DEFAULT_SLEEP, ...p,
  };
}
const get = (list: Achievement[], id: string) => {
  const a = list.find((x) => x.id === id);
  if (!a) throw new Error(`no achievement ${id}`);
  return a;
};

/** The ids that existed before the emblem expansion: users' unlocked emblems and the e2e rely on them. */
const LEGACY = [
  'first', 'explorer', 'marathon', 'streak7', 'streak30', 'streak100', 'streak365', 'rest', 'balanced', 'hundred', 'thursday', 'target5', 'target8',
  'scales', 'violin50', 'coding100', 'iron', 'sports25', 'sub2', 'study50', 'chess30', 'nights30', 'rested', 'screen7', 'tasks25', 'cabinet100',
  'lv10', 'lv25', 'lv50', 'form2', 'form5', 'form10', 'form15', 'form20', 'specialist', 'renaissance', 'quest1', 'sweep', 'sweep7', 'quest50', 'month',
  'boss1', 'boss5', 'boss20', 'bestiary',
];

describe('achievement catalogue', () => {
  const list = achievements(input());

  it('has at least 160, with unique ids, and keeps every earlier one', () => {
    expect(list.length).toBeGreaterThanOrEqual(160);
    expect(new Set(list.map((a) => a.id)).size).toBe(list.length);
    for (const id of LEGACY) expect(list.some((a) => a.id === id)).toBe(true);
    expect(LEGACY.length).toBe(45);
  });

  it('keeps the earlier titles and tiers', () => {
    expect(get(list, 'first')).toMatchObject({ title: 'First Entry', tier: 'bronze', desc: 'Logged your first activity' });
    expect(get(list, 'coding100')).toMatchObject({ title: 'Grinder', tier: 'gold', desc: '100 coding sessions' });
    expect(get(list, 'iron')).toMatchObject({ title: 'Iron Habit', tier: 'silver', desc: '12 gym sessions logged' });
    expect(get(list, 'study50')).toMatchObject({ title: 'Bookworm', tier: 'gold', desc: '50 hours of study logged' });
    expect(get(list, 'target5')).toMatchObject({ title: 'Five at Target', tier: 'silver', desc: 'Violin weekly target 5 weeks running' });
    expect(get(list, 'bestiary')).toMatchObject({ title: 'Full Bestiary', tier: 'platinum' });
    expect(get(list, 'form15')).toMatchObject({ title: 'Dragon Rising', tier: 'platinum' });
  });

  it('uses only known glyphs and groups, and every one of them', () => {
    for (const a of list) {
      expect(GLYPHS).toContain(a.glyph);
      expect(ACHIEVEMENT_GROUPS).toContain(a.group);
    }
    expect(new Set(list.map((a) => a.glyph)).size).toBe(GLYPHS.length);
    expect(new Set(list.map((a) => a.group)).size).toBe(ACHIEVEMENT_GROUPS.length);
  });

  it('spreads the tiers roughly 35 / 30 / 22 / 13 %', () => {
    const share = (t: string) => list.filter((a) => a.tier === t).length / list.length;
    expect(share('bronze')).toBeGreaterThan(0.28);
    expect(share('bronze')).toBeLessThan(0.42);
    expect(share('silver')).toBeGreaterThan(0.24);
    expect(share('silver')).toBeLessThan(0.36);
    expect(share('gold')).toBeGreaterThan(0.16);
    expect(share('gold')).toBeLessThan(0.28);
    expect(share('platinum')).toBeGreaterThan(0.08);
    expect(share('platinum')).toBeLessThan(0.18);
  });

  it('has secrets, all in the secret group, and nothing unlocked without records', () => {
    const secrets = list.filter((a) => a.secret);
    expect(secrets.length).toBeGreaterThanOrEqual(8);
    expect(secrets.every((a) => a.group === 'secret')).toBe(true);
    expect(list.filter((a) => a.group === 'secret').every((a) => a.secret)).toBe(true);
    for (const a of list) {
      expect(a.unlockedOn).toBeNull();
      expect(a.goal).toBeGreaterThan(0);
      expect(a.progress).toBeGreaterThanOrEqual(0);
      expect(a.progress).toBeLessThanOrEqual(a.goal);
    }
  });

  it('works the same out once per input', () => {
    const i = input();
    expect(achievements(i)).toBe(achievements(i));
  });
});

describe('new achievements unlock on the right day', () => {
  it('streaks, comebacks, weekends, long days', () => {
    // 3 days running, then 8 empty days, then a weekend (Sat 24, Sun 25 Oct) with a 5-hour Saturday.
    const entries = [entry('2026-10-01', 30), entry('2026-10-02', 30), entry('2026-10-03', 30), entry('2026-10-12', 20), entry('2026-10-24', 300), entry('2026-10-25', 30)];
    const list = achievements(input({ entries }));
    expect(get(list, 'streak3').unlockedOn).toBe('2026-10-03');
    expect(get(list, 'comeback').unlockedOn).toBe('2026-10-12');
    expect(get(list, 'weekend1').unlockedOn).toBe('2026-10-25');
    expect(get(list, 'day5h').unlockedOn).toBe('2026-10-24');
    expect(get(list, 'hours10')).toMatchObject({ progress: 7, unlockedOn: null }); // 440 min
    expect(get(list, 'v1').unlockedOn).toBe('2026-10-01');
    expect(get(list, 'streak7').unlockedOn).toBeNull();
  });

  it('a gap of six empty days is not a comeback', () => {
    const list = achievements(input({ entries: [entry('2026-10-01', 30), entry('2026-10-08', 30)] }));
    expect(get(list, 'comeback').unlockedOn).toBeNull();
    const seven = achievements(input({ entries: [entry('2026-10-01', 30), entry('2026-10-09', 30)] }));
    expect(get(seven, 'comeback').unlockedOn).toBe('2026-10-09');
  });

  it('gym personal bests and sets, sports distance', () => {
    const g1 = entry('2026-09-01', 60, 'topic-gym');
    const g2 = entry('2026-09-08', 60, 'topic-gym');
    const r1 = entry('2026-09-10', 55, 'topic-sports');
    const sets = (w: number) => [{ reps: 5, weight: w, done: true }, { reps: 5, weight: w, done: true }, { reps: 5, weight: w + 50, done: false }];
    const details = new Map([
      detail(g1, 'gym', { name: 'A', template: null, exercises: [{ name: 'Bench', rest: 90, alts: [], sets: sets(60) }] }),
      detail(g2, 'gym', { name: 'A', template: null, exercises: [{ name: 'Bench', rest: 90, alts: [], sets: sets(65) }, { name: 'Plank', unit: 's', rest: 30, alts: [], sets: [{ reps: 60, weight: 200, done: true }] }] }),
      detail(r1, 'sports', { sport: 'running', km: 10.4 }),
    ]);
    const list = achievements(input({ entries: [g1, g2, r1], details }));
    expect(get(list, 'pr1').unlockedOn).toBe('2026-09-08');
    expect(get(list, 'heavy100').unlockedOn).toBeNull(); // a timed hold isn't a lift
    expect(get(list, 'sets100').progress).toBe(5);
    expect(get(list, 'run10k').unlockedOn).toBe('2026-09-10');
    expect(get(list, 'run21k').unlockedOn).toBeNull();
    expect(get(list, 'km50').progress).toBe(10);
    expect(get(list, 'gym1').unlockedOn).toBe('2026-09-01');
  });

  it('tasks: per day, before the due day', () => {
    const todos = [
      ...Array.from({ length: 5 }, (_, i) => todo(`a${i}`, '2026-10-20', '2026-10-21')),
      ...Array.from({ length: 5 }, (_, i) => todo(`b${i}`, '2026-10-22', '2026-10-30', 'high')),
      todo('open', null),
    ];
    const list = achievements(input({ todos }));
    expect(get(list, 'taskday5').unlockedOn).toBe('2026-10-20');
    expect(get(list, 'tasks10').unlockedOn).toBe('2026-10-22');
    expect(get(list, 'early10').unlockedOn).toBe('2026-10-22');
    expect(get(list, 'high25').progress).toBe(5);
  });

  it('sleep: on time to bed and up on time', () => {
    const days = Array.from({ length: 10 }, (_, i) => addDays('2026-10-10', i));
    const plan = (d: string) => (weekdayIndex(d) >= 5 ? DEFAULT_SLEEP.weekend : DEFAULT_SLEEP.weekday);
    const list = achievements(input({
      metrics: days.map((d) => metric(d, 'sleep', 470)),
      nights: new Map(days.map((d) => night(d, plan(d).bed, plan(d).wake))),
    }));
    expect(get(list, 'bed10').unlockedOn).toBe(days[9]);
    expect(get(list, 'wake10').unlockedOn).toBe(days[9]);
    expect(get(list, 'full10').unlockedOn).toBe(days[9]);
    expect(get(list, 'rested').unlockedOn).toBe(days[6]);
    expect(get(list, 'nights7').unlockedOn).toBe(days[6]);
  });

  it('secrets', () => {
    const list = achievements(input({ entries: [entry('2025-10-31', 42), entry('2026-02-02', 15)] }));
    expect(get(list, 'answer')).toMatchObject({ unlockedOn: '2025-10-31', secret: true });
    expect(get(list, 'halloween').unlockedOn).toBe('2025-10-31');
    expect(get(list, 'mirror').unlockedOn).toBe('2026-02-02');
    expect(get(list, 'friday13').unlockedOn).toBeNull();
  });

  it('every section on one day', () => {
    const d = '2026-10-20';
    const entries = TOPICS.map(([t]) => entry(d, 20, t));
    const list = achievements(input({ entries, metrics: [metric(d, 'sleep', 450), metric(d, 'screen', 100)], cabinetDays: [d] }));
    expect(get(list, 'everything').unlockedOn).toBe(d);
    expect(get(list, 'explorer').unlockedOn).toBe(d);
    expect(get(list, 'spread').unlockedOn).toBe(d);
    expect(get(list, 'allround').unlockedOn).toBe(d);
  });
});

// ─── a realistic two years, for timing ──────────────────────────────────────

function twoYears(): ProgressInput {
  let seed = 7;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const entries: LogEntry[] = [];
  const details = new Map<string, LtDetail>();
  const metrics: LogDayMetric[] = [];
  const nights = new Map<string, LtNight>();
  const todos: Todo[] = [];
  const cabinetDays: string[] = [];
  const restDays: string[] = [];
  const start = addDays(T, -729);
  for (let i = 0; i < 730; i++) {
    const d = addDays(start, i);
    const k = 2 + Math.floor(rand() * 5); // 2–6 sessions, ~4 a day
    for (let j = 0; j < k; j++) {
      const [topic, section] = TOPICS[Math.floor(rand() * TOPICS.length)];
      const e = entry(d, 15 + Math.floor(rand() * 90), topic, `p${i}-${j}`);
      entries.push(e);
      if (section === 'gym') details.set(...detail(e, 'gym', { name: 'Push', template: null, exercises: ['Bench', 'Press', 'Dips'].map((name) => ({ name, rest: 90, alts: [], sets: [0, 1, 2].map(() => ({ reps: 8, weight: 40 + Math.floor(rand() * 40), done: rand() > 0.1 })) })) }));
      if (section === 'sports') details.set(...detail(e, 'sports', { sport: ['running', 'cycling', 'swimming'][j % 3], km: Math.round(rand() * 200) / 10 }));
      if (section === 'violin') details.set(...detail(e, 'violin', { type: 'solo', pieces: [`piece${Math.floor(rand() * 15)}`], scales: rand() > 0.5 ? ['s1'] : [] }));
      if (section === 'coding') details.set(...detail(e, 'coding', { kind: rand() > 0.8 ? 'Contest' : 'Problems', solved: Math.floor(rand() * 5) }));
      if (section === 'study') details.set(...detail(e, 'study', { subject: ['Maths', 'Physics', 'CS', 'Further Maths'][j % 4], kind: 'Homework' }));
      if (section === 'chess') details.set(...detail(e, 'chess', { kind: 'Puzzles', games: 2 }));
    }
    if (i >= 30) {
      metrics.push(metric(d, 'sleep', 400 + Math.floor(rand() * 120)));
      metrics.push(metric(d, 'screen', 60 + Math.floor(rand() * 240)));
      nights.set(...night(d, rand() > 0.3 ? '22:50' : '00:10', rand() > 0.4 ? '06:35' : '07:30'));
    }
    if (rand() > 0.3) todos.push(todo(`t${i}`, d, rand() > 0.5 ? addDays(d, 1) : null, rand() > 0.8 ? 'high' : 'normal'));
    if (rand() > 0.6) cabinetDays.push(d);
    if (i % 37 === 0) restDays.push(d);
  }
  return input({ entries, details, metrics, nights, todos, cabinetDays, restDays });
}

describe('performance', () => {
  it('works out every achievement for two years of records quickly', () => {
    const base = twoYears();
    expect(base.entries.length).toBeGreaterThan(2500);
    expect(base.todos.length).toBeGreaterThan(450);
    achievements(twoYears()); // warm up the JIT on other data

    // The app's path: XP events, quests and bosses already worked out for the same input.
    const app = { ...base };
    const extras = { events: allXpEvents(app), quests: questHistory(app), bosses: bossHistory(app) };
    let t = performance.now();
    const list = achievements(app, extras);
    const withExtras = performance.now() - t;

    // From nothing: day facts, XP, quests and bosses included.
    const cold = { ...base };
    t = performance.now();
    achievements(cold);
    const fromScratch = performance.now() - t;

    expect(list.length).toBeGreaterThanOrEqual(160);
    expect(list.filter((a) => a.unlockedOn).length).toBeGreaterThan(60);
    for (const a of list) if (a.unlockedOn) expect(a.unlockedOn <= T).toBe(true);
    expect(withExtras).toBeLessThan(150);
    expect(fromScratch).toBeLessThan(300);
  });
});

describe('bucket list and the streak buffer', () => {
  const wish = (id: string, done: string | null) => ({
    id, title: id, note: null, done_at: done ? `${done}T12:00:00Z` : null, sort_order: 1, data: {}, created_at: '2026-10-01T09:00:00Z', updated_at: '2026-10-01T09:00:00Z', deleted_at: null,
  });

  it('unlocks the bucket-list ladder from things crossed off', () => {
    const list = achievements(input({ bucket: [wish('a', '2026-10-05'), wish('b', '2026-10-09'), wish('c', '2026-10-20'), wish('d', null)] }));
    expect(get(list, 'bucket1').unlockedOn).toBe('2026-10-05');
    expect(get(list, 'bucket5').progress).toBe(3);
    expect(get(list, 'bucketmonth').unlockedOn).toBe('2026-10-20');
    expect(get(list, 'bucketlist10').progress).toBe(4);
  });

  it('counts the bucket-list sections things are crossed off in', () => {
    const titled = (title: string, done: string | null) => ({ ...wish(title, done), title });
    const list = achievements(
      input({
        bucket: [
          titled('Visit Kyoto', '2026-10-02'),
          titled('Run a marathon', '2026-10-03'),
          titled('Play the Bach Chaconne', '2026-10-04'),
          titled('Go to IOI', '2026-10-05'),
          titled('Visit Rome', '2026-10-06'),
          titled('Eat ramen in Sapporo', '2026-10-07'),
          titled('Go skydiving', null),
        ],
      }),
    );
    expect(get(list, 'bucketpaths').unlockedOn).toBe('2026-10-07');
    expect(get(list, 'bucketwide').progress).toBe(6);
  });

  it('lets a streak achievement run across one missed day', () => {
    const days = ['2026-10-20', '2026-10-21', '2026-10-23', '2026-10-24']; // the 22nd missed
    expect(get(achievements(input({ entries: days.map((d) => entry(d, 20)) })), 'streak3').unlockedOn).toBe('2026-10-23');
  });
});
