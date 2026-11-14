import { describe, expect, it } from 'vitest';
import { capsulePool, cosmeticOf, sellable, type Gear, type Title } from './catalog';
import {
  AWAY_MS,
  awayEff,
  awayHours,
  baseRate,
  buyAllUpgrades,
  buyGen,
  buyPerk,
  buyUpgrade,
  CAT_COGS_A_DAY,
  catchCat,
  checkMilestones,
  cogsOf,
  crateCogs,
  extMult,
  FLOORS,
  fmt,
  fmtTime,
  fresh,
  FRENZY_MULT,
  GEAR_SKINS,
  genCost,
  GENS,
  heatMult,
  maxBuy,
  MILESTONES,
  NO_EXT,
  normalise,
  normaliseWorksLook,
  openCrate,
  PERKS,
  printsAt,
  printsFree,
  printsWaiting,
  rateNow,
  rebuild,
  ROBOT_GOODS,
  settle,
  tap,
  tapValue,
  UPGRADES,
  upgradesFor,
  waiting,
  WORKS_GOODS,
  type IdleSave,
} from './idle';
import { itemKindName, itemName, walletOf, type Tx } from './wallet';

const T0 = 1_800_000_000_000;
const withBolts = (n: number, extra: Partial<IdleSave> = {}): IdleSave => ({ ...fresh(T0), bolts: n, run: n, life: n, ...extra });

describe('the Works: numbers', () => {
  it('formats small, grouped, suffixed and enormous numbers', () => {
    expect(fmt(0)).toBe('0');
    expect(fmt(0.1)).toBe('0.1');
    expect(fmt(999.9)).toBe('999');
    expect(fmt(12_345)).toBe('12,345');
    expect(fmt(1_500_000)).toBe('1.50M');
    expect(fmt(23_400_000_000)).toBe('23.4B');
    expect(fmt(1e36)).toBe('1.00e36');
    expect(fmtTime(45)).toBe('45 s');
    expect(fmtTime(3725)).toBe('1 h 2 m');
    expect(fmtTime(7200)).toBe('2 h');
  });

  it('has unique ids everywhere, and prices that rise', () => {
    for (const list of [GENS, UPGRADES, PERKS, MILESTONES, GEAR_SKINS, FLOORS]) expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
    expect(new Set(WORKS_GOODS.map((g) => g.item)).size).toBe(WORKS_GOODS.length);
    for (let i = 1; i < GENS.length; i++) {
      expect(GENS[i].cost).toBeGreaterThan(GENS[i - 1].cost);
      expect(GENS[i].rate).toBeGreaterThan(GENS[i - 1].rate);
      // After the starter mouse, a dearer machine is worse value per bolt at first, so the early ones stay worth buying.
      if (i > 1) expect(GENS[i].cost / GENS[i].rate).toBeGreaterThan(GENS[i - 1].cost / GENS[i - 1].rate);
    }
  });
});

describe('the Works: turning and buying', () => {
  it('a turn makes one bolt at first, more with heat, ten times on a perfect turn', () => {
    const s = fresh(T0);
    const plain = tap(s, T0, NO_EXT, 0, 0.99);
    expect(plain.gain).toBe(1);
    expect(plain.crit).toBe(false);
    expect(plain.save).toMatchObject({ bolts: 1, run: 1, life: 1, taps: 1, crits: 0 });
    expect(tap(s, T0, NO_EXT, 0, 0.01)).toMatchObject({ gain: 10, crit: true });
    expect(heatMult(0)).toBe(1);
    expect(heatMult(60)).toBe(2);
    expect(heatMult(100)).toBe(3);
    expect(tap(s, T0, NO_EXT, 100, 0.99).save.hot).toBe(true);
  });

  it('machines cost 15% more each, in bulk too, and Max buys exactly what the bolts cover', () => {
    const s = withBolts(1000);
    expect(genCost(s, 'mouse')).toBe(15);
    const one = buyGen(s, 'mouse')!;
    expect(one.bolts).toBe(985);
    expect(genCost(one, 'mouse')).toBe(Math.ceil(15 * 1.15));
    const ten = genCost(s, 'mouse', 10);
    let step = s;
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += genCost(step, 'mouse');
      step = buyGen(step, 'mouse')!;
    }
    expect(Math.abs(ten - sum)).toBeLessThanOrEqual(10);
    const n = maxBuy(s, 'mouse');
    expect(genCost(s, 'mouse', n)).toBeLessThanOrEqual(1000);
    expect(genCost(s, 'mouse', n + 1)).toBeGreaterThan(1000);
    expect(buyGen(withBolts(14), 'mouse')).toBeNull();
    expect(buyGen(s, 'nope')).toBeNull();
    expect(maxBuy(withBolts(0), 'mouse')).toBe(0);
  });

  it('upgrades appear when earned, double what they say, and can be bought together', () => {
    let s = withBolts(1e6, { gens: { mouse: 10 } });
    const before = rateNow(s, NO_EXT, T0);
    expect(before).toBeCloseTo(1);
    expect(upgradesFor(s).map((u) => u.id)).toContain('g:mouse:0');
    expect(upgradesFor(s).map((u) => u.id)).not.toContain('g:mouse:1');
    s = buyUpgrade(s, 'g:mouse:0')!;
    expect(rateNow(s, NO_EXT, T0)).toBeCloseTo(2);
    expect(buyUpgrade(s, 'g:mouse:0')).toBeNull();
    expect(buyUpgrade(s, 'g:mouse:1')).toBeNull();
    const tapped = withBolts(1e6, { taps: 60 });
    const all = buyAllUpgrades(tapped);
    expect(all.n).toBeGreaterThanOrEqual(2);
    expect(tapValue(all.save, NO_EXT, T0)).toBeGreaterThanOrEqual(4);
    expect(all.save.bolts).toBeLessThan(1e6);
  });

  it('what you logged today, your streak and your level all speed it up', () => {
    const s = withBolts(0, { gens: { tanuki: 10 } });
    expect(baseRate(s, NO_EXT)).toBeCloseTo(10);
    expect(extMult({ sections: 2, streak: 10, level: 11 })).toBeCloseTo(1.3 * 1.1 * 1.1);
    expect(extMult({ sections: 99, streak: 999, level: 1 })).toBeCloseTo(1.9 * 1.5);
    expect(baseRate(s, { sections: 2, streak: 0, level: 1 })).toBeCloseTo(13);
  });
});

describe('the Works: time', () => {
  const s = withBolts(0, { gens: { tanuki: 10 } });

  it('pays a short gap in full', () => {
    const { save, away } = settle(s, T0 + 30_000, NO_EXT);
    expect(away).toBeNull();
    expect(save.bolts).toBeCloseTo(300);
    expect(save.life).toBeCloseTo(300);
    expect(save.at).toBe(T0 + 30_000);
    expect(save.best).toBeCloseTo(10);
  });

  it('pays a long gap at half speed, up to four hours, and says so', () => {
    const hour = settle(s, T0 + 3_600_000, NO_EXT);
    expect(hour.away).toMatchObject({ capped: false, eff: 0.5 });
    expect(hour.save.bolts).toBeCloseTo(10 * 0.5 * 3600);
    const day = settle(s, T0 + 86_400_000, NO_EXT);
    expect(day.away).toMatchObject({ capped: true, worked: 4 * 3600 });
    expect(day.save.bolts).toBeCloseTo(10 * 0.5 * 4 * 3600);
    expect(waiting(s, T0 + 3_600_000, NO_EXT)).toBeCloseTo(18_000);
    expect(settle(s, T0 + AWAY_MS + 1, NO_EXT).away).not.toBeNull();
  });

  it('never goes backwards when the clock does', () => {
    const { save, away } = settle(s, T0 - 5000, NO_EXT);
    expect(away).toBeNull();
    expect(save.bolts).toBe(0);
    expect(save.at).toBe(T0 - 5000);
    expect(settle(s, T0, NO_EXT).save).toBe(s);
  });

  it('perks make the crew work longer and harder', () => {
    const p = { ...s, perks: { night: 2, crew: 3 } };
    expect(awayHours(p)).toBe(8);
    expect(awayEff(p)).toBeCloseTo(0.8);
    expect(settle(p, T0 + 86_400_000, NO_EXT).save.bolts).toBeCloseTo(10 * 0.8 * 8 * 3600);
  });

  it('a frenzy pays seven times only while it lasts', () => {
    const f = { ...s, boost: { k: 'frenzy' as const, until: T0 + 10_000 } };
    expect(rateNow(f, NO_EXT, T0)).toBeCloseTo(10 * FRENZY_MULT);
    const { save } = settle(f, T0 + 20_000, NO_EXT);
    expect(save.bolts).toBeCloseTo(10 * 7 * 10 + 10 * 10);
    expect(save.boost).toBeNull();
  });
});

describe('the Works: rebuilding', () => {
  it('draws blueprints from lifetime bolts, keeps perks and cogs, and clears the floor', () => {
    expect(printsAt(999_999)).toBe(0);
    expect(printsAt(1e6)).toBe(1);
    expect(printsAt(1e9)).toBeGreaterThanOrEqual(9);
    expect(rebuild(withBolts(5000), T0)).toBeNull();
    const s = withBolts(8e6, { gens: { mouse: 30 }, ups: ['g:mouse:0'], cogs: 4, perks: { head: 0 } });
    expect(printsWaiting(s)).toBe(2);
    const r = rebuild(s, T0)!;
    expect(r).toMatchObject({ bolts: 0, run: 0, gens: {}, ups: [], printsAll: 2, rebuilds: 1, cogs: 9, life: 8e6 });
    expect(printsWaiting(r)).toBe(0);
    // Two blueprints: +10% on everything.
    expect(baseRate({ ...r, gens: { tanuki: 10 } }, NO_EXT)).toBeCloseTo(11);
  });

  it('perks cost blueprints, stop at their limit and survive a rebuild', () => {
    let s = withBolts(27e6, { printsAll: 3 });
    expect(printsFree(s)).toBe(3);
    s = buyPerk(s, 'head')!;
    s = buyPerk(s, 'head')!;
    expect(printsFree(s)).toBe(0);
    expect(buyPerk(s, 'bulk')).toBeNull();
    expect(buyPerk(s, 'nope')).toBeNull();
    const again = rebuild({ ...s, life: 64e6 }, T0)!;
    expect(again.perks.head).toBe(2);
    expect(again.bolts).toBe(10_000);
    const full = { ...s, printsAll: 1e6, perks: { crew: 5 } };
    expect(buyPerk(full, 'crew')).toBeNull();
    expect(genCost({ ...s, perks: { bulk: 10 } }, 'mouse')).toBe(Math.ceil(15 * 0.7));
  });
});

describe('the Works: gold cogs', () => {
  it('the cat pays a prize, and a cog until the day’s ten are gone', () => {
    const s = withBolts(1000, { gens: { tanuki: 10 } });
    const koban = catchCat(s, T0, NO_EXT, '2026-11-14', 0.1);
    expect(koban.prize.kind).toBe('koban');
    expect(koban.save.bolts).toBeGreaterThan(1000);
    expect(koban.save).toMatchObject({ cats: 1, cogs: 1, catDay: '2026-11-14', catCogs: 1 });
    expect(catchCat(s, T0, NO_EXT, '2026-11-14', 0.6).save.boost).toEqual({ k: 'frenzy', until: T0 + 45_000 });
    expect(catchCat(s, T0, NO_EXT, '2026-11-14', 0.9).save.boost?.k).toBe('fever');
    const spent = { ...s, catDay: '2026-11-14', catCogs: CAT_COGS_A_DAY, cogs: 10 };
    expect(catchCat(spent, T0, NO_EXT, '2026-11-14', 0.1)).toMatchObject({ cog: false, save: { cogs: 10 } });
    expect(catchCat(spent, T0, NO_EXT, '2026-11-15', 0.1)).toMatchObject({ cog: true, save: { cogs: 11, catCogs: 1 } });
  });

  it('the crate opens once a day and doubles when something was logged', () => {
    const s = fresh(T0);
    expect(crateCogs(s, NO_EXT)).toBe(5);
    expect(crateCogs(s, { ...NO_EXT, sections: 1 })).toBe(10);
    expect(crateCogs({ ...s, perks: { tooth: 2 } }, NO_EXT)).toBe(9);
    const open = openCrate(s, '2026-11-14', NO_EXT)!;
    expect(open.cogs).toBe(5);
    expect(openCrate(open, '2026-11-14', NO_EXT)).toBeNull();
    expect(openCrate(open, '2026-11-15', NO_EXT)!.cogs).toBe(10);
  });

  it('milestones pay once', () => {
    const s = withBolts(2000, { taps: 150 });
    const { save, reached } = checkMilestones(s);
    expect(reached.map((m) => m.id).sort()).toEqual(['life:1000', 'taps:100']);
    expect(save.cogs).toBe(2);
    expect(checkMilestones(save).reached).toEqual([]);
    expect(checkMilestones(save).save).toBe(save);
  });

  it('the balance is what was earned less what the ledger says was spent', () => {
    const s = { ...fresh(T0), cogs: 100 };
    const txs = [
      { type: 'works', ref: 'title:boltcounter' },
      { type: 'works', ref: 'wgear:brass' },
      { type: 'buy', ref: 'title:foreman' },
      { type: 'works', ref: 'gone:item' },
    ];
    expect(cogsOf(s, txs)).toBe(100 - 10 - 15);
  });

  it('every robot item at the counter exists, is sold nowhere else, and lands in the wallet', () => {
    const pool = new Set(capsulePool().map((p) => p.item));
    for (const g of ROBOT_GOODS) {
      const c = cosmeticOf(g.item);
      expect(c, g.item).not.toBeNull();
      expect((c!.entry as Gear).works, g.item).toBe(true);
      expect(sellable(c!.entry as Gear & Title), g.item).toBe(false);
      expect(pool.has(g.item), g.item).toBe(false);
      expect(g.price).toBeGreaterThan(0);
    }
    const tx: Tx = { id: 'a', type: 'works', at: '2026-11-14', ref: 'wgear:daruma', cost: {}, gain: { items: ['wgear:daruma'] } };
    const w = walletOf([], [tx]);
    expect(w.items.has('wgear:daruma')).toBe(true);
    expect(w.coins).toBe(0);
    expect(itemName('wgear:daruma')).toBe('Daruma');
    expect(itemKindName('wfloor:forge')).toBe('Works floor');
    expect(itemName('title:foreman')).toBe('Shop Foreman');
  });

  it('a look you do not own falls back to the free one', () => {
    const none = new Set<string>();
    expect(normaliseWorksLook({ gear: 'moon', floor: 'orbit' }, none)).toEqual({ gear: 'steel', floor: 'shed' });
    expect(normaliseWorksLook({ gear: 'moon', floor: 'orbit' }, new Set(['wgear:moon']))).toEqual({ gear: 'moon', floor: 'shed' });
    expect(normaliseWorksLook(null, none)).toEqual({ gear: 'steel', floor: 'shed' });
  });
});

describe('the Works: reading a save back', () => {
  it('starts new from nothing and survives rubbish', () => {
    expect(normalise(undefined, T0)).toEqual(fresh(T0));
    const s = normalise({ at: T0 + 999_999, bolts: -5, life: 'lots', gens: { mouse: 3.7, ghost: 9, tanuki: -1 }, ups: ['g:mouse:0', 'g:mouse:0', 'nope', 7], perks: { crew: 99, nope: 1 }, done: ['hot', 'nope'], boost: { k: 'party', until: 5 } }, T0);
    expect(s).toMatchObject({ at: T0, bolts: 0, life: 0, gens: { mouse: 3 }, ups: ['g:mouse:0'], perks: { crew: 5 }, done: ['hot'], boost: null });
  });

  it('round-trips through JSON', () => {
    const s: IdleSave = { ...withBolts(123.5, { gens: { mouse: 4 }, ups: ['tap:0'], perks: { head: 1 }, done: ['hot'], boost: { k: 'fever', until: T0 + 5 } }), hot: true, cogs: 7, crate: '2026-11-14' };
    expect(normalise(JSON.parse(JSON.stringify(s)), T0)).toEqual(s);
  });
});
