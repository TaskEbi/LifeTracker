import { describe, expect, it } from 'vitest';
import {
  ASCS,
  autoOn,
  autoStep,
  bang,
  BODIES,
  altitude,
  ALTITUDE,
  autoOpen,
  bodyCost,
  buyEveryRungUp,
  buyRungUp,
  buyTree,
  climb,
  coresEarned,
  coresHeld,
  echo,
  LADDER_FROM,
  LADDER_TO,
  peakMult,
  rungAutoOpen,
  rungGain,
  rungMult,
  rungNeed,
  rungOf,
  RUNGS,
  rungUpCost,
  topLayer,
  TREE,
  bountyHave,
  bountyKind,
  buyAllBodies,
  buyOrr,
  catchStar,
  claimBounty,
  claimDaily,
  dailyPay,
  fillBoard,
  FRENZY,
  LABS,
  makeBounty,
  ORRERY,
  RUSH,
  starGap,
  startLab,
  stopLab,
  SWAP_MS,
  swapBounty,
  upCost,
  buyAsc,
  buyBody,
  buyNode,
  buyRelic,
  buyUp,
  CHALLENGES,
  chalGoal,
  check,
  collapse,
  darkGain,
  dustMult,
  dustParts,
  enterChal,
  eonGain,
  FEATS,
  freshCosmos,
  galGain,
  ignite,
  layerSeen,
  leaveChal,
  lightGain,
  maxBody,
  mergeCosmos,
  MILES,
  NEED,
  NODES,
  normaliseCosmos,
  orbitRate,
  rateNow,
  RELICS,
  relicSlots,
  resoSteps,
  settle,
  tap,
  tapValue,
  transcend,
  UPS,
  VOIDS,
  wearRelic,
  rankMult,
  KEYS,
  keyMet,
  giftLv,
  giftNext,
  rankOf,
  renownXp,
  renownParts,
  rankNeed,
  labSlots,
  masteryOf,
  masteryMult,
  masteryTotal,
  resoGap,
  needTranscend,
  eclipseNext,
  orrMax,
  frenzyMult,
  type CosmosSave,
} from './cosmos';
import { mergeSave, sameData } from './saves';

const T0 = Date.UTC(2026, 10, 15);
const ext = { sections: 0, streak: 0, level: 0 };
const base = (over: Partial<CosmosSave> = {}): CosmosSave => ({ ...freshCosmos(T0), ...over });

describe('the Cosmos: dust', () => {
  it('a tap gathers one dust at the start, and a bright tap ten', () => {
    const s = base();
    expect(tapValue(s, ext, T0)).toBe(1);
    const plain = tap(s, T0, ext, 0.99);
    expect(plain.save.dust).toBe(1);
    expect(plain.save.taps).toBe(1);
    expect(plain.crit).toBe(false);
    const bright = tap(s, T0, ext, 0);
    expect(bright.gain).toBe(10);
    expect(bright.save.crits).toBe(1);
  });

  it('bodies cost more each time, and buying the most you can never overspends', () => {
    let s = base({ dust: 1e6 });
    expect(bodyCost(s, 'net')).toBe(10);
    const n = maxBody(s, 'net');
    expect(n).toBeGreaterThan(10);
    expect(bodyCost(s, 'net', n)).toBeLessThanOrEqual(s.dust);
    expect(bodyCost(s, 'net', n + 1)).toBeGreaterThan(s.dust);
    s = buyBody(s, 'net', n)!;
    expect(s.gens.net).toBe(n);
    expect(buyBody(s, 'net', 1e6)).toBeNull();
    expect(bodyCost(s, 'net')).toBeGreaterThan(10);
  });

  it('orbit pays over time, and resonance doubles a body at 10, 25, 50 and every 50 after', () => {
    expect([9, 10, 24, 25, 49, 50, 99, 100, 150].map((n) => resoSteps(n))).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 5]);
    // Fold's gift shortens the gap, and never makes it worse.
    for (const n of [25, 40, 50, 75, 100, 333]) expect(resoSteps(n, 40)).toBeGreaterThanOrEqual(resoSteps(n));
    const s = base({ gens: { net: 10 } });
    expect(orbitRate(s, ext, T0)).toBeCloseTo(10 * 0.2 * 2);
    const { save, away } = settle(s, T0 + 10_000, ext);
    expect(away).toBeNull();
    expect(save.dust).toBeCloseTo(40);
    expect(save.runDust).toBeCloseTo(40);
    expect(save.life).toBeCloseTo(40);
  });

  it('time away pays 60% speed, up to ten hours, and says so', () => {
    const s = base({ gens: { net: 10 } });
    const { save, away } = settle(s, T0 + 20 * 3600_000, ext);
    expect(away).not.toBeNull();
    expect(away!.capped).toBe(true);
    expect(away!.worked).toBe(10 * 3600);
    expect(away!.eff).toBe(0.6);
    expect(save.dust).toBeCloseTo(4 * 0.6 * 10 * 3600);
  });

  it('real life makes more dust', () => {
    const s = base({ gens: { net: 10 } });
    const busy = { sections: 2, streak: 10, level: 20 };
    expect(orbitRate(s, busy, T0) / orbitRate(s, ext, T0)).toBeCloseTo(1.3 * 1.1 * 1.2);
  });

  it('the parts shown in the log multiply to the whole', () => {
    const s = base({ dust: 1e8, ups: { lens: 3, hoard: 2 }, lightRun: 99, nodes: ['polaris'], voids: { density: 2 }, darkRun: 15, galRun: 8, eonAll: 9, done: ['life3', 'tap100'] });
    const product = dustParts(s, ext, T0).reduce((m, p) => m * p.mult, 1);
    expect(dustMult(s, ext, T0) / product).toBeCloseTo(1);
    expect(product).toBeGreaterThan(1000);
  });
});

describe('the Cosmos: starting again', () => {
  const ripe = (over: Partial<CosmosSave> = {}) => base({ dust: 5e9, runDust: 4e9, gens: { net: 30 }, ups: { focus: 3 }, ...over });

  it('Ignite needs a billion dust in the run, pays starlight and keeps the constellation', () => {
    expect(lightGain(base({ runDust: 9.9e8 }))).toBe(0);
    expect(ignite(base({ runDust: 9.9e8 }), T0)).toBeNull();
    const s = ripe({ light: 1, lightRun: 1, lightAll: 1, nodes: ['polaris'] });
    const gain = lightGain(s);
    expect(gain).toBeGreaterThanOrEqual(1);
    const after = ignite(s, T0 + 5)!;
    expect(after.light).toBe(1 + gain);
    expect(after.lightAll).toBe(1 + gain);
    expect(after.dust).toBe(0);
    expect(after.runDust).toBe(0);
    expect(after.gens).toEqual({});
    expect(after.ups).toEqual({});
    expect(after.nodes).toEqual(['polaris']);
    expect(after.ignites).toBe(1);
    expect(after.ignitesAll).toBe(1);
    expect(after.life).toBe(s.life);
  });

  it('the constellation is bought in order, and its stars do what they say', () => {
    const s = base({ light: 5 });
    expect(buyNode(s, 'kindle')).toBeNull();
    const a = buyNode(s, 'polaris')!;
    expect(a.light).toBe(4);
    expect(dustMult(a, ext, T0) / dustMult(s, ext, T0)).toBeCloseTo(3);
    const b = buyNode(a, 'kindle')!;
    expect(tapValue(b, ext, T0) / tapValue(a, ext, T0)).toBeCloseTo(5);
    expect(buyNode(b, 'kindle')).toBeNull();
    // Every star can be reached from Polaris.
    let all = base({ light: 1e300 });
    for (let pass = 0; pass < NODES.length; pass++) for (const n of NODES) all = buyNode(all, n.id) ?? all;
    expect(all.nodes.length).toBe(NODES.length);
  });

  it('Collapse takes the starlight and the constellation, and keeps what dark matter bought', () => {
    const s = ripe({ light: 5e11, lightRun: 2e11, lightAll: 2e11, nodes: ['polaris', 'kindle'], ignites: 9, ignitesAll: 9 });
    expect(darkGain(base({ lightRun: NEED.collapse / 2 }))).toBe(0);
    const gain = darkGain(s);
    expect(gain).toBeGreaterThanOrEqual(1);
    const after = collapse(s, T0)!;
    expect(after.dark).toBe(gain);
    expect(after.light).toBe(0);
    expect(after.lightRun).toBe(0);
    expect(after.nodes).toEqual([]);
    expect(after.ignites).toBe(0);
    expect(after.ignitesAll).toBe(9);
    expect(after.collapsesAll).toBe(1);
    // From the fifth Collapse the constellation stays.
    expect(collapse({ ...s, collapsesAll: 4 }, T0)!.nodes).toEqual(['polaris', 'kindle']);
  });

  it('the Big Bang takes dark matter and void upgrades; Transcend takes galaxies; relics and ascensions stay', () => {
    const s = ripe({ dark: 1e15, darkRun: 4e14, darkAll: 4e14, voids: { density: 5 }, collapses: 3, collapsesAll: 30, relics: { mirror: 2 }, worn: ['mirror'], chals: { thin: 2 }, chal: null });
    const g = galGain(s);
    expect(g).toBeGreaterThanOrEqual(1);
    const b = bang(s, T0)!;
    expect(b.gal).toBe(g);
    expect(b.dark).toBe(0);
    expect(b.voids).toEqual({});
    expect(b.relics).toEqual({ mirror: 2 });
    expect(b.chals).toEqual({ thin: 2 });
    expect(b.bangsAll).toBe(1);
    const far = { ...b, gal: 3e4, galRun: 3e3, galAll: 3e3, asc: { swift: 1 } };
    expect(eonGain({ ...far, galRun: 2999 })).toBe(0);
    expect(eonGain(far)).toBe(1);
    expect(eonGain({ ...far, galRun: 3e5 })).toBe(3);
    const t = transcend(far, T0)!;
    expect(t.eon).toBe(1);
    expect(t.gal).toBe(0);
    expect(t.galRun).toBe(0);
    expect(t.relics).toEqual({ mirror: 2 });
    expect(t.worn).toEqual(['mirror']);
    expect(t.asc).toEqual({ swift: 1 });
    expect(t.transcends).toBe(1);
    // The next Transcend needs 1.6 times the galaxies.
    expect(eonGain({ ...t, galRun: 4.7e3 })).toBe(0);
    expect(eonGain({ ...t, galRun: 4.8e3 })).toBe(1);
    // Memory keeps the void upgrades through a Big Bang.
    expect(bang({ ...s, asc: { memory: 1 } }, T0)!.voids).toEqual({ density: 5 });
  });

  it('rooms open as you get near them', () => {
    expect(layerSeen(base(), 1)).toBe(false);
    expect(layerSeen(base({ life: 2e6 }), 1)).toBe(true);
    expect(layerSeen(base({ life: 2e6 }), 2)).toBe(false);
    expect(layerSeen(base({ collapsesAll: 1 }), 1)).toBe(true);
    expect(layerSeen(base({ galAll: 60 }), 4)).toBe(true);
  });
});

describe('the Cosmos: things to work on', () => {
  it('upgrades have levels, prices that climb, and a top', () => {
    let s = base({ dust: 1e12 });
    const focus = UPS.find((u) => u.id === 'focus')!;
    s = buyUp(s, 'focus')!;
    expect(s.dust).toBe(1e12 - focus.cost);
    expect(tapValue(s, ext, T0)).toBe(2);
    const spark = UPS.find((u) => u.id === 'spark')!;
    let t = base({ dust: 1e300 });
    for (let i = 0; i < spark.max; i++) t = buyUp(t, 'spark')!;
    expect(buyUp(t, 'spark')).toBeNull();
    for (const list of [UPS, VOIDS, ASCS]) for (const u of list) expect(u.max).toBeGreaterThan(0);
  });

  it('a challenge is a Collapse that pays nothing; its goal gives a tier for good', () => {
    const s = base({ collapsesAll: 2, light: 50, lightRun: 50, nodes: ['polaris'], dust: 100, gens: { net: 3 } });
    expect(enterChal(base(), 'hands', T0)).toBeNull();
    const c = enterChal(s, 'hands', T0)!;
    expect(c.chal).toBe('hands');
    expect(c.light).toBe(0);
    expect(c.nodes).toEqual([]);
    expect(c.dark).toBe(0);
    expect(tapValue(c, ext, T0)).toBe(0);
    expect(enterChal(c, 'thin', T0)).toBeNull();
    // No Collapse, Big Bang or Transcend from inside one.
    expect(darkGain({ ...c, lightRun: 1e20 })).toBe(0);
    const hands = CHALLENGES.find((x) => x.id === 'hands')!;
    const won = check({ ...c, runDust: chalGoal(hands, 0) });
    expect(won.won?.tier).toBe(1);
    expect(won.save.chal).toBeNull();
    expect(won.save.chals).toEqual({ hands: 1 });
    expect(chalGoal(hands, 1)).toBeGreaterThan(chalGoal(hands, 0));
    // The reward: bodies ×2.
    const body = base({ gens: { net: 1 } });
    expect(orbitRate({ ...body, chals: { hands: 1 } }, ext, T0) / orbitRate(body, ext, T0)).toBeCloseTo(2);
    expect(leaveChal(c)!.chal).toBeNull();
    expect(leaveChal(s)).toBeNull();
  });

  it('each handicap really is one', () => {
    const s = base({ gens: { net: 50, comet: 50, mill: 20, moon: 20, ring: 5 }, nodes: ['polaris'], lightRun: 100, dust: 1e9 });
    const free = orbitRate(s, ext, T0 + 60_000);
    expect(orbitRate({ ...s, chal: 'thin' }, ext, T0 + 60_000)).toBeLessThan(free);
    expect(orbitRate({ ...s, chal: 'dim' }, ext, T0 + 60_000)).toBeLessThan(free);
    expect(orbitRate({ ...s, chal: 'decay' }, ext, T0 + 60_000)).toBeLessThan(free * 0.5);
    expect(bodyCost({ ...s, chal: 'steep' }, 'net')).toBeGreaterThan(bodyCost(s, 'net'));
    expect(maxBody({ ...s, chal: 'lone' }, 'ring')).toBe(0);
    expect(maxBody(s, 'ring')).toBeGreaterThan(0);
  });

  it('relics are kept, but only do anything while worn, and only so many fit', () => {
    let s = base({ gal: 1e9, gens: { net: 1 } });
    expect(relicSlots(s)).toBe(2);
    s = buyRelic(s, 'mirror')!;
    s = buyRelic(s, 'chart')!;
    s = buyRelic(s, 'glass')!;
    expect(s.worn).toEqual(['mirror', 'chart']);
    expect(wearRelic(s, 'glass')).toBeNull();
    const bare = wearRelic(s, 'mirror')!;
    expect(orbitRate(s, ext, T0) / orbitRate(bare, ext, T0)).toBeCloseTo(10);
    expect(wearRelic(bare, 'glass')!.worn).toEqual(['chart', 'glass']);
    expect(relicSlots({ ...s, bangsAll: 25, transcends: 2, asc: { wide: 3 } })).toBe(9);
    for (const r of RELICS) expect(r.blurb(1).length).toBeGreaterThan(5);
  });

  it('the Second Sun opens two more bodies', () => {
    const s = base({ dust: 1e300 });
    expect(maxBody(s, 'quasar')).toBe(0);
    const t = buyAsc({ ...s, eon: 1 }, 'twin')!;
    expect(t.eon).toBe(0);
    expect(maxBody(t, 'quasar')).toBeGreaterThan(0);
    expect(BODIES.filter((b) => b.twin).length).toBe(2);
  });

  it('feats are found once and each adds 5% dust', () => {
    const s = base({ life: 2e6, taps: 150 });
    const { save, feats } = check(s);
    expect(feats.map((f) => f.id).sort()).toEqual(['life3', 'life6', 'tap100']);
    expect(check(save).feats).toEqual([]);
    expect(dustMult(save, ext, T0)).toBeCloseTo(1.05 ** 3 * rankMult(save));
    expect(new Set(FEATS.map((f) => f.id)).size).toBe(FEATS.length);
  });

  it('automation is unlocked by milestones, can be switched off, and does what a player would', () => {
    const s = base({ dust: 1e5, ignitesAll: 3 });
    expect(autoOn(base({ dust: 1e5 }), 'bodies')).toBe(false);
    expect(autoStep(base({ dust: 1e5 }), T0)).toEqual(base({ dust: 1e5 }));
    const a = autoStep(s, T0);
    expect(Object.keys(a.gens).length).toBeGreaterThan(0);
    expect(a.ups).toEqual({});
    expect(autoStep({ ...s, auto: { bodies: false } }, T0).gens).toEqual({});
    // Auto-ignite waits until it would double the starlight (or two minutes).
    const ripe = base({ collapsesAll: 1, runDust: 5e9, lightRun: 1000 });
    expect(autoStep(ripe, T0 + 1000).ignitesAll).toBe(0);
    expect(autoStep(ripe, T0 + 121_000).ignitesAll).toBe(1);
    expect(autoStep({ ...ripe, lightRun: 1 }, T0 + 1000).ignitesAll).toBe(1);
    for (const m of MILES) expect(m.at).toBeGreaterThan(0);
  });

  it('nothing ever becomes infinite', () => {
    const huge = base({ dust: 1e300, runDust: 1e300, life: 1e300, lightRun: 1e300, darkRun: 1e300, galRun: 1e300, eonAll: 500, gens: Object.fromEntries(BODIES.map((b) => [b.id, 5000])), ups: { lens: 80, focus: 60 }, voids: { density: 80 }, asc: { bodhi: 1, twin: 1 } });
    for (const v of [rateNow(huge, ext, T0), tapValue(huge, ext, T0, true), lightGain(huge), darkGain(huge), galGain(huge), bodyCost(huge, 'tree', 1000)]) expect(Number.isFinite(v)).toBe(true);
    const after = settle(huge, T0 + 30_000, ext).save;
    expect(Number.isFinite(after.dust)).toBe(true);
    expect(buyAllBodies(base({ dust: 0 }))).toBeNull();
  });
});

describe('the Cosmos: the save', () => {
  it('reads back through JSON unchanged, and throws away what it does not know', () => {
    const s = base({ dust: 5, gens: { net: 3 }, nodes: ['polaris'], relics: { mirror: 2 }, worn: ['mirror'], auto: { bodies: false }, chal: 'thin', done: ['life3'] });
    expect(normaliseCosmos(JSON.parse(JSON.stringify(s)), T0 + 5)).toEqual(s);
    const junk = normaliseCosmos({ dust: -4, gens: { net: 2, nope: 9 }, nodes: ['polaris', 'x', 'polaris'], worn: ['mirror', 'chart'], relics: { chart: 99 }, chal: 'nope', at: T0 + 9e9, done: ['zzz'] }, T0);
    expect(junk.dust).toBe(0);
    expect(junk.gens).toEqual({ net: 2 });
    expect(junk.nodes).toEqual(['polaris']);
    expect(junk.relics).toEqual({ chart: 5 });
    expect(junk.worn).toEqual(['chart']);
    expect(junk.chal).toBeNull();
    expect(junk.at).toBe(T0);
    expect(junk.done).toEqual([]);
    expect(normaliseCosmos(null, T0)).toEqual(freshCosmos(T0));
  });

  it('two devices: nothing kept for good is lost, and the run comes from the copy further along', () => {
    // The phone: three Collapses in, relics and a challenge tier. The PC: an old copy left running, with more dust in hand.
    const phone = base({ collapsesAll: 3, ignitesAll: 40, life: 1e30, dust: 10, dark: 7, voids: { density: 2 }, relics: { mirror: 1 }, worn: ['mirror'], chals: { thin: 1 }, done: ['ig1', 'co1'], asc: { swift: 1 } });
    const pc = base({ at: T0 + 9e6, collapsesAll: 0, ignitesAll: 12, life: 1e20, dust: 1e18, gens: { net: 400 }, relics: { chart: 2 }, chals: { hands: 2 }, done: ['ig1', 'tap100'], taps: 900 });
    const m = mergeCosmos(pc, phone);
    expect(m.dust).toBe(10);
    expect(m.dark).toBe(7);
    expect(m.voids).toEqual({ density: 2 });
    expect(m.gens).toEqual({});
    expect(m.relics).toEqual({ mirror: 1, chart: 2 });
    expect(m.chals).toEqual({ thin: 1, hands: 2 });
    expect(m.asc).toEqual({ swift: 1 });
    expect([...m.done].sort()).toEqual(['co1', 'ig1', 'tap100']);
    expect(m.taps).toBe(900);
    expect(m.life).toBe(1e30);
    expect(sameData(mergeCosmos(phone, pc), m)).toBe(true);
  });

  it('the same run on two devices pools what was bought, and a merge is idempotent', () => {
    const a = base({ ignitesAll: 2, life: 500, gens: { net: 5 }, ups: { focus: 1 }, nodes: ['polaris'] });
    const b = base({ at: T0 + 1, ignitesAll: 2, life: 400, gens: { net: 2, comet: 3 }, ups: { lens: 2 }, nodes: ['polaris', 'kindle'] });
    const m = mergeCosmos(a, b);
    expect(m.gens).toEqual({ net: 5, comet: 3 });
    expect(m.ups).toEqual({ focus: 1, lens: 2 });
    expect(m.nodes).toEqual(['polaris', 'kindle']);
    expect(sameData(mergeCosmos(m, a), m)).toBe(true);
    expect(sameData(mergeCosmos(m, b), m)).toBe(true);
    expect(sameData(mergeCosmos(m, m), m)).toBe(true);
    const row = JSON.parse(JSON.stringify(m));
    expect(sameData(mergeSave('gm_cosmos', row, row), row)).toBe(true);
  });
});

describe('the Cosmos: around the layers', () => {
  it('a shooting star gives one of four gifts, and boosts wear off', () => {
    const s = base({ gens: { net: 10 } });
    const frenzy = catchStar(s, T0, ext, 0.1);
    expect(frenzy.gift.k).toBe('frenzy');
    expect(frenzy.save.caught).toBe(1);
    expect(orbitRate(frenzy.save, ext, T0 + 1000) / orbitRate(s, ext, T0 + 1000)).toBeCloseTo(FRENZY);
    expect(orbitRate(frenzy.save, ext, T0 + 61_000)).toBeCloseTo(orbitRate(s, ext, T0 + 61_000));
    const wind = catchStar(s, T0, ext, 0.5);
    expect(wind.gift.k).toBe('windfall');
    expect(wind.save.dust).toBeCloseTo(rateNow(s, ext, T0) * 180 + 100);
    const rush = catchStar(s, T0, ext, 0.8);
    expect(rush.gift.k).toBe('rush');
    expect(tapValue(rush.save, ext, T0 + 1000) / tapValue(s, ext, T0 + 1000)).toBeCloseTo(RUSH);
    const shard = catchStar(s, T0, ext, 0.95);
    expect(shard.gift.k).toBe('shard');
    expect(shard.save.shards).toBe(1);
    // Both at once is a feat.
    const both = catchStar(frenzy.save, T0 + 5000, ext, 0.8).save;
    expect(check(both).feats.map((f) => f.id)).toContain('both');
    // More often with the Lodestone and Comet Rain.
    expect(starGap(base({ orr: { lode: 2 }, asc: { rain: 1 } }))).toBeLessThan(starGap(s) / 2);
  });

  it('the Orrery is bought with shards and nothing resets it', () => {
    const s = base({ shards: 10, shardsAll: 10, gens: { net: 1 } });
    const a = buyOrr(s, 'gears')!;
    expect(a.shards).toBe(10 - ORRERY.find((u) => u.id === 'gears')!.cost);
    expect(orbitRate(a, ext, T0) / orbitRate(s, ext, T0)).toBeCloseTo(1.35);
    expect(buyOrr(base(), 'gears')).toBeNull();
    const t = transcend({ ...a, gal: 1e9, galRun: 1e6 }, T0)!;
    expect(t.transcends).toBe(1);
    expect(t.orr).toEqual({ gears: 1 });
    expect(t.shards).toBe(a.shards);
    // Keepsake keeps the dust upgrades through an Ignite, but not without it.
    const kept = ignite(base({ runDust: 5e9, ups: { focus: 3 }, orr: { keep: 1 } }), T0)!;
    expect(kept.ups).toEqual({ focus: 3 });
    expect(ignite(base({ runDust: 5e9, ups: { focus: 3 } }), T0)!.ups).toEqual({});
  });

  it('research costs its price, runs in real time (even while away) and pays shards', () => {
    const s = base({ ignitesAll: 1, dust: 1e6 });
    expect(startLab(base({ dust: 1e6 }), 'r_nets', T0)).toBeNull();
    const a = startLab(s, 'r_nets', T0)!;
    expect(a.dust).toBe(1e6 - 1e5);
    expect(a.lab).toEqual([{ id: 'r_nets', end: T0 + 5 * 60_000 }]);
    // One at a time, and what comes after waits for it.
    expect(startLab(a, 'r_tap', T0)).toBeNull();
    expect(startLab({ ...a, lab: [] }, 'r_mill', T0)).toBeNull();
    expect(stopLab(a, 'r_nets')!.dust).toBe(1e6);
    const mid = settle({ ...a, gens: { net: 10 } }, T0 + 60_000, ext).save;
    expect(mid.labs).toEqual([]);
    const { save, away } = settle({ ...a, gens: { net: 10 } }, T0 + 3600_000, ext);
    expect(save.labs).toEqual(['r_nets']);
    expect(save.lab).toEqual([]);
    expect(save.shards).toBe(1);
    expect(away!.labs).toEqual(['r_nets']);
    const noLab = { ...save, labs: [] };
    expect(orbitRate(save, ext, T0) / rankMult(save) / (orbitRate(noLab, ext, T0) / rankMult(noLab))).toBeCloseTo(2);
    // Faster with the Clockwork; two at once with Twin Scopes.
    const quick = startLab({ ...s, orr: { clock: 5, scope: 1 } }, 'r_nets', T0)!;
    expect(quick.lab[0].end).toBe(T0 + 2.5 * 60_000);
    expect(startLab({ ...quick, dust: 1e7 }, 'r_tap', T0)!.lab.length).toBe(2);
    for (const r of LABS) expect(r.after === undefined || LABS.some((x) => x.id === r.after)).toBe(true);
  });

  it('bounties fill the board, count from when they were posted, and pay shards when claimed', () => {
    const s = fillBoard(base({ taps: 50, bought: 7 }), 10);
    expect(s.bounties.length).toBe(3);
    expect(new Set(s.bounties.map((b) => b.k)).size).toBe(3);
    expect(s.bountyN).toBe(3);
    // Only the kinds that make sense yet.
    expect(s.bounties.every((b) => ['taps', 'crits', 'bodies', 'dust', 'stars'].includes(b.k))).toBe(true);
    const b = s.bounties[0];
    expect(bountyHave(s, b)).toBe(0);
    expect(claimBounty(s, b.n, 10)).toBeNull();
    const done = { ...s, taps: s.taps + 1e6, crits: 1e6, bought: 1e6, life: 1e300, caught: 100 };
    expect(bountyHave(done, b)).toBe(b.need);
    const c = claimBounty(done, b.n, 10)!;
    expect(c.shards).toBe(b.pay);
    expect(c.bountiesDone).toBe(1);
    expect(c.bounties.length).toBe(3);
    expect(c.bounties.some((x) => x.n === b.n)).toBe(false);
    expect(bountyKind(b.k)!.ask(b.need).length).toBeGreaterThan(5);
    // Swapping: once every ten minutes.
    const sw = swapBounty(s, b.n, T0 + SWAP_MS, 10)!;
    expect(sw.bounties.some((x) => x.n === b.n)).toBe(false);
    expect(swapBounty(sw, sw.bounties[0].n, T0 + SWAP_MS + 1000, 10)).toBeNull();
    // The same number always makes the same bounty.
    expect(makeBounty(base(), 42, 10)).toEqual(makeBounty(base(), 42, 10));
  });

  it('the daily alignment pays once a day, more for days in a row', () => {
    const a = claimDaily(base(), '2026-11-15', T0)!;
    expect(a.shards).toBe(dailyPay(1));
    expect(a.boosts.frenzy).toBeGreaterThan(T0);
    expect(claimDaily(a, '2026-11-15', T0)).toBeNull();
    const b = claimDaily(a, '2026-11-16', T0 + 86_400_000)!;
    expect(b.dailyRun).toBe(2);
    expect(b.shards).toBe(dailyPay(1) + dailyPay(2));
    const gap = claimDaily(b, '2026-11-19', T0 + 4 * 86_400_000)!;
    expect(gap.dailyRun).toBe(1);
    expect(claimDaily(b, 'nonsense', T0)).toBeNull();
  });

  it('the new challenges handicap and reward', () => {
    const s = base({ gens: { net: 50 }, dust: 1e9 });
    expect(orbitRate({ ...s, chal: 'frail' }, ext, T0)).toBeCloseTo(orbitRate(s, ext, T0) * 0.01);
    expect(upCost({ ...s, chal: 'cost' }, UPS[0], 0)).toBe(UPS[0].cost * 1e4);
    expect(buyUp({ ...s, dust: 100, chal: 'cost' }, 'focus')).toBeNull();
    expect(orbitRate({ ...s, chals: { cost: 1 } }, ext, T0) / orbitRate(s, ext, T0)).toBeCloseTo(3);
    expect(tapValue({ ...s, chals: { frail: 1 } }, ext, T0) / tapValue(s, ext, T0)).toBeCloseTo(10);
  });

  it('the new parts of the save read back, and merge without losing anything', () => {
    const s = base({ shards: 4, shardsAll: 30, orr: { gears: 2 }, boosts: { frenzy: T0 + 5000 }, caught: 9, bought: 40, lab: [{ id: 'r_tap', end: T0 + 9000 }], labs: ['r_nets'], bounties: [{ n: 3, k: 'taps', need: 100, from: 5, pay: 2 }], bountyN: 3, bountiesDone: 2, swapAt: T0 - 5, daily: '2026-11-14', dailyRun: 2, dailyAll: 5 });
    expect(normaliseCosmos(JSON.parse(JSON.stringify(s)), T0 + 5)).toEqual(s);
    const junk = normaliseCosmos({ lab: [{ id: 'r_nets', end: 5 }, { id: 'nope', end: 5 }], labs: ['r_nets'], bounties: [{ n: 1, k: 'nope' }, 'x'], daily: 'yesterday', orr: { gears: 99 } }, T0);
    expect(junk.lab).toEqual([]);
    expect(junk.bounties).toEqual([]);
    expect(junk.daily).toBe('');
    expect(junk.orr.gears).toBe(ORRERY.find((u) => u.id === 'gears')!.max);
    const phone = { ...s, ignitesAll: 5, labs: ['r_nets', 'r_tap'], lab: [], orr: { gears: 1, lode: 2 }, daily: '2026-11-15', dailyRun: 3 };
    const m = mergeCosmos(s, phone);
    expect([...m.labs].sort()).toEqual(['r_nets', 'r_tap']);
    expect(m.lab).toEqual([]);
    expect(m.orr).toEqual({ gears: 2, lode: 2 });
    expect(m.daily).toBe('2026-11-15');
    expect(m.dailyRun).toBe(3);
    expect(sameData(mergeCosmos(phone, s), m)).toBe(true);
    expect(sameData(mergeCosmos(m, m), m)).toBe(true);
  });
});

describe('the Cosmos: the Ladder and what stays', () => {
  const ladderAt = (top: number, over: Partial<CosmosSave> = {}) =>
    base({ transcends: 5, transRun: 2, ladder: Array.from({ length: top - LADDER_FROM + 1 }, (_, i) => ({ c: 100, run: 100, all: 500, nAll: 3, ups: [], at: T0 - 1000 * (i + 1) })), ...over });

  it('there are 40 layers, every rung named once, each with a key and a gift of its own', () => {
    expect(RUNGS.map((r) => r.n)).toEqual(Array.from({ length: 36 }, (_, i) => i + 5));
    expect(new Set(RUNGS.map((r) => r.verb)).size).toBe(36);
    expect(new Set(RUNGS.map((r) => r.kanji)).size).toBe(36);
    expect(new Set(RUNGS.map((r) => r.gift)).size).toBe(36);
    expect(KEYS.map((k) => k.n)).toEqual(RUNGS.map((r) => r.n));
    expect(new Set(KEYS.map((k) => k.text)).size).toBe(36);
    expect(LADDER_TO).toBe(40);
  });

  it('Unravel needs ten aeons since it was last done, pays threads and starts everything below again', () => {
    const s = base({ transcends: 3, transRun: 3, eon: 9, eonRun: 9, eonAll: 9, gal: 50, galRun: 50, dark: 5, nodes: ['polaris'], relics: { mirror: 1 }, worn: ['mirror'], asc: { twin: 1 } });
    expect(rungGain(s, 5)).toBe(0);
    expect(climb(s, 5, T0)).toBeNull();
    const ripe = { ...s, eon: 40, eonRun: 40, eonAll: 40 };
    const g = rungGain(ripe, 5);
    expect(g).toBeGreaterThanOrEqual(1);
    const a = climb(ripe, 5, T0)!;
    expect(rungOf(a, 5)).toMatchObject({ c: g, run: g, all: g, nAll: 1 });
    expect(a.eon).toBe(0);
    expect(a.eonRun).toBe(0);
    expect(a.transRun).toBe(0);
    expect(a.gal).toBe(0);
    expect(a.dark).toBe(0);
    expect(a.transcends).toBe(3);
    expect(a.eonAll).toBe(40);
    // Kept for good.
    expect(a.relics).toEqual({ mirror: 1 });
    expect(a.asc).toEqual({ twin: 1 });
    expect(a.peaks['5']).toBe(g);
    expect(topLayer(a)).toBe(5);
  });

  it('a higher rung starts the lower rungs again, but not the ones above it', () => {
    const s = ladderAt(8, { eonRun: 50 });
    const r6 = rungOf(s, 6);
    expect(rungGain({ ...s, ladder: s.ladder.map((r, i) => (i === 1 ? { ...r, run: 0 } : r)) }, 7)).toBe(0);
    const ready = { ...s, ladder: s.ladder.map((r, i) => (i === 1 ? { ...r, run: rungNeed(7) * 10 } : r)) };
    const a = climb(ready, 7, T0)!;
    expect(rungOf(a, 5).c).toBe(0);
    expect(rungOf(a, 6).run).toBe(0);
    expect(rungOf(a, 6).nAll).toBe(r6.nAll);
    expect(rungOf(a, 7).nAll).toBe(4);
    expect(rungOf(a, 8)).toEqual(rungOf(s, 8));
  });

  it('rung upgrades are bought with the rung, and do what they say', () => {
    let s = ladderAt(6, { gens: { net: 5 } });
    s = { ...s, ladder: s.ladder.map((r) => ({ ...r, c: 1e12 })) };
    const before = orbitRate(s, ext, T0);
    const a = buyRungUp(s, 6, 0)!;
    expect(rungOf(a, 6).ups[0]).toBe(1);
    expect(rungOf(a, 6).c).toBe(1e12 - rungUpCost(s, 6, 0, 0));
    expect(orbitRate(a, ext, T0) / before).toBeCloseTo(10);
    // Echo on rung 6 makes rung 5 pay more; Focus on rung 5 too.
    const e = buyRungUp(s, 6, 1)!;
    expect(rungMult(e, 5) / rungMult(s, 5)).toBeCloseTo(1.5);
    const f = buyRungUp(s, 5, 3)!;
    expect(rungMult(f, 5) / rungMult(s, 5)).toBeCloseTo(1.25);
    expect(buyRungUp(base(), 5, 0)).toBeNull();
    expect(buyEveryRungUp(s, 5)).not.toBeNull();
  });

  it('a rung done three times pays a share of itself every second; Altitude grows with the highest rung', () => {
    const s = ladderAt(6, { eonRun: 1e6 });
    const g = rungGain(s, 5);
    expect(g).toBeGreaterThan(0);
    const after = settle(s, T0 + 10_000, ext).save;
    expect(rungOf(after, 5).run - rungOf(s, 5).run).toBeCloseTo(g * 0.01 * 10, 0);
    expect(altitude(ladderAt(10))).toBeCloseTo(ALTITUDE ** 6);
    expect(altitude(base())).toBe(1);
  });

  it('automation: Transcend from the first Unravel, each rung from the rung above', () => {
    const s = base({ transcends: 1 });
    expect(autoOpen(s, 'transcend')).toBe(false);
    const u = ladderAt(7);
    expect(autoOpen(u, 'transcend')).toBe(true);
    expect(rungAutoOpen(u, 5)).toBe(true);
    expect(rungAutoOpen(u, 7)).toBe(false);
    const ready = { ...u, ladder: u.ladder.map((r, i) => (i === 0 ? { ...r, run: 0 } : r)), eonRun: 1e4 };
    expect(rungOf(autoStep(ready, T0), 5).nAll).toBe(4);
    expect(rungOf(autoStep({ ...ready, auto: { L5: false } }, T0), 5).nAll).toBe(3);
  });

  it('cores come from what has been done and are never stored; the tree spends them', () => {
    expect(coresEarned(base())).toBe(0);
    const s = base({ ignitesAll: 12, collapsesAll: 1, bangsAll: 1, transcends: 1 });
    // Ignite: 1 for the first, 1 more at 10; Collapse 2; Big Bang 3; Transcend 4.
    expect(coresEarned(s)).toBe(2 + 2 + 3 + 4);
    expect(buyTree(base({ ignitesAll: 5 }), 'root')).toBeNull();
    const a = buyTree(s, 'root')!;
    expect(coresHeld(a)).toBe(coresEarned(s) - 1);
    const g = { ...a, gens: { net: 5 } };
    expect(orbitRate(g, ext, T0) / orbitRate({ ...g, tree: {} }, ext, T0)).toBeCloseTo(1000);
    let all = { ...s, transcends: 1e6, ignitesAll: 1e6 };
    for (let i = 0; i < 100; i++) for (const u of TREE) all = buyTree(all, u.id) ?? all;
    expect(coresHeld(all)).toBeGreaterThanOrEqual(0);
  });

  it('Echoes and Peaks only count from the first Transcend, then multiply', () => {
    const early = base({ ignitesAll: 1000, peaks: { '1': 1e6 } });
    expect(echo(early, 1)).toBe(1);
    expect(dustMult(early, ext, T0)).toBeCloseTo(dustMult({ ...early, peaks: {} }, ext, T0));
    const late = { ...early, transcends: 1 };
    expect(echo(late, 1)).toBeCloseTo(1001 ** 0.2);
    expect(peakMult(late, 1)).toBeCloseTo(7, 0);
  });

  it('old saves read with the Ladder empty, aeons since the last Unravel taken from aeons ever, and merge', () => {
    const old = { ...base({ transcends: 4, eonAll: 30 }) } as Record<string, unknown>;
    delete old.ladder;
    delete old.eonRun;
    delete old.transRun;
    const n = normaliseCosmos(JSON.parse(JSON.stringify(old)), T0);
    expect(n.ladder).toEqual([]);
    expect(n.eonRun).toBe(30);
    expect(n.transRun).toBe(4);
    const s = ladderAt(7, { tree: { root: 2 }, peaks: { '5': 9 }, auto: { L5: false } });
    expect(normaliseCosmos(JSON.parse(JSON.stringify(s)), T0)).toEqual(s);
    const phone = ladderAt(9, { tree: { trunk: 1 } });
    const m = mergeCosmos(s, phone);
    expect(m.ladder.length).toBe(5);
    expect(topLayer(m)).toBe(9);
    expect(m.tree).toEqual({ root: 2, trunk: 1 });
    expect(sameData(mergeCosmos(phone, s), m)).toBe(true);
  });

  it('nothing on the Ladder becomes infinite', () => {
    const huge = ladderAt(40, { eonRun: 1e300, dust: 1e300, runDust: 1e300, galRun: 1e300, tree: { root: 30, trunk: 20, canopy: 20 } });
    const big = { ...huge, ladder: huge.ladder.map((r) => ({ ...r, run: 1e300, c: 1e300, ups: [20, 10, 8, 10] })) };
    for (let n = 5; n <= 40; n++) expect(Number.isFinite(rungGain(big, n))).toBe(true);
    const gifted = { ...big, ladder: big.ladder.map((r) => ({ ...r, nAll: 1e9 })) };
    for (const v of [rateNow(gifted, ext, T0), rungGain(gifted, 40), renownXp(gifted), coresEarned(gifted)]) expect(Number.isFinite(v)).toBe(true);
    for (const v of [rateNow(big, ext, T0), lightGain(big), darkGain(big), galGain(big), eonGain(big)]) expect(Number.isFinite(v)).toBe(true);
    expect(Number.isFinite(settle(big, T0 + 60_000, ext).save.dust)).toBe(true);
  });
});

describe('the Cosmos: keys, gifts, Renown and Mastery', () => {
  const ladderAt = (top: number, over: Partial<CosmosSave> = {}, nAll = 3) =>
    base({ transcends: 5, transRun: 2, ladder: Array.from({ length: top - LADDER_FROM + 1 }, (_, i) => ({ c: 100, run: 100, all: 500, nAll, ups: [], at: T0 - 1000 * (i + 1) })), ...over });
  /** A save with rung n ready to climb the first time (the rung below holds plenty). */
  const readyFor = (n: number, over: Partial<CosmosSave> = {}) => {
    const s = ladderAt(n - 1, over);
    return { ...s, ladder: [...s.ladder.map((r, i) => (i === n - 1 - LADDER_FROM ? { ...r, run: rungNeed(n) * 100 } : r)), { c: 0, run: 0, all: 0, nAll: 0, ups: [], at: 0 }] };
  };

  it('every rung asks for its key the first time, and stays open after', () => {
    // Unravel: the Second Sun.
    const u = base({ transcends: 3, eon: 40, eonRun: 40, eonAll: 40 });
    expect(rungGain(u, 5)).toBeGreaterThanOrEqual(1);
    expect(keyMet(u, 5, T0)).toBe(false);
    expect(climb(u, 5, T0)).toBeNull();
    const done = climb({ ...u, asc: { twin: 1 } }, 5, T0)!;
    expect(rungOf(done, 5).nAll).toBe(1);
    // Done once, it stays open whatever happens to the key.
    expect(keyMet({ ...done, asc: {} }, 5, T0)).toBe(true);
    // A count: Eclipse wants 12 shooting stars.
    const e = readyFor(6, { caught: 11 });
    expect(climb(e, 6, T0)).toBeNull();
    expect(climb({ ...e, caught: 12 }, 6, T0)).not.toBeNull();
    // A state at the moment: Nova during a Frenzy; Sunder with nothing worn.
    const nova = readyFor(7, { caught: 20 });
    expect(climb(nova, 7, T0)).toBeNull();
    expect(climb({ ...nova, boosts: { frenzy: T0 + 5000 } }, 7, T0)).not.toBeNull();
    const sunder = readyFor(18, { relics: { mirror: 1 }, worn: ['mirror'] });
    expect(climb(sunder, 18, T0)).toBeNull();
    expect(climb({ ...sunder, worn: [] }, 18, T0)).not.toBeNull();
    // A challenge: Hush only from inside Lights Out, which may be run again even with every tier done.
    const hush = readyFor(21, { collapsesAll: 5, chals: { dim: 10 } });
    expect(climb(hush, 21, T0)).toBeNull();
    const inside = enterChal(hush, 'dim', T0)!;
    expect(inside.chal).toBe('dim');
    expect(check(inside).save.chals.dim).toBe(10);
    const h = climb(inside, 21, T0)!;
    expect(rungOf(h, 21).nAll).toBe(1);
    expect(h.chal).toBeNull();
    // Unbind: every switch off.
    const ub = readyFor(39);
    expect(climb(ub, 39, T0)).toBeNull();
    const off = Object.fromEntries(['bodies', 'ups', 'nodes', 'ignite', 'voids', 'collapse', 'bang', 'transcend', ...Array.from({ length: 35 }, (_, i) => `L${i + 5}`)].map((k) => [k, false]));
    expect(climb({ ...ub, auto: off }, 39, T0)).not.toBeNull();
  });

  it('gifts grow at 1, 10, 100, 1,000 and 10,000 times done, and Aleph lifts the rest', () => {
    const at = (t: number) => ladderAt(9, {}, t);
    expect([0, 1, 9, 10, 100, 1000, 1e4, 1e6].map((t) => giftLv(at(t), 9))).toEqual([0, 1, 1, 2, 3, 4, 5, 5]);
    expect(giftNext(at(3), 9)).toBe(10);
    expect(giftNext(at(1e4), 9)).toBe(0);
    const aleph = ladderAt(30, {}, 1e4);
    expect(giftLv(aleph, 9)).toBe(6);
    expect(giftLv(aleph, 30)).toBe(5);
  });

  it('gifts do what they say', () => {
    // Fold: resonance comes sooner. Crown: more relic hands. Unravel: Transcends need less each time.
    expect(resoGap(ladderAt(9, {}, 10))).toBe(40);
    expect(relicSlots(ladderAt(16, {}, 100)) - relicSlots(ladderAt(15, {}, 100))).toBe(2);
    expect(needTranscend({ ...ladderAt(5, {}, 1), transRun: 2 })).toBeLessThan(needTranscend({ ...base(), transRun: 2 }));
    // Drift: dust upgrades kept through an Ignite. Weave: the constellation through a Collapse.
    const d = { ...ladderAt(8), ups: { focus: 3 }, runDust: 1e10 };
    expect(ignite(d, T0)!.ups).toEqual({ focus: 3 });
    const w = { ...ladderAt(10), nodes: ['polaris'], lightRun: 1e12, collapsesAll: 0 };
    expect(collapse(w, T0)!.nodes).toEqual(['polaris']);
    // Eclipse: every 5th star is five times as strong.
    const ec = { ...ladderAt(6, {}, 1), caught: 4 };
    expect(eclipseNext(ec)).toBe(true);
    expect(eclipseNext({ ...ec, caught: 5 })).toBe(false);
    const g = catchStar(ec, T0, ext, 0.95);
    expect(g.gift.name).toMatch(/^Eclipse!/);
    expect(g.save.shards).toBe(5);
    // Absolute: every star brings all four.
    const ab = catchStar(ladderAt(28, {}, 1), T0, ext, 0.95).save;
    expect(ab.boosts.frenzy).toBeGreaterThan(T0);
    expect(ab.boosts.rush).toBeGreaterThan(T0);
    expect(ab.shards).toBeGreaterThan(0);
    // Gild: a stronger Frenzy. Tessellate: the Orrery goes higher. Unbind: each rung needs less.
    // (Aleph, done below them, lifts each by one level.)
    const gild = ladderAt(32, {}, 1);
    expect(giftLv(gild, 32)).toBe(2);
    expect(frenzyMult(gild)).toBe(FRENZY + 6);
    const gears = ORRERY.find((u) => u.id === 'gears')!;
    expect(orrMax(ladderAt(34, {}, 1), gears)).toBe(gears.max + 4);
    expect(rungNeed(30, ladderAt(39, {}, 1))).toBeLessThan(rungNeed(30));
    // Eternity: the alignment's days in a row never break.
    const et = { ...ladderAt(27, {}, 1), daily: '2026-11-01', dailyRun: 4 };
    expect(claimDaily(et, '2026-11-15', T0)!.dailyRun).toBe(5);
  });

  it('Renown is counted, never stored, only grows, and its ranks give perks', () => {
    expect(rankOf(base())).toBe(0);
    expect(rankNeed(1)).toBeGreaterThan(0);
    const s = base({ ignitesAll: 50, collapsesAll: 5, done: ['life3', 'life6'], caught: 10, labs: ['r_nets'] });
    expect(renownXp(s)).toBe(renownParts(s).reduce((a, p) => a + p.xp, 0));
    expect(renownXp({ ...s, ignitesAll: 60 })).toBeGreaterThan(renownXp(s));
    expect(rankMult(s)).toBeCloseTo(1.15 ** rankOf(s));
    // Rank 25: a third piece of research.
    const big = ladderAt(20, {}, 1000);
    expect(rankOf(big)).toBeGreaterThanOrEqual(25);
    expect(labSlots(big)).toBe(2);
    // It isn't in the save.
    expect(Object.keys(base())).not.toContain('rank');
  });

  it('Mastery grows with bodies ever bought, is kept for good and merges', () => {
    let s = base({ dust: 1e12, ignitesAll: 1 });
    s = buyBody(s, 'net', 60)!;
    expect(s.boughtBy.net).toBe(60);
    expect(masteryOf(s, 'net')).toBe(1);
    expect(masteryMult(s, 'net')).toBe(2);
    // A reset takes the bodies, not the Mastery.
    const after = ignite({ ...s, runDust: 1e10 }, T0)!;
    expect(after.gens.net ?? 0).toBeLessThan(60);
    expect(masteryOf(after, 'net')).toBe(1);
    expect(masteryOf(base({ boughtBy: { net: 800 } }), 'net')).toBe(5);
    expect(bodyCost(base({ boughtBy: { net: 800 } }), 'net')).toBeLessThan(bodyCost(base(), 'net'));
    expect(masteryTotal(base({ boughtBy: { net: 100, comet: 50 } }))).toBe(3);
    const phone = base({ boughtBy: { net: 500, mill: 70 }, naps: 2 });
    const m = mergeCosmos(s, phone);
    expect(m.boughtBy).toEqual({ net: 500, mill: 70 });
    expect(m.naps).toBe(2);
    expect(normaliseCosmos(JSON.parse(JSON.stringify(m)), T0).boughtBy).toEqual(m.boughtBy);
  });

  it('coming back after an hour counts as a nap (Dream’s key)', () => {
    const s = base({ gens: { net: 1 } });
    expect(settle(s, T0 + 30 * 60_000, ext).save.naps).toBe(0);
    expect(settle(s, T0 + 2 * 3600_000, ext).save.naps).toBe(1);
  });
});
