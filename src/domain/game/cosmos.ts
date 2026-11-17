/**
 * 宙 The Cosmos: an incremental game with four layers of starting again.
 *
 *   dust 塵 → Ignite → starlight 光 → Collapse → dark matter 闇 → Big Bang → galaxies 銀 → Transcend → aeons 劫
 *
 * Each layer wipes the ones under it and pays its own currency, which makes the lower layers
 * faster and buys things of its own: a constellation of nodes, void upgrades and challenges, relics
 * to wear, and ascensions. Milestones (by how many times a layer has been done, ever) hand out the
 * automation, so the early layers end up running themselves.
 *
 * Around the layers: shooting stars to catch (short boosts), shards 片 (a currency nothing resets)
 * from stars, bounties and the daily alignment, spent in the Orrery on lasting parts; and the
 * Observatory, research that runs in real time, even while the app is shut, and is kept for good.
 *
 * Everything here is a pure function of one save (`CosmosSave`) and the clock. The save is one
 * `gm_cosmos` row. Nothing in it is worth anything outside the game: no Ryō, no Tama, no XP.
 */
import { fmt, type Ext } from './idle';

export { fmt };
export type { Ext };

const CAP = 1e300;
/** Numbers stay finite and below 1e300, so nothing ever turns into Infinity or NaN. */
const fin = (x: number) => (Number.isNaN(x) ? 0 : Math.max(0, Math.min(x, CAP)));
const lvOf = (rec: Record<string, number>, id: string) => rec[id] ?? 0;

// ─── the save ───────────────────────────────────────────────────────────────

export type AutoKey = 'bodies' | 'ups' | 'nodes' | 'ignite' | 'voids' | 'collapse' | 'bang';
export const AUTO_KEYS: AutoKey[] = ['bodies', 'ups', 'nodes', 'ignite', 'voids', 'collapse', 'bang'];

export interface CosmosSave {
  v: 1;
  /** When dust was last settled (ms). */
  at: number;

  // dust
  dust: number;
  /** Dust made since the last Ignite. */
  runDust: number;
  /** When this run began (ms). */
  runAt: number;
  gens: Record<string, number>;
  ups: Record<string, number>;

  // starlight
  light: number;
  /** Starlight earned since the last Collapse. */
  lightRun: number;
  nodes: string[];
  /** Ignites since the last Collapse. */
  ignites: number;
  colAt: number;

  // dark matter
  dark: number;
  /** Dark matter earned since the last Big Bang. */
  darkRun: number;
  voids: Record<string, number>;
  collapses: number;
  bangAt: number;
  /** The challenge being run, if any. */
  chal: string | null;
  /** Tiers finished, by challenge. Kept for good. */
  chals: Record<string, number>;

  // galaxies
  gal: number;
  /** Galaxies earned since the last Transcend. */
  galRun: number;
  bangs: number;
  /** Relic levels. Kept for good. */
  relics: Record<string, number>;
  worn: string[];

  // aeons
  eon: number;
  eonAll: number;
  asc: Record<string, number>;

  auto: Partial<Record<AutoKey, boolean>>;

  // for good
  life: number;
  taps: number;
  crits: number;
  ignitesAll: number;
  collapsesAll: number;
  bangsAll: number;
  transcends: number;
  lightAll: number;
  darkAll: number;
  galAll: number;
  done: string[];
  best: number;

  // around the layers (nothing resets these)
  shards: number;
  shardsAll: number;
  /** Orrery part levels. */
  orr: Record<string, number>;
  /** When each shooting-star gift wears off (ms). */
  boosts: Record<string, number>;
  /** Shooting stars caught. */
  caught: number;
  /** Bodies ever bought. */
  bought: number;
  /** Research under way: which, and when it's done (ms). */
  lab: { id: string; end: number }[];
  /** Research finished. */
  labs: string[];
  bounties: Bounty[];
  /** Bounties ever posted (the next one's number). */
  bountyN: number;
  bountiesDone: number;
  /** When a bounty was last swapped (ms). */
  swapAt: number;
  /** The last day the alignment was claimed (YYYY-MM-DD), the days in a row, and how many ever. */
  daily: string;
  dailyRun: number;
  dailyAll: number;
}

export interface Bounty {
  /** Its number: also the seed it was made from. */
  n: number;
  k: string;
  need: number;
  /** The count it started from. */
  from: number;
  pay: number;
}

export function freshCosmos(now: number): CosmosSave {
  return {
    v: 1, at: now,
    dust: 0, runDust: 0, runAt: now, gens: {}, ups: {},
    light: 0, lightRun: 0, nodes: [], ignites: 0, colAt: now,
    dark: 0, darkRun: 0, voids: {}, collapses: 0, bangAt: now, chal: null, chals: {},
    gal: 0, galRun: 0, bangs: 0, relics: {}, worn: [],
    eon: 0, eonAll: 0, asc: {},
    auto: {},
    life: 0, taps: 0, crits: 0, ignitesAll: 0, collapsesAll: 0, bangsAll: 0, transcends: 0, lightAll: 0, darkAll: 0, galAll: 0, done: [], best: 0,
    shards: 0, shardsAll: 0, orr: {}, boosts: {}, caught: 0, bought: 0, lab: [], labs: [], bounties: [], bountyN: 0, bountiesDone: 0, swapAt: 0, daily: '', dailyRun: 0, dailyAll: 0,
  };
}

// ─── bodies in orbit (dust a second) ────────────────────────────────────────

export interface Body {
  id: string;
  name: string;
  kanji: string;
  blurb: string;
  cost: number;
  rate: number;
  /** Needs the Second Sun ascension. */
  twin?: boolean;
}

export const BODIES: Body[] = [
  { id: 'net', name: 'Mote Net', kanji: '網', blurb: 'A sail of spider silk that drifts and sifts.', cost: 10, rate: 0.2 },
  { id: 'comet', name: 'Comet Catcher', kanji: '彗', blurb: 'Lassoes a comet and combs out its tail.', cost: 150, rate: 2 },
  { id: 'mill', name: 'Asteroid Mill', kanji: '礫', blurb: 'Grinds rocks against other rocks. Very loud, in theory.', cost: 2_500, rate: 20 },
  { id: 'moon', name: 'Moon Quarry', kanji: '月', blurb: 'The rabbit on it has been asked to move.', cost: 50_000, rate: 250 },
  { id: 'ring', name: 'Ringworks', kanji: '環', blurb: 'Skims a planet’s rings like cream.', cost: 1.2e6, rate: 3_500 },
  { id: 'giant', name: 'Storm Siphon', kanji: '嵐', blurb: 'A straw in a gas giant’s biggest storm.', cost: 3.5e7, rate: 60_000 },
  { id: 'petal', name: 'Dyson Petal', kanji: '華', blurb: 'One petal of a flower that will close around the sun.', cost: 1.2e9, rate: 1.2e6 },
  { id: 'pulsar', name: 'Pulsar Loom', kanji: '脈', blurb: 'Weaves dust on a beam that ticks 700 times a second.', cost: 5e10, rate: 3e7 },
  { id: 'quasar', name: 'Quasar Wheel', kanji: '輪', blurb: 'A water wheel, in the jet of a quasar.', cost: 3e12, rate: 1e9, twin: true },
  { id: 'tree', name: 'World Tree', kanji: '樹', blurb: 'Its roots drink from every star at once.', cost: 2.5e14, rate: 4e10, twin: true },
];
export const bodyById = (id: string) => BODIES.find((b) => b.id === id);

// ─── dust upgrades (gone at every Ignite) ───────────────────────────────────

export interface Levelled {
  id: string;
  name: string;
  kanji: string;
  blurb: string;
  cost: number;
  grow: number;
  max: number;
}

export const UPS: Levelled[] = [
  { id: 'focus', name: 'Focus', kanji: '指', blurb: 'Each tap gathers twice as much.', cost: 40, grow: 10, max: 60 },
  { id: 'lens', name: 'Gravity Lens', kanji: '鏡', blurb: 'Everything gathers 25% more.', cost: 400, grow: 10, max: 80 },
  { id: 'tide', name: 'Tidal Pull', kanji: '潮', blurb: 'A tap also gathers 3% of a second of orbit dust.', cost: 2_000, grow: 4, max: 10 },
  { id: 'spark', name: 'Spark', kanji: '閃', blurb: 'Bright taps (×10) happen 4% more often.', cost: 5_000, grow: 8, max: 5 },
  { id: 'drift', name: 'Slow Drift', kanji: '漂', blurb: 'Bodies cost 4% less.', cost: 10_000, grow: 3.5, max: 10 },
  { id: 'chord', name: 'Orbital Chord', kanji: '弦', blurb: '+0.4% dust for every body in orbit.', cost: 20_000, grow: 4, max: 10 },
  { id: 'hoard', name: 'Dust Cloud', kanji: '雲', blurb: 'The more dust you hold, the more you gather.', cost: 1e6, grow: 8, max: 5 },
  { id: 'swell', name: 'Swell', kanji: '昇', blurb: 'Dust grows the longer this run lasts (up to 10 minutes).', cost: 5e6, grow: 6, max: 5 },
];

// ─── the constellation (starlight; gone at a Collapse until a milestone keeps it) ───

export interface Node {
  id: string;
  name: string;
  kanji: string;
  blurb: string;
  cost: number;
  req: string[];
  /** Where it sits on the map, 0–100 each way. */
  x: number;
  y: number;
  /** How bright the star is drawn, 1–3. */
  mag: 1 | 2 | 3;
}

export const NODES: Node[] = [
  { id: 'polaris', name: 'Polaris', kanji: '極', blurb: 'Dust ×3.', cost: 1, req: [], x: 50, y: 10, mag: 3 },
  { id: 'kindle', name: 'Kindle', kanji: '点', blurb: 'Taps ×5.', cost: 3, req: ['polaris'], x: 24, y: 22, mag: 2 },
  { id: 'ember', name: 'Ember', kanji: '熾', blurb: 'Every run starts with 2,000 dust and 5 Mote Nets.', cost: 10, req: ['polaris'], x: 76, y: 22, mag: 2 },
  { id: 'prism', name: 'Prism', kanji: '虹', blurb: 'Starlight ×2.', cost: 100, req: ['polaris'], x: 50, y: 30, mag: 2 },
  { id: 'flare', name: 'Flare', kanji: '炎', blurb: 'Bright taps are ×40, and 5% more often.', cost: 2000, req: ['kindle'], x: 8, y: 38, mag: 1 },
  { id: 'chorus', name: 'Chorus', kanji: '唱', blurb: 'Dust +10% for each Ignite since the last Collapse (up to ×11).', cost: 50000, req: ['prism'], x: 36, y: 44, mag: 2 },
  { id: 'cradle', name: 'Cradle', kanji: '揺', blurb: 'Bodies cost 15% less.', cost: 1000000, req: ['ember'], x: 92, y: 38, mag: 1 },
  { id: 'vigil', name: 'Vigil', kanji: '守', blurb: 'While you’re away: full speed, and 4 more hours.', cost: 5000000, req: ['ember'], x: 72, y: 46, mag: 1 },
  { id: 'halo', name: 'Halo', kanji: '暈', blurb: 'Starlight you haven’t spent makes more dust.', cost: 50000000, req: ['prism'], x: 58, y: 52, mag: 2 },
  { id: 'pulse', name: 'Pulse', kanji: '拍', blurb: 'The auto-tapper is 4 times as fast.', cost: 500000000, req: ['kindle'], x: 20, y: 56, mag: 1 },
  { id: 'tides', name: 'Tides', kanji: '汐', blurb: 'Each body’s price climbs more slowly.', cost: 5000000000, req: ['cradle'], x: 88, y: 60, mag: 1 },
  { id: 'harmony', name: 'Harmony', kanji: '和', blurb: 'Resonance doubles become ×2.25.', cost: 100000000000, req: ['chorus'], x: 34, y: 66, mag: 2 },
  { id: 'spectrum', name: 'Spectrum', kanji: '彩', blurb: 'Starlight ×3.', cost: 2000000000000, req: ['halo'], x: 64, y: 68, mag: 2 },
  { id: 'giant', name: 'Red Giant', kanji: '巨', blurb: 'Dust ×8.', cost: 50000000000000, req: ['harmony'], x: 16, y: 76, mag: 3 },
  { id: 'corona', name: 'Corona', kanji: '冠', blurb: 'Starlight ×5.', cost: 2000000000000000, req: ['spectrum'], x: 82, y: 78, mag: 2 },
  { id: 'super', name: 'Supergiant', kanji: '超', blurb: 'Dust ×20.', cost: 100000000000000000, req: ['giant'], x: 34, y: 86, mag: 3 },
  { id: 'zenith', name: 'Zenith', kanji: '頂', blurb: 'Starlight ×10.', cost: 5000000000000000000, req: ['super', 'corona'], x: 58, y: 86, mag: 3 },
  { id: 'hyper', name: 'Hypergiant', kanji: '極', blurb: 'Dust ×50.', cost: 1e21, req: ['super'], x: 20, y: 94, mag: 3 },
  { id: 'horizon', name: 'Event Horizon', kanji: '涯', blurb: 'Dark matter ×3.', cost: 1e23, req: ['zenith'], x: 80, y: 94, mag: 3 },
];
export const nodeById = (id: string) => NODES.find((n) => n.id === id);

// ─── void upgrades (dark matter; gone at a Big Bang) ────────────────────────

export const VOIDS: Levelled[] = [
  { id: 'density', name: 'Density', kanji: '密', blurb: 'Dust ×2.', cost: 1, grow: 4, max: 80 },
  { id: 'touch', name: 'Void Touch', kanji: '触', blurb: 'Taps ×10.', cost: 1, grow: 4, max: 30 },
  { id: 'lumin', name: 'Luminosity', kanji: '耀', blurb: 'Starlight ×2.', cost: 2, grow: 4, max: 60 },
  { id: 'seed', name: 'Seed', kanji: '種', blurb: 'Runs start with 10 more of each body, and 10 times the dust (from 1,000).', cost: 3, grow: 5, max: 8 },
  { id: 'dilate', name: 'Time Dilation', kanji: '遅', blurb: 'Everything runs 20% faster.', cost: 5, grow: 6, max: 10 },
  { id: 'energy', name: 'Dark Energy', kanji: '能', blurb: 'Dark matter ×1.5.', cost: 10, grow: 5, max: 40 },
  { id: 'arc', name: 'Arc Lamp', kanji: '弧', blurb: 'The auto-tapper is twice as fast.', cost: 50, grow: 12, max: 5 },
];

// ─── challenges (a Collapse with a handicap; each tier pays for good) ───────

export interface Challenge {
  id: string;
  name: string;
  kanji: string;
  rule: string;
  reward: string;
  /** Dust to make in one run, first tier. */
  goal: number;
  /** Each tier's goal is this many times the last. */
  step: number;
}

export const CHALLENGES: Challenge[] = [
  { id: 'hands', name: 'No Hands', kanji: '手', rule: 'Taps gather nothing, by hand or by machine.', reward: 'Bodies ×2', goal: 1e29, step: 1e5 },
  { id: 'thin', name: 'Thin Air', kanji: '薄', rule: 'All dust gathered is raised to the power 0.8.', reward: 'Starlight ×2', goal: 1e23, step: 1e5 },
  { id: 'lone', name: 'Lonely Orbit', kanji: '孤', rule: 'Only the first four bodies can be bought.', reward: 'Resonance +0.15', goal: 1e25, step: 1e5 },
  { id: 'steep', name: 'Steep Climb', kanji: '険', rule: 'Each body’s price climbs by 40% a time.', reward: 'Prices climb more slowly', goal: 1e23, step: 1e5 },
  { id: 'dim', name: 'Lights Out', kanji: '暗', rule: 'The constellation does nothing, and starlight adds no dust.', reward: 'Dark matter ×2', goal: 1e21, step: 1e5 },
  { id: 'decay', name: 'Half-life', kanji: '崩', rule: 'Dust gathered halves every 45 seconds of a run.', reward: 'Everything 15% faster', goal: 1e23, step: 1e5 },
  { id: 'cost', name: 'Inflation', kanji: '価', rule: 'Dust upgrades cost 10,000 times as much.', reward: 'Dust ×3', goal: 1e24, step: 1e5 },
  { id: 'frail', name: 'Frailty', kanji: '脆', rule: 'Bodies gather a hundredth as much; taps are what you have.', reward: 'Taps ×10', goal: 1e20, step: 1e5 },
];
export const chalById = (id: string) => CHALLENGES.find((c) => c.id === id);
export const CHAL_TIERS = 5;
export const chalMax = (s: CosmosSave) => CHAL_TIERS + lvOf(s.asc, 'deep');
export const chalTier = (s: CosmosSave, id: string) => lvOf(s.chals, id);
/** The dust a challenge tier needs in one run (the Handicapper's research makes them 10 times smaller). */
export const chalGoal = (c: Challenge, tier: number, s?: CosmosSave) => fin((c.goal * c.step ** tier) / (s && hasLab(s, 'r_chal') ? 10 : 1));
const inChal = (s: CosmosSave, id: string) => s.chal === id;

// ─── relics (galaxies; kept for good; only the ones worn do anything) ───────

export interface Relic {
  id: string;
  name: string;
  kanji: string;
  /** What it does, given its level. */
  blurb: (lv: number) => string;
  cost: number;
  grow: number;
}
export const RELIC_MAX = 5;

export const RELICS: Relic[] = [
  { id: 'mirror', name: 'Sun Mirror', kanji: '鏡', blurb: (lv) => `Dust ×${fmt(10 ** lv)}.`, cost: 1, grow: 10 },
  { id: 'chart', name: 'Star Chart', kanji: '図', blurb: (lv) => `Starlight ×${fmt(5 ** lv)}.`, cost: 1, grow: 10 },
  { id: 'lantern', name: 'Void Lantern', kanji: '灯', blurb: (lv) => `Dark matter ×${fmt(2 ** lv)}.`, cost: 2, grow: 10 },
  { id: 'glass', name: 'Hourglass', kanji: '砂', blurb: (lv) => `Everything runs ×${(1.5 ** lv).toFixed(2)} as fast.`, cost: 2, grow: 10 },
  { id: 'metro', name: 'Metronome', kanji: '拍', blurb: (lv) => `Taps ×${fmt(10 ** lv)}; the auto-tapper is 3 times as fast.`, cost: 1, grow: 10 },
  { id: 'vault', name: 'Seed Vault', kanji: '蔵', blurb: (lv) => `Runs start with ${20 * lv} of each body.`, cost: 1, grow: 10 },
  { id: 'fork', name: 'Tuning Fork', kanji: '叉', blurb: (lv) => `Resonance +${(0.25 * lv).toFixed(2)}.`, cost: 3, grow: 10 },
  { id: 'abacus', name: 'Abacus', kanji: '算', blurb: (lv) => `Bodies cost ${fmt(100 ** lv)} times less.`, cost: 2, grow: 10 },
  { id: 'dice', name: 'Loaded Dice', kanji: '賽', blurb: (lv) => `Bright taps ${8 * lv}% more often, and ×${fmt(5 ** lv)} brighter.`, cost: 1, grow: 10 },
  { id: 'anchor', name: 'Anchor', kanji: '錨', blurb: (lv) => `While you’re away: ${6 * lv} more hours, and ×${1 + lv} dust.`, cost: 2, grow: 10 },
  { id: 'crown', name: 'Spiral Crown', kanji: '冠', blurb: (lv) => `Galaxies ×${(1.5 ** lv).toFixed(2)}.`, cost: 25, grow: 10 },
  { id: 'lure', name: 'Comet Lure', kanji: '餌', blurb: (lv) => `Shooting stars come ${20 * lv}% more often, and their gifts last ${25 * lv}% longer.`, cost: 1, grow: 10 },
  { id: 'compass', name: 'Compass', kanji: '針', blurb: (lv) => `Research runs ${25 * lv}% faster.`, cost: 2, grow: 10 },
  { id: 'quill', name: 'Quill', kanji: '筆', blurb: (lv) => `Bounties pay ${lv} more shard${lv === 1 ? '' : 's'}.`, cost: 2, grow: 10 },
];
export const relicById = (id: string) => RELICS.find((r) => r.id === id);
/** Level of a relic, if it's worn. */
const worn = (s: CosmosSave, id: string) => (s.worn.includes(id) ? lvOf(s.relics, id) : 0);

// ─── ascensions (aeons; kept for good) ──────────────────────────────────────

export const ASCS: Levelled[] = [
  { id: 'twin', name: 'Second Sun', kanji: '双', blurb: 'Two more bodies can be put in orbit: the Quasar Wheel and the World Tree.', cost: 1, grow: 1, max: 1 },
  { id: 'swift', name: 'Swiftness', kanji: '迅', blurb: 'Everything runs 50% faster.', cost: 2, grow: 4, max: 5 },
  { id: 'rich', name: 'Abundance', kanji: '富', blurb: 'Galaxies ×2.', cost: 3, grow: 4, max: 6 },
  { id: 'wide', name: 'Wider Hands', kanji: '広', blurb: 'One more relic can be worn.', cost: 2, grow: 4, max: 3 },
  { id: 'dawn', name: 'First Light', kanji: '暁', blurb: 'After a Big Bang you start with 10 times the dark matter to spend (from 10).', cost: 2, grow: 3, max: 6 },
  { id: 'memory', name: 'Memory', kanji: '憶', blurb: 'Void upgrades are kept through a Big Bang.', cost: 3, grow: 1, max: 1 },
  { id: 'deep', name: 'Deeper', kanji: '深', blurb: 'Every challenge has one more tier.', cost: 4, grow: 3, max: 5 },
  { id: 'rain', name: 'Comet Rain', kanji: '雨', blurb: 'Shooting stars come twice as often.', cost: 2, grow: 1, max: 1 },
  { id: 'patience', name: 'Patience', kanji: '忍', blurb: 'Research runs twice as fast.', cost: 2, grow: 3, max: 2 },
  { id: 'bodhi', name: 'Enlightenment', kanji: '悟', blurb: 'The end of the road. Dust ×10 billion, and the sky turns gold.', cost: 60, grow: 1, max: 1 },
];

// ─── the Orrery (shards; kept for good, even through a Transcend) ───────────

export const ORRERY: Levelled[] = [
  { id: 'gears', name: 'Brass Gears', kanji: '歯', blurb: 'Dust ×1.35.', cost: 3, grow: 1.9, max: 10 },
  { id: 'watch', name: 'Night Watch', kanji: '夜', blurb: 'While you’re away: 2 more hours, and 10% faster.', cost: 4, grow: 2, max: 4 },
  { id: 'lode', name: 'Lodestone', kanji: '磁', blurb: 'Shooting stars come 15% more often.', cost: 4, grow: 2, max: 5 },
  { id: 'tail', name: 'Long Tail', kanji: '尾', blurb: 'Shooting-star gifts last 25% longer.', cost: 5, grow: 2, max: 4 },
  { id: 'grind', name: 'Lens Grinder', kanji: '研', blurb: 'Starlight ×1.25.', cost: 6, grow: 1.9, max: 6 },
  { id: 'clock', name: 'Clockwork', kanji: '時', blurb: 'Research runs 20% faster.', cost: 6, grow: 2, max: 5 },
  { id: 'board', name: 'Notice Board', kanji: '札', blurb: 'One more bounty on the board.', cost: 10, grow: 4, max: 2 },
  { id: 'keep', name: 'Keepsake', kanji: '形', blurb: 'Dust upgrades are kept through an Ignite.', cost: 25, grow: 1, max: 1 },
  { id: 'scope', name: 'Twin Scopes', kanji: '双', blurb: 'Two pieces of research can run at once.', cost: 40, grow: 1, max: 1 },
  { id: 'well', name: 'Gravity Well', kanji: '井', blurb: 'Dark matter ×1.3.', cost: 12, grow: 2, max: 5 },
  { id: 'chart', name: 'Star Map', kanji: '図', blurb: 'Galaxies ×1.25.', cost: 30, grow: 2.2, max: 4 },
];

// ─── the Observatory (research in real time; kept for good) ────────────────

export type Coin = 'dust' | 'light' | 'dark' | 'gal' | 'eon';

export interface Research {
  id: string;
  name: string;
  kanji: string;
  blurb: string;
  /** How long it takes, in minutes, before anything speeds it up. */
  mins: number;
  cost: number;
  coin: Coin;
  /** Research that must be finished first. */
  after?: string;
  /** What else it needs, and how to say so. */
  need?: (s: CosmosSave) => boolean;
  needText?: string;
  /** Shards it pays when it's done. */
  pay: number;
}

const ign = (n: number) => (s: CosmosSave) => s.ignitesAll >= n;
const col = (n: number) => (s: CosmosSave) => s.collapsesAll >= n;
const bng = (n: number) => (s: CosmosSave) => s.bangsAll >= n;

export const LABS: Research[] = [
  { id: 'r_nets', name: 'Fine Mesh', kanji: '細', blurb: 'Mote Nets and Comet Catchers gather twice as much.', mins: 5, cost: 1e5, coin: 'dust', pay: 1 },
  { id: 'r_tap', name: 'Ergonomics', kanji: '握', blurb: 'Taps ×5.', mins: 8, cost: 1e6, coin: 'dust', pay: 1 },
  { id: 'r_mill', name: 'Harder Rock', kanji: '岩', blurb: 'Asteroid Mills and Moon Quarries gather twice as much.', mins: 20, cost: 1e8, coin: 'dust', after: 'r_nets', pay: 1 },
  { id: 'r_crit', name: 'Glint', kanji: '煌', blurb: 'Bright taps come 5% more often and are twice as bright.', mins: 30, cost: 1e9, coin: 'dust', after: 'r_tap', pay: 1 },
  { id: 'r_away', name: 'Night Shift', kanji: '番', blurb: 'While you’re away: 4 more hours, and 15% faster.', mins: 45, cost: 10, coin: 'light', pay: 2 },
  { id: 'r_ring', name: 'Ring Theory', kanji: '輪', blurb: 'Ringworks and Storm Siphons gather twice as much.', mins: 60, cost: 1e12, coin: 'dust', after: 'r_mill', pay: 2 },
  { id: 'r_comet', name: 'Comet Almanac', kanji: '暦', blurb: 'Shooting stars come 25% more often.', mins: 60, cost: 100, coin: 'light', need: ign(3), needText: 'Ignite 3 times', pay: 2 },
  { id: 'r_bounty', name: 'Ledger', kanji: '帳', blurb: 'Bounties pay one more shard.', mins: 90, cost: 1000, coin: 'light', pay: 2 },
  { id: 'r_cheap', name: 'Bulk Orders', kanji: '卸', blurb: 'Bodies cost half as much.', mins: 150, cost: 1e4, coin: 'light', after: 'r_ring', pay: 2 },
  { id: 'r_petal', name: 'Petal Physics', kanji: '弁', blurb: 'Dyson Petals and Pulsar Looms gather twice as much.', mins: 180, cost: 1e7, coin: 'light', after: 'r_ring', pay: 2 },
  { id: 'r_light', name: 'Spectroscopy', kanji: '譜', blurb: 'Starlight ×1.5.', mins: 120, cost: 1, coin: 'dark', need: col(1), needText: 'Collapse once', pay: 2 },
  { id: 'r_auto', name: 'Clockwork Hands', kanji: '機', blurb: 'The auto-tapper is 3 times as fast.', mins: 150, cost: 3, coin: 'dark', need: col(1), needText: 'Collapse once', pay: 2 },
  { id: 'r_dark', name: 'Dark Optics', kanji: '視', blurb: 'Dark matter ×1.5.', mins: 240, cost: 20, coin: 'dark', need: col(3), needText: 'Collapse 3 times', pay: 3 },
  { id: 'r_chal', name: 'Handicapper', kanji: '障', blurb: 'Challenge goals are 10 times smaller.', mins: 240, cost: 50, coin: 'dark', need: col(2), needText: 'Collapse twice', pay: 3 },
  { id: 'r_reso', name: 'Resonator', kanji: '共', blurb: 'Resonance +0.05.', mins: 360, cost: 500, coin: 'dark', need: col(5), needText: 'Collapse 5 times', pay: 3 },
  { id: 'r_gal', name: 'Redshift', kanji: '赤', blurb: 'Galaxies ×1.5.', mins: 360, cost: 2, coin: 'gal', need: bng(1), needText: 'Set off a Big Bang', pay: 4 },
  { id: 'r_relic', name: 'Display Case', kanji: '棚', blurb: 'One more relic can be worn.', mins: 480, cost: 10, coin: 'gal', need: bng(1), needText: 'Set off a Big Bang', pay: 4 },
  { id: 'r_drip', name: 'Siphon', kanji: '吸', blurb: 'You gain 1% of the dark matter a Collapse would pay, every second.', mins: 480, cost: 25, coin: 'gal', need: bng(2), needText: 'Set off 2 Big Bangs', pay: 4 },
  { id: 'r_quasar', name: 'Radio Telescope', kanji: '電', blurb: 'Quasar Wheels and World Trees gather twice as much.', mins: 600, cost: 100, coin: 'gal', need: (s) => lvOf(s.asc, 'twin') > 0, needText: 'Light the Second Sun', pay: 5 },
  { id: 'r_eon', name: 'Deep Time', kanji: '古', blurb: 'Each Transcend needs a quarter fewer galaxies.', mins: 720, cost: 1, coin: 'eon', need: (s) => s.transcends >= 1, needText: 'Transcend once', pay: 6 },
];
export const labById = (id: string) => LABS.find((r) => r.id === id);
export const hasLab = (s: CosmosSave, id: string) => s.labs.includes(id);
/** The Observatory opens at the first Ignite. */
export const labOpen = (s: CosmosSave) => s.ignitesAll >= 1;
export const labSlots = (s: CosmosSave) => 1 + lvOf(s.orr, 'scope');
export const labSpeed = (s: CosmosSave) => (1 + 0.2 * lvOf(s.orr, 'clock')) * (1 + 0.25 * worn(s, 'compass')) * 2 ** lvOf(s.asc, 'patience');
/** Its turn has come: what it needs is done, and it isn't done or running. */
export const labReady = (s: CosmosSave, r: Research) => labOpen(s) && (!r.after || hasLab(s, r.after)) && (!r.need || r.need(s));
export const labMs = (s: CosmosSave, r: Research) => (r.mins * 60_000) / labSpeed(s);

const BODY_LAB: Record<string, string> = { net: 'r_nets', comet: 'r_nets', mill: 'r_mill', moon: 'r_mill', ring: 'r_ring', giant: 'r_ring', petal: 'r_petal', pulsar: 'r_petal', quasar: 'r_quasar', tree: 'r_quasar' };

// ─── shooting stars (caught on the stage while the tab is open) ─────────────

/** How long one stays in the sky. */
export const STAR_LIFE = 12_000;
export const starFreq = (s: CosmosSave) => (1 + 0.15 * lvOf(s.orr, 'lode')) * (hasLab(s, 'r_comet') ? 1.25 : 1) * (1 + 0.2 * worn(s, 'lure')) * (lvOf(s.asc, 'rain') ? 2 : 1);
/** Seconds between shooting stars, on average. */
export const starGap = (s: CosmosSave) => 150 / starFreq(s);
export const giftLen = (s: CosmosSave) => (1 + 0.25 * lvOf(s.orr, 'tail')) * (1 + 0.25 * worn(s, 'lure'));
export const FRENZY = 3;
export const RUSH = 10;
export const boostOn = (s: CosmosSave, k: 'frenzy' | 'rush', now: number) => (s.boosts[k] ?? 0) > now;

export interface Gift {
  k: 'frenzy' | 'windfall' | 'rush' | 'shard';
  name: string;
  text: string;
}

// ─── bounties (a board of small goals; each pays shards) ────────────────────

interface BountyKind {
  id: string;
  /** What it asks, given how many. */
  ask: (n: number) => string;
  open: (s: CosmosSave) => boolean;
  count: (s: CosmosSave) => number;
  /** How many to ask for, from a size in [0, 1) and the dust a second now. */
  need: (size: number, rate: number) => number;
  pay: number;
}

const plural = (n: number, one: string, many: string) => `${fmt(n)} ${n === 1 ? one : many}`;
export const BOUNTY_KINDS: BountyKind[] = [
  { id: 'taps', ask: (n) => `Tap the core ${fmt(n)} times`, open: () => true, count: (s) => s.taps, need: (z) => 100 + 50 * Math.floor(z * 6), pay: 1 },
  { id: 'crits', ask: (n) => `Land ${plural(n, 'bright tap', 'bright taps')} by hand`, open: () => true, count: (s) => s.crits, need: (z) => 5 + Math.floor(z * 15), pay: 2 },
  { id: 'bodies', ask: (n) => `Put ${plural(n, 'body', 'bodies')} in orbit`, open: () => true, count: (s) => s.bought, need: (z) => 25 + 25 * Math.floor(z * 6), pay: 1 },
  { id: 'dust', ask: (n) => `Gather ${fmt(n)} dust`, open: () => true, count: (s) => s.life, need: (z, rate) => Math.max(500, Math.ceil(rate * (300 + 900 * z))), pay: 1 },
  { id: 'stars', ask: (n) => `Catch ${plural(n, 'shooting star', 'shooting stars')}`, open: () => true, count: (s) => s.caught, need: (z) => 1 + Math.floor(z * 3), pay: 2 },
  { id: 'ignite', ask: (n) => `Ignite ${plural(n, 'time', 'times')}`, open: (s) => s.ignitesAll >= 1, count: (s) => s.ignitesAll, need: (z) => 2 + Math.floor(z * 8), pay: 2 },
  { id: 'lab', ask: () => 'Finish a piece of research', open: (s) => labOpen(s) && LABS.some((r) => !hasLab(s, r.id)), count: (s) => s.labs.length, need: () => 1, pay: 2 },
  { id: 'collapse', ask: (n) => `Collapse ${plural(n, 'time', 'times')}`, open: (s) => s.collapsesAll >= 1, count: (s) => s.collapsesAll, need: (z) => 1 + Math.floor(z * 3), pay: 3 },
  { id: 'tier', ask: () => 'Finish a challenge tier', open: (s) => chalsOpen(s) && CHALLENGES.some((c) => chalTier(s, c.id) < chalMax(s)), count: (s) => totalTiers(s), need: () => 1, pay: 4 },
  { id: 'bang', ask: (n) => `Set off ${plural(n, 'Big Bang', 'Big Bangs')}`, open: (s) => s.bangsAll >= 1, count: (s) => s.bangsAll, need: (z) => 1 + Math.floor(z * 2), pay: 4 },
  { id: 'transcend', ask: () => 'Transcend', open: (s) => s.transcends >= 1, count: (s) => s.transcends, need: () => 1, pay: 6 },
];
export const bountyKind = (id: string) => BOUNTY_KINDS.find((k) => k.id === id);
export const boardSize = (s: CosmosSave) => 3 + lvOf(s.orr, 'board');
export const bountyBonus = (s: CosmosSave) => (hasLab(s, 'r_bounty') ? 1 : 0) + worn(s, 'quill');
/** A bounty can be swapped for another once every this long. */
export const SWAP_MS = 10 * 60_000;
/** How far a bounty has come. */
export const bountyHave = (s: CosmosSave, b: Bounty) => {
  const k = bountyKind(b.k);
  return k ? Math.max(0, Math.min(b.need, k.count(s) - b.from)) : 0;
};

/** A small fixed random sequence from a number. */
function seeded(seed: number) {
  let x = (seed * 2654435761 + 0x9e3779b9) >>> 0;
  return () => {
    x = (x + 0x6d2b79f5) >>> 0;
    let t = Math.imul(x ^ (x >>> 15), 1 | x);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── the daily alignment ────────────────────────────────────────────────────

/** Shards the alignment pays on a day that is the `run`th in a row. */
export const dailyPay = (run: number) => 3 + Math.min(4, Math.max(0, run - 1));
const dayBefore = (day: string) => {
  const t = Date.parse(`${day}T12:00:00Z`);
  return Number.isFinite(t) ? new Date(t - 86_400_000).toISOString().slice(0, 10) : '';
};

export const levelCost = (u: Levelled, lv: number) => fin(Math.ceil(u.cost * u.grow ** lv));
export const relicCost = (r: Relic, lv: number) => Math.ceil(r.cost * r.grow ** lv);

// ─── milestones (by times done, ever) ───────────────────────────────────────

export type Layer = 1 | 2 | 3 | 4;
export const LAYERS: { n: Layer; verb: string; kanji: string; coin: string; coinKanji: string }[] = [
  { n: 1, verb: 'Ignite', kanji: '点', coin: 'starlight', coinKanji: '光' },
  { n: 2, verb: 'Collapse', kanji: '崩', coin: 'dark matter', coinKanji: '闇' },
  { n: 3, verb: 'Big Bang', kanji: '爆', coin: 'galaxies', coinKanji: '銀' },
  { n: 4, verb: 'Transcend', kanji: '超', coin: 'aeons', coinKanji: '劫' },
];

export interface Mile {
  layer: Layer;
  at: number;
  name: string;
  blurb: string;
}

export const MILES: Mile[] = [
  { layer: 1, at: 1, name: 'Afterglow', blurb: 'Dust ×2, and bodies can buy themselves.' },
  { layer: 1, at: 2, name: 'Metronome', blurb: 'An auto-tapper: 5 taps a second.' },
  { layer: 1, at: 4, name: 'Quartermaster', blurb: 'Dust upgrades can buy themselves.' },
  { layer: 1, at: 10, name: 'Warm Start', blurb: 'Every run starts with 10,000 more dust.' },
  { layer: 1, at: 25, name: 'Bright Eyes', blurb: 'Starlight ×1.5.' },
  { layer: 1, at: 100, name: 'Daybreak', blurb: 'You gain 1% of the starlight an Ignite would pay, every second.' },
  { layer: 1, at: 200, name: 'Wildfire', blurb: 'Starlight ×3.' },
  { layer: 2, at: 1, name: 'Pilot Light', blurb: 'Ignite can happen by itself, and challenges open.' },
  { layer: 2, at: 2, name: 'Stargazer', blurb: 'Constellation stars can buy themselves.' },
  { layer: 2, at: 3, name: 'Fixed Stars', blurb: 'The constellation is kept through a Collapse.' },
  { layer: 2, at: 10, name: 'Noon', blurb: '10% more of that starlight, every second.' },
  { layer: 2, at: 15, name: 'Heavy', blurb: 'Dark matter ×2.' },
  { layer: 2, at: 50, name: 'Singularity', blurb: 'Dark matter ×3.' },
  { layer: 3, at: 1, name: 'Undertow', blurb: 'Collapse can happen by itself, and void upgrades can buy themselves.' },
  { layer: 3, at: 2, name: 'Third Hand', blurb: 'One more relic can be worn.' },
  { layer: 3, at: 3, name: 'Seep', blurb: 'You gain 1% of the dark matter a Collapse would pay, every second.' },
  { layer: 3, at: 5, name: 'Fourth Hand', blurb: 'One more relic can be worn.' },
  { layer: 3, at: 15, name: 'Fifth Hand', blurb: 'One more relic can be worn.' },
  { layer: 3, at: 40, name: 'Cosmic Web', blurb: 'Galaxies ×2.' },
  { layer: 4, at: 1, name: 'Wheel of Time', blurb: 'The Big Bang can happen by itself.' },
  { layer: 4, at: 2, name: 'Sixth Hand', blurb: 'One more relic can be worn.' },
  { layer: 4, at: 3, name: 'Spiral', blurb: 'You gain 1% of the galaxies a Big Bang would pay, every second.' },
  { layer: 4, at: 5, name: 'Old Light', blurb: 'Everything runs twice as fast.' },
  { layer: 4, at: 10, name: 'Eternal Return', blurb: 'Aeons ×2.' },
];

export const timesDone = (s: CosmosSave, layer: Layer) => (layer === 1 ? s.ignitesAll : layer === 2 ? s.collapsesAll : layer === 3 ? s.bangsAll : s.transcends);
const mile = (s: CosmosSave, layer: Layer, at: number) => timesDone(s, layer) >= at;

const AUTO_NEED: Record<AutoKey, [Layer, number]> = { bodies: [1, 1], ups: [1, 4], nodes: [2, 2], ignite: [2, 1], voids: [3, 1], collapse: [3, 1], bang: [4, 1] };
export const AUTO_NAME: Record<AutoKey, string> = { bodies: 'Buy bodies', ups: 'Buy dust upgrades', nodes: 'Buy constellation stars', ignite: 'Ignite', voids: 'Buy void upgrades', collapse: 'Collapse', bang: 'Big Bang' };
export const autoOpen = (s: CosmosSave, k: AutoKey) => mile(s, ...AUTO_NEED[k]);
export const autoOn = (s: CosmosSave, k: AutoKey) => autoOpen(s, k) && s.auto[k] !== false;
export const autoNeed = (k: AutoKey) => MILES.find((m) => m.layer === AUTO_NEED[k][0] && m.at === AUTO_NEED[k][1])!;

export const relicSlots = (s: CosmosSave) => 2 + (mile(s, 3, 2) ? 1 : 0) + (mile(s, 3, 5) ? 1 : 0) + (mile(s, 3, 15) ? 1 : 0) + (mile(s, 4, 2) ? 1 : 0) + lvOf(s.asc, 'wide') + (hasLab(s, 'r_relic') ? 1 : 0);

// ─── achievements (each: dust ×1.05, for good) ──────────────────────────────

export interface Feat {
  id: string;
  name: string;
  blurb: string;
  ok: (s: CosmosSave) => boolean;
}

const totalBodies = (s: CosmosSave) => Object.values(s.gens).reduce((a, n) => a + n, 0);
const totalTiers = (s: CosmosSave) => Object.values(s.chals).reduce((a, n) => a + n, 0);
const relicCount = (s: CosmosSave) => RELICS.filter((r) => lvOf(s.relics, r.id) > 0).length;
const lifeFeat = (e: number, name: string): Feat => ({ id: `life${e}`, name, blurb: `Gather ${fmt(10 ** e)} dust in all.`, ok: (s) => s.life >= 10 ** e });

export const FEATS: Feat[] = [
  lifeFeat(3, 'A Pinch'),
  lifeFeat(6, 'A Handful'),
  lifeFeat(9, 'A Dune'),
  lifeFeat(12, 'A Desert'),
  lifeFeat(18, 'A Moon’s Worth'),
  lifeFeat(30, 'A Sun’s Worth'),
  lifeFeat(50, 'A Galaxy’s Worth'),
  lifeFeat(100, 'Googol'),
  lifeFeat(200, 'More Than There Is'),
  { id: 'tap100', name: 'Knock Knock', blurb: 'Tap 100 times.', ok: (s) => s.taps >= 100 },
  { id: 'tap1k', name: 'Woodpecker', blurb: 'Tap 1,000 times.', ok: (s) => s.taps >= 1000 },
  { id: 'tap10k', name: 'Drum Solo', blurb: 'Tap 10,000 times.', ok: (s) => s.taps >= 10000 },
  { id: 'crit100', name: 'Bright Idea', blurb: 'Land 100 bright taps.', ok: (s) => s.crits >= 100 },
  { id: 'b50', name: 'Busy Sky', blurb: 'Have 50 bodies in orbit.', ok: (s) => totalBodies(s) >= 50 },
  { id: 'b300', name: 'Traffic', blurb: 'Have 300 bodies in orbit.', ok: (s) => totalBodies(s) >= 300 },
  { id: 'b1000', name: 'Swarm', blurb: 'Have 1,000 bodies in orbit.', ok: (s) => totalBodies(s) >= 1000 },
  { id: 'one100', name: 'Specialist', blurb: 'Have 100 of one body.', ok: (s) => Object.values(s.gens).some((n) => n >= 100) },
  { id: 'all8', name: 'Full House', blurb: 'Have one of each of the first eight bodies.', ok: (s) => BODIES.filter((b) => !b.twin).every((b) => lvOf(s.gens, b.id) > 0) },
  { id: 'ig1', name: 'Let There Be Light', blurb: 'Ignite.', ok: (s) => s.ignitesAll >= 1 },
  { id: 'ig10', name: 'Serial Arsonist', blurb: 'Ignite 10 times.', ok: (s) => s.ignitesAll >= 10 },
  { id: 'ig100', name: 'Lamplighter', blurb: 'Ignite 100 times.', ok: (s) => s.ignitesAll >= 100 },
  { id: 'ig1000', name: 'Lighthouse', blurb: 'Ignite 1,000 times.', ok: (s) => s.ignitesAll >= 1000 },
  { id: 'n6', name: 'Dot to Dot', blurb: 'Light 6 stars of the constellation.', ok: (s) => s.nodes.length >= 6 },
  { id: 'nall', name: 'Cartographer', blurb: 'Light the whole constellation.', ok: (s) => s.nodes.length >= NODES.length },
  { id: 'co1', name: 'Into the Dark', blurb: 'Collapse.', ok: (s) => s.collapsesAll >= 1 },
  { id: 'co10', name: 'Gravity’s Friend', blurb: 'Collapse 10 times.', ok: (s) => s.collapsesAll >= 10 },
  { id: 'co100', name: 'Regular Customer', blurb: 'Collapse 100 times.', ok: (s) => s.collapsesAll >= 100 },
  { id: 'ch1', name: 'Handicap', blurb: 'Finish a challenge tier.', ok: (s) => totalTiers(s) >= 1 },
  { id: 'ch6', name: 'Six of One', blurb: 'Finish 6 challenge tiers.', ok: (s) => totalTiers(s) >= 6 },
  { id: 'chEach', name: 'All-rounder', blurb: 'Finish a tier of every challenge.', ok: (s) => CHALLENGES.every((c) => chalTier(s, c.id) >= 1) },
  { id: 'ch30', name: 'Nothing Left to Prove', blurb: 'Finish 30 challenge tiers.', ok: (s) => totalTiers(s) >= 30 },
  { id: 'bb1', name: 'Bang', blurb: 'Set off a Big Bang.', ok: (s) => s.bangsAll >= 1 },
  { id: 'bb5', name: 'Encore', blurb: 'Set off 5 Big Bangs.', ok: (s) => s.bangsAll >= 5 },
  { id: 'bb25', name: 'Steady State', blurb: 'Set off 25 Big Bangs.', ok: (s) => s.bangsAll >= 25 },
  { id: 're1', name: 'Souvenir', blurb: 'Own a relic.', ok: (s) => relicCount(s) >= 1 },
  { id: 're5', name: 'Collector', blurb: 'Own 5 relics.', ok: (s) => relicCount(s) >= 5 },
  { id: 'reAll', name: 'Curator', blurb: 'Own every relic.', ok: (s) => relicCount(s) >= RELICS.length },
  { id: 'reMax', name: 'Polished', blurb: 'Raise a relic to level 5.', ok: (s) => RELICS.some((r) => lvOf(s.relics, r.id) >= RELIC_MAX) },
  { id: 'tr1', name: 'Beyond', blurb: 'Transcend.', ok: (s) => s.transcends >= 1 },
  { id: 'tr5', name: 'Old Soul', blurb: 'Transcend 5 times.', ok: (s) => s.transcends >= 5 },
  { id: 'twin', name: 'Binary', blurb: 'Light the Second Sun.', ok: (s) => lvOf(s.asc, 'twin') > 0 },
  { id: 'bodhi', name: 'Enlightened', blurb: 'Reach Enlightenment.', ok: (s) => lvOf(s.asc, 'bodhi') > 0 },
  lifeFeat(75, 'A Supercluster'),
  lifeFeat(150, 'Past Counting'),
  lifeFeat(250, 'Near the Edge'),
  { id: 'b5000', name: 'Clouded Sky', blurb: 'Have 5,000 bodies in orbit.', ok: (s) => totalBodies(s) >= 5000 },
  { id: 'tree', name: 'Roots', blurb: 'Plant a World Tree.', ok: (s) => lvOf(s.gens, 'tree') > 0 },
  { id: 'st1', name: 'Make a Wish', blurb: 'Catch a shooting star.', ok: (s) => s.caught >= 1 },
  { id: 'st25', name: 'Butterfly Net', blurb: 'Catch 25 shooting stars.', ok: (s) => s.caught >= 25 },
  { id: 'st100', name: 'Comet Hunter', blurb: 'Catch 100 shooting stars.', ok: (s) => s.caught >= 100 },
  { id: 'st500', name: 'Meteor Shower', blurb: 'Catch 500 shooting stars.', ok: (s) => s.caught >= 500 },
  { id: 'both', name: 'Lucky Streak', blurb: 'Have a Frenzy and a Rush at once.', ok: (s) => (s.boosts.both ?? 0) > 0 },
  { id: 'sh10', name: 'Glitter', blurb: 'Earn 10 shards.', ok: (s) => s.shardsAll >= 10 },
  { id: 'sh100', name: 'Stained Glass', blurb: 'Earn 100 shards.', ok: (s) => s.shardsAll >= 100 },
  { id: 'sh1000', name: 'Kaleidoscope', blurb: 'Earn 1,000 shards.', ok: (s) => s.shardsAll >= 1000 },
  { id: 'orr1', name: 'Tinkerer', blurb: 'Fit a part to the Orrery.', ok: (s) => Object.keys(s.orr).length >= 1 },
  { id: 'orrMax', name: 'Watchmaker', blurb: 'Raise an Orrery part to its top.', ok: (s) => ORRERY.some((u) => u.max > 1 && lvOf(s.orr, u.id) >= u.max) },
  { id: 'orrAll', name: 'Clockwork Heavens', blurb: 'Fit every part of the Orrery.', ok: (s) => ORRERY.every((u) => lvOf(s.orr, u.id) > 0) },
  { id: 'bo1', name: 'Odd Job', blurb: 'Finish a bounty.', ok: (s) => s.bountiesDone >= 1 },
  { id: 'bo10', name: 'For Hire', blurb: 'Finish 10 bounties.', ok: (s) => s.bountiesDone >= 10 },
  { id: 'bo50', name: 'Bounty Hunter', blurb: 'Finish 50 bounties.', ok: (s) => s.bountiesDone >= 50 },
  { id: 'bo200', name: 'Legend of the Board', blurb: 'Finish 200 bounties.', ok: (s) => s.bountiesDone >= 200 },
  { id: 'lab1', name: 'Eureka', blurb: 'Finish a piece of research.', ok: (s) => s.labs.length >= 1 },
  { id: 'lab8', name: 'Lab Coat', blurb: 'Finish 8 pieces of research.', ok: (s) => s.labs.length >= 8 },
  { id: 'labAll', name: 'Encyclopaedia', blurb: 'Finish every piece of research.', ok: (s) => s.labs.length >= LABS.length },
  { id: 'day1', name: 'Good Morning', blurb: 'Claim the daily alignment.', ok: (s) => s.dailyAll >= 1 },
  { id: 'day7', name: 'Like Clockwork', blurb: 'Claim the alignment 7 days in a row.', ok: (s) => s.dailyRun >= 7 },
  { id: 'ch40', name: 'Iron Will', blurb: 'Finish 40 challenge tiers.', ok: (s) => totalTiers(s) >= 40 },
  { id: 'tr10', name: 'Wheel Turns', blurb: 'Transcend 10 times.', ok: (s) => s.transcends >= 10 },
  { id: 'tr25', name: 'Kalpa', blurb: 'Transcend 25 times.', ok: (s) => s.transcends >= 25 },
];
export const FEAT_MULT = 1.05;

// ─── what real life adds ────────────────────────────────────────────────────

/** Sections logged today, the day streak and your level all make more dust. */
export const lifeMult = (e: Ext) => (1 + 0.15 * Math.max(0, e.sections)) * (1 + Math.min(100, Math.max(0, e.streak)) / 100) * (1 + Math.max(0, e.level) / 100);

// ─── multipliers ────────────────────────────────────────────────────────────

/** A constellation star that is lit and doing something (they all go dark in Lights Out). */
const lit = (s: CosmosSave, id: string) => !inChal(s, 'dim') && s.nodes.includes(id);

export const speed = (s: CosmosSave) => 1.2 ** lvOf(s.voids, 'dilate') * 1.5 ** worn(s, 'glass') * 1.5 ** lvOf(s.asc, 'swift') * 1.15 ** chalTier(s, 'decay') * (mile(s, 4, 5) ? 2 : 1);

/** What each doubling at 10 and every 25 of a body is really worth. */
export const resonance = (s: CosmosSave) => (lit(s, 'harmony') ? 2.25 : 2) + 0.15 * chalTier(s, 'lone') + 0.25 * worn(s, 'fork') + (hasLab(s, 'r_reso') ? 0.05 : 0);
export const resoSteps = (n: number) => (n >= 10 ? 1 : 0) + (n >= 25 ? 1 : 0) + Math.floor(n / 50);
/** How many more of a body until its next resonance. */
export const resoNext = (n: number) => (n < 10 ? 10 : n < 25 ? 25 : (Math.floor(n / 50) + 1) * 50);

export const growth = (s: CosmosSave) => (inChal(s, 'steep') ? 1.4 : Math.max(1.07, 1.15 - (lit(s, 'tides') ? 0.015 : 0) - 0.005 * chalTier(s, 'steep')));
const discount = (s: CosmosSave) => (0.96 ** lvOf(s.ups, 'drift') * (lit(s, 'cradle') ? 0.85 : 1) * (hasLab(s, 'r_cheap') ? 0.5 : 1)) / 100 ** worn(s, 'abacus');

export const bodyOpen = (s: CosmosSave, b: Body) => (!b.twin || lvOf(s.asc, 'twin') > 0) && !(inChal(s, 'lone') && BODIES.indexOf(b) >= 4);

/** Dust a second from one kind of body, before the multipliers on all dust. */
export function bodyRate(s: CosmosSave, b: Body): number {
  const n = lvOf(s.gens, b.id);
  if (!n) return 0;
  const lab = hasLab(s, BODY_LAB[b.id] ?? '') ? 2 : 1;
  return fin(n * b.rate * resonance(s) ** resoSteps(n) * 2 ** chalTier(s, 'hands') * lab * (inChal(s, 'frail') ? 0.01 : 1));
}

export interface Part {
  name: string;
  mult: number;
}

/** Everything that multiplies dust, taps and orbit alike, by where it comes from. */
export function dustParts(s: CosmosSave, ext: Ext, now: number): Part[] {
  const dim = inChal(s, 'dim');
  const runMin = Math.min(10, Math.max(0, now - s.runAt) / 60000);
  let ups = 1.25 ** lvOf(s.ups, 'lens');
  ups *= 1 + 0.004 * lvOf(s.ups, 'chord') * totalBodies(s);
  ups *= 1 + 0.2 * lvOf(s.ups, 'hoard') * Math.log10(1 + s.dust);
  ups *= 1 + 0.125 * lvOf(s.ups, 'swell') * runMin;
  let stars = 1;
  if (lit(s, 'polaris')) stars *= 3;
  if (lit(s, 'chorus')) stars *= 1 + 0.1 * Math.min(100, s.ignites);
  if (lit(s, 'halo')) stars *= (1 + Math.log10(1 + s.light)) ** 1.5;
  if (lit(s, 'giant')) stars *= 8;
  if (lit(s, 'super')) stars *= 20;
  if (lit(s, 'hyper')) stars *= 50;
  return [
    { name: 'Real life', mult: lifeMult(ext) },
    { name: 'Feats', mult: FEAT_MULT ** s.done.length },
    { name: 'Shooting star (Frenzy)', mult: boostOn(s, 'frenzy', now) ? FRENZY : 1 },
    { name: 'Orrery', mult: 1.35 ** lvOf(s.orr, 'gears') },
    { name: 'Challenges', mult: 3 ** chalTier(s, 'cost') },
    { name: 'Dust upgrades', mult: fin(ups) },
    { name: 'Starlight earned', mult: (dim ? 1 : Math.sqrt(1 + s.lightRun)) * (mile(s, 1, 1) ? 2 : 1) },
    { name: 'Constellation', mult: fin(stars) },
    { name: 'Dark matter', mult: fin(2 ** lvOf(s.voids, 'density') * (1 + s.darkRun) ** 0.25) },
    { name: 'Galaxies', mult: fin(Math.sqrt(1 + s.galRun) * 10 ** worn(s, 'mirror')) },
    { name: 'Aeons', mult: fin((1 + s.eonAll) ** 3 * (lvOf(s.asc, 'bodhi') ? 1e10 : 1)) },
  ];
}

export const dustMult = (s: CosmosSave, ext: Ext, now: number): number => fin(dustParts(s, ext, now).reduce((m, p) => m * p.mult, 1));

/** Challenge handicaps on dust actually gathered. */
function shape(s: CosmosSave, x: number, now: number): number {
  let v = x;
  if (inChal(s, 'thin')) v = v ** 0.8;
  if (inChal(s, 'decay')) v *= 0.5 ** (Math.max(0, now - s.runAt) / 45000);
  return fin(v);
}

/** Dust a second from everything in orbit (not counting the speed of time). */
export function orbitRate(s: CosmosSave, ext: Ext, now: number): number {
  let r = 0;
  for (const b of BODIES) r += bodyRate(s, b);
  return shape(s, r * dustMult(s, ext, now), now);
}

export const critChance = (s: CosmosSave) => Math.min(0.9, 0.02 + 0.04 * lvOf(s.ups, 'spark') + (lit(s, 'flare') ? 0.05 : 0) + 0.08 * worn(s, 'dice') + (hasLab(s, 'r_crit') ? 0.05 : 0));
export const critMult = (s: CosmosSave) => (lit(s, 'flare') ? 40 : 10) * 5 ** worn(s, 'dice') * (hasLab(s, 'r_crit') ? 2 : 1);

/** Dust from one tap. */
export function tapValue(s: CosmosSave, ext: Ext, now: number, crit = false): number {
  if (inChal(s, 'hands')) return 0;
  const hand = 2 ** lvOf(s.ups, 'focus') * (lit(s, 'kindle') ? 5 : 1) * 10 ** lvOf(s.voids, 'touch') * 10 ** worn(s, 'metro') * (hasLab(s, 'r_tap') ? 5 : 1) * 10 ** chalTier(s, 'frail') * (boostOn(s, 'rush', now) ? RUSH : 1);
  const v = shape(s, hand * dustMult(s, ext, now), now) + 0.03 * lvOf(s.ups, 'tide') * orbitRate(s, ext, now);
  return fin(v * (crit ? critMult(s) : 1));
}

/** Taps a second the auto-tapper makes. */
export const autoTaps = (s: CosmosSave) => (mile(s, 1, 2) && !inChal(s, 'hands') ? 5 * (lit(s, 'pulse') ? 4 : 1) * (worn(s, 'metro') ? 3 : 1) * 2 ** lvOf(s.voids, 'arc') * (hasLab(s, 'r_auto') ? 3 : 1) : 0);

/** Dust a second, all told: orbit and auto-tapper, at the speed time runs. */
export function rateNow(s: CosmosSave, ext: Ext, now: number): number {
  const taps = autoTaps(s);
  const tap = taps ? tapValue(s, ext, now) * (1 + critChance(s) * (critMult(s) - 1)) * taps : 0;
  return fin((orbitRate(s, ext, now) + tap) * speed(s));
}

// ─── what each layer would pay ──────────────────────────────────────────────

export const NEED = { ignite: 1e9, collapse: 1e11, bang: 1e14, transcend: 2e4 } as const;

export const LIGHT_EXP = 0.4;
export function lightMult(s: CosmosSave): number {
  let m = (lit(s, 'prism') ? 2 : 1) * (lit(s, 'spectrum') ? 3 : 1) * (lit(s, 'corona') ? 5 : 1) * (lit(s, 'zenith') ? 10 : 1) * (mile(s, 1, 25) ? 1.5 : 1) * (mile(s, 1, 200) ? 3 : 1);
  m *= 1.25 ** lvOf(s.orr, 'grind') * (hasLab(s, 'r_light') ? 1.5 : 1);
  m *= 2 ** lvOf(s.voids, 'lumin') * (1 + s.galRun) ** 0.25 * 5 ** worn(s, 'chart') * (1 + s.eonAll) ** 2 * 2 ** chalTier(s, 'thin');
  return fin(m);
}
export const lightGain = (s: CosmosSave) => (s.runDust < NEED.ignite ? 0 : fin(Math.floor((s.runDust / NEED.ignite) ** LIGHT_EXP * lightMult(s))));

export function darkMult(s: CosmosSave): number {
  return fin(1.5 ** lvOf(s.voids, 'energy') * (lit(s, 'horizon') ? 3 : 1) * (mile(s, 2, 15) ? 2 : 1) * (mile(s, 2, 50) ? 3 : 1) * 2 ** worn(s, 'lantern') * (1 + s.eonAll) * 2 ** chalTier(s, 'dim') * 1.3 ** lvOf(s.orr, 'well') * (hasLab(s, 'r_dark') ? 1.5 : 1));
}
export const darkGain = (s: CosmosSave) => (s.lightRun < NEED.collapse || s.chal ? 0 : fin(Math.floor((s.lightRun / NEED.collapse) ** 0.2 * darkMult(s))));

export const galMult = (s: CosmosSave) => fin(1.5 ** worn(s, 'crown') * 2 ** lvOf(s.asc, 'rich') * Math.sqrt(1 + s.eonAll) * (mile(s, 3, 40) ? 2 : 1) * 1.25 ** lvOf(s.orr, 'chart') * (hasLab(s, 'r_gal') ? 1.5 : 1));
export const galGain = (s: CosmosSave) => (s.darkRun < NEED.bang || s.chal ? 0 : fin(Math.floor((s.darkRun / NEED.bang) ** 0.2 * galMult(s))));

/** Galaxies a Transcend needs: 1.8 times as many each time it has been done. */
export const needTranscend = (s: CosmosSave) => fin(NEED.transcend * 1.8 ** Math.min(1100, s.transcends) * (hasLab(s, 'r_eon') ? 0.75 : 1));
export const eonGain = (s: CosmosSave) => (s.galRun < needTranscend(s) || s.chal ? 0 : Math.floor(1 + Math.log10(s.galRun / needTranscend(s))) * (mile(s, 4, 10) ? 2 : 1));

/** Shares of a layer's payout that arrive every second without doing it. */
export const lightDrip = (s: CosmosSave) => (mile(s, 1, 100) ? 0.01 : 0) + (mile(s, 2, 10) ? 0.1 : 0);
export const darkDrip = (s: CosmosSave) => (mile(s, 3, 3) ? 0.01 : 0) + (hasLab(s, 'r_drip') ? 0.01 : 0);
export const galDrip = (s: CosmosSave) => (mile(s, 4, 3) ? 0.01 : 0);

// ─── time passing ───────────────────────────────────────────────────────────

/** A gap longer than this is time away. */
export const AWAY_MS = 60_000;
export const awayHours = (s: CosmosSave) => 10 + (lit(s, 'vigil') ? 4 : 0) + 6 * worn(s, 'anchor') + 2 * lvOf(s.orr, 'watch') + (hasLab(s, 'r_away') ? 4 : 0);
export const awayEff = (s: CosmosSave) => ((lit(s, 'vigil') ? 1 : 0.6) + 0.1 * lvOf(s.orr, 'watch') + (hasLab(s, 'r_away') ? 0.15 : 0)) * (1 + worn(s, 'anchor'));

export interface Away {
  gap: number;
  worked: number;
  capped: boolean;
  eff: number;
  dust: number;
  light: number;
  dark: number;
  gal: number;
  /** Research that finished while you were away. */
  labs: string[];
}

function addDust(s: CosmosSave, n: number): CosmosSave {
  if (!(n > 0)) return s;
  return { ...s, dust: fin(s.dust + n), runDust: fin(s.runDust + n), life: fin(s.life + n) };
}

/** Bring the save up to `now`: dust from orbit and the auto-tapper, and anything that drips. */
export function settle(s0: CosmosSave, now: number, ext: Ext): { save: CosmosSave; away: Away | null } {
  const s = finishLabs(s0, now);
  const gap = now - s.at;
  if (gap <= 0) return { save: gap < 0 ? { ...s, at: now } : s, away: null };
  const away = gap > AWAY_MS;
  const secs = away ? Math.min(gap / 1000, awayHours(s) * 3600) : gap / 1000;
  const eff = away ? awayEff(s) : 1;
  const rate = rateNow(s, ext, now);
  const dust = rate * secs * eff;
  let next = addDust({ ...s, at: now }, dust);
  const t = secs * speed(s);
  const light = fin(lightGain(next) * lightDrip(next) * t);
  if (light > 0) next = { ...next, light: fin(next.light + light), lightRun: fin(next.lightRun + light), lightAll: fin(next.lightAll + light) };
  const dark = fin(darkGain(next) * darkDrip(next) * t);
  if (dark > 0) next = { ...next, dark: fin(next.dark + dark), darkRun: fin(next.darkRun + dark), darkAll: fin(next.darkAll + dark) };
  const gal = fin(galGain(next) * galDrip(next) * t);
  if (gal > 0) next = { ...next, gal: fin(next.gal + gal), galRun: fin(next.galRun + gal), galAll: fin(next.galAll + gal) };
  if (rate > next.best) next = { ...next, best: rate };
  const labs = next.labs.filter((id) => !s0.labs.includes(id));
  return { save: next, away: away ? { gap: gap / 1000, worked: secs, capped: gap / 1000 > secs, eff, dust, light, dark, gal, labs } : null };
}

/** Research whose time has come is done, and pays its shards. */
export function finishLabs(s: CosmosSave, now: number): CosmosSave {
  if (!s.lab.some((l) => l.end <= now)) return s;
  const done = s.lab.filter((l) => l.end <= now && !s.labs.includes(l.id)).map((l) => l.id);
  const pay = done.reduce((n, id) => n + (labById(id)?.pay ?? 0), 0);
  return { ...s, lab: s.lab.filter((l) => l.end > now), labs: [...s.labs, ...done], shards: s.shards + pay, shardsAll: s.shardsAll + pay };
}

/** What would be waiting if it were opened now (for the Home door). */
export const waiting = (s: CosmosSave, now: number, ext: Ext) => settle(s, now, ext).save.dust - s.dust;

// ─── doing things ───────────────────────────────────────────────────────────

/** One tap. `roll` in [0, 1) decides a bright one. */
export function tap(s: CosmosSave, now: number, ext: Ext, roll: number): { save: CosmosSave; gain: number; crit: boolean } {
  const crit = roll < critChance(s);
  const gain = tapValue(s, ext, now, crit);
  return { save: addDust({ ...s, taps: s.taps + 1, crits: s.crits + (crit && gain > 0 ? 1 : 0) }, gain), gain, crit: crit && gain > 0 };
}

/** What the next `n` of a body cost together. */
export function bodyCost(s: CosmosSave, id: string, n = 1): number {
  const b = bodyById(id);
  if (!b || n < 1) return Infinity;
  const g = growth(s);
  return fin(Math.ceil(b.cost * discount(s) * g ** lvOf(s.gens, id) * ((g ** n - 1) / (g - 1))));
}

/** How many of a body the dust in hand buys. */
export function maxBody(s: CosmosSave, id: string): number {
  const b = bodyById(id);
  if (!b || !bodyOpen(s, b)) return 0;
  const g = growth(s);
  const first = b.cost * discount(s) * g ** lvOf(s.gens, id);
  if (!(first > 0) || !Number.isFinite(first)) return 0;
  let n = Math.max(0, Math.floor(Math.log(1 + (s.dust * (g - 1)) / first) / Math.log(g)));
  n = Math.min(n, 1e6 - lvOf(s.gens, id));
  while (n > 0 && bodyCost(s, id, n) > s.dust) n--;
  return n;
}

export function buyBody(s: CosmosSave, id: string, n: number): CosmosSave | null {
  const b = bodyById(id);
  if (!b || !bodyOpen(s, b) || n < 1) return null;
  const cost = bodyCost(s, id, n);
  if (cost > s.dust) return null;
  return { ...s, dust: s.dust - cost, gens: { ...s.gens, [id]: lvOf(s.gens, id) + n }, bought: s.bought + n };
}

/** As many of everything as the dust buys, dearest first. */
export function buyAllBodies(s: CosmosSave): CosmosSave | null {
  let next = s;
  for (const b of [...BODIES].reverse()) {
    const n = maxBody(next, b.id);
    if (n > 0) next = buyBody(next, b.id, n) ?? next;
  }
  return next === s ? null : next;
}

type Purse = Coin | 'shards';
/** What the next level of a dust upgrade costs (Inflation makes it dearer). */
export const upCost = (s: CosmosSave, u: Levelled, lv: number) => fin(levelCost(u, lv) * (inChal(s, 'cost') ? 1e4 : 1));
function buyLevel(s: CosmosSave, list: Levelled[], rec: 'ups' | 'voids' | 'asc' | 'orr', purse: Purse, id: string): CosmosSave | null {
  const u = list.find((x) => x.id === id);
  if (!u) return null;
  const lv = lvOf(s[rec], id);
  const cost = list === UPS ? upCost(s, u, lv) : levelCost(u, lv);
  if (lv >= u.max || cost > s[purse]) return null;
  return { ...s, [purse]: s[purse] - cost, [rec]: { ...s[rec], [id]: lv + 1 } };
}

export const buyUp = (s: CosmosSave, id: string) => buyLevel(s, UPS, 'ups', 'dust', id);
export const buyVoid = (s: CosmosSave, id: string) => buyLevel(s, VOIDS, 'voids', 'dark', id);
export const buyAsc = (s: CosmosSave, id: string) => buyLevel(s, ASCS, 'asc', 'eon', id);
export const buyOrr = (s: CosmosSave, id: string) => buyLevel(s, ORRERY, 'orr', 'shards', id);

/** Every level the purse can pay for, cheapest first. */
function buyEvery(s: CosmosSave, list: Levelled[], buy: (s: CosmosSave, id: string) => CosmosSave | null): CosmosSave | null {
  let next = s;
  for (let guard = 0; guard < 2000; guard++) {
    let best: CosmosSave | null = null;
    let bestCost = Infinity;
    for (const u of list) {
      const rec = list === UPS ? next.ups : next.voids;
      const cost = list === UPS ? upCost(next, u, lvOf(rec, u.id)) : levelCost(u, lvOf(rec, u.id));
      if (cost < bestCost) {
        const got = buy(next, u.id);
        if (got) {
          best = got;
          bestCost = cost;
        }
      }
    }
    if (!best) break;
    next = best;
  }
  return next === s ? null : next;
}
export const buyEveryUp = (s: CosmosSave) => buyEvery(s, UPS, buyUp);
export const buyEveryVoid = (s: CosmosSave) => buyEvery(s, VOIDS, buyVoid);

export const nodeOpen = (s: CosmosSave, n: Node) => n.req.every((r) => s.nodes.includes(r));
export function buyNode(s: CosmosSave, id: string): CosmosSave | null {
  const n = nodeById(id);
  if (!n || s.nodes.includes(id) || !nodeOpen(s, n) || n.cost > s.light) return null;
  return { ...s, light: s.light - n.cost, nodes: [...s.nodes, id] };
}

export function buyRelic(s: CosmosSave, id: string): CosmosSave | null {
  const r = relicById(id);
  if (!r) return null;
  const lv = lvOf(s.relics, id);
  const cost = relicCost(r, lv);
  if (lv >= RELIC_MAX || cost > s.gal) return null;
  const worn = lv === 0 && s.worn.length < relicSlots(s) ? [...s.worn, id] : s.worn;
  return { ...s, gal: s.gal - cost, relics: { ...s.relics, [id]: lv + 1 }, worn };
}

/** Put a relic on, or take it off. */
export function wearRelic(s: CosmosSave, id: string): CosmosSave | null {
  if (!lvOf(s.relics, id)) return null;
  if (s.worn.includes(id)) return { ...s, worn: s.worn.filter((w) => w !== id) };
  if (s.worn.length >= relicSlots(s)) return null;
  return { ...s, worn: [...s.worn, id] };
}

export const setAuto = (s: CosmosSave, k: AutoKey, on: boolean): CosmosSave => ({ ...s, auto: { ...s.auto, [k]: on } });

// ─── research ───────────────────────────────────────────────────────────────

export function startLab(s: CosmosSave, id: string, now: number): CosmosSave | null {
  const r = labById(id);
  if (!r || hasLab(s, id) || s.lab.some((l) => l.id === id) || s.lab.length >= labSlots(s) || !labReady(s, r) || r.cost > s[r.coin]) return null;
  return { ...s, [r.coin]: s[r.coin] - r.cost, lab: [...s.lab, { id, end: now + Math.ceil(labMs(s, r)) }] };
}

/** Stop a piece of research: what it cost comes back. */
export function stopLab(s: CosmosSave, id: string): CosmosSave | null {
  const r = labById(id);
  if (!r || !s.lab.some((l) => l.id === id)) return null;
  return { ...s, [r.coin]: fin(s[r.coin] + r.cost), lab: s.lab.filter((l) => l.id !== id) };
}

// ─── shooting stars ─────────────────────────────────────────────────────────

/** Catch a shooting star. `roll` in [0, 1) decides the gift. */
export function catchStar(s: CosmosSave, now: number, ext: Ext, roll: number): { save: CosmosSave; gift: Gift } {
  const len = giftLen(s);
  const caught = { ...s, caught: s.caught + 1 };
  const boost = (k: 'frenzy' | 'rush', secs: number): CosmosSave => {
    const boosts = { ...live(caught.boosts, now), [k]: Math.max(caught.boosts[k] ?? 0, now) + Math.round(secs * len * 1000) };
    // Both at once: a mark for the feat, gone when the boosts are next tidied.
    if ((boosts.frenzy ?? 0) > now && (boosts.rush ?? 0) > now) boosts.both = now + 1;
    return { ...caught, boosts };
  };
  if (roll < 0.4) return { save: boost('frenzy', 60), gift: { k: 'frenzy', name: 'Frenzy', text: `Dust ×${FRENZY} for ${Math.round(60 * len)} seconds` } };
  if (roll < 0.7) {
    const dust = fin(rateNow({ ...s, boosts: {} }, ext, now) * 180 + 100);
    return { save: addDust(caught, dust), gift: { k: 'windfall', name: 'Windfall', text: `+${fmt(dust)} dust` } };
  }
  if (roll < 0.88) return { save: boost('rush', 30), gift: { k: 'rush', name: 'Rush', text: `Taps ×${RUSH} for ${Math.round(30 * len)} seconds` } };
  return { save: { ...caught, shards: caught.shards + 1, shardsAll: caught.shardsAll + 1 }, gift: { k: 'shard', name: 'A shard', text: '+1 shard' } };
}
/** Boosts still running. */
const live = (b: Record<string, number>, now: number) => Object.fromEntries(Object.entries(b).filter(([, t]) => t > now));

// ─── bounties ───────────────────────────────────────────────────────────────

/** The bounty numbered `n`, made for the save as it is. */
export function makeBounty(s: CosmosSave, n: number, rate: number): Bounty {
  const r = seeded(n);
  const kinds = BOUNTY_KINDS.filter((k) => k.open(s));
  const taken = new Set(s.bounties.map((b) => b.k));
  const pool = kinds.filter((k) => !taken.has(k.id));
  const list = pool.length ? pool : kinds;
  const k = list[Math.floor(r() * list.length)];
  const size = r();
  return { n, k: k.id, need: k.need(size, rate), from: k.count(s), pay: k.pay + (size >= 0.6 ? 1 : 0) + bountyBonus(s) };
}

/** Put bounties up until the board is full. */
export function fillBoard(s: CosmosSave, rate: number): CosmosSave {
  let next = s;
  while (next.bounties.length < boardSize(next)) {
    const b = makeBounty(next, next.bountyN + 1, rate);
    next = { ...next, bounties: [...next.bounties, b], bountyN: next.bountyN + 1 };
  }
  return next;
}

export function claimBounty(s: CosmosSave, n: number, rate: number): CosmosSave | null {
  const b = s.bounties.find((x) => x.n === n);
  if (!b || bountyHave(s, b) < b.need) return null;
  return fillBoard({ ...s, bounties: s.bounties.filter((x) => x.n !== n), shards: s.shards + b.pay, shardsAll: s.shardsAll + b.pay, bountiesDone: s.bountiesDone + 1 }, rate);
}

/** Take a bounty down and put up another (once every ten minutes). */
export function swapBounty(s: CosmosSave, n: number, now: number, rate: number): CosmosSave | null {
  if (!s.bounties.some((x) => x.n === n) || now - s.swapAt < SWAP_MS) return null;
  return fillBoard({ ...s, bounties: s.bounties.filter((x) => x.n !== n), swapAt: now }, rate);
}

// ─── the daily alignment ────────────────────────────────────────────────────

/** Which day in a row claiming on `day` would make. */
export const dailyRunOn = (s: CosmosSave, day: string) => (s.daily && s.daily === dayBefore(day) ? s.dailyRun + 1 : 1);

/** Claim today's alignment: shards (more for days in a row) and a two-minute Frenzy. */
export function claimDaily(s: CosmosSave, day: string, now: number): CosmosSave | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || s.daily >= day) return null;
  const run = dailyRunOn(s, day);
  const pay = dailyPay(run);
  return {
    ...s,
    daily: day,
    dailyRun: run,
    dailyAll: s.dailyAll + 1,
    shards: s.shards + pay,
    shardsAll: s.shardsAll + pay,
    boosts: { ...live(s.boosts, now), frenzy: Math.max(s.boosts.frenzy ?? 0, now) + 120_000 },
  };
}

// ─── starting again ─────────────────────────────────────────────────────────

/** A new run: what's in orbit and in hand after any reset. */
function newRun(s: CosmosSave, now: number): CosmosSave {
  const each = 10 * lvOf(s.voids, 'seed') + 20 * worn(s, 'vault');
  const gens: Record<string, number> = {};
  if (each) for (const b of BODIES) if (bodyOpen(s, b)) gens[b.id] = each;
  if (s.nodes.includes('ember')) gens.net = (gens.net ?? 0) + 5;
  const dust = (s.nodes.includes('ember') ? 2000 : 0) + (mile(s, 1, 25) ? 10000 : 0) + (lvOf(s.voids, 'seed') ? 100 * 10 ** lvOf(s.voids, 'seed') : 0);
  return { ...s, at: now, dust: fin(dust), runDust: 0, runAt: now, gens, ups: {} };
}

export function ignite(s: CosmosSave, now: number): CosmosSave | null {
  const gain = lightGain(s);
  if (gain < 1) return null;
  const run = newRun({ ...s, light: fin(s.light + gain), lightRun: fin(s.lightRun + gain), lightAll: fin(s.lightAll + gain), ignites: s.ignites + 1, ignitesAll: s.ignitesAll + 1 }, now);
  return lvOf(s.orr, 'keep') ? { ...run, ups: s.ups } : run;
}

/** Everything a Collapse takes away (also how a challenge begins). */
function collapsed(s: CosmosSave, now: number): CosmosSave {
  return newRun({ ...s, light: 0, lightRun: 0, nodes: mile(s, 2, 5) ? s.nodes : [], ignites: 0, colAt: now }, now);
}

export function collapse(s: CosmosSave, now: number): CosmosSave | null {
  const gain = darkGain(s);
  if (gain < 1) return null;
  return collapsed({ ...s, dark: fin(s.dark + gain), darkRun: fin(s.darkRun + gain), darkAll: fin(s.darkAll + gain), collapses: s.collapses + 1, collapsesAll: s.collapsesAll + 1 }, now);
}

function banged(s: CosmosSave, now: number): CosmosSave {
  const keep = lvOf(s.asc, 'memory') > 0;
  const dawn = lvOf(s.asc, 'dawn');
  const start = dawn ? 10 ** dawn : 0;
  return collapsed({ ...s, dark: start, darkRun: 0, voids: keep ? s.voids : {}, collapses: 0, bangAt: now, chal: null }, now);
}

export function bang(s: CosmosSave, now: number): CosmosSave | null {
  const gain = galGain(s);
  if (gain < 1) return null;
  return banged({ ...s, gal: fin(s.gal + gain), galRun: fin(s.galRun + gain), galAll: fin(s.galAll + gain), bangs: s.bangs + 1, bangsAll: s.bangsAll + 1 }, now);
}

export function transcend(s: CosmosSave, now: number): CosmosSave | null {
  const gain = eonGain(s);
  if (gain < 1) return null;
  return banged({ ...s, eon: s.eon + gain, eonAll: s.eonAll + gain, transcends: s.transcends + 1, gal: 0, galRun: 0, bangs: 0 }, now);
}

export const chalsOpen = (s: CosmosSave) => mile(s, 2, 2);

/** Begin a challenge: a Collapse that pays nothing, then the handicap until its goal is met. */
export function enterChal(s: CosmosSave, id: string, now: number): CosmosSave | null {
  const c = chalById(id);
  if (!c || !chalsOpen(s) || s.chal || chalTier(s, id) >= chalMax(s)) return null;
  return collapsed({ ...s, chal: id }, now);
}

/** Give up: the handicap goes, and what you have stays. */
export const leaveChal = (s: CosmosSave): CosmosSave | null => (s.chal ? { ...s, chal: null } : null);

/** New achievements, and a challenge whose goal has been met. */
export function check(s: CosmosSave): { save: CosmosSave; feats: Feat[]; won: { c: Challenge; tier: number } | null } {
  let next = s;
  let won: { c: Challenge; tier: number } | null = null;
  const c = s.chal ? chalById(s.chal) : undefined;
  if (c && s.runDust >= chalGoal(c, chalTier(s, c.id))) {
    const tier = chalTier(s, c.id) + 1;
    next = { ...next, chal: null, chals: { ...next.chals, [c.id]: tier } };
    won = { c, tier };
  }
  const feats = FEATS.filter((f) => !next.done.includes(f.id) && f.ok(next));
  if (feats.length) next = { ...next, done: [...next.done, ...feats.map((f) => f.id)] };
  return { save: next, feats, won };
}

// ─── automation ─────────────────────────────────────────────────────────────

/** One pass of whatever is switched on. Returns the same save when nothing was done. */
export function autoStep(s: CosmosSave, now: number): CosmosSave {
  let next = s;
  if (!next.chal) {
    if (autoOn(next, 'bang')) {
      const g = galGain(next);
      if (g >= 1 && (g >= next.galRun || now - next.bangAt >= 1_800_000)) next = bang(next, now) ?? next;
    }
    if (autoOn(next, 'collapse')) {
      const g = darkGain(next);
      if (g >= 1 && (g >= next.darkRun || now - next.colAt >= 600_000)) next = collapse(next, now) ?? next;
    }
  }
  if (autoOn(next, 'ignite')) {
    const g = lightGain(next);
    if (g >= 1 && (g >= next.lightRun || now - next.runAt >= 120_000)) next = ignite(next, now) ?? next;
  }
  if (autoOn(next, 'voids')) next = buyEveryVoid(next) ?? next;
  if (autoOn(next, 'nodes')) for (const n of NODES) next = buyNode(next, n.id) ?? next;
  if (autoOn(next, 'ups')) next = buyEveryUp(next) ?? next;
  if (autoOn(next, 'bodies')) next = buyAllBodies(next) ?? next;
  return next;
}

// ─── what's unlocked, for the screens ───────────────────────────────────────

/** A layer shows once you've done it, or are a good way towards it. */
export const layerSeen = (s: CosmosSave, layer: Layer) =>
  timesDone(s, layer) > 0 ||
  (layer === 1 ? s.life >= 1e6 : layer === 2 ? s.lightAll >= 1e3 : layer === 3 ? s.darkAll >= 1e3 : s.galAll >= 50) ||
  (layer < 4 && timesDone(s, (layer + 1) as Layer) > 0);

/** How far the sky has come: 0 dust, 1 a star, 2 a black hole, 3 galaxies, 4 beyond, 5 gold. */
export const era = (s: CosmosSave) => (lvOf(s.asc, 'bodhi') ? 5 : s.transcends ? 4 : s.bangsAll ? 3 : s.collapsesAll ? 2 : s.ignitesAll ? 1 : 0);

// ─── reading a saved row ────────────────────────────────────────────────────

const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.min(x, CAP) : 0);
const int = (x: unknown) => Math.floor(num(x));
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function readBounties(x: unknown): Bounty[] {
  if (!Array.isArray(x)) return [];
  const out: Bounty[] = [];
  for (const b of x) {
    if (!b || typeof b !== 'object') continue;
    const o = b as Record<string, unknown>;
    if (typeof o.k !== 'string' || !bountyKind(o.k) || out.some((y) => y.n === int(o.n))) continue;
    out.push({ n: int(o.n), k: o.k, need: Math.max(1, num(o.need)), from: num(o.from), pay: Math.max(1, int(o.pay)) });
  }
  return out.slice(0, 5);
}

function readLab(x: unknown, done: string[]): { id: string; end: number }[] {
  if (!Array.isArray(x)) return [];
  const out: { id: string; end: number }[] = [];
  for (const l of x) {
    if (!l || typeof l !== 'object') continue;
    const o = l as Record<string, unknown>;
    if (typeof o.id === 'string' && labById(o.id) && !done.includes(o.id) && !out.some((y) => y.id === o.id)) out.push({ id: o.id, end: num(o.end) });
  }
  return out.slice(0, 2);
}

export function normaliseCosmos(v: unknown, now: number): CosmosSave {
  if (!v || typeof v !== 'object') return freshCosmos(now);
  const o = v as Record<string, unknown>;
  const counts = (x: unknown, max: (id: string) => number | undefined) => {
    const out: Record<string, number> = {};
    if (x && typeof x === 'object') {
      for (const [k, n] of Object.entries(x as Record<string, unknown>)) {
        const m = max(k);
        if (m !== undefined && int(n) > 0) out[k] = Math.min(int(n), m);
      }
    }
    return out;
  };
  const list = (x: unknown, ok: (id: string) => boolean) => (Array.isArray(x) ? [...new Set(x.filter((i): i is string => typeof i === 'string' && ok(i)))] : []);
  const maxOf = (l: Levelled[]) => (id: string) => l.find((u) => u.id === id)?.max;
  const time = (x: unknown) => Math.min(num(x) || now, now);
  const relics = counts(o.relics, (id) => (relicById(id) ? RELIC_MAX : undefined));
  const asc = counts(o.asc, maxOf(ASCS));
  const auto: Partial<Record<AutoKey, boolean>> = {};
  if (o.auto && typeof o.auto === 'object') for (const k of AUTO_KEYS) if (typeof (o.auto as Record<string, unknown>)[k] === 'boolean') auto[k] = (o.auto as Record<string, boolean>)[k];
  const s: CosmosSave = {
    v: 1,
    at: time(o.at),
    dust: num(o.dust),
    runDust: num(o.runDust),
    runAt: time(o.runAt),
    gens: counts(o.gens, (id) => (bodyById(id) ? 1e6 : undefined)),
    ups: counts(o.ups, maxOf(UPS)),
    light: num(o.light),
    lightRun: num(o.lightRun),
    nodes: list(o.nodes, (id) => !!nodeById(id)),
    ignites: int(o.ignites),
    colAt: time(o.colAt),
    dark: num(o.dark),
    darkRun: num(o.darkRun),
    voids: counts(o.voids, maxOf(VOIDS)),
    collapses: int(o.collapses),
    bangAt: time(o.bangAt),
    chal: typeof o.chal === 'string' && chalById(o.chal) ? o.chal : null,
    chals: counts(o.chals, (id) => (chalById(id) ? CHAL_TIERS + 5 : undefined)),
    gal: num(o.gal),
    galRun: num(o.galRun),
    bangs: int(o.bangs),
    relics,
    worn: [],
    eon: int(o.eon),
    eonAll: int(o.eonAll),
    asc,
    auto,
    life: num(o.life),
    taps: int(o.taps),
    crits: int(o.crits),
    ignitesAll: int(o.ignitesAll),
    collapsesAll: int(o.collapsesAll),
    bangsAll: int(o.bangsAll),
    transcends: int(o.transcends),
    lightAll: num(o.lightAll),
    darkAll: num(o.darkAll),
    galAll: num(o.galAll),
    done: list(o.done, (id) => FEATS.some((f) => f.id === id)),
    best: num(o.best),
    shards: int(o.shards),
    shardsAll: int(o.shardsAll),
    orr: counts(o.orr, maxOf(ORRERY)),
    boosts: counts(o.boosts, (id) => (id === 'frenzy' || id === 'rush' || id === 'both' ? CAP : undefined)),
    caught: int(o.caught),
    bought: int(o.bought),
    lab: [],
    labs: list(o.labs, (id) => !!labById(id)),
    bounties: readBounties(o.bounties),
    bountyN: int(o.bountyN),
    bountiesDone: int(o.bountiesDone),
    swapAt: Math.min(num(o.swapAt), now),
    daily: typeof o.daily === 'string' && DAY.test(o.daily) ? o.daily : '',
    dailyRun: int(o.dailyRun),
    dailyAll: int(o.dailyAll),
  };
  s.lab = readLab(o.lab, s.labs);
  s.worn = list(o.worn, (id) => !!relics[id]).slice(0, relicSlots(s));
  return s;
}

// ─── two copies of a save ───────────────────────────────────────────────────

const maxRec = (a: Record<string, number>, b: Record<string, number>) => {
  const out = { ...a };
  for (const [k, n] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, n);
  return out;
};
const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];

/** How far along a save is: the layers done, highest first, then dust ever gathered. */
const rank = (s: CosmosSave) => [s.transcends, s.bangsAll, s.collapsesAll, s.ignitesAll, s.life, s.at];
function ahead(x: CosmosSave, y: CosmosSave): boolean {
  const a = rank(x);
  const b = rank(y);
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
}

/**
 * Two devices' copies, merged: nothing either has reached for good is lost (relics, ascensions,
 * challenge tiers, achievements, lifetime counts), and the run in progress comes from the copy
 * that is further along. Runs of the same layer count pool what they have bought.
 */
export function mergeCosmos(x: CosmosSave, y: CosmosSave): CosmosSave {
  const [p, o] = ahead(x, y) ? [x, y] : [y, x];
  const sameBang = p.transcends === o.transcends && p.bangsAll === o.bangsAll;
  const sameCol = sameBang && p.collapsesAll === o.collapsesAll;
  const sameRun = sameCol && p.ignitesAll === o.ignitesAll && p.chal === o.chal;
  const relics = maxRec(p.relics, o.relics);
  const merged: CosmosSave = {
    ...p,
    at: Math.max(p.at, o.at),
    gens: sameRun ? maxRec(p.gens, o.gens) : p.gens,
    ups: sameRun ? maxRec(p.ups, o.ups) : p.ups,
    nodes: sameCol ? union(p.nodes, o.nodes) : p.nodes,
    voids: sameBang ? maxRec(p.voids, o.voids) : p.voids,
    chals: maxRec(p.chals, o.chals),
    relics,
    asc: maxRec(p.asc, o.asc),
    eonAll: Math.max(p.eonAll, o.eonAll),
    life: Math.max(p.life, o.life),
    taps: Math.max(p.taps, o.taps),
    crits: Math.max(p.crits, o.crits),
    ignitesAll: Math.max(p.ignitesAll, o.ignitesAll),
    collapsesAll: Math.max(p.collapsesAll, o.collapsesAll),
    bangsAll: Math.max(p.bangsAll, o.bangsAll),
    transcends: Math.max(p.transcends, o.transcends),
    lightAll: Math.max(p.lightAll, o.lightAll),
    darkAll: Math.max(p.darkAll, o.darkAll),
    galAll: Math.max(p.galAll, o.galAll),
    done: union(p.done, o.done),
    best: Math.max(p.best, o.best),
    shardsAll: Math.max(p.shardsAll, o.shardsAll),
    orr: maxRec(p.orr, o.orr),
    boosts: maxRec(p.boosts, o.boosts),
    caught: Math.max(p.caught, o.caught),
    bought: Math.max(p.bought, o.bought),
    labs: union(p.labs, o.labs),
    bountyN: Math.max(p.bountyN, o.bountyN),
    bountiesDone: Math.max(p.bountiesDone, o.bountiesDone),
    dailyAll: Math.max(p.dailyAll, o.dailyAll),
  };
  merged.lab = p.lab.filter((l) => !merged.labs.includes(l.id));
  // The alignment: the later day claimed, and its run.
  if (o.daily > p.daily || (o.daily === p.daily && o.dailyRun > p.dailyRun)) {
    merged.daily = o.daily;
    merged.dailyRun = o.dailyRun;
  }
  return merged;
}
