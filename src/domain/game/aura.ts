/**
 * 霊 The Aura Dial, a room in the Works: every roll of the dial lands on an aura, each "1 in N".
 * Rolls go on while you're away, upgrades make them faster and luckier, and the rare ones play a
 * scene the first time you see them.
 *
 * Everything here is a pure function of one save (`AuraSave`, one `gm_aura` row), the clock and a
 * random source. Luck works the usual way for this kind of game: from the rarest aura down, each has
 * a `luck / N` chance to be the one; the commonest takes whatever is left.
 */
import { fuelMult, streakMult, type Ext } from './idle';

// ─── the auras ──────────────────────────────────────────────────────────────

export type AuraTier = 0 | 1 | 2 | 3 | 4 | 5;

export const AURA_TIERS: { name: string; color: string; cogs: number }[] = [
  { name: 'Common', color: '#9aa5b1', cogs: 1 },
  { name: 'Uncommon', color: '#4ade80', cogs: 2 },
  { name: 'Rare', color: '#38bdf8', cogs: 4 },
  { name: 'Epic', color: '#c084fc', cogs: 8 },
  { name: 'Legendary', color: '#fbbf24', cogs: 15 },
  { name: 'Mythic', color: '#fb7185', cogs: 30 },
];

export interface Aura {
  id: string;
  name: string;
  kanji: string;
  /** One in this many, at luck ×1. */
  odds: number;
  tier: AuraTier;
  /** Its main colour. */
  c: string;
  blurb: string;
}

const tierOf = (odds: number): AuraTier => (odds < 100 ? 0 : odds < 2_000 ? 1 : odds < 40_000 ? 2 : odds < 1_000_000 ? 3 : odds < 40_000_000 ? 4 : 5);
const A = (id: string, name: string, kanji: string, odds: number, c: string, blurb: string): Aura => ({ id, name, kanji, odds, tier: tierOf(odds), c, blurb });

/** Commonest first. */
export const AURAS: Aura[] = [
  A('dust', 'Dust', '塵', 2, '#b8b2a7', 'What the factory floor gives everyone.'),
  A('steam', 'Steam', '蒸', 4, '#dfe7ee', 'A kettle went off somewhere near you.'),
  A('ember', 'Ember', '火', 8, '#ff8a3d', 'Sparks that never quite land.'),
  A('dew', 'Dew', '露', 16, '#7dd3fc', 'Morning, wherever you stand.'),
  A('moss', 'Moss', '苔', 32, '#84cc16', 'You stood still long enough.'),
  A('copper', 'Copper Glow', '銅', 64, '#d97745', 'Warm, like a pan left on the stove.'),
  A('lantern', 'Paper Lantern', '灯', 125, '#ffb84d', 'Festival lights that follow you home.'),
  A('rain', 'Passing Rain', '雨', 250, '#60a5fa', 'Your own small cloud.'),
  A('firefly', 'Firefly', '蛍', 500, '#d9f99d', 'They only come out for some people.'),
  A('sakura', 'Sakura Drift', '桜', 1_000, '#f9a8d4', 'Spring, all year.'),
  A('maple', 'Maple Fall', '楓', 2_500, '#ef4444', 'Red leaves, no tree in sight.'),
  A('tide', 'Tide', '潮', 5_000, '#22d3ee', 'The sea comes in at your ankles.'),
  A('static', 'Static', '電', 8_000, '#fde047', 'Do not touch the door handle.'),
  A('frost', 'Frost', '霜', 15_000, '#bae6fd', 'Six sides, no two alike.'),
  A('sumi', 'Sumi', '墨', 25_000, '#e5e5e5', 'One brush stroke, never lifted.'),
  A('koi', 'Koi Circle', '鯉', 50_000, '#fb923c', 'Two fish that have decided you are the pond.'),
  A('thunder', 'Thunderhead', '雷', 100_000, '#a78bfa', 'The storm asked to come along.'),
  A('foxfire', 'Foxfire', '狐', 200_000, '#5eead4', 'Blue flames a kitsune left behind.'),
  A('spring', 'Mainspring', '巻', 400_000, '#f5c451', 'Wound once. Still going.'),
  A('moon', 'Harvest Moon', '月', 750_000, '#fde68a', 'It rises behind you and nobody else.'),
  A('torii', 'Torii', '門', 1_500_000, '#e11d48', 'A gate that opens wherever you are.'),
  A('cranes', 'Thousand Cranes', '鶴', 3_000_000, '#f8fafc', 'Someone folded every one of them for you.'),
  A('veil', 'Polar Veil', '幕', 6_000_000, '#34d399', 'The sky hung a curtain in your honour.'),
  A('dragon', 'Dragon Vein', '龍', 12_000_000, '#4ade80', 'The river under the mountain surfaced.'),
  A('corona', 'Corona', '冠', 25_000_000, '#fb923c', 'The sun, with something in front of it.'),
  A('null', 'Null Pointer', '零', 50_000_000, '#22ff88', 'aura is undefined. And yet here it is.'),
  A('horizon', 'Event Horizon', '淵', 100_000_000, '#f97316', 'Light goes round you rather than through.'),
  A('orrery', 'Orrery', '儀', 250_000_000, '#eab308', 'The heavens, geared down to fit.'),
  A('banbutsu', 'Ten Thousand Things', '万', 500_000_000, '#f0abfc', 'Every other aura, at once.'),
  A('lastbolt', 'The Last Bolt', '螺', 1_000_000_000, '#ffd700', 'The one the whole Works was built to make.'),
];

const BY_ID = new Map(AURAS.map((a, i) => [a.id, i]));
export const auraById = (id: string | null | undefined): Aura | undefined => (id ? AURAS[BY_ID.get(id) ?? -1] : undefined);

/** Motes a roll of this aura is worth before the sieve. */
export const worth = (a: Aura) => Math.max(1, Math.round(Math.sqrt(a.odds)));

/** Rare and above get a scene. */
export const SCENE_TIER: AuraTier = 2;

// ─── upgrades ───────────────────────────────────────────────────────────────

export interface AuraUpgrade {
  id: string;
  name: string;
  kanji: string;
  blurb: string;
  max: number;
  /** Paid in motes, or in bolts from the factory floor. */
  cur: 'motes' | 'bolts';
  /** Price of the next level, from the level you have. */
  cost: (lv: number) => number;
}

const geo = (base: number, r: number) => (lv: number) => Math.ceil(base * r ** lv);

export const AURA_UPGRADES: AuraUpgrade[] = [
  { id: 'speed', name: 'Oiled Dial', kanji: '速', blurb: 'The dial rolls 10% sooner.', max: 30, cur: 'motes', cost: geo(10, 2) },
  { id: 'luck', name: 'Omamori', kanji: '守', blurb: 'Luck ×1.12.', max: 50, cur: 'motes', cost: geo(25, 1.57) },
  { id: 'sieve', name: 'Mote Sieve', kanji: '篩', blurb: 'Every roll leaves 15% more motes.', max: 30, cur: 'motes', cost: geo(40, 2) },
  { id: 'multi', name: 'Extra Dial', kanji: '重', blurb: 'One more roll every time the dial turns.', max: 9, cur: 'motes', cost: geo(500, 11) },
  { id: 'charge', name: 'Charged Roll', kanji: '溜', blurb: 'The charged roll is one luck multiple stronger.', max: 8, cur: 'motes', cost: geo(200, 9) },
  { id: 'fuse', name: 'Short Fuse', kanji: '短', blurb: 'The charged roll comes one roll sooner.', max: 5, cur: 'motes', cost: geo(2_000, 25) },
  { id: 'hand', name: 'Steady Hand', kanji: '手', blurb: 'Rolls you make yourself are one luck multiple stronger.', max: 8, cur: 'motes', cost: geo(100, 5) },
  { id: 'night', name: 'Night Dial', kanji: '夜', blurb: 'The dial keeps rolling 4 more hours while you are away.', max: 10, cur: 'motes', cost: geo(300, 4) },
  { id: 'sleep', name: 'Sleepwalker', kanji: '眠', blurb: 'It rolls 10% faster while you are away.', max: 5, cur: 'motes', cost: geo(1_000, 12) },
  { id: 'feed', name: 'Bolt Feed', kanji: '螺', blurb: 'Luck ×1.1. Paid in bolts from the factory floor.', max: 15, cur: 'bolts', cost: geo(1e5, 20) },
];

export const auraUpgradeById = (id: string) => AURA_UPGRADES.find((u) => u.id === id);

// ─── the save ───────────────────────────────────────────────────────────────

export interface AuraSave {
  v: 1;
  /** When rolls were last settled (ms). */
  at: number;
  motes: number;
  /** Motes ever made. */
  motesAll: number;
  /** Rolls ever made, and how many were by hand. */
  rolls: number;
  hand: number;
  /** Rolls since the last charged one. */
  n: number;
  /** Times each aura has been rolled. */
  got: Record<string, number>;
  /** The day each was first rolled. */
  first: Record<string, string>;
  ups: Record<string, number>;
  /** Rolls of incense left (luck ×2). */
  incense: number;
  /** The aura your robot wears on the dial. */
  worn: string | null;
  /** Scenes not watched yet, in the order to play them. */
  queue: string[];
}

export const freshAura = (now: number): AuraSave => ({ v: 1, at: now, motes: 0, motesAll: 0, rolls: 0, hand: 0, n: 0, got: {}, first: {}, ups: {}, incense: 0, worn: null, queue: [] });

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
const int = (v: unknown) => Math.floor(num(v));

/** Reads a stored save back, dropping anything this version doesn't know. */
export function normaliseAura(v: unknown, now: number): AuraSave {
  if (!v || typeof v !== 'object') return freshAura(now);
  const o = v as Record<string, unknown>;
  const rec = (x: unknown) => (x && typeof x === 'object' ? Object.entries(x as Record<string, unknown>) : []);
  const got: Record<string, number> = {};
  for (const [k, n] of rec(o.got)) if (BY_ID.has(k) && int(n) > 0) got[k] = int(n);
  const first: Record<string, string> = {};
  for (const [k, d] of rec(o.first)) if (got[k] && typeof d === 'string') first[k] = d.slice(0, 10);
  const ups: Record<string, number> = {};
  for (const [k, n] of rec(o.ups)) {
    const u = auraUpgradeById(k);
    if (u && int(n) > 0) ups[k] = Math.min(u.max, int(n));
  }
  const queue = Array.isArray(o.queue) ? [...new Set(o.queue.filter((i): i is string => typeof i === 'string' && !!got[i]))].slice(0, QUEUE_MAX) : [];
  return {
    v: 1,
    at: Math.min(num(o.at) || now, now),
    motes: num(o.motes),
    motesAll: num(o.motesAll),
    rolls: int(o.rolls),
    hand: int(o.hand),
    n: int(o.n),
    got,
    first,
    ups,
    incense: Math.min(INCENSE_MAX, int(o.incense)),
    worn: typeof o.worn === 'string' && got[o.worn] ? o.worn : null,
    queue,
  };
}

/** Auras rolled at least once, read straight from a stored row (for the factory's bonus and cogs). */
export function auraFoundIn(rowData: unknown): string[] {
  const got = rowData && typeof rowData === 'object' ? (rowData as { got?: unknown }).got : null;
  if (!got || typeof got !== 'object') return [];
  return Object.entries(got as Record<string, unknown>)
    .filter(([k, n]) => BY_ID.has(k) && int(n) > 0)
    .map(([k]) => k);
}

// ─── what the numbers come to ───────────────────────────────────────────────

const lv = (s: AuraSave, id: string) => s.ups[id] ?? 0;

export const foundCount = (s: AuraSave) => Object.keys(s.got).length;

/** Seconds between turns of the dial. */
export const intervalOf = (s: AuraSave) => 3 * 0.9 ** lv(s, 'speed');
/** Rolls each time it turns. */
export const multiOf = (s: AuraSave) => 1 + lv(s, 'multi');
export const rollsPerSecond = (s: AuraSave) => multiOf(s) / intervalOf(s);
export const sieveMult = (s: AuraSave) => 1.15 ** lv(s, 'sieve');

/** Each aura in the index adds this much luck. */
export const INDEX_LUCK = 0.02;
/** And this much to what the factory's machines make. */
export const INDEX_WORKS = 0.01;
export const worksBonus = (found: number) => 1 + INDEX_WORKS * found;

export const charmMult = (s: AuraSave) => 1.12 ** lv(s, 'luck') * 1.1 ** lv(s, 'feed');
export const indexMult = (s: AuraSave) => 1 + INDEX_LUCK * foundCount(s);
/** What real life adds: sections logged today and the streak, as on the factory floor. */
export const lifeMult = (e: Ext) => fuelMult(e) * streakMult(e);

/** Luck on a plain roll. */
export const luckOf = (s: AuraSave, ext: Ext) => charmMult(s) * indexMult(s) * lifeMult(ext);

/** The charged roll: every `chargeEvery`th roll has its luck times `chargeMult`. */
export const chargeEvery = (s: AuraSave) => 10 - lv(s, 'fuse');
export const chargeMult = (s: AuraSave) => 2 + lv(s, 'charge');
/** Rolls you make yourself. */
export const handMult = (s: AuraSave) => 2 + lv(s, 'hand');

export const INCENSE_ROLLS = 200;
export const INCENSE_MULT = 2;
export const INCENSE_MAX = 2_000;

export const awayHoursOf = (s: AuraSave) => 8 + 4 * lv(s, 'night');
export const awayEffOf = (s: AuraSave) => 0.5 + 0.1 * lv(s, 'sleep');
/** A gap longer than this counts as being away. */
export const AURA_AWAY_MS = 90_000;

/** The chance of each aura on one roll at this luck (same order as AURAS). */
export function chances(luck: number): number[] {
  const out = new Array<number>(AURAS.length).fill(0);
  let left = 1;
  for (let i = AURAS.length - 1; i > 0; i--) {
    const p = left * Math.min(1, luck / AURAS[i].odds);
    out[i] = p;
    left -= p;
  }
  out[0] = Math.max(0, left);
  return out;
}

/** Motes an average roll leaves at this luck. */
export function motesPerRoll(s: AuraSave, luck: number): number {
  const p = chances(luck);
  let m = 0;
  for (let i = 0; i < AURAS.length; i++) m += p[i] * worth(AURAS[i]);
  return m * sieveMult(s);
}

// ─── rolling ────────────────────────────────────────────────────────────────

export type Rng = () => number;

/** One roll: the index of the aura it lands on. */
export function rollOne(luck: number, rng: Rng): number {
  for (let i = AURAS.length - 1; i > 0; i--) if (rng() < luck / AURAS[i].odds) return i;
  return 0;
}

/** How many of `n` tries succeed at chance `p`: exact for small n, approximated for large. */
export function binomial(n: number, p: number, rng: Rng): number {
  if (n <= 0 || p <= 0) return 0;
  if (p >= 1) return n;
  if (n <= 64) {
    let k = 0;
    for (let i = 0; i < n; i++) if (rng() < p) k++;
    return k;
  }
  if (p > 0.5) return n - binomial(n, 1 - p, rng);
  const mean = n * p;
  if (mean < 24) {
    const stop = Math.exp(-mean);
    let k = 0;
    let x = rng();
    while (x > stop) {
      k++;
      x *= rng();
    }
    return Math.min(n, k);
  }
  const z = Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  return Math.max(0, Math.min(n, Math.round(mean + Math.sqrt(mean * (1 - p)) * z)));
}

/** `n` rolls at one luck, counted per aura without making them one by one. */
function rollBulk(n: number, luck: number, rng: Rng, counts: number[]) {
  let left = n;
  for (let i = AURAS.length - 1; i > 0 && left > 0; i--) {
    const k = binomial(left, Math.min(1, luck / AURAS[i].odds), rng);
    counts[i] += k;
    left -= k;
  }
  counts[0] += left;
}

/** Above this many rolls at once they are counted in bulk. */
const ONE_BY_ONE = 400;
export const QUEUE_MAX = 6;

export interface Ctx {
  ext: Ext;
  /** Today, for the day an aura was first rolled. */
  day: string;
  rng: Rng;
}

export interface Batch {
  save: AuraSave;
  rolls: number;
  motes: number;
  /** Aura id → times rolled in this batch. */
  counts: Record<string, number>;
  /** Rolled for the first time, rarest first. */
  fresh: string[];
  /** The rarest thing in the batch. */
  best: string | null;
}

/** Whether rolling this deserves its scene: new, or still a long shot at the luck you have. */
export const showy = (a: Aura, isNew: boolean, luck: number) => a.tier >= SCENE_TIER && (isNew || a.odds / luck >= 1_000);

/** Make `rolls` rolls. `hand` marks them as your own (stronger, and counted). */
export function rollBatch(s: AuraSave, rolls: number, ctx: Ctx, hand = false): Batch {
  rolls = Math.max(0, Math.floor(rolls));
  if (!rolls) return { save: s, rolls: 0, motes: 0, counts: {}, fresh: [], best: null };
  const base = luckOf(s, ctx.ext) * (hand ? handMult(s) : 1);
  const every = chargeEvery(s);
  const cm = chargeMult(s);
  const tally = new Array<number>(AURAS.length).fill(0);
  const smoke = Math.min(s.incense, rolls);
  const charged = Math.floor((s.n + rolls) / every);
  if (rolls <= ONE_BY_ONE) {
    let n = s.n;
    for (let i = 0; i < rolls; i++) {
      n++;
      let luck = base * (i < smoke ? INCENSE_MULT : 1);
      if (n >= every) {
        n = 0;
        luck *= cm;
      }
      tally[rollOne(luck, ctx.rng)]++;
    }
  } else {
    // Four kinds of roll, each at its own luck: with or without incense, charged or not.
    const bothN = Math.round((charged * smoke) / rolls);
    const kinds: [number, number][] = [
      [bothN, base * INCENSE_MULT * cm],
      [smoke - bothN, base * INCENSE_MULT],
      [charged - bothN, base * cm],
      [rolls - smoke - (charged - bothN), base],
    ];
    for (const [n, luck] of kinds) if (n > 0) rollBulk(n, luck, ctx.rng, tally);
  }
  const counts: Record<string, number> = {};
  const got = { ...s.got };
  const first = { ...s.first };
  const fresh: string[] = [];
  const scenes: string[] = [];
  const plain = luckOf(s, ctx.ext);
  let motes = 0;
  let best: string | null = null;
  for (let i = AURAS.length - 1; i >= 0; i--) {
    const k = tally[i];
    if (!k) continue;
    const a = AURAS[i];
    best ??= a.id;
    counts[a.id] = k;
    motes += k * worth(a);
    const isNew = !got[a.id];
    if (isNew) {
      fresh.push(a.id);
      first[a.id] = ctx.day;
    }
    got[a.id] = (got[a.id] ?? 0) + k;
    if (showy(a, isNew, plain)) scenes.push(a.id);
  }
  motes = Math.floor(motes * sieveMult(s));
  // New scenes go in rarest first, behind anything already waiting.
  const queue = scenes.length ? [...new Set([...s.queue, ...scenes])].slice(0, QUEUE_MAX) : s.queue;
  const save: AuraSave = {
    ...s,
    motes: s.motes + motes,
    motesAll: s.motesAll + motes,
    rolls: s.rolls + rolls,
    hand: s.hand + (hand ? rolls : 0),
    n: (s.n + rolls) % every,
    got,
    first,
    incense: s.incense - smoke,
    queue,
  };
  return { save, rolls, motes, counts, fresh, best };
}

export interface AuraAway {
  /** Seconds since the dial was last looked at. */
  gap: number;
  /** Seconds it kept rolling (the gap, up to the cap). */
  worked: number;
  capped: boolean;
  eff: number;
  rolls: number;
  motes: number;
  fresh: string[];
  best: string | null;
}

/**
 * Bring the save up to `now`. A short gap rolls at full speed and keeps the part-turn left over; a
 * long one rolls at the away rate, up to the cap, and is reported.
 */
export function settleAura(s: AuraSave, now: number, ctx: Ctx): { save: AuraSave; away: AuraAway | null; batch: Batch | null } {
  const gap = now - s.at;
  if (gap <= 0) return { save: gap < 0 ? { ...s, at: now } : s, away: null, batch: null };
  // Nothing rolls until the dial has been pulled once.
  if (!s.rolls) return { save: { ...s, at: now }, away: null, batch: null };
  const step = intervalOf(s) * 1000;
  if (gap > AURA_AWAY_MS) {
    const cap = awayHoursOf(s) * 3_600_000;
    const worked = Math.min(gap, cap);
    const eff = awayEffOf(s);
    const batch = rollBatch({ ...s, at: now }, Math.floor((worked * eff) / step) * multiOf(s), ctx);
    const away: AuraAway | null = batch.rolls ? { gap: gap / 1000, worked: worked / 1000, capped: gap > cap, eff, rolls: batch.rolls, motes: batch.motes, fresh: batch.fresh, best: batch.best } : null;
    return { save: batch.save, away, batch: batch.rolls ? batch : null };
  }
  const turns = Math.floor(gap / step);
  if (!turns) return { save: s, away: null, batch: null };
  const batch = rollBatch({ ...s, at: s.at + turns * step }, turns * multiOf(s), ctx);
  return { save: batch.save, away: null, batch };
}

/** Pull the dial yourself: one turn's worth of rolls, at your hand's luck. */
export const pull = (s: AuraSave, ctx: Ctx): Batch => rollBatch(s, multiOf(s), ctx, true);

// ─── spending ───────────────────────────────────────────────────────────────

export const upgradeCost = (s: AuraSave, id: string): number | null => {
  const u = auraUpgradeById(id);
  return u && lv(s, id) < u.max ? u.cost(lv(s, id)) : null;
};

/** Buy the next level. A bolt-priced one needs `bolts` (and the caller takes them off the floor). */
export function buyAuraUpgrade(s: AuraSave, id: string, bolts = 0): AuraSave | null {
  const u = auraUpgradeById(id);
  const cost = upgradeCost(s, id);
  if (!u || cost === null) return null;
  if (u.cur === 'bolts') return cost <= bolts ? { ...s, ups: { ...s.ups, [id]: lv(s, id) + 1 } } : null;
  if (cost > s.motes) return null;
  return { ...s, motes: s.motes - cost, ups: { ...s.ups, [id]: lv(s, id) + 1 } };
}

/** A stick of incense: the next 200 rolls at twice the luck. Priced at a quarter of what they'd leave. */
export const incenseCost = (s: AuraSave, ext: Ext) => Math.max(50, Math.ceil(0.25 * INCENSE_ROLLS * motesPerRoll(s, luckOf(s, ext))));

export function buyIncense(s: AuraSave, ext: Ext): AuraSave | null {
  const cost = incenseCost(s, ext);
  if (cost > s.motes || s.incense + INCENSE_ROLLS > INCENSE_MAX) return null;
  return { ...s, motes: s.motes - cost, incense: s.incense + INCENSE_ROLLS };
}

export const wear = (s: AuraSave, id: string | null): AuraSave => (id === null || s.got[id] ? { ...s, worn: id } : s);
export const watched = (s: AuraSave, id: string): AuraSave => (s.queue.includes(id) ? { ...s, queue: s.queue.filter((q) => q !== id) } : s);

// ─── what the index pays ────────────────────────────────────────────────────

/** Gold cogs the index has paid: so many for each aura rolled once, by how rare it is. Never stored. */
export const auraCogs = (found: string[]) => found.reduce((n, id) => n + (AURA_TIERS[auraById(id)?.tier ?? 0]?.cogs ?? 0), 0);

/** "1 in 1,500,000". */
export const oddsText = (a: Aura) => `1 in ${a.odds.toLocaleString('en-GB')}`;
