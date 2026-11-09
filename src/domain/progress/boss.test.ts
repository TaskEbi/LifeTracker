import { describe, expect, it } from 'vitest';
import type { LogDayMetric, LogEntry, SectionId } from '../../data/types';
import { TIMED_SECTIONS } from '../../data/types';
import { addDays } from '../log/dates';
import { DEFAULT_SLEEP, DEFAULT_TARGETS } from '../prefs';
import { achievements } from './achievements';
import { BOSS_ERA2, BOSS_FROM, BOSS_XP, bossEvents, bossFor, bossFight, bossHistory, bossHp, BOSSES, COMBO, currentBoss, DMG, HP2, HP_MIN, REGEN, TIERS } from './boss';
import { dayFacts } from './quests';
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

  it('keeps the first era to the first eight, and brings all of them once a round after', () => {
    expect(BOSSES.length).toBe(24);
    for (let w = BOSS_FROM; w < BOSS_ERA2; w = addDays(w, 7)) expect(BOSSES.indexOf(bossFor(w))).toBeLessThan(8);
    for (const r of [0, 1, 3]) {
      const ids = Array.from({ length: BOSSES.length }, (_, i) => bossFor(addDays(BOSS_ERA2, 7 * (r * BOSSES.length + i))).id);
      expect(new Set(ids).size).toBe(BOSSES.length);
    }
    expect(bossFor(BOSS_ERA2).id).not.toBe(bossFor(addDays(BOSS_ERA2, -7)).id);
  });

  it('gives every boss a real second weakness, a trait, and a resisted section when it resists', () => {
    const real = new Set<string>([...TIMED_SECTIONS, 'sleep', 'screen']);
    for (const b of BOSSES) {
      expect(real.has(b.weak2)).toBe(true);
      expect(b.weak2).not.toBe(b.weak);
      if (b.trait === 'resist') expect(b.resist && b.resist !== b.weak && b.resist !== b.weak2).toBeTruthy();
    }
    expect(new Set(BOSSES.map((b) => b.id)).size).toBe(BOSSES.length);
    expect(BOSSES.filter((b) => b.tier === 3).length).toBeGreaterThanOrEqual(4);
  });

  it('has a weakness in a real section for every boss', () => {
    for (const b of BOSSES) expect([...TIMED_SECTIONS, 'sleep', 'screen']).toContain(b.weak);
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

  it('takes minutes from every timed section', () => {
    for (const s of TIMED_SECTIONS) {
      const f = bossFight(input({ topicSection: new Map([[topicOf(s), s]]), entries: [entry(MON, 30, topicOf(s))] }), MON);
      expect(f.hits.some((h) => h.source === s && h.label === '30 min')).toBe(true);
      expect(f.damage).toBe(30 * (bossFor(MON).weak === s ? DMG.weakMultiplier : 1) + DMG.newSection);
    }
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

/** The first era-two week whose boss has a trait, for the rules below. */
const weekWith = (pred: (b: (typeof BOSSES)[number]) => boolean) => {
  for (let w = BOSS_ERA2, i = 0; i < 48; i++, w = addDays(w, 7)) if (pred(bossFor(w))) return w;
  throw new Error('none');
};
const ERA_TOPICS: [string, SectionId][] = [...TOPICS, ['topic-reading', 'reading'], ['topic-maths', 'maths'], ['topic-future', 'future']];

describe('era two', () => {
  it('is stronger: a higher floor scaled by rank, and more growth', () => {
    const w = BOSS_ERA2;
    const f = bossFight(input({ today: addDays(w, 6), topicSection: new Map(ERA_TOPICS) }), w);
    expect(f.era2).toBe(true);
    expect(f.hp).toBe(Math.round((HP2.min * TIERS[f.tier].hp) / 10) * 10);
    expect(f.xp).toBe(TIERS[f.tier].xp);
    const past = [1, 2, 3, 4].map((k) => entry(addDays(w, -7 * k), 1500, 'topic-study'));
    const inp = input({ today: addDays(w, 6), entries: past, topicSection: new Map(ERA_TOPICS) });
    expect(bossHp(w, dayFacts(inp), inp.today)).toBe(Math.min(HP2.max, Math.round(((1500 + DMG.newSection) * HP2.growth * TIERS[bossFor(w).tier].hp) / 10) * 10));
  });

  it('pays its rank in XP', () => {
    const w = weekWith((b) => b.tier === 3);
    const entries = [entry(w, 1400, 'topic-violin'), entry(w, 1400, 'topic-coding')];
    const ev = bossEvents(input({ today: addDays(w, 6), entries }));
    expect(ev.find((e) => e.key === `boss:${w}`)?.xp).toBe(TIERS[3].xp);
  });

  it('adds combos for three and five sections in a day', () => {
    const w = BOSS_ERA2;
    const three = bossFight(input({ today: w, topicSection: new Map(ERA_TOPICS), entries: ['violin', 'chess', 'coding'].map((s) => entry(w, 5, topicOf(s as SectionId))) }), w);
    expect(three.hits.find((h) => h.source === 'combo')?.dmg).toBe(COMBO.three);
    const five = bossFight(input({ today: w, topicSection: new Map(ERA_TOPICS), entries: ['violin', 'chess', 'coding', 'gym', 'sports'].map((s) => entry(w, 5, topicOf(s as SectionId))) }), w);
    expect(five.hits.find((h) => h.source === 'combo')?.dmg).toBe(COMBO.five);
  });

  it('cracks at half HP, and the weakness switches the next day', () => {
    const w = BOSS_ERA2;
    const b = bossFor(w);
    const hp = Math.round((HP2.min * TIERS[b.tier].hp) / 10) * 10;
    const filler = (['violin', 'coding', 'chess', 'study'] as SectionId[]).find((s) => s !== b.weak && s !== b.weak2 && s !== b.resist)!;
    const entries = [entry(w, Math.ceil(hp / 2), topicOf(filler))];
    const f = bossFight(input({ today: addDays(w, 1), topicSection: new Map(ERA_TOPICS), entries }), w);
    expect(f.crackedOn).toBe(w);
    expect(f.weakNow).toBe(b.weak2);
  });

  it('regenerates after a whole day with no hits', () => {
    const w = weekWith((b) => b.trait === 'regen');
    const b = bossFor(w);
    const filler = (['violin', 'coding', 'chess', 'study'] as SectionId[]).find((s) => s !== b.weak && s !== b.weak2 && s !== b.resist)!;
    const f = bossFight(input({ today: addDays(w, 2), topicSection: new Map(ERA_TOPICS), entries: [entry(w, 100, topicOf(filler))] }), w);
    const heal = Math.round((f.hp * REGEN) / 10) * 10;
    expect(f.healed).toBe(heal);
    expect(f.damage).toBe(100 + DMG.newSection - heal);
    expect(f.hits.filter((h) => h.source === 'boss')).toHaveLength(1);
  });

  it('enrages on Saturday when more than half its HP is left', () => {
    const w = weekWith((b) => b.trait === 'enrage');
    const f = bossFight(input({ today: addDays(w, 6), topicSection: new Map(ERA_TOPICS) }), w);
    expect(f.enragedOn).toBe(addDays(w, 5));
    expect(f.hp).toBe(bossFight(input({ today: addDays(w, 4), topicSection: new Map(ERA_TOPICS) }), w).hp * 1.2);
  });

  it('resists its section by half', () => {
    const w = weekWith((b) => b.trait === 'resist' && TIMED_SECTIONS.includes(b.resist as never));
    const b = bossFor(w);
    const f = bossFight(input({ today: w, topicSection: new Map(ERA_TOPICS), entries: [entry(w, 41, topicOf(b.resist!))] }), w);
    const h = f.hits.find((x) => x.source === b.resist && !x.flat)!;
    expect(h.resisted).toBe(true);
    expect(h.dmg).toBe(21);
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
