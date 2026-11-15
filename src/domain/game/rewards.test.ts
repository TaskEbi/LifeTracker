import { describe, expect, it } from 'vitest';
import type { XpEvent } from '../progress/engine';
import { computeProgress } from '../progress/engine';
import { ACH_XP, CHASSIS, MASTERY_TITLES, BODY_LINES } from './catalog';
import { achPrizes, achRef, claimXp, nextMonth, passesNow, passGain, passState, PASS_STEP, PASS_TIERS, rewardClaims, skinItem, skinLock, SKINS } from './rewards';
import { changeLoadout, normaliseLoadout, wornSkin, type Tx } from './wallet';

const ev = (date: string, xp: number, key = `entry:${date}:${xp}:time`): XpEvent => ({ key, date, section: 'violin', xp, reason: 'x' });

describe('the new bodies', () => {
  it('has thirty more, in five groups of six, each with a title and a battle cry', () => {
    const groups = ['samurai', 'mecha', 'guardians', 'engines', 'heavens'] as const;
    for (const g of groups) {
      const list = CHASSIS.filter((c) => c.group === g);
      expect(list, g).toHaveLength(6);
      for (const c of list) {
        expect(c.level, c.id).toBeGreaterThan(0);
        expect(MASTERY_TITLES[c.id], c.id).toBeTruthy();
        expect(BODY_LINES[c.id], c.id).toBeTruthy();
      }
    }
    expect(new Set(CHASSIS.map((c) => c.id)).size).toBe(CHASSIS.length);
  });
});

describe('true skins', () => {
  const none = () => false;
  it('needs the body built, the level, and silver before gold', () => {
    expect(skinLock('silver', 30, none, 'koi', 0)).toBe('Build the body first');
    expect(skinLock('silver', SKINS.silver.level - 1, none, 'koi', 1)).toMatch(/LV/);
    expect(skinLock('silver', SKINS.silver.level, none, 'koi', 1)).toBeNull();
    expect(skinLock('gold', SKINS.gold.level, none, 'koi', 1)).toBe('True Silver first');
    expect(skinLock('gold', SKINS.gold.level, (it) => it === skinItem('koi', 'silver'), 'koi', 1)).toBeNull();
  });

  it('keeps a skin per body in the loadout, and wears only the current body\'s', () => {
    const look = normaliseLoadout({ chassis: 'koi', skins: { koi: 'gold', tanuki: 'silver', bad: 'bronze' } });
    expect(look.skins).toEqual({ koi: 'gold', tanuki: 'silver' });
    expect(wornSkin(look)).toBe('gold');
    expect(wornSkin({ ...look, chassis: 'drone' })).toBeNull();
    expect(normaliseLoadout({ chassis: 'koi' }).skins).toBeUndefined();
  });
});

describe('achievement prizes', () => {
  it('lists unlocked ones not yet claimed, newest first, and their XP comes from the tier', () => {
    const list = [
      { id: 'a', title: 'A', tier: 'bronze' as const, unlockedOn: '2026-11-01' },
      { id: 'b', title: 'B', tier: 'gold' as const, unlockedOn: '2026-11-10' },
      { id: 'c', title: 'C', tier: 'silver' as const, unlockedOn: null },
    ];
    const got = achPrizes(list, new Set([achRef('a', 'bronze')]));
    expect(got.map((x) => x.id)).toEqual(['b']);
    expect(got[0].xp).toBe(ACH_XP.gold);
    expect(achPrizes(list, new Set()).map((x) => x.id)).toEqual(['b', 'a']);
    expect(claimXp('ach:b:gold')).toBe(ACH_XP.gold);
    expect(claimXp('pass:2026-11:3')).toBe(0);
  });

  it('adds the XP to progress once per claim row, kept out of Ryō per XP', () => {
    const base = { today: '2026-11-15', entries: [], topicSection: new Map(), details: new Map(), metrics: [], nights: new Map(), todos: [], dayOf: (s: string) => s.slice(0, 10), restDays: [], cabinetDays: [], targets: {} as never, sleep: {} as never, plans: [] as never, bucket: [] } as never;
    const without = computeProgress(base);
    const withClaim = computeProgress({ ...(base as object), usedItems: [{ id: 'r1', item: 'ach:b:platinum', date: '2026-11-15' }] } as never);
    expect(withClaim.total - without.total).toBe(ACH_XP.platinum);
    expect(withClaim.events.find((e) => e.key === 'item:r1')?.section).toBe('quests');
  });
});

describe('the Hangar Pass', () => {
  it('fills from the month\'s record XP, not bought or claimed XP', () => {
    const xp = [ev('2026-11-02', 200), ev('2026-11-20', 260), ev('2026-10-30', 999), { ...ev('2026-11-03', 500), key: 'item:x' }];
    const p = passState(xp, '2026-11', '2026-11-21', new Set());
    expect(p.xp).toBe(460);
    expect(p.reached).toBe(Math.floor(460 / PASS_STEP));
    expect(p.into).toBe(460 % PASS_STEP);
    expect(p.tiers).toHaveLength(PASS_TIERS);
    expect(p.open).toBe(true);
  });

  it('stops at the last tier', () => {
    const p = passState([ev('2026-11-02', PASS_STEP * PASS_TIERS * 2)], '2026-11', '2026-11-21', new Set());
    expect(p.reached).toBe(PASS_TIERS);
    expect(p.into).toBe(0);
  });

  it('pays something on every tier, and the most at the end', () => {
    for (let n = 1; n <= PASS_TIERS; n++) expect(Object.values(passGain(n)).some((v) => v !== undefined), String(n)).toBe(true);
    expect(passGain(PASS_TIERS).chests).toEqual(['mythic']);
  });

  it('keeps last month open until this one ends, and only while it has prizes left', () => {
    const xp = [ev('2026-11-20', 400), ev('2026-12-02', 10)];
    const dec = passesNow(xp, '2026-12-05', new Set());
    expect(dec.map((p) => p.month)).toEqual(['2026-12', '2026-11']);
    const claimed = new Set(['pass:2026-11:1', 'pass:2026-11:2']);
    expect(passesNow(xp, '2026-12-05', claimed).map((p) => p.month)).toEqual(['2026-12']);
    expect(passState(xp, '2026-11', '2027-01-02', new Set()).open).toBe(false);
    expect(nextMonth('2026-12')).toBe('2027-01');
  });

  it('reads claim refs from the ledger', () => {
    const tx = (ref: string): Tx => ({ id: ref, type: 'claim', at: '2026-11-15', ref, cost: {}, gain: {} });
    expect([...rewardClaims([tx('ach:a:bronze'), tx('pass:2026-11:1'), tx('body:koi:lv5')])]).toEqual(['ach:a:bronze', 'pass:2026-11:1']);
  });
});

describe('an outfit per body', () => {
  it('saves what the old body wore and puts the new body\'s back on', () => {
    let look = normaliseLoadout({ chassis: 'koi', hat: 'crown', paint: 'gold', title: 'rookie' });
    look = changeLoadout(look, { chassis: 'tanuki' });
    expect(look).toMatchObject({ chassis: 'tanuki', hat: null, paint: null, title: null });
    look = changeLoadout(look, { pet: 'cat', title: 'ronin' });
    look = changeLoadout(look, { chassis: 'koi' });
    expect(look).toMatchObject({ chassis: 'koi', hat: 'crown', paint: 'gold', title: 'rookie', pet: null });
    look = changeLoadout(look, { chassis: 'tanuki' });
    expect(look).toMatchObject({ chassis: 'tanuki', pet: 'cat', title: 'ronin', hat: null });
    look = changeLoadout(look, { chassis: 'drone' });
    expect(look).toMatchObject({ chassis: 'drone', hat: null, pet: null });
  });

  it('lets a patch that changes body and outfit together win, and reads back through JSON', () => {
    const look = changeLoadout(normaliseLoadout({ chassis: 'koi', hat: 'crown' }), { chassis: 'tanuki', hat: 'cap' });
    expect(look.hat).toBe('cap');
    const back = normaliseLoadout(JSON.parse(JSON.stringify(look)));
    expect(back.kits).toEqual(look.kits);
    expect(back.kits?.koi.hat).toBe('crown');
  });
});
