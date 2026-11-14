/**
 * 廠 The Works: a clockwork factory that keeps making bolts while you're away.
 *
 * Everything here is a pure function of one save (`IdleSave`) and the clock. The save is one
 * `gm_idle` row; it holds counts and lifetime totals, and the time bolts were last settled. Bolts
 * made since then are worked out when the factory is opened again (`settle`).
 *
 * Gold cogs pay for cosmetics. The save only counts cogs ever earned; what's been spent is the sum
 * of the `works` rows in the ledger (`cogsOf`), so a balance is never stored.
 */
import type { Rarity } from './catalog';

// ─── numbers ────────────────────────────────────────────────────────────────

const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/** 1234 → "1,234", 1.5e6 → "1.50M", past decillions → "1.2e40". */
export function fmt(n: number): string {
  if (!Number.isFinite(n)) return '∞';
  if (n < 0) return `-${fmt(-n)}`;
  if (n < 1000) return n < 10 && n % 1 !== 0 ? n.toFixed(1) : Math.floor(n).toString();
  if (n < 1e6) return Math.floor(n).toLocaleString('en-GB');
  const tier = Math.floor(Math.log10(n) / 3);
  if (tier >= SUFFIX.length) return n.toExponential(2).replace('+', '');
  const v = n / 10 ** (tier * 3);
  return `${v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)}${SUFFIX[tier]}`;
}

/** 3725 → "1 h 2 m". */
export function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s} s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? (m ? `${h} h ${m} m` : `${h} h`) : `${m} m`;
}

// ─── machines ───────────────────────────────────────────────────────────────

export interface Gen {
  id: string;
  name: string;
  kanji: string;
  blurb: string;
  /** Price of the first one. */
  cost: number;
  /** Bolts a second, each. */
  rate: number;
}

export const GENS: Gen[] = [
  { id: 'mouse', name: 'Wind-up Mouse', kanji: '鼠', blurb: 'Runs in circles carrying one bolt at a time.', cost: 15, rate: 0.1 },
  { id: 'tanuki', name: 'Tanuki Apprentice', kanji: '狸', blurb: 'Threads bolts by hand. Naps on the hour.', cost: 100, rate: 1 },
  { id: 'lathe', name: 'Foot Lathe', kanji: '旋', blurb: 'Someone has to pedal. It is never you.', cost: 1_100, rate: 8 },
  { id: 'doll', name: 'Tea-serving Doll', kanji: '茶', blurb: 'A karakuri that brings tea and takes bolts back.', cost: 12_000, rate: 47 },
  { id: 'press', name: 'Stamping Press', kanji: '鍛', blurb: 'One thump, forty bolts.', cost: 130_000, rate: 260 },
  { id: 'belt', name: 'Conveyor Line', kanji: '帯', blurb: 'Nobody knows where the far end goes.', cost: 1_400_000, rate: 1_400 },
  { id: 'gacha', name: 'Bolt Gashapon', kanji: '蛋', blurb: 'Every capsule is a bolt. No duplicates policy.', cost: 20_000_000, rate: 7_800 },
  { id: 'arm', name: 'Robot Arm', kanji: '腕', blurb: 'Six axes, zero breaks.', cost: 330_000_000, rate: 44_000 },
  { id: 'furnace', name: 'Dragon Furnace', kanji: '竜', blurb: 'A ryū that agreed to breathe on the ore.', cost: 5_100_000_000, rate: 260_000 },
  { id: 'mecha', name: 'Giant Mecha Line', kanji: '巨', blurb: 'Builds robots that build bolts.', cost: 75_000_000_000, rate: 1_600_000 },
  { id: 'moon', name: 'Clockwork Moon', kanji: '月', blurb: 'The whole thing is one gear. It turns once a month.', cost: 1_000_000_000_000, rate: 10_000_000 },
  { id: 'loom', name: 'Time Loom', kanji: '時', blurb: 'Weaves tomorrow\'s bolts today.', cost: 14_000_000_000_000, rate: 65_000_000 },
];

export const genById = (id: string) => GENS.find((g) => g.id === id);
const GROWTH = 1.15;

// ─── upgrades (this run) ────────────────────────────────────────────────────

export interface IdleUpgrade {
  id: string;
  name: string;
  kanji: string;
  blurb: string;
  cost: number;
  /** Shown once this is true. */
  need: (s: IdleSave) => boolean;
}

const ROMAN = ['II', 'III', 'IV', 'V', 'VI', 'VII'];
const TIER_AT = [10, 25, 50, 100, 150, 200];
const TIER_COST = [10, 100, 3e3, 3e6, 3e9, 3e12];
const TAP_COST = [100, 5e3, 5e5, 5e7, 5e9, 5e11, 5e13];
const LINK_COST = [1e4, 1e6, 1e8, 1e10, 1e12];
const CRIT_COST = [2.5e4, 2.5e7, 2.5e10];
const OIL_COST = [5e4, 5e6, 5e8, 5e10, 5e12, 5e14, 5e16];
const CAT_COST = [7.77e5, 7.77e8, 7.77e11];

export const UPGRADES: IdleUpgrade[] = [
  ...GENS.flatMap((g) =>
    TIER_AT.map((at, i): IdleUpgrade => ({
      id: `g:${g.id}:${i}`,
      name: `${g.name} Mk ${ROMAN[i]}`,
      kanji: g.kanji,
      blurb: `${g.name}s make twice as much.`,
      cost: g.cost * TIER_COST[i],
      need: (s) => (s.gens[g.id] ?? 0) >= at,
    })),
  ),
  ...TAP_COST.map((cost, i): IdleUpgrade => ({ id: `tap:${i}`, name: `Calloused Thumb ${ROMAN[i - 1] ?? 'I'}`, kanji: '指', blurb: 'Each turn of the gear makes twice as much.', cost, need: (s) => s.taps >= [1, 50, 200, 500, 1000, 2500, 5000][i] })),
  ...LINK_COST.map((cost, i): IdleUpgrade => ({ id: `link:${i}`, name: `Drive Belt ${ROMAN[i - 1] ?? 'I'}`, kanji: '連', blurb: 'Each turn also makes 1% of what the machines make in a second.', cost, need: (s) => s.life >= cost / 4 })),
  ...CRIT_COST.map((cost, i): IdleUpgrade => ({ id: `crit:${i}`, name: `Lucky Strike ${ROMAN[i - 1] ?? 'I'}`, kanji: '当', blurb: 'Perfect turns (×10) happen 5% more often.', cost, need: (s) => s.life >= cost / 4 })),
  ...OIL_COST.map((cost, i): IdleUpgrade => ({ id: `oil:${i}`, name: `Camellia Oil ${ROMAN[i - 1] ?? 'I'}`, kanji: '油', blurb: 'Every machine makes 25% more.', cost, need: (s) => s.life >= cost / 4 })),
  ...CAT_COST.map((cost, i): IdleUpgrade => ({ id: `cat:${i}`, name: `Catnip ${ROMAN[i - 1] ?? 'I'}`, kanji: '猫', blurb: 'The lucky cat turns up 20% sooner.', cost, need: (s) => s.cats >= [1, 5, 20][i] })),
];

export const idleUpgradeById = (id: string) => UPGRADES.find((u) => u.id === id);

// ─── blueprints and perks (kept through a rebuild) ──────────────────────────

export interface Perk {
  id: string;
  name: string;
  kanji: string;
  /** What one level does. */
  blurb: string;
  max: number;
  /** Blueprints for the next level, from the level you have. */
  cost: (lv: number) => number;
}

export const PERKS: Perk[] = [
  { id: 'head', name: 'Head Start', kanji: '先', blurb: 'Start each rebuild with bolts in the till (×10 per level).', max: 10, cost: (lv) => 2 ** lv },
  { id: 'night', name: 'Night Shift', kanji: '夜', blurb: 'The crew works 2 more hours while you are away.', max: 10, cost: (lv) => 2 * (lv + 1) },
  { id: 'crew', name: 'Loyal Crew', kanji: '組', blurb: 'They work 10% harder while you are away.', max: 5, cost: (lv) => 3 * (lv + 1) },
  { id: 'hands', name: 'Heavy Hands', kanji: '拳', blurb: 'Each turn of the gear makes twice as much.', max: 10, cost: (lv) => 2 ** lv },
  { id: 'auto', name: 'Wind-up Finger', kanji: '巻', blurb: 'Turns the gear for you once a second, away or not.', max: 10, cost: (lv) => 3 * (lv + 1) },
  { id: 'bulk', name: 'Wholesale', kanji: '卸', blurb: 'Machines cost 3% less.', max: 10, cost: (lv) => lv + 1 },
  { id: 'bell', name: 'Lucky Bell', kanji: '鈴', blurb: 'The lucky cat turns up 12% sooner and stays longer.', max: 5, cost: (lv) => 2 * (lv + 1) },
  { id: 'tooth', name: 'Gold Tooth', kanji: '歯', blurb: 'The daily crate holds 2 more gold cogs.', max: 5, cost: (lv) => 5 * (lv + 1) },
];

export const perkById = (id: string) => PERKS.find((p) => p.id === id);

/** Each blueprint ever drawn adds this much to everything the machines make. */
export const PRINT_BONUS = 0.05;
/** Lifetime bolts for the first blueprint; after that it's the cube root. */
export const PRINT_UNIT = 1e6;

// ─── the save ───────────────────────────────────────────────────────────────

export type BoostKind = 'frenzy' | 'fever';

export interface IdleSave {
  v: 1;
  /** When bolts were last settled (ms). */
  at: number;
  bolts: number;
  /** Made since the last rebuild. */
  run: number;
  /** Made ever. */
  life: number;
  taps: number;
  crits: number;
  gens: Record<string, number>;
  ups: string[];
  perks: Record<string, number>;
  /** Blueprints ever drawn. */
  printsAll: number;
  rebuilds: number;
  /** Lucky cats caught. */
  cats: number;
  /** Milestones reached. */
  done: string[];
  /** Gold cogs ever earned. Spending is in the ledger. */
  cogs: number;
  /** The day the cat last paid cogs, and how many that day. */
  catDay: string;
  catCogs: number;
  /** The day the crate was last opened. */
  crate: string;
  boost: { k: BoostKind; until: number } | null;
  /** Best bolts a second seen. */
  best: number;
  /** The gear reached full heat at least once. */
  hot: boolean;
}

export function fresh(now: number): IdleSave {
  return { v: 1, at: now, bolts: 0, run: 0, life: 0, taps: 0, crits: 0, gens: {}, ups: [], perks: {}, printsAll: 0, rebuilds: 0, cats: 0, done: [], cogs: 0, catDay: '', catCogs: 0, crate: '', boost: null, best: 0, hot: false };
}

const num = (v: unknown, min = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= min ? v : min);
const int = (v: unknown) => Math.floor(num(v));
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** Reads a stored save back, dropping anything this version doesn't know. */
export function normalise(v: unknown, now: number): IdleSave {
  if (!v || typeof v !== 'object') return fresh(now);
  const o = v as Record<string, unknown>;
  const counts = (x: unknown, known: (id: string) => number | undefined) => {
    const out: Record<string, number> = {};
    if (x && typeof x === 'object') {
      for (const [k, n] of Object.entries(x as Record<string, unknown>)) {
        const max = known(k);
        if (max !== undefined && int(n) > 0) out[k] = Math.min(int(n), max);
      }
    }
    return out;
  };
  const list = (x: unknown, ok: (id: string) => boolean) => (Array.isArray(x) ? [...new Set(x.filter((i): i is string => typeof i === 'string' && ok(i)))] : []);
  const b = o.boost as { k?: unknown; until?: unknown } | null | undefined;
  return {
    v: 1,
    at: Math.min(num(o.at) || now, now),
    bolts: num(o.bolts),
    run: num(o.run),
    life: num(o.life),
    taps: int(o.taps),
    crits: int(o.crits),
    gens: counts(o.gens, (id) => (genById(id) ? 1e6 : undefined)),
    ups: list(o.ups, (id) => !!idleUpgradeById(id)),
    perks: counts(o.perks, (id) => perkById(id)?.max),
    printsAll: int(o.printsAll),
    rebuilds: int(o.rebuilds),
    cats: int(o.cats),
    done: list(o.done, (id) => MILESTONES.some((m) => m.id === id)),
    cogs: int(o.cogs),
    catDay: str(o.catDay),
    catCogs: int(o.catCogs),
    crate: str(o.crate),
    boost: b && (b.k === 'frenzy' || b.k === 'fever') && num(b.until) > 0 ? { k: b.k, until: num(b.until) } : null,
    best: num(o.best),
    hot: o.hot === true,
  };
}

// ─── what real life adds ────────────────────────────────────────────────────

/** Read from the records, never stored: the factory runs better on days you've done something. */
export interface Ext {
  /** Sections with XP today. */
  sections: number;
  /** Day streak. */
  streak: number;
  /** Overall level. */
  level: number;
}

export const NO_EXT: Ext = { sections: 0, streak: 0, level: 1 };
export const FUEL_PER_SECTION = 0.15;
export const FUEL_MAX_SECTIONS = 6;
export const STREAK_MAX = 50;

export const fuelMult = (e: Ext) => 1 + FUEL_PER_SECTION * Math.min(FUEL_MAX_SECTIONS, Math.max(0, e.sections));
export const streakMult = (e: Ext) => 1 + Math.min(STREAK_MAX, Math.max(0, e.streak)) / 100;
export const foremanMult = (e: Ext) => 1 + Math.max(0, e.level - 1) / 100;
export const extMult = (e: Ext) => fuelMult(e) * streakMult(e) * foremanMult(e);

// ─── rates ──────────────────────────────────────────────────────────────────

interface Effects {
  gen: Record<string, number>;
  tap: number;
  link: number;
  crit: number;
  oil: number;
  cat: number;
}

const fxMemo = new WeakMap<string[], Effects>();
function effects(ups: string[]): Effects {
  const hit = fxMemo.get(ups);
  if (hit) return hit;
  const e: Effects = { gen: {}, tap: 1, link: 0, crit: 0, oil: 1, cat: 1 };
  for (const id of ups) {
    const [k, a] = id.split(':');
    if (k === 'g') e.gen[a] = (e.gen[a] ?? 1) * 2;
    else if (k === 'tap') e.tap *= 2;
    else if (k === 'link') e.link += 0.01;
    else if (k === 'crit') e.crit += 0.05;
    else if (k === 'oil') e.oil *= 1.25;
    else if (k === 'cat') e.cat *= 0.8;
  }
  fxMemo.set(ups, e);
  return e;
}

const perk = (s: IdleSave, id: string) => s.perks[id] ?? 0;

export const printsMult = (s: IdleSave) => 1 + PRINT_BONUS * s.printsAll;

/** What one machine of a kind makes a second, with its Mk upgrades. */
export const genRate = (s: IdleSave, id: string) => (genById(id)?.rate ?? 0) * (effects(s.ups).gen[id] ?? 1);

/** Bolts a second from the machines alone: no cat, no auto-turns. */
export function machineRate(s: IdleSave, ext: Ext): number {
  let base = 0;
  for (const g of GENS) base += (s.gens[g.id] ?? 0) * genRate(s, g.id);
  return base * effects(s.ups).oil * printsMult(s) * extMult(ext);
}

export const CRIT_BASE = 0.05;
export const CRIT_MULT = 10;
export const critChance = (s: IdleSave) => CRIT_BASE + effects(s.ups).crit;

/** Heat 0–100 → ×1 to ×3 on a turn of the gear. */
export const heatMult = (heat: number) => 1 + Math.min(4, Math.floor(Math.max(0, heat) / 25)) * 0.5;

/** One plain turn of the gear (no heat, no crit, no fever). */
export function tapBase(s: IdleSave, ext: Ext): number {
  const e = effects(s.ups);
  return (e.tap * 2 ** perk(s, 'hands') + e.link * machineRate(s, ext)) * printsMult(s);
}

export const FRENZY_MULT = 7;
export const FEVER_MULT = 15;
const boostOn = (s: IdleSave, k: BoostKind, now: number) => s.boost?.k === k && s.boost.until > now;

export function tapValue(s: IdleSave, ext: Ext, now: number, heat = 0, crit = false): number {
  return tapBase(s, ext) * heatMult(heat) * (crit ? CRIT_MULT : 1) * (boostOn(s, 'fever', now) ? FEVER_MULT : 1);
}

/** Bolts a second without a boost: machines and the wind-up finger. */
export const baseRate = (s: IdleSave, ext: Ext) => machineRate(s, ext) + perk(s, 'auto') * tapBase(s, ext);

/** Bolts a second right now. */
export const rateNow = (s: IdleSave, ext: Ext, now: number) => baseRate(s, ext) * (boostOn(s, 'frenzy', now) ? FRENZY_MULT : 1);

// ─── away ───────────────────────────────────────────────────────────────────

/** A gap longer than this counts as being away. */
export const AWAY_MS = 90_000;
export const awayHours = (s: IdleSave) => 4 + 2 * perk(s, 'night');
export const awayEff = (s: IdleSave) => 0.5 + 0.1 * perk(s, 'crew');

export interface Away {
  /** Seconds since the factory was last looked at. */
  gap: number;
  /** Seconds the crew worked (the gap, up to the cap). */
  worked: number;
  capped: boolean;
  eff: number;
  gained: number;
}

const add = (s: IdleSave, n: number): IdleSave => (n > 0 ? { ...s, bolts: s.bolts + n, run: s.run + n, life: s.life + n } : s);

/**
 * Bring the save up to `now`. A short gap is paid in full (with any boost still running); a long
 * one is paid at the away rate, up to the cap, and reported.
 */
export function settle(s: IdleSave, now: number, ext: Ext): { save: IdleSave; away: Away | null } {
  const gap = now - s.at;
  if (gap <= 0) return { save: gap < 0 ? { ...s, at: now } : s, away: null };
  const base = baseRate(s, ext);
  if (gap > AWAY_MS) {
    const cap = awayHours(s) * 3600;
    const worked = Math.min(gap / 1000, cap);
    const eff = awayEff(s);
    const gained = base * eff * worked;
    const next = add({ ...s, at: now, boost: null }, gained);
    return { save: next, away: { gap: gap / 1000, worked, capped: gap / 1000 > cap, eff, gained } };
  }
  let made = (base * gap) / 1000;
  if (s.boost?.k === 'frenzy' && s.boost.until > s.at) made += (base * (FRENZY_MULT - 1) * (Math.min(now, s.boost.until) - s.at)) / 1000;
  const next = add({ ...s, at: now, boost: s.boost && s.boost.until <= now ? null : s.boost }, made);
  const r = rateNow(next, ext, now);
  return { save: r > next.best ? { ...next, best: r } : next, away: null };
}

/** What the crew would have made if you opened the factory now (for the Home door). */
export function waiting(s: IdleSave, now: number, ext: Ext): number {
  const { save } = settle(s, now, ext);
  return save.bolts - s.bolts;
}

// ─── doing things ───────────────────────────────────────────────────────────

/** One turn of the gear. `roll` in [0, 1) decides a perfect turn. */
export function tap(s: IdleSave, now: number, ext: Ext, heat: number, roll: number): { save: IdleSave; gain: number; crit: boolean } {
  const crit = roll < critChance(s);
  const gain = tapValue(s, ext, now, heat, crit);
  const next = add({ ...s, taps: s.taps + 1, crits: s.crits + (crit ? 1 : 0), hot: s.hot || heat >= 100 }, gain);
  return { save: next, gain, crit };
}

const discount = (s: IdleSave) => 1 - 0.03 * perk(s, 'bulk');

/** What the next `n` of a machine cost together. */
export function genCost(s: IdleSave, id: string, n = 1): number {
  const g = genById(id);
  if (!g || n < 1) return Infinity;
  const have = s.gens[id] ?? 0;
  return Math.ceil(g.cost * discount(s) * GROWTH ** have * ((GROWTH ** n - 1) / (GROWTH - 1)));
}

/** How many of a machine the bolts in hand buy. */
export function maxBuy(s: IdleSave, id: string): number {
  const g = genById(id);
  if (!g) return 0;
  const first = g.cost * discount(s) * GROWTH ** (s.gens[id] ?? 0);
  let n = Math.max(0, Math.floor(Math.log((s.bolts * (GROWTH - 1)) / first + 1) / Math.log(GROWTH)));
  // Rounding up in genCost can make the last one a bolt too dear.
  while (n > 0 && genCost(s, id, n) > s.bolts) n--;
  return n;
}

export function buyGen(s: IdleSave, id: string, n = 1): IdleSave | null {
  const cost = genCost(s, id, n);
  if (!(cost <= s.bolts)) return null;
  return { ...s, bolts: s.bolts - cost, gens: { ...s.gens, [id]: (s.gens[id] ?? 0) + n } };
}

/** Upgrades you could buy now (cheapest first), and how many you've bought. */
export function upgradesFor(s: IdleSave): IdleUpgrade[] {
  const own = new Set(s.ups);
  return UPGRADES.filter((u) => !own.has(u.id) && u.need(s)).sort((a, b) => a.cost - b.cost);
}

export function buyUpgrade(s: IdleSave, id: string): IdleSave | null {
  const u = idleUpgradeById(id);
  if (!u || s.ups.includes(id) || !u.need(s) || u.cost > s.bolts) return null;
  return { ...s, bolts: s.bolts - u.cost, ups: [...s.ups, id] };
}

/** Buy every upgrade on offer that the bolts in hand cover, cheapest first. */
export function buyAllUpgrades(s: IdleSave): { save: IdleSave; n: number } {
  let save = s;
  let n = 0;
  for (;;) {
    const next = upgradesFor(save).find((u) => u.cost <= save.bolts);
    const bought = next && buyUpgrade(save, next.id);
    if (!bought) return { save, n };
    save = bought;
    n++;
  }
}

// ─── rebuilding ─────────────────────────────────────────────────────────────

/** Blueprints a lifetime of bolts is worth. */
export const printsAt = (life: number) => Math.floor(Math.cbrt(Math.max(0, life) / PRINT_UNIT));
/** Blueprints a rebuild would draw now. */
export const printsWaiting = (s: IdleSave) => Math.max(0, printsAt(s.life) - s.printsAll);
/** Lifetime bolts the next blueprint needs. */
export const nextPrintAt = (s: IdleSave) => PRINT_UNIT * (Math.max(s.printsAll, printsAt(s.life)) + 1) ** 3;

export const printsSpent = (s: IdleSave) => PERKS.reduce((n, p) => n + Array.from({ length: perk(s, p.id) }, (_, lv) => p.cost(lv)).reduce((a, b) => a + b, 0), 0);
/** Blueprints left to spend on perks. */
export const printsFree = (s: IdleSave) => s.printsAll - printsSpent(s);

export const headStart = (s: IdleSave) => (perk(s, 'head') ? 10 ** (perk(s, 'head') + 2) : 0);
export const REBUILD_COGS = 5;

/** Knock it down and start again: machines, upgrades and bolts go; blueprints, perks and cogs stay. */
export function rebuild(s: IdleSave, now: number): IdleSave | null {
  const gain = printsWaiting(s);
  if (gain < 1) return null;
  return { ...s, at: now, bolts: headStart(s), run: 0, gens: {}, ups: [], boost: null, printsAll: s.printsAll + gain, rebuilds: s.rebuilds + 1, cogs: s.cogs + REBUILD_COGS };
}

export function buyPerk(s: IdleSave, id: string): IdleSave | null {
  const p = perkById(id);
  if (!p) return null;
  const lv = perk(s, id);
  if (lv >= p.max || p.cost(lv) > printsFree(s)) return null;
  return { ...s, perks: { ...s.perks, [id]: lv + 1 } };
}

// ─── the lucky cat ──────────────────────────────────────────────────────────

export const CAT_COGS_A_DAY = 10;
/** Seconds until the next cat, for a roll in [0, 1). */
export const catWait = (s: IdleSave, roll: number) => (90 + 120 * roll) * effects(s.ups).cat * 0.88 ** perk(s, 'bell');
/** Seconds the cat stays. */
export const catStay = (s: IdleSave) => 12 + 2 * perk(s, 'bell');

export type CatPrize = { kind: 'koban'; gain: number } | { kind: BoostKind; seconds: number };

/** Catch the cat. `roll` in [0, 1) picks the prize; a gold cog comes with it until the day's are gone. */
export function catchCat(s: IdleSave, now: number, ext: Ext, day: string, roll: number): { save: IdleSave; prize: CatPrize; cog: boolean } {
  const today = s.catDay === day ? s.catCogs : 0;
  const cog = today < CAT_COGS_A_DAY;
  let save: IdleSave = { ...s, cats: s.cats + 1, catDay: day, catCogs: today + (cog ? 1 : 0), cogs: s.cogs + (cog ? 1 : 0) };
  let prize: CatPrize;
  if (roll < 0.45) {
    const rate = baseRate(s, ext);
    const gain = Math.max(tapBase(s, ext) * 30, Math.min(rate * 600, s.bolts * 0.15 + rate * 60));
    save = add(save, gain);
    prize = { kind: 'koban', gain };
  } else if (roll < 0.8) {
    prize = { kind: 'frenzy', seconds: 45 };
    save = { ...save, boost: { k: 'frenzy', until: now + 45_000 } };
  } else {
    prize = { kind: 'fever', seconds: 20 };
    save = { ...save, boost: { k: 'fever', until: now + 20_000 } };
  }
  return { save, prize, cog };
}

// ─── the daily crate ────────────────────────────────────────────────────────

export const CRATE_COGS = 5;
/** Gold cogs in today's crate: doubled once you've logged anything today. */
export const crateCogs = (s: IdleSave, ext: Ext) => (CRATE_COGS + 2 * perk(s, 'tooth')) * (ext.sections > 0 ? 2 : 1);

export function openCrate(s: IdleSave, day: string, ext: Ext): IdleSave | null {
  if (s.crate >= day) return null;
  return { ...s, crate: day, cogs: s.cogs + crateCogs(s, ext) };
}

// ─── milestones ─────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  name: string;
  hint: string;
  cogs: number;
  /** How far along, and how far it goes. */
  at: (s: IdleSave) => [number, number];
}

const machines = (s: IdleSave) => Object.values(s.gens).reduce((a, b) => a + b, 0);
const M = (id: string, name: string, hint: string, cogs: number, at: (s: IdleSave) => [number, number]): Milestone => ({ id, name, hint, cogs, at });

export const MILESTONES: Milestone[] = [
  ...([[1e3, 'First Thousand', 1], [1e6, 'Bolt Millionaire', 2], [1e9, 'Nine Zeroes', 3], [1e12, 'A Trillion Threads', 5], [1e15, 'Industrial Scale', 7], [1e18, 'Bolts for Every Star', 10], [1e21, 'More Bolts than Sense', 15]] as const).map(([n, name, cogs]) =>
    M(`life:${n}`, name, `Make ${fmt(n)} bolts, all time`, cogs, (s) => [s.life, n]),
  ),
  ...([[100, 'Warm Hands', 1], [1_000, 'Gear Turner', 2], [10_000, 'Blistered', 4], [50_000, 'One with the Gear', 8]] as const).map(([n, name, cogs]) => M(`taps:${n}`, name, `Turn the gear ${fmt(n)} times`, cogs, (s) => [s.taps, n])),
  ...([[10, 'A Small Shed', 1], [50, 'Proper Workshop', 2], [150, 'Factory Floor', 3], [400, 'Company Town', 5], [800, 'Industrial District', 8], [1500, 'It Never Sleeps', 12]] as const).map(([n, name, cogs]) =>
    M(`own:${n}`, name, `Own ${n} machines at once`, cogs, (s) => [machines(s), n]),
  ),
  ...GENS.slice(2).map((g, i) => M(`first:${g.id}`, `First ${g.name}`, `Buy a ${g.name}`, 1 + Math.floor(i / 2), (s) => [s.gens[g.id] ?? 0, 1])),
  ...([[10, 'Fine Tuning', 2], [30, 'Souped Up', 4], [60, 'Nothing Left to Bolt On', 8]] as const).map(([n, name, cogs]) => M(`ups:${n}`, name, `Hold ${n} upgrades in one run`, cogs, (s) => [s.ups.length, n])),
  ...([[1, 'Back to the Drawing Board', 3], [3, 'Third Time Lucky', 5], [10, 'Serial Rebuilder', 8], [25, 'Ship of Theseus', 15]] as const).map(([n, name, cogs]) => M(`rebuild:${n}`, name, n === 1 ? 'Rebuild the Works' : `Rebuild ${n} times`, cogs, (s) => [s.rebuilds, n])),
  ...([[10, 'Draughtsman', 2], [100, 'Chief Engineer', 5], [1000, 'Master Plan', 10]] as const).map(([n, name, cogs]) => M(`prints:${n}`, name, `Draw ${fmt(n)} blueprints`, cogs, (s) => [s.printsAll, n])),
  ...([[1, 'Here, Kitty', 1], [10, 'Cat Person', 2], [50, 'Regular Customer', 4], [200, 'The Cat Sends Its Regards', 8]] as const).map(([n, name, cogs]) => M(`cats:${n}`, name, n === 1 ? 'Catch the lucky cat' : `Catch the lucky cat ${n} times`, cogs, (s) => [s.cats, n])),
  M('crits:100', 'Sweet Spot', 'Land 100 perfect turns', 3, (s) => [s.crits, 100]),
  M('hot', 'Red Hot', 'Fill the heat bar', 2, (s) => [s.hot ? 1 : 0, 1]),
];

/** Mark what's newly reached and pay its cogs. */
export function checkMilestones(s: IdleSave): { save: IdleSave; reached: Milestone[] } {
  const done = new Set(s.done);
  const reached = MILESTONES.filter((m) => {
    if (done.has(m.id)) return false;
    const [a, b] = m.at(s);
    return a >= b;
  });
  if (!reached.length) return { save: s, reached };
  return { save: { ...s, done: [...s.done, ...reached.map((m) => m.id)], cogs: s.cogs + reached.reduce((n, m) => n + m.cogs, 0) }, reached };
}

// ─── the cosmetics counter ──────────────────────────────────────────────────

export interface WorksGood {
  /** `title:foreman`, `paint:brass`, `wgear:daruma`, `wfloor:forge`… */
  item: string;
  /** Gold cogs. */
  price: number;
}

/** Looks for the gear you turn. */
export const GEAR_SKINS: { id: string; name: string; rarity: Rarity; price: number; blurb: string }[] = [
  { id: 'steel', name: 'Steel Cog', rarity: 'common', price: 0, blurb: 'What it came with.' },
  { id: 'brass', name: 'Brass Cog', rarity: 'common', price: 15, blurb: 'Polished every morning.' },
  { id: 'koban', name: 'Koban', rarity: 'rare', price: 40, blurb: 'An oval gold coin. Turn it for luck.' },
  { id: 'daruma', name: 'Daruma', rarity: 'rare', price: 60, blurb: 'Spin it and it rights itself.' },
  { id: 'taiko', name: 'Taiko', rarity: 'epic', price: 100, blurb: 'Every turn is a drum beat.' },
  { id: 'mochi', name: 'Mochi', rarity: 'epic', price: 120, blurb: 'Soft. Leaves a thumbprint.' },
  { id: 'moon', name: 'Full Moon', rarity: 'legendary', price: 220, blurb: 'A rabbit is in there pounding rice.' },
];

/** Looks for the factory floor. */
export const FLOORS: { id: string; name: string; rarity: Rarity; price: number; blurb: string }[] = [
  { id: 'shed', name: 'The Shed', rarity: 'common', price: 0, blurb: 'Corrugated iron and one bulb.' },
  { id: 'paper', name: 'Blueprint Room', rarity: 'common', price: 20, blurb: 'White lines on blue.' },
  { id: 'neon', name: 'Night Shift', rarity: 'rare', price: 45, blurb: 'Pink tubes over the benches.' },
  { id: 'forge', name: 'The Forge', rarity: 'epic', price: 90, blurb: 'Everything glows a bit.' },
  { id: 'sakura', name: 'Blossom Yard', rarity: 'epic', price: 110, blurb: 'The line moved outside for spring.' },
  { id: 'orbit', name: 'Low Orbit', rarity: 'legendary', price: 200, blurb: 'Zero gravity. The bolts float off.' },
];

/** Robot cosmetics only the Works sells (catalog.ts marks them `works`). */
export const ROBOT_GOODS: WorksGood[] = [
  { item: 'title:boltcounter', price: 10 },
  { item: 'title:clockedin', price: 25 },
  { item: 'title:foreman', price: 30 },
  { item: 'title:idlehands', price: 60 },
  { item: 'title:tappedout', price: 70 },
  { item: 'title:revolution', price: 160 },
  { item: 'title:perpetual', price: 400 },
  { item: 'paint:machineoil', price: 30 },
  { item: 'paint:brass', price: 55 },
  { item: 'paint:blueprint', price: 55 },
  { item: 'paint:hotrivet', price: 120 },
  { item: 'paint:clockchrome', price: 130 },
  { item: 'paint:molten', price: 260 },
  { item: 'hat:hardhat', price: 70 },
  { item: 'hat:weldmask', price: 140 },
  { item: 'hat:cogcrown', price: 300 },
  { item: 'pet:sparebolt', price: 45 },
  { item: 'pet:windmouse', price: 110 },
  { item: 'aura:sparks', price: 170 },
  { item: 'aura:cogs', price: 320 },
];

export const WORKS_GOODS: WorksGood[] = [
  ...ROBOT_GOODS,
  ...GEAR_SKINS.filter((x) => x.price > 0).map((x) => ({ item: `wgear:${x.id}`, price: x.price })),
  ...FLOORS.filter((x) => x.price > 0).map((x) => ({ item: `wfloor:${x.id}`, price: x.price })),
];

export const worksPrice = (item: string) => WORKS_GOODS.find((g) => g.item === item)?.price;

/** Gold cogs in hand: earned (in the save) less what the ledger says was spent. */
export function cogsOf(s: IdleSave, txs: { type: string; ref: string }[]): number {
  let spent = 0;
  for (const t of txs) if (t.type === 'works') spent += worksPrice(t.ref) ?? 0;
  return s.cogs - spent;
}

export interface WorksLook {
  gear: string;
  floor: string;
}
export const DEFAULT_WORKS_LOOK: WorksLook = { gear: 'steel', floor: 'shed' };

/** The look chosen, falling back to the free one for anything not owned. */
export function normaliseWorksLook(v: unknown, items: { has(item: string): boolean }): WorksLook {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const pick = (x: unknown, list: { id: string; price: number }[], kind: string, fallback: string) => {
    const e = list.find((i) => i.id === x);
    return e && (e.price === 0 || items.has(`${kind}:${e.id}`)) ? e.id : fallback;
  };
  return { gear: pick(o.gear, GEAR_SKINS, 'wgear', 'steel'), floor: pick(o.floor, FLOORS, 'wfloor', 'shed') };
}
