import { describe, expect, it } from 'vitest';
import type { XpEvent } from '../progress/engine';
import { capsulePool, CHASSIS, chassisById, cosmeticLists, MASTERY_TITLES, BODY_LINES, sellable, TITLES, type Gear, type Title } from './catalog';
import { weeklyStock } from './shop';
import {
  bestDaySections,
  BODY_MAX,
  bodyLevel,
  bodyPrizes,
  bodySections,
  bodyStats,
  bodyStep,
  bodyXpFor,
  hallState,
  longestRun,
  MASTERY_FROM,
  MK_XP,
  MP,
  OWN_MULT,
  pilotAt,
  pilotsOf,
  SECRETS,
  secretOpen,
  TIERS,
  unclaimed,
  type SecretFacts,
} from './mastery';
import { overallLevel } from '../progress/engine';
import type { Tx } from './wallet';

const D = MASTERY_FROM;
const pilot = (ref: string, t: string, at = t.slice(0, 10)): Tx => ({ id: `p${t}`, type: 'pilot', at, ref, cost: {}, gain: {}, t });
const ev = (key: string, section: XpEvent['section'], xp: number, date = D): XpEvent => ({ key, date, section, xp, reason: '' });
const noStamp = () => null;

describe('body levels', () => {
  it('come far faster than overall levels, and stop at the cap', () => {
    expect(bodyLevel(0).level).toBe(1);
    expect(bodyLevel(bodyStep(1)).level).toBe(2);
    expect(bodyLevel(bodyXpFor(10)).level).toBe(10);
    expect(bodyLevel(bodyXpFor(BODY_MAX) + 99999)).toMatchObject({ level: BODY_MAX, max: true, need: 0 });
    // The same XP is several body levels for every overall one.
    expect(bodyLevel(600).level).toBeGreaterThan(overallLevel(600).level);
    expect(bodyXpFor(10)).toBeLessThan(500);
  });

  it('every body has sections it is from, a title and a battle cry', () => {
    for (const ch of CHASSIS) {
      expect(bodySections(ch).length, ch.id).toBeGreaterThan(0);
      expect(MASTERY_TITLES[ch.id], ch.id).toBeTruthy();
      expect(BODY_LINES[ch.id], ch.id).toBeTruthy();
      expect(TITLES.some((t) => t.id === `m_${ch.id}` && t.mastery === ch.id)).toBe(true);
    }
  });
});

describe('who was piloting', () => {
  it('with no pilot rows, the body worn now counts from the start', () => {
    const ps = pilotsOf([], 'tanuki');
    expect(ps).toHaveLength(1);
    expect(pilotAt(ps, null, D)).toBe('tanuki');
    expect(pilotAt(ps, null, '2026-11-01')).toBeNull();
  });

  it('timed XP goes to the body worn at that moment; day-only XP to the one you ended the day in', () => {
    const ps = pilotsOf([pilot('kappa', `${D}T15:00:00.000Z`), pilot('tanuki', `${D}T00:00:00.000Z`)], 'kappa');
    expect(ps.map((p) => p.chassis)).toEqual(['tanuki', 'kappa']);
    expect(pilotAt(ps, Date.parse(`${D}T09:00:00Z`), D)).toBe('tanuki');
    expect(pilotAt(ps, Date.parse(`${D}T18:00:00Z`), D)).toBe('kappa');
    expect(pilotAt(ps, null, D)).toBe('kappa');
  });
});

describe('body stats', () => {
  const txs = [pilot('tanuki', `${D}T00:00:00.000Z`), pilot('maestro', `${D}T12:00:00.000Z`)];
  const stamps: Record<string, number> = {
    'entry:a:time': Date.parse(`${D}T09:00:00Z`),
    'entry:a:logged': Date.parse(`${D}T09:00:00Z`),
    'entry:b:time': Date.parse(`${D}T13:00:00Z`),
    'entry:b:logged': Date.parse(`${D}T13:00:00Z`),
  };
  const xp = [
    ev('entry:a:time', 'gym', 40),
    ev('entry:a:logged', 'gym', 5),
    ev('entry:b:time', 'violin', 30),
    ev('entry:b:logged', 'violin', 5),
    ev(`quest:daily:${D}:sweep`, 'quests', 20),
    ev(`boss:${D}`, 'quests', 100),
  ];
  const stats = bodyStats({ xp, stampOf: (k) => stamps[k] ?? null, txs, current: 'maestro' });

  it('shares XP out by who was piloting, doubled in a body\'s own sections', () => {
    // Tanuki is from gym and cabinet: the morning's gym session counts double.
    expect(stats.get('tanuki')!.xp).toBe(45 * OWN_MULT);
    // The Maestro is violin's: the afternoon's session doubles, and the day's quests and boss land with whoever ended the day.
    expect(stats.get('maestro')!.xp).toBe(35 * OWN_MULT + 120);
    expect(stats.get('kappa')!.xp).toBe(0);
  });

  it('mastery counts sessions, days, boards and bosses', () => {
    expect(stats.get('tanuki')!.mp).toBe(MP.own + MP.day);
    expect(stats.get('maestro')!.mp).toBe(MP.own + MP.day + MP.daily + MP.boss);
    expect(stats.get('maestro')!.sessions).toBe(1);
  });

  it('building a Mk gives the body XP', () => {
    const s = bodyStats({ xp: [], stampOf: noStamp, txs: [{ id: 'm', type: 'mk', at: D, ref: 'chassis:koi:3', cost: {}, gain: {} }], current: 'drone' });
    expect(s.get('koi')!.xp).toBe(MK_XP[3]);
  });

  it('the drone earns nothing of its own, and old records before mastery count for nobody', () => {
    const s = bodyStats({ xp: [ev('entry:x:time', 'gym', 50, '2026-10-20')], stampOf: noStamp, txs: [], current: 'tanuki' });
    expect(s.get('tanuki')!.xp).toBe(0);
    const d = bodyStats({ xp: [ev('entry:x:time', 'gym', 50)], stampOf: noStamp, txs: [], current: 'drone' });
    expect([...d.values()].every((x) => x.xp === 0)).toBe(true);
  });
});

describe('prizes', () => {
  const ch = chassisById('tanuki')!;
  it('has six level prizes and nine tiers, Silver III teaching a cry and Gold III a title', () => {
    const s = bodyStats({ xp: [], stampOf: noStamp, txs: [], current: 'drone' }).get('tanuki')!;
    const track = bodyPrizes(ch, s);
    expect(track).toHaveLength(15);
    expect(track.every((t) => !t.reached)).toBe(true);
    expect(track.find((t) => t.prize.ref === 'body:tanuki:s3')!.prize.gain.items).toEqual(['cry:tanuki']);
    expect(track.find((t) => t.prize.ref === 'body:tanuki:g3')!.prize.gain.items).toEqual(['title:m_tanuki']);
    expect(TIERS.map((t) => t.at)).toEqual([...TIERS.map((t) => t.at)].sort((a, b) => a - b));
  });

  it('lists what is reached and not claimed, once', () => {
    const fake = new Map([['tanuki', { id: 'tanuki', xp: bodyXpFor(12), level: 12, into: 0, need: 1, max: false, mp: 260, tiers: 2, next: TIERS[2], ownXp: 0, sessions: 0, days: 0 }]]);
    const all = unclaimed(fake, new Set()).map((p) => p.ref);
    expect(all).toEqual(['body:tanuki:lv5', 'body:tanuki:lv10', 'body:tanuki:b1', 'body:tanuki:b2']);
    expect(unclaimed(fake, new Set(['body:tanuki:lv5', 'body:tanuki:b1'])).map((p) => p.ref)).toEqual(['body:tanuki:lv10', 'body:tanuki:b2']);
  });

  it('the hall counts bodies at a tier', () => {
    const many = new Map(CHASSIS.slice(0, 10).map((c) => [c.id, { mp: 120 } as never]));
    expect(hallState(many).find((h) => h.id === 'tour')!.reached).toBe(true);
    expect(hallState(many).find((h) => h.id === 'first')!.reached).toBe(false);
  });

  it('mastery titles are never sold or dropped', () => {
    const pool = new Set(capsulePool().map((p) => p.item));
    for (const t of cosmeticLists.title as Title[]) if (t.mastery) {
      expect(sellable(t as Gear & Title)).toBe(false);
      expect(pool.has(`title:${t.id}`)).toBe(false);
    }
  });
});

describe('hidden bodies', () => {
  const none: SecretFacts = { bodiesOwned: 0, bestStreak: 0, photos: 0, bigWish: false, bosses: 0, rebuilds: 0, fish: 0, bestDay: 0, tanukiMp: 0, golds: 0, sleptToday: false, hour: 12 };

  it('every hidden body has a rule, and none are on the shop shelf', () => {
    const hidden = CHASSIS.filter((c) => c.unlock);
    expect(hidden.length).toBe(11);
    expect(hidden.map((c) => c.id).sort()).toEqual(SECRETS.map((s) => s.id).sort());
    for (let w = 0; w < 30; w++) {
      const monday = new Date(Date.UTC(2026, 10, 16 + 7 * w)).toISOString().slice(0, 10);
      for (const s of weeklyStock(monday)) if (s.item.startsWith('chassis:')) expect(chassisById(s.item.split(':')[1])!.unlock).toBeUndefined();
    }
    for (const s of SECRETS) expect(secretOpen(s.id, none), s.id).toBe(false);
  });

  it('each opens when its rule is met', () => {
    const open = (f: Partial<SecretFacts>) => SECRETS.filter((s) => secretOpen(s.id, { ...none, ...f })).map((s) => s.id);
    expect(open({ tanukiMp: 700 })).toEqual(['kitsune']);
    expect(open({ sleptToday: true, hour: 6 })).toEqual(['niwatori']);
    expect(open({ sleptToday: true, hour: 9 })).toEqual([]);
    expect(open({ photos: 30 })).toEqual(['shashin']);
    expect(open({ fish: 30 })).toEqual(['medetai']);
    expect(open({ rebuilds: 1 })).toEqual(['chagama']);
    expect(open({ bosses: 8 })).toEqual(['namazu']);
    expect(open({ bigWish: true })).toEqual(['nagareboshi']);
    expect(open({ bodiesOwned: 12 })).toEqual(['nue']);
    expect(open({ bestStreak: 30 })).toEqual(['hoo']);
    expect(open({ bestDay: 6 })).toEqual(['ashura']);
    expect(open({ golds: 3 })).toEqual(['kirin']);
  });

  it('works out the longest streak and the busiest day', () => {
    expect(longestRun(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06'])).toBe(3);
    expect(longestRun([])).toBe(0);
    expect(bestDaySections([ev('a', 'gym', 1), ev('b', 'violin', 1), ev('c', 'quests', 9), ev('d', 'gym', 1), ev('e', 'study', 1, '2026-11-15')])).toBe(2);
  });
});
