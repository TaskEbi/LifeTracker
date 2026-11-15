import { describe, expect, it } from 'vitest';
import {
  ASCS,
  autoOn,
  autoStep,
  bang,
  BODIES,
  bodyCost,
  buyAllBodies,
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
    expect([9, 10, 24, 25, 49, 50, 99, 100, 150].map(resoSteps)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 5]);
    const s = base({ gens: { net: 10 } });
    expect(orbitRate(s, ext, T0)).toBeCloseTo(10 * 0.2 * 2);
    const { save, away } = settle(s, T0 + 10_000, ext);
    expect(away).toBeNull();
    expect(save.dust).toBeCloseTo(40);
    expect(save.runDust).toBeCloseTo(40);
    expect(save.life).toBeCloseTo(40);
  });

  it('time away pays half speed, up to eight hours, and says so', () => {
    const s = base({ gens: { net: 10 } });
    const { save, away } = settle(s, T0 + 20 * 3600_000, ext);
    expect(away).not.toBeNull();
    expect(away!.capped).toBe(true);
    expect(away!.worked).toBe(8 * 3600);
    expect(away!.eff).toBe(0.5);
    expect(save.dust).toBeCloseTo(4 * 0.5 * 8 * 3600);
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
    const s = ripe({ dark: 1e14, darkRun: 4e13, darkAll: 4e13, voids: { density: 5 }, collapses: 3, collapsesAll: 30, relics: { mirror: 2 }, worn: ['mirror'], chals: { thin: 2 }, chal: null });
    const g = galGain(s);
    expect(g).toBeGreaterThanOrEqual(1);
    const b = bang(s, T0)!;
    expect(b.gal).toBe(g);
    expect(b.dark).toBe(0);
    expect(b.voids).toEqual({});
    expect(b.relics).toEqual({ mirror: 2 });
    expect(b.chals).toEqual({ thin: 2 });
    expect(b.bangsAll).toBe(1);
    const far = { ...b, gal: 3e4, galRun: 2e4, galAll: 2e4, asc: { swift: 1 } };
    expect(eonGain({ ...far, galRun: 9999 })).toBe(0);
    expect(eonGain(far)).toBe(1);
    expect(eonGain({ ...far, galRun: 1e6 })).toBe(3);
    const t = transcend(far, T0)!;
    expect(t.eon).toBe(1);
    expect(t.gal).toBe(0);
    expect(t.galRun).toBe(0);
    expect(t.relics).toEqual({ mirror: 2 });
    expect(t.worn).toEqual(['mirror']);
    expect(t.asc).toEqual({ swift: 1 });
    expect(t.transcends).toBe(1);
    // The next Transcend needs twice the galaxies.
    expect(eonGain({ ...t, galRun: 1.9e4 })).toBe(0);
    expect(eonGain({ ...t, galRun: 2e4 })).toBe(1);
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
    expect(dustMult(save, ext, T0)).toBeCloseTo(1.05 ** 3);
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
