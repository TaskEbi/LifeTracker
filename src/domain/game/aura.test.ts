import { describe, expect, it } from 'vitest';
import { AURA_FX } from '../../features/game/auraFx';
import {
  AURA_AWAY_MS,
  AURA_TIERS,
  AURA_UPGRADES,
  auraById,
  auraCogs,
  auraFoundIn,
  AURAS,
  awayEffOf,
  awayHoursOf,
  binomial,
  buyAuraUpgrade,
  buyIncense,
  chances,
  chargeEvery,
  freshAura,
  INCENSE_ROLLS,
  incenseCost,
  intervalOf,
  luckOf,
  motesPerRoll,
  multiOf,
  normaliseAura,
  pull,
  QUEUE_MAX,
  rollBatch,
  rollOne,
  settleAura,
  showy,
  upgradeCost,
  watched,
  wear,
  worksBonus,
  worth,
  type AuraSave,
  type Ctx,
} from './aura';
import { extMult, NO_EXT } from './idle';

/** A repeatable random source. */
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const ctx = (seed = 1, over: Partial<Ctx> = {}): Ctx => ({ ext: NO_EXT, day: '2026-11-14', rng: seeded(seed), ...over });
const started = (over: Partial<AuraSave> = {}): AuraSave => ({ ...freshAura(0), rolls: 1, ...over });

describe('the auras', () => {
  it('are listed commonest first, each with a look, and no two alike', () => {
    expect(AURAS.length).toBe(30);
    for (let i = 1; i < AURAS.length; i++) expect(AURAS[i].odds).toBeGreaterThan(AURAS[i - 1].odds);
    expect(new Set(AURAS.map((a) => a.id)).size).toBe(AURAS.length);
    expect(new Set(AURAS.map((a) => a.name)).size).toBe(AURAS.length);
    for (const a of AURAS) expect(AURA_FX[a.id]?.length, a.id).toBeGreaterThan(0);
    expect(Object.keys(AURA_FX).sort()).toEqual(AURAS.map((a) => a.id).sort());
    expect(AURA_TIERS.map((_, t) => AURAS.filter((a) => a.tier === t).length)).toEqual([6, 4, 5, 5, 5, 5]);
  });

  it('are worth more motes the rarer they are', () => {
    expect(worth(auraById('dust')!)).toBe(1);
    expect(worth(auraById('sakura')!)).toBe(32);
    expect(worth(auraById('lastbolt')!)).toBe(31623);
  });
});

describe('luck', () => {
  it('gives each aura luck ÷ odds, from the rarest down, and the commonest the rest', () => {
    const p = chances(1);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(p[AURAS.length - 1]).toBeCloseTo(1e-9, 15);
    // Steam is 1 in 4 of the rolls nothing rarer took.
    expect(p[1]).toBeGreaterThan(0.17);
    expect(p[1]).toBeLessThan(0.22);
    // At luck 100 nothing commoner than 1 in 125 can turn up.
    const lucky = chances(100);
    expect(lucky.slice(0, 5).every((v) => v === 0)).toBe(true);
    expect(lucky[5]).toBeGreaterThan(0);
    expect(lucky[AURAS.length - 1]).toBeCloseTo(1e-7, 12);
  });

  it('rolls one aura from a random source', () => {
    expect(rollOne(1, () => 0.999)).toBe(0);
    expect(AURAS[rollOne(1, () => 0)].id).toBe('lastbolt');
    // Past the rarest 28, a 0.2 lands on Steam (1 in 4).
    let n = 0;
    expect(AURAS[rollOne(1, () => (++n <= 28 ? 0.9 : 0.2))].id).toBe('steam');
  });

  it('comes from charms, the index and the day', () => {
    const s = started();
    expect(luckOf(s, NO_EXT)).toBe(1);
    expect(luckOf({ ...s, ups: { luck: 2, feed: 1 } }, NO_EXT)).toBeCloseTo(1.12 * 1.12 * 1.1, 10);
    expect(luckOf({ ...s, got: { dust: 3, steam: 1 } }, NO_EXT)).toBeCloseTo(1.04, 10);
    expect(luckOf(s, { sections: 2, streak: 10, level: 5 })).toBeCloseTo(1.3 * 1.1, 10);
  });

  it('counts successes sensibly at every size', () => {
    const rng = seeded(7);
    expect(binomial(0, 0.5, rng)).toBe(0);
    expect(binomial(10, 0, rng)).toBe(0);
    expect(binomial(10, 1, rng)).toBe(10);
    for (const [n, p] of [[40, 0.3], [5000, 0.001], [5000, 0.4], [1e6, 0.9], [1e7, 1e-7]] as const) {
      let sum = 0;
      for (let i = 0; i < 300; i++) {
        const k = binomial(n, p, rng);
        expect(k).toBeGreaterThanOrEqual(0);
        expect(k).toBeLessThanOrEqual(n);
        sum += k;
      }
      const mean = n * p;
      expect(Math.abs(sum / 300 - mean)).toBeLessThan(Math.max(0.35, mean * 0.05));
    }
  });
});

describe('rolling', () => {
  it('counts rolls, motes and what is new, and charges every tenth', () => {
    const s = started({ rolls: 0 });
    const b = rollBatch(s, 25, ctx());
    expect(b.rolls).toBe(25);
    expect(Object.values(b.counts).reduce((a, n) => a + n, 0)).toBe(25);
    expect(b.save.rolls).toBe(25);
    expect(b.save.n).toBe(5);
    expect(b.save.motes).toBe(b.motes);
    expect(b.motes).toBe(Object.entries(b.counts).reduce((m, [id, n]) => m + n * worth(auraById(id)!), 0));
    expect(b.fresh.sort()).toEqual(Object.keys(b.counts).sort());
    expect(b.save.first[b.fresh[0]]).toBe('2026-11-14');
    expect(b.best).toBe([...AURAS].reverse().find((a) => b.counts[a.id])!.id);
    // A second batch finds nothing new among what it already has.
    const again = rollBatch(b.save, 25, ctx(2));
    expect(again.fresh.every((id) => !b.counts[id])).toBe(true);
    expect(chargeEvery({ ...s, ups: { fuse: 5 } })).toBe(5);
  });

  it('rolls a big batch in bulk with the same odds', () => {
    const b = rollBatch(started(), 2_000_000, ctx(3));
    expect(Object.values(b.counts).reduce((a, n) => a + n, 0)).toBe(2_000_000);
    // Steam is 1 in 4 of whatever isn't rarer; charged rolls shift it a little.
    expect(b.counts.steam / 2_000_000).toBeGreaterThan(0.2);
    expect(b.counts.steam / 2_000_000).toBeLessThan(0.3);
    expect(b.counts.sakura).toBeGreaterThan(1500);
    expect(b.counts.sakura).toBeLessThan(3000);
    expect(b.save.n).toBe(0);
  });

  it('pulling by hand is luckier and counted', () => {
    const s = started({ ups: { multi: 2, hand: 3 } });
    const b = pull(s, ctx());
    expect(b.rolls).toBe(3);
    expect(b.save.hand).toBe(3);
    // Hand luck ×5: Steam (1 in 4) is now certain if nothing rarer hits, so Dust can't turn up.
    const many = rollBatch(s, 300, ctx(5), true);
    expect(many.counts.dust).toBeUndefined();
    expect(many.counts.steam).toBeGreaterThan(0);
  });

  it('queues a scene for a rare aura when it is new or still a long shot', () => {
    const maple = auraById('maple')!;
    expect(showy(auraById('sakura')!, true, 1)).toBe(false);
    expect(showy(maple, true, 500)).toBe(true);
    expect(showy(maple, false, 1)).toBe(true);
    expect(showy(maple, false, 3)).toBe(false);
    // A rigged source: every roll lands on the rarest.
    const b = rollBatch(started(), 3, ctx(1, { rng: () => 0 }));
    expect(b.save.queue).toEqual(['lastbolt']);
    expect(b.fresh).toEqual(['lastbolt']);
    expect(watched(b.save, 'lastbolt').queue).toEqual([]);
    // The queue never grows past its limit.
    let s = started();
    let i = AURAS.length;
    for (let k = 0; k < 12; k++) {
      i--;
      const target = i;
      let step = AURAS.length;
      s = rollBatch(s, 1, ctx(1, { rng: () => (--step === target ? 0 : 0.9999999999) })).save;
    }
    expect(s.queue.length).toBe(QUEUE_MAX);
    expect(s.queue[0]).toBe('lastbolt');
  });

  it('burns incense by the roll', () => {
    const s = started({ motes: 1e6 });
    const lit = buyIncense(s, NO_EXT)!;
    expect(lit.incense).toBe(INCENSE_ROLLS);
    expect(lit.motes).toBe(1e6 - incenseCost(s, NO_EXT));
    expect(rollBatch(lit, 50, ctx()).save.incense).toBe(INCENSE_ROLLS - 50);
    expect(rollBatch(lit, 5000, ctx()).save.incense).toBe(0);
    expect(buyIncense(started({ motes: 10 }), NO_EXT)).toBeNull();
    expect(buyIncense({ ...lit, incense: 1900 }, NO_EXT)).toBeNull();
  });
});

describe('time', () => {
  it('does nothing until the dial has been pulled once', () => {
    const { save, batch } = settleAura(freshAura(0), 3_600_000, ctx());
    expect(batch).toBeNull();
    expect(save.rolls).toBe(0);
    expect(save.at).toBe(3_600_000);
  });

  it('rolls at full speed over a short gap and keeps the part-turn', () => {
    const s = started();
    expect(intervalOf(s)).toBe(3);
    const { save, batch, away } = settleAura(s, 10_000, ctx());
    expect(away).toBeNull();
    expect(batch!.rolls).toBe(3);
    expect(save.at).toBe(9_000);
    expect(settleAura(save, 10_500, ctx()).save).toBe(save);
    expect(settleAura({ ...s, ups: { multi: 4 } }, 6_000, ctx()).batch!.rolls).toBe(10);
  });

  it('rolls at the away rate over a long one, up to the cap', () => {
    const s = started();
    expect(awayHoursOf(s)).toBe(8);
    expect(awayEffOf(s)).toBe(0.5);
    const hour = settleAura(s, 3_600_000, ctx());
    expect(hour.away).toMatchObject({ gap: 3600, worked: 3600, capped: false, eff: 0.5, rolls: 600 });
    expect(hour.save.at).toBe(3_600_000);
    expect(hour.save.rolls).toBe(601);
    const day = settleAura(s, 24 * 3_600_000, ctx());
    expect(day.away).toMatchObject({ capped: true, worked: 8 * 3600, rolls: 4800 });
    const better = settleAura({ ...s, ups: { night: 10, sleep: 5, speed: 30, multi: 9 } }, 72 * 3_600_000, ctx());
    expect(better.away!.worked).toBe(48 * 3600);
    expect(better.away!.eff).toBe(1);
    expect(better.away!.rolls).toBe(Math.floor((48 * 3_600_000) / (intervalOf(better.save) * 1000)) * 10);
    expect(settleAura(s, AURA_AWAY_MS, ctx()).away).toBeNull();
  });
});

describe('spending', () => {
  it('buys upgrades with motes, and the bolt feed with bolts', () => {
    const s = started({ motes: 100 });
    expect(upgradeCost(s, 'speed')).toBe(10);
    const a = buyAuraUpgrade(s, 'speed')!;
    expect(a.motes).toBe(90);
    expect(intervalOf(a)).toBeCloseTo(2.7, 10);
    expect(upgradeCost(a, 'speed')).toBe(20);
    expect(buyAuraUpgrade(s, 'multi')).toBeNull();
    expect(multiOf({ ...s, ups: { multi: 9 } })).toBe(10);
    expect(buyAuraUpgrade({ ...s, ups: { multi: 9 }, motes: 1e15 }, 'multi')).toBeNull();
    expect(buyAuraUpgrade(s, 'feed', 99_999)).toBeNull();
    const fed = buyAuraUpgrade(s, 'feed', 100_000)!;
    expect(fed.ups.feed).toBe(1);
    expect(fed.motes).toBe(100);
    for (const u of AURA_UPGRADES) expect(u.cost(u.max - 1)).toBeGreaterThan(u.cost(0));
  });

  it('an average roll leaves more motes with more luck', () => {
    const s = started();
    expect(motesPerRoll(s, 1)).toBeGreaterThan(2);
    expect(motesPerRoll(s, 100)).toBeGreaterThan(motesPerRoll(s, 10));
    expect(motesPerRoll({ ...s, ups: { sieve: 1 } }, 1)).toBeCloseTo(motesPerRoll(s, 1) * 1.15, 10);
  });

  it('wears only what has been rolled', () => {
    const s = started({ got: { moss: 2 } });
    expect(wear(s, 'moss').worn).toBe('moss');
    expect(wear(s, 'lastbolt').worn).toBeNull();
    expect(wear(wear(s, 'moss'), null).worn).toBeNull();
  });
});

describe('the save', () => {
  it('reads back what it wrote and drops what it does not know', () => {
    const b = rollBatch(started({ at: 5, ups: { speed: 3 }, worn: null }), 200, ctx(9));
    const s = wear(b.save, b.best!);
    expect(normaliseAura(JSON.parse(JSON.stringify(s)), 1e12)).toEqual(s);
    const odd = normaliseAura({ at: 5e12, motes: -4, got: { dust: 2, unicorn: 9 }, ups: { speed: 99, wings: 1 }, worn: 'unicorn', queue: ['dust', 'steam', 7], incense: 1e9 }, 1000);
    expect(odd).toMatchObject({ at: 1000, motes: 0, got: { dust: 2 }, ups: { speed: 30 }, worn: null, queue: ['dust'], incense: 2000 });
    expect(normaliseAura(null, 5)).toEqual(freshAura(5));
  });

  it('tells the factory what is in the index', () => {
    expect(auraFoundIn(null)).toEqual([]);
    expect(auraFoundIn({ got: { dust: 2, unicorn: 1, moss: 0, torii: 1 } }).sort()).toEqual(['dust', 'torii']);
    expect(auraCogs(['dust', 'torii'])).toBe(1 + 15);
    expect(auraCogs(AURAS.map((a) => a.id))).toBe(6 * 1 + 4 * 2 + 5 * 4 + 5 * 8 + 5 * 15 + 5 * 30);
    expect(worksBonus(10)).toBeCloseTo(1.1, 10);
    expect(extMult({ ...NO_EXT, aura: worksBonus(10) })).toBeCloseTo(1.1, 10);
    expect(extMult(NO_EXT)).toBe(1);
  });
});
