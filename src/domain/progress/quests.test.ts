import { describe, expect, it } from 'vitest';
import type { LogDayMetric, LogEntry, SectionId } from '../../data/types';
import { DEFAULT_SLEEP, DEFAULT_TARGETS } from '../prefs';
import { achievements } from './achievements';
import { computeProgress, type ProgressInput } from './engine';
import { drawQuests, QUEST_POOLS, QUEST_XP, questBoard, questEvents, questHistory, QUESTS_FROM, SWEEP_XP } from './quests';

const T = '2026-10-24'; // a Saturday
let n = 0;
const entry = (date: string, minutes: number, topic = 'topic-violin', id = `e${++n}`): LogEntry => ({
  id, date, topic_id: topic, subcategory_id: null, minutes, note: null,
  created_at: `${date}T10:00:00Z`, updated_at: `${date}T10:00:00Z`, deleted_at: null,
});
const metric = (date: string, m: LogDayMetric['metric'], minutes: number): LogDayMetric => ({
  id: `${m}:${date}`, date, metric: m, minutes, created_at: date, updated_at: date, deleted_at: null,
});
const TOPICS: [string, SectionId][] = [['topic-violin', 'violin'], ['topic-gym', 'gym'], ['topic-coding', 'coding'], ['topic-study', 'study'], ['topic-chess', 'chess'], ['topic-sports', 'sports']];

function input(p: Partial<ProgressInput> = {}): ProgressInput {
  return {
    today: T, entries: [], topicSection: new Map(TOPICS), details: new Map(), metrics: [], nights: new Map(), todos: [],
    dayOf: (iso) => iso.slice(0, 10), restDays: [], cabinetDays: [], targets: DEFAULT_TARGETS, sleep: DEFAULT_SLEEP, ...p,
  };
}

/** Records that complete every daily quest on a day. */
const fullDay = (d: string): Partial<ProgressInput> => ({
  entries: [entry(d, 60, 'topic-violin'), entry(d, 40, 'topic-gym'), entry(d, 40, 'topic-study')],
  metrics: [metric(d, 'sleep', 480), metric(d, 'screen', 60)],
  nights: new Map([[d, { id: d, date: d, bed: '23:30', wake: '07:30', created_at: d, updated_at: d, deleted_at: null }]]),
  todos: [1, 2].map((i) => ({ id: `t${d}${i}`, title: 'x', priority: 'normal' as const, due: null, done_at: `${d}T12:00:00Z`, created_at: d, updated_at: d, deleted_at: null, section: null })),
});

describe('quest draw', () => {
  it('is the same for the same day and differs across days', () => {
    expect(drawQuests('daily', T).map((q) => q.id)).toEqual(drawQuests('daily', T).map((q) => q.id));
    const days = Array.from({ length: 10 }, (_, i) => drawQuests('daily', `2026-11-${String(i + 1).padStart(2, '0')}`).map((q) => q.id).join());
    expect(new Set(days).size).toBeGreaterThan(3);
  });

  it('draws three distinct quests from each pool', () => {
    for (const period of ['daily', 'weekly', 'monthly'] as const) {
      const ids = drawQuests(period, '2026-11-02').map((q) => q.id);
      expect(new Set(ids).size).toBe(3);
      for (const id of ids) expect(QUEST_POOLS[period].some((q) => q.id === id)).toBe(true);
    }
  });
});

describe('quest progress and XP', () => {
  it('completes on the day the goal is reached and pays once', () => {
    const board = questBoard(input(fullDay(T)));
    expect(board.daily.quests.every((q) => q.doneOn === T)).toBe(true);
    expect(board.daily.sweptOn).toBe(T);
    const ev = questEvents(input(fullDay(T))).filter((e) => e.key.startsWith(`quest:daily:${T}`));
    expect(ev.reduce((s, e) => s + e.xp, 0)).toBe(3 * QUEST_XP.daily + SWEEP_XP.daily);
    // The same records twice still pay once.
    const twice = fullDay(T);
    expect(computeProgress(input({ ...twice, entries: [...twice.entries!, ...twice.entries!] })).bySection.quests).toBe(computeProgress(input(twice)).bySection.quests);
  });

  it('shows progress without paying for unfinished quests', () => {
    const board = questBoard(input());
    expect(board.daily.quests.every((q) => q.progress === 0 && !q.doneOn)).toBe(true);
    expect(questEvents(input())).toEqual([]);
  });

  it('gives no quest XP before quests began', () => {
    const before = '2026-09-15';
    const p = computeProgress(input(fullDay(before)));
    expect(p.bySection.quests).toBe(0);
    expect(questHistory(input()).every((s) => s.start >= QUESTS_FROM)).toBe(true);
  });

  it('counts weekly quests across the days of the week', () => {
    const mon = '2026-10-19';
    const recs = [0, 1, 2, 3, 4].map((i) => fullDay(`2026-10-${19 + i}`));
    const merged: Partial<ProgressInput> = {
      entries: recs.flatMap((r) => r.entries!),
      metrics: recs.flatMap((r) => r.metrics!),
      nights: new Map(recs.flatMap((r) => [...r.nights!])),
      todos: recs.flatMap((r) => r.todos!),
    };
    const week = questBoard(input(merged)).weekly;
    expect(week.start).toBe(mon);
    expect(week.quests.every((q) => q.doneOn && q.doneOn >= mon && q.doneOn <= T)).toBe(true);
  });
});

describe('achievements', () => {
  it('have tiers, and unlock quest achievements from the records', () => {
    const list = achievements(input(fullDay(T)));
    expect(list.length).toBeGreaterThanOrEqual(30);
    expect(new Set(list.map((a) => a.id)).size).toBe(list.length);
    expect(list.find((a) => a.id === 'quest1')?.unlockedOn).toBe(T);
    expect(list.find((a) => a.id === 'sweep')?.unlockedOn).toBe(T);
    expect(list.find((a) => a.id === 'lv10')?.unlockedOn).toBeNull();
    for (const a of list) expect(a.progress).toBeLessThanOrEqual(a.goal);
  });
});
