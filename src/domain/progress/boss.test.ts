import { describe, expect, it } from 'vitest';
import type { LogDayMetric, LogEntry, SectionId } from '../../data/types';
import { addDays } from '../log/dates';
import { DEFAULT_SLEEP, DEFAULT_TARGETS } from '../prefs';
import { achievements } from './achievements';
import { BOSS_FROM, BOSS_XP, bossEvents, bossFor, bossFight, bossHistory, BOSSES, currentBoss, DMG, HP_MIN } from './boss';
import { computeProgress, type ProgressInput } from './engine';
import { heatmap, lastWeekRecap, weekRecap } from './recap';

const MON = '2026-11-02';
let n = 0;
const entry = (date: string, minutes: number, topic = 'topic-violin', id = `e${++n}`): LogEntry => ({
  id, date, topic_id: topic, subcategory_id: null, minutes, note: null,
  created_at: `${date}T10:00:00Z`, updated_at: `${date}T10:00:00Z`, deleted_at: null,
});
const metric = (date: string, m: LogDayMetric['metric'], minutes: number): LogDayMetric => ({
  id: `${m}:${date}`, date, metric: m, minutes, created_at: date, updated_at: date, deleted_at: null,
});
const TOPICS: [string, SectionId][] = [['topic-violin', 'violin'], ['topic-gym', 'gym'], ['topic-coding', 'coding'], ['topic-study', 'study'], ['topic-chess', 'chess'], ['topic-sports', 'sports']];
const topicOf = (s: SectionId) => `topic-${s}`;

function input(p: Partial<ProgressInput> = {}): ProgressInput {
  return {
    today: addDays(MON, 6), entries: [], topicSection: new Map(TOPICS), details: new Map(), metrics: [], nights: new Map(), todos: [],
    dayOf: (iso) => iso.slice(0, 10), restDays: [], cabinetDays: [], targets: DEFAULT_TARGETS, sleep: DEFAULT_SLEEP, ...p,
  };
}

describe('boss draw', () => {
  it('is fixed per week and never repeats the week before', () => {
    expect(bossFor(MON).id).toBe(bossFor(MON).id);
    for (let w = BOSS_FROM, i = 0; i < 40; i++, w = addDays(w, 7)) expect(bossFor(w).id).not.toBe(bossFor(addDays(w, -7)).id);
    const seen = new Set(Array.from({ length: 40 }, (_, i) => bossFor(addDays(BOSS_FROM, 7 * i)).id));
    expect(seen.size).toBeGreaterThan(5);
  });

  it('brings every boss once in each round of eight weeks', () => {
    for (const r of [0, 1, 5]) {
      const ids = Array.from({ length: BOSSES.length }, (_, i) => bossFor(addDays(BOSS_FROM, 7 * (r * BOSSES.length + i))).id);
      expect(new Set(ids).size).toBe(BOSSES.length);
    }
  });

  it('has a weakness in a real section for every boss', () => {
    for (const b of BOSSES) expect(TOPICS.map(([, s]) => s).concat(['sleep', 'screen'])).toContain(b.weak);
  });
});

describe('boss damage', () => {
  it('counts minutes, doubles the weak section and adds a bonus per new section', () => {
    const weak = bossFor(MON).weak;
    const other = (['violin', 'coding', 'study'] as SectionId[]).find((s) => s !== weak)!;
    const timedWeak = (['violin', 'coding', 'sports', 'gym', 'study', 'chess'] as SectionId[]).includes(weak);
    const entries = [entry(MON, 30, topicOf(other)), entry(addDays(MON, 1), 20, topicOf(other))];
    if (timedWeak) entries.push(entry(MON, 10, topicOf(weak)));
    const f = bossFight(input({ entries }), MON);
    const expected = 50 + DMG.newSection + (timedWeak ? 10 * DMG.weakMultiplier + DMG.newSection : 0);
    expect(f.damage).toBe(expected);
    if (timedWeak) expect(f.hits.some((h) => h.weak && h.source === weak)).toBe(true);
  });

  it('starts at the minimum HP and is defeated on the day the damage reaches it', () => {
    const f0 = bossFight(input(), MON);
    expect(f0.hp).toBe(HP_MIN);
    expect(f0.defeatedOn).toBeNull();
    const entries = [entry(MON, 100, 'topic-chess'), entry(addDays(MON, 2), 250, 'topic-coding'), entry(addDays(MON, 4), 200, 'topic-study')];
    const f = bossFight(input({ entries }), MON);
    expect(f.defeatedOn).toBe(addDays(MON, 2));
  });

  it('grows with your recent weeks', () => {
    const past = [1, 2, 3, 4].map((k) => entry(addDays(MON, -7 * k), 900, 'topic-study'));
    const f = bossFight(input({ entries: past }), MON);
    // 900 min + one new-section bonus a week, plus 10%.
    expect(f.hp).toBe(Math.round(((900 + DMG.newSection) * 1.1) / 10) * 10);
  });

  it('counts sleep and screen time', () => {
    const d = MON;
    const f = bossFight(input({ metrics: [metric(d, 'sleep', 480), metric(d, 'screen', 60)], nights: new Map([[d, { id: d, date: d, bed: DEFAULT_SLEEP.weekday.bed, wake: '07:00', created_at: d, updated_at: d, deleted_at: null }]]) }), MON);
    const weak = bossFor(MON).weak;
    const sleep = (DMG.night + DMG.bedtime) * (weak === 'sleep' ? 2 : 1);
    const screen = DMG.screen * (weak === 'screen' ? 2 : 1) + (DEFAULT_TARGETS.screenDay != null && 60 <= DEFAULT_TARGETS.screenDay ? DMG.screenUnder * (weak === 'screen' ? 2 : 1) : 0);
    expect(f.damage).toBe(sleep + screen + 2 * DMG.newSection);
  });
});

describe('boss XP', () => {
  it('pays once per defeated week, keyed by the week, and none before BOSS_FROM', () => {
    const entries = [entry(MON, 400, 'topic-coding'), entry(addDays(BOSS_FROM, -7), 900, 'topic-coding')];
    const inp = input({ entries });
    const ev = bossEvents(inp);
    expect(ev.map((e) => e.key)).toEqual([`boss:${MON}`]);
    expect(ev[0].xp).toBe(BOSS_XP);
    const twice = input({ entries: [...entries, ...entries] });
    expect(computeProgress(twice).bySection.quests).toBe(computeProgress(inp).bySection.quests);
    expect(bossHistory(inp)[0].start).toBe(BOSS_FROM);
  });

  it('unlocks the first boss achievement', () => {
    const a = achievements(input({ entries: [entry(MON, 400, 'topic-coding')] }));
    expect(a.find((x) => x.id === 'boss1')?.unlockedOn).toBe(MON);
    expect(a.find((x) => x.id === 'bestiary')?.progress).toBe(1);
  });

  it('shows the current week', () => {
    expect(currentBoss(input({ today: addDays(MON, 3) })).start).toBe(MON);
  });
});

describe('recap and heatmap', () => {
  it('sums a week and compares it with the week before', () => {
    const entries = [entry(MON, 40, 'topic-violin'), entry(MON, 20, 'topic-chess'), entry(addDays(MON, 3), 90, 'topic-study'), entry(addDays(MON, -3), 30, 'topic-study')];
    const r = weekRecap(input({ entries }), MON);
    expect(r.minutes).toBe(150);
    expect(r.prevMinutes).toBe(30);
    expect(r.activeDays).toBe(2);
    expect(r.sections[0]).toEqual({ id: 'study', minutes: 90 });
    expect(r.bestDay).toEqual({ date: addDays(MON, 3), minutes: 90 });
    expect(r.boss?.name).toBe(bossFor(MON).name);
    expect(lastWeekRecap(input({ entries, today: addDays(MON, 8) })).start).toBe(MON);
  });

  it('grades days by minutes and stops at today', () => {
    const today = addDays(MON, 2);
    const grid = heatmap(input({ today, entries: [entry(MON, 130, 'topic-study'), entry(addDays(MON, 1), 15, 'topic-study')], restDays: [today] }), 3);
    expect(grid).toHaveLength(3);
    const week = grid[2];
    expect(week).toHaveLength(3);
    expect(week.map((d) => d.level)).toEqual([5, 2, 0]);
    expect(week[2].rest).toBe(true);
  });
});
