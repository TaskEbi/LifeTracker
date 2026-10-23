import { describe, expect, it } from 'vitest';
import type { LogDayMetric, LogEntry, LtDetail, LtNight, SectionId, Todo } from '../../data/types';
import { DEFAULT_SLEEP, DEFAULT_TARGETS, targetsAt } from '../prefs';
import { bedDelta, computeProgress, dayStreak, overallLevel, RULES, rewardBetween, sectionLevel, weekStreak, xpEvents, type ProgressInput } from './engine';

const T = '2026-10-24'; // a Saturday
const VIOLIN = 'topic-violin';
const GYM = 'topic-gym';
let n = 0;
const entry = (date: string, minutes: number, topic = VIOLIN, id = `e${++n}`): LogEntry => ({
  id, date, topic_id: topic, subcategory_id: null, minutes, note: null,
  created_at: `${date}T10:00:00Z`, updated_at: `${date}T10:00:00Z`, deleted_at: null,
});
const metric = (date: string, m: LogDayMetric['metric'], minutes: number): LogDayMetric => ({
  id: `${m}:${date}`, date, metric: m, minutes, created_at: date, updated_at: date, deleted_at: null,
});

function input(p: Partial<ProgressInput> = {}): ProgressInput {
  return {
    today: T,
    entries: [],
    topicSection: new Map<string, SectionId>([[VIOLIN, 'violin'], [GYM, 'gym']]),
    details: new Map(),
    metrics: [],
    nights: new Map(),
    todos: [],
    dayOf: (iso) => iso.slice(0, 10),
    restDays: [],
    cabinetDays: [],
    targets: DEFAULT_TARGETS,
    sleep: DEFAULT_SLEEP,
    ...p,
  };
}

describe('XP from records', () => {
  it('gives time and completion XP for a session, with the per-entry cap', () => {
    const ev = xpEvents(input({ entries: [entry(T, 45, VIOLIN, 'a'), entry('2026-10-23', 300, VIOLIN, 'b')] }));
    const a = ev.filter((e) => e.key.startsWith('entry:a:'));
    expect(a.map((e) => e.xp).sort()).toEqual([10, 23]);
    const b = ev.find((e) => e.key === 'entry:b:time')!;
    expect(b.xp).toBe(RULES.timeCapPerEntry);
  });

  it('caps time XP per section per day so more practice is not always more XP', () => {
    const ev = xpEvents(input({ entries: [entry(T, 90, VIOLIN), entry(T, 90, VIOLIN), entry(T, 90, VIOLIN)] }));
    const time = ev.filter((e) => e.key.endsWith(':time')).reduce((s, e) => s + e.xp, 0);
    expect(time).toBe(RULES.timeCapPerDay);
  });

  it('counts a record once even if it arrives twice', () => {
    const e = entry(T, 30, VIOLIN, 'same');
    const once = computeProgress(input({ entries: [e] })).total;
    const twice = computeProgress(input({ entries: [e, { ...e }] })).total;
    expect(twice).toBe(once);
  });

  it('recomputes instead of adding when an entry is edited', () => {
    const e = entry(T, 30, VIOLIN, 'edit');
    const before = computeProgress(input({ entries: [e] })).total;
    const after = computeProgress(input({ entries: [{ ...e, minutes: 60 }] })).total;
    expect(after - before).toBe(15);
  });

  it('awards the weekly violin target once per week, lessons and rehearsals included', () => {
    const mon = '2026-10-19';
    const entries = [entry(mon, 100), entry('2026-10-22', 45), entry('2026-10-22', 90)]; // 235
    expect(xpEvents(input({ entries })).some((e) => e.key.startsWith('week:violin'))).toBe(false);
    const more = [...entries, entry(T, 10)];
    expect(xpEvents(input({ entries: more })).filter((e) => e.key === `week:violin:${mon}`)).toHaveLength(1);
  });

  it('never takes back past weekly bonuses when the target is raised later', () => {
    const entries = [entry('2026-10-12', 250), entry('2026-10-19', 250)];
    const before = xpEvents(input({ entries }));
    expect(before.filter((e) => e.key.startsWith('week:violin'))).toHaveLength(2);
    const log = [{ from: '2000-01-03', targets: DEFAULT_TARGETS }, { from: '2026-10-19', targets: { ...DEFAULT_TARGETS, violinWeek: 300 } }];
    const after = xpEvents(input({ entries, targets: log[1].targets, targetsAt: (w) => targetsAt(log, log[1].targets, w) }));
    expect(after.filter((e) => e.key.startsWith('week:violin')).map((e) => e.key)).toEqual(['week:violin:2026-10-12']);
  });

  it('caps gym set XP at the plan and gives a check-in bonus', () => {
    const e = entry(T, 70, GYM, 'g');
    const sets = Array.from({ length: 30 }, () => ({ done: true }));
    const detail: LtDetail = { id: 'g', section: 'gym', data: { name: 'Lower A', exercises: [{ sets }], effort: 7 }, created_at: T, updated_at: T, deleted_at: null };
    const ev = xpEvents(input({ entries: [e], details: new Map([['g', detail]]) }));
    expect(ev.find((x) => x.key === 'entry:g:sets')!.xp).toBe(RULES.gymSetsCap);
    expect(ev.find((x) => x.key === 'entry:g:checkin')!.xp).toBe(RULES.gymCheckIn);
  });

  it('rewards logging sleep and a steady bedtime, never sleeping less', () => {
    const night: LtNight = { id: 'n', date: T, bed: '23:20', wake: '08:00', created_at: T, updated_at: T, deleted_at: null };
    const short = xpEvents(input({ metrics: [metric(T, 'sleep', 300)], nights: new Map([[T, night]]) }));
    const long = xpEvents(input({ metrics: [metric(T, 'sleep', 600)], nights: new Map([[T, night]]) }));
    expect(short.reduce((s, e) => s + e.xp, 0)).toBe(long.reduce((s, e) => s + e.xp, 0));
    expect(short.some((e) => e.key.endsWith(':bedtime'))).toBe(true);
  });

  it('judges bedtime around midnight against the right night', () => {
    // Saturday morning: Friday night is a weekend night (23:30 planned).
    expect(bedDelta({ date: T, bed: '00:10' }, DEFAULT_SLEEP)).toBe(40);
    // Monday morning: Sunday night is a school night (22:45 planned).
    expect(bedDelta({ date: '2026-10-26', bed: '22:30' }, DEFAULT_SLEEP)).toBe(-15);
  });

  it('gives finished tasks XP once, on the day they were finished', () => {
    const todo: Todo = { id: 't', title: 'x', priority: 'normal', due: null, done_at: '2026-10-23T12:00:00Z', created_at: T, updated_at: T, deleted_at: null, section: 'study' };
    const ev = xpEvents(input({ todos: [todo, { ...todo, done_at: null, id: 'open' }] }));
    expect(ev.filter((e) => e.key.startsWith('task:'))).toEqual([{ key: 'task:t', date: '2026-10-23', section: 'study', xp: RULES.taskDone, reason: 'Task completed' }]);
  });

  it('ignores entries dated in the future', () => {
    expect(xpEvents(input({ entries: [entry('2026-10-25', 30)] }))).toEqual([]);
  });
});

describe('levels', () => {
  it('follows the illustrative curves', () => {
    expect(sectionLevel(1599).level).toBe(9);
    expect(sectionLevel(1620).level).toBe(10);
    expect(overallLevel(10100).level).toBe(15);
    expect(overallLevel(10200).level).toBe(16);
  });
});

describe('streaks', () => {
  it("keeps the day streak alive until today is over", () => {
    const days = new Set(['2026-10-21', '2026-10-22', '2026-10-23']);
    expect(dayStreak(days, T)).toEqual({ n: 3, today: false });
    days.add(T);
    expect(dayStreak(days, T)).toEqual({ n: 4, today: true });
  });

  it('counts planned rest days as active', () => {
    const p = computeProgress(input({ entries: [entry('2026-10-23', 30)], restDays: [T] }));
    expect(p.streak).toEqual({ n: 2, today: true, rest: true });
  });

  it('counts consecutive weeks, the current one only once it passes', () => {
    const ok = new Set(['2026-10-05', '2026-10-12']);
    expect(weekStreak((w) => ok.has(w), T)).toBe(2);
    ok.add('2026-10-19');
    expect(weekStreak((w) => ok.has(w), T)).toBe(3);
  });
});

describe('rewards', () => {
  it('lists exactly what a save added', () => {
    const base = [entry('2026-10-19', 100), entry('2026-10-22', 135)];
    const before = computeProgress(input({ entries: base }));
    const after = computeProgress(input({ entries: [...base, entry(T, 45, VIOLIN, 'new')] }));
    const r = rewardBetween(before, after);
    expect(r.lines.map((l) => l.reason)).toEqual(['45 min logged', 'Session logged', 'Weekly violin target reached']);
    expect(r.total).toBe(23 + 10 + 30);
  });
});
