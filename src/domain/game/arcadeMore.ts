/**
 * 遊 Three more Arcade games, played with what you've logged like the first three (arcade.ts).
 *
 * - Pachinko: balls come from the day's XP. Pick a chute; the ball bounces down eight rows of pins
 *   into one of seven pockets. The pockets move every day; the 当 pocket spins three reels.
 * - The dojo: a ladder of rival robots. Challenges come from active days. Each round you pick a
 *   stance (strike beats feint, feint beats guard, guard beats strike); how hard you hit comes from
 *   your overall level, the level of the body you pilot and its Mk. A win climbs a floor.
 * - The vault: one four-symbol code a day, open once you've logged something. Eight tries; fewer
 *   tries pay more.
 *
 * Only what you do is stored, as `gm_tx` rows: `drop`, `duel`, `crack` and `claim`. A drop's and a
 * duel's row id comes from its number, so its bounces and the rival's moves are fixed before it's
 * played. The day's code comes from the date.
 */
import { addDays } from '../log/dates';
import { bankOf, type DayStat } from './arcade';
import { CHASSIS, type Bag, type Chassis, type ChestTier } from './catalog';
import type { EarnInput } from './earn';
import { hash32, stream } from './loot';
import type { Tx } from './wallet';

/** Nothing before these games opened pays balls or challenges. */
export const MORE_FROM = '2026-11-15';

// ─── pachinko ───────────────────────────────────────────────────────────────

export const BALL_CAP = 40;
export const BALLS_A_DAY = 12;

/** Balls a day earns: two for turning up and one per 15 XP, twelve at most. */
export function ballsFor(day: DayStat | undefined, active: boolean): number {
  if (!active) return 0;
  return Math.min(BALLS_A_DAY, 2 + Math.floor((day?.xp ?? 0) / 15));
}

/** Rows of pins a ball falls through. */
export const PIN_ROWS = 8;
/** Chutes along the top, and pockets along the bottom. */
export const CHUTES = 7;
/** A ball's place across the board is counted in half pockets: 0 to 12. */
const WIDTH = (CHUTES - 1) * 2;

export type PocketKind = 'reel' | 'coins' | 'gems';
export interface Pocket {
  kind: PocketKind;
  kanji: string;
  label: string;
  coins?: number;
  gems?: number;
}

const POCKETS: Pocket[] = [
  { kind: 'reel', kanji: '当', label: 'Spins the reels' },
  { kind: 'coins', kanji: '両', label: '40 Ryō', coins: 40 },
  { kind: 'coins', kanji: '両', label: '20 Ryō', coins: 20 },
  { kind: 'coins', kanji: '両', label: '12 Ryō', coins: 12 },
  { kind: 'coins', kanji: '両', label: '8 Ryō', coins: 8 },
  { kind: 'coins', kanji: '両', label: '5 Ryō', coins: 5 },
  { kind: 'gems', kanji: '玉', label: '1 Tama', gems: 1 },
];

/** The day's pockets, left to right: the same seven, in a new order each day. */
export function pocketsFor(date: string): Pocket[] {
  const r = stream(`pachi:${date}`);
  const out = [...POCKETS];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const REEL_FACES = ['七', '桜', '鈴', '星', '達'] as const;
export type ReelFace = (typeof REEL_FACES)[number];
export type ReelClass = 'jackpot' | 'triple' | 'pair' | 'none';

/** What three of a kind pays (three 七 is the jackpot). */
export const TRIPLE_PRIZE: Record<ReelFace, Bag> = {
  七: { gems: 30, coins: 500, chests: ['gold'], items: ['title:lucky7'] },
  桜: { coins: 250 },
  鈴: { gems: 10 },
  星: { tickets: 1, dust: 20 },
  達: { coins: 80, chests: ['iron'] },
};
export const PAIR_PRIZE: Bag = { coins: 40 };
export const NO_MATCH_PRIZE: Bag = { coins: 10 };

/** Out of 1,000 spins: 15 jackpots, 85 other triples, 350 pairs, 550 nothing. */
const REEL_ODDS = { jackpot: 15, triple: 85, pair: 350 };

export interface Reels {
  faces: [ReelFace, ReelFace, ReelFace];
  cls: ReelClass;
}

function spinReels(r: () => number): Reels {
  const v = r() * 1000;
  const other = REEL_FACES.slice(1);
  const any = () => REEL_FACES[Math.floor(r() * REEL_FACES.length)];
  if (v < REEL_ODDS.jackpot) return { faces: ['七', '七', '七'], cls: 'jackpot' };
  if (v < REEL_ODDS.jackpot + REEL_ODDS.triple) {
    const f = other[Math.floor(r() * other.length)];
    return { faces: [f, f, f], cls: 'triple' };
  }
  if (v < REEL_ODDS.jackpot + REEL_ODDS.triple + REEL_ODDS.pair) {
    const f = any();
    const rest = REEL_FACES.filter((x) => x !== f);
    const odd = rest[Math.floor(r() * rest.length)];
    const at = Math.floor(r() * 3);
    const faces: ReelFace[] = [f, f, f];
    faces[at] = odd;
    return { faces: faces as Reels['faces'], cls: 'pair' };
  }
  // Three different faces.
  const pool = [...REEL_FACES];
  const pick = () => pool.splice(Math.floor(r() * pool.length), 1)[0];
  return { faces: [pick(), pick(), pick()], cls: 'none' };
}

export const reelPrize = (x: Reels): Bag => (x.cls === 'jackpot' || x.cls === 'triple' ? TRIPLE_PRIZE[x.faces[0]] : x.cls === 'pair' ? PAIR_PRIZE : NO_MATCH_PRIZE);

export interface Drop {
  n: number;
  chute: number;
  /** Where the ball is after each row, in half pockets (the first is the chute). */
  path: number[];
  pocket: number;
  hit: Pocket;
  reels?: Reels;
  gain: Bag;
}

/** The nth ball, dropped down a chute on a day. Its bounces come from n, so the chute is the only choice. */
export function dropBall(n: number, chute: number, date: string): Drop {
  const r = stream(`drop:${n}`);
  const c = Math.max(0, Math.min(CHUTES - 1, Math.floor(chute)));
  let x = c * 2;
  const path = [x];
  for (let row = 0; row < PIN_ROWS; row++) {
    let dx = r() < 0.5 ? -1 : 1;
    // The side walls knock it back in.
    if (x + dx < 0 || x + dx > WIDTH) dx = -dx;
    x += dx;
    path.push(x);
  }
  const pocket = x / 2;
  const hit = pocketsFor(date)[pocket];
  const reels = hit.kind === 'reel' ? spinReels(r) : undefined;
  const gain: Bag = reels ? reelPrize(reels) : hit.kind === 'gems' ? { gems: hit.gems } : { coins: hit.coins };
  return { n, chute: c, path, pocket, hit, reels, gain };
}

const DROP_CODE: Record<ReelClass, string> = { jackpot: 'j', triple: 't', pair: 'p', none: 'x' };
export const dropRef = (d: Drop) => `drop:${d.n}:${d.chute}:${d.pocket}:${d.reels ? DROP_CODE[d.reels.cls] : d.hit.kind === 'gems' ? 'g' : 'c'}`;

export function parseDropRef(ref: string): { n: number; chute: number; pocket: number; code: string } | null {
  const m = /^drop:(\d+):(\d):(\d):([cgxptj])$/.exec(ref);
  return m ? { n: +m[1], chute: +m[2], pocket: +m[3], code: m[4] } : null;
}

export const dropLine = (code: string) => (code === 'j' ? 'three sevens!' : code === 't' ? 'three of a kind' : code === 'p' ? 'a pair on the reels' : code === 'x' ? 'the reels, no match' : code === 'g' ? 'a Tama pocket' : 'a Ryō pocket');

export interface PachiState {
  balls: number;
  /** Times the reels spun, and how they came up. */
  spins: number;
  triples: number;
  jackpots: number;
  usedByDay: Map<string, number>;
}

export function pachiOf(txs: Tx[]): PachiState {
  const s: PachiState = { balls: 0, spins: 0, triples: 0, jackpots: 0, usedByDay: new Map() };
  for (const t of txs) {
    if (t.type !== 'drop') continue;
    const d = parseDropRef(t.ref);
    if (!d) continue;
    s.balls++;
    s.usedByDay.set(t.at, (s.usedByDay.get(t.at) ?? 0) + 1);
    if ('xptj'.includes(d.code)) s.spins++;
    if (d.code === 't') s.triples++;
    if (d.code === 'j') s.jackpots++;
  }
  return s;
}

// ─── the dojo ───────────────────────────────────────────────────────────────

export const BOUT_CAP = 8;

/** Challenges a day earns: two for turning up, one more for a 100-XP day. */
export function boutsFor(day: DayStat | undefined, active: boolean): number {
  if (!active) return 0;
  return 2 + (day && day.xp >= 100 ? 1 : 0);
}

export type Stance = 'strike' | 'guard' | 'feint';
export const STANCES: Record<Stance, { name: string; kanji: string; beats: Stance; line: string }> = {
  strike: { name: 'Strike', kanji: '打', beats: 'feint', line: 'beats Feint' },
  guard: { name: 'Guard', kanji: '守', beats: 'strike', line: 'beats Strike' },
  feint: { name: 'Feint', kanji: '崩', beats: 'guard', line: 'beats Guard' },
};
const STANCE_IDS = Object.keys(STANCES) as Stance[];
const STANCE_CODE: Record<Stance, string> = { strike: 's', guard: 'g', feint: 'f' };

export interface Fighter {
  hp: number;
  atk: number;
}

/** How strong you are: your overall level, the level of the body you pilot (1–30) and its Mk (1–3). */
export function heroOf(level: number, bodyLevel: number, mk: number): Fighter {
  return { hp: 40 + 3 * Math.max(1, level) + Math.max(1, bodyLevel), atk: 8 + Math.floor(Math.max(1, level) / 2) + 2 * Math.max(1, Math.min(3, mk)) };
}

/** Each loss on a floor makes you hit a tenth harder there, up to half as hard again. */
export const GRIT_STEP = 0.1;
export const GRIT_MAX = 5;
export const withGrit = (hero: Fighter, grit: number): Fighter => ({ hp: hero.hp, atk: Math.round(hero.atk * (1 + GRIT_STEP * Math.min(GRIT_MAX, Math.max(0, grit)))) });

export interface Rival extends Fighter {
  floor: number;
  body: Chassis;
  mk: 1 | 2 | 3;
  /** The stance it uses half the time (a master: four times in ten). */
  style: Stance;
  master: boolean;
}

/** Bodies a rival may wear: the ones the shop sells (never a hidden or festival body). */
const RIVAL_BODIES = CHASSIS.filter((c) => !c.unlock && !c.event && c.group !== 'secret' && c.group !== 'event');

export const isMaster = (floor: number) => floor % 5 === 0;

export function rivalOf(floor: number): Rival {
  const f = Math.max(1, Math.floor(floor));
  const master = isMaster(f);
  const grand = RIVAL_BODIES.filter((c) => c.rarity === 'legendary' || c.rarity === 'mythic');
  const pool = master && grand.length ? grand : RIVAL_BODIES;
  const body = pool[hash32(`rival:${f}`) % pool.length];
  const style = STANCE_IDS[hash32(`style:${f}`) % 3];
  return {
    floor: f,
    body,
    mk: f < 10 ? 1 : f < 25 ? 2 : 3,
    style,
    master,
    hp: Math.round((30 + 7 * f) * (master ? 1.3 : 1)),
    atk: 7 + f + (master ? 2 : 0),
  };
}

/** One round you played: your stance, and whether you spent your kiai on it. */
export interface Move {
  stance: Stance;
  kiai: boolean;
}

const historyKey = (moves: Move[]) => moves.map((m) => STANCE_CODE[m.stance] + (m.kiai ? '!' : '')).join('');

/**
 * The rival's stance this round. It favours its style, never uses the same stance three times
 * running, and is drawn from the duel's number and everything you've played so far: leaving and
 * coming back, then playing the same way, meets the same moves.
 */
export function rivalStance(n: number, rival: Rival, moves: Move[], theirs: Stance[]): Stance {
  const r = stream(`duel:${n}:${rival.floor}:${historyKey(moves)}`);
  const k = theirs.length;
  const barred = k >= 2 && theirs[k - 1] === theirs[k - 2] ? theirs[k - 1] : null;
  const fav = rival.master ? 40 : 50;
  const weights = STANCE_IDS.map((s) => (s === barred ? 0 : s === rival.style ? fav : (100 - fav) / 2));
  let v = r() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 3; i++) if ((v -= weights[i]) < 0) return STANCE_IDS[i];
  return STANCE_IDS.find((s) => s !== barred)!;
}

export type RoundResult = 'win' | 'lose' | 'clash';

export interface Round {
  yours: Stance;
  theirs: Stance;
  kiai: boolean;
  result: RoundResult;
  /** Damage you dealt and took. */
  dealt: number;
  taken: number;
}

export interface Duel {
  n: number;
  rival: Rival;
  hero: Fighter;
  heroHp: number;
  rivalHp: number;
  rounds: Round[];
  kiaiLeft: boolean;
  over: 'won' | 'lost' | null;
}

export const startDuel = (n: number, hero: Fighter, rival: Rival): Duel => ({ n, rival, hero, heroHp: hero.hp, rivalHp: rival.hp, rounds: [], kiaiLeft: true, over: null });

/** A duel that drags past this many rounds goes to whoever has more of their health left. */
export const ROUND_LIMIT = 40;

/** Play one round. A win hits for your attack (twice with kiai); a loss takes theirs; a clash chips a third off both. */
export function playRound(d: Duel, stance: Stance, kiai: boolean): Duel {
  if (d.over) return d;
  const useKiai = kiai && d.kiaiLeft;
  const moves: Move[] = d.rounds.map((r) => ({ stance: r.yours, kiai: r.kiai }));
  const theirs = rivalStance(d.n, d.rival, moves, d.rounds.map((r) => r.theirs));
  const result: RoundResult = STANCES[stance].beats === theirs ? 'win' : STANCES[theirs].beats === stance ? 'lose' : 'clash';
  const dealt = result === 'win' ? d.hero.atk * (useKiai ? 2 : 1) : result === 'clash' ? Math.max(1, Math.floor(d.hero.atk / 3)) : 0;
  const taken = result === 'lose' ? d.rival.atk : result === 'clash' ? Math.max(1, Math.floor(d.rival.atk / 3)) : 0;
  const rivalHp = Math.max(0, d.rivalHp - dealt);
  const heroHp = Math.max(0, d.heroHp - taken);
  const rounds = [...d.rounds, { yours: stance, theirs, kiai: useKiai, result, dealt, taken }];
  let over: Duel['over'] = null;
  // Both falling in a clash goes to you: you were the one who came to fight.
  if (rivalHp <= 0) over = 'won';
  else if (heroHp <= 0) over = 'lost';
  else if (rounds.length >= ROUND_LIMIT) over = heroHp / d.hero.hp >= rivalHp / d.rival.hp ? 'won' : 'lost';
  return { ...d, heroHp, rivalHp, rounds, kiaiLeft: d.kiaiLeft && !useKiai, over };
}

/** Floors whose master hands over a title. */
export const DOJO_TITLES: Record<number, string> = { 10: 'dojo10', 25: 'dojo25', 50: 'dojo50' };

/** What beating a floor pays. Masters (every fifth floor) add Tama, a ticket and a chest. */
export function duelPrize(floor: number): Bag {
  const out: Bag = { coins: 30 + 8 * Math.min(floor, 50) };
  if (isMaster(floor)) {
    const chest: ChestTier = floor % 50 === 0 ? 'mythic' : floor % 10 === 0 ? 'gold' : 'iron';
    out.gems = 10 + Math.min(40, floor);
    out.tickets = 1;
    out.chests = [chest];
    if (DOJO_TITLES[floor]) out.items = [`title:${DOJO_TITLES[floor]}`];
  }
  return out;
}

export const LOSS_PRIZE: Bag = { coins: 8 };

export const duelRef = (n: number, floor: number, won: boolean, rounds: number) => `duel:${n}:${floor}:${won ? 'w' : 'l'}:${rounds}`;

export function parseDuelRef(ref: string): { n: number; floor: number; won: boolean; rounds: number } | null {
  const m = /^duel:(\d+):(\d+):([wl]):(\d+)$/.exec(ref);
  return m ? { n: +m[1], floor: +m[2], won: m[3] === 'w', rounds: +m[4] } : null;
}

export interface DojoState {
  /** The floor you're on: one past the floors you've beaten. */
  floor: number;
  duels: number;
  wins: number;
  losses: number;
  /** Losses on this floor since you got here. */
  grit: number;
  usedByDay: Map<string, number>;
  /** The last few duels, newest first. */
  recent: { n: number; floor: number; won: boolean; rounds: number; at: string }[];
}

export function dojoOf(txs: Tx[]): DojoState {
  const all: DojoState['recent'] = [];
  const usedByDay = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== 'duel') continue;
    const d = parseDuelRef(t.ref);
    if (!d) continue;
    all.push({ ...d, at: t.at });
    usedByDay.set(t.at, (usedByDay.get(t.at) ?? 0) + 1);
  }
  all.sort((a, b) => a.n - b.n);
  // A floor counts once, however many devices beat it.
  const beaten = new Set(all.filter((d) => d.won).map((d) => d.floor));
  let floor = 1;
  while (beaten.has(floor)) floor++;
  const grit = Math.min(GRIT_MAX, all.filter((d) => !d.won && d.floor === floor).length);
  return { floor, duels: all.length, wins: all.filter((d) => d.won).length, losses: all.filter((d) => !d.won).length, grit, usedByDay, recent: all.slice(-6).reverse() };
}

// ─── the vault ──────────────────────────────────────────────────────────────

export const VAULT_SYMBOLS = ['火', '水', '木', '金', '土', '月'] as const;
export const VAULT_NAMES = ['Fire', 'Water', 'Wood', 'Gold', 'Earth', 'Moon'] as const;
export const VAULT_SLOTS = 4;
export const VAULT_TRIES = 8;

/** The day's code: four symbols (by index), repeats allowed. */
export function codeFor(date: string): number[] {
  const r = stream(`vault:${date}`);
  return Array.from({ length: VAULT_SLOTS }, () => Math.floor(r() * VAULT_SYMBOLS.length));
}

/** How close a guess is: `hit` right symbol in the right place, `near` right symbol in the wrong place. */
export function judge(code: number[], guess: number[]): { hit: number; near: number } {
  let hit = 0;
  const left = new Map<number, number>();
  const spare: number[] = [];
  code.forEach((c, i) => {
    if (guess[i] === c) hit++;
    else {
      left.set(c, (left.get(c) ?? 0) + 1);
      spare.push(guess[i]);
    }
  });
  let near = 0;
  for (const g of spare) {
    const n = left.get(g) ?? 0;
    if (n > 0) {
      near++;
      left.set(g, n - 1);
    }
  }
  return { hit, near };
}

export const validGuess = (g: unknown): g is number[] => Array.isArray(g) && g.length === VAULT_SLOTS && g.every((x) => Number.isInteger(x) && x >= 0 && x < VAULT_SYMBOLS.length);

/** What the vault pays for the number of tries it took (0: it stayed shut). */
export function vaultPrize(tries: number): Bag {
  if (tries <= 0) return { coins: 15 };
  if (tries <= 3) return { coins: 300, gems: 12, tickets: 1 };
  if (tries <= 5) return { coins: 150, gems: 5 };
  if (tries === 6) return { coins: 100, gems: 3 };
  if (tries === 7) return { coins: 70 };
  return { coins: 50 };
}

export const vaultRef = (date: string, tries: number) => `vault:${date}:${tries}`;

export function parseVaultRef(ref: string): { date: string; tries: number } | null {
  const m = /^vault:(\d{4}-\d{2}-\d{2}):(\d)$/.exec(ref);
  return m ? { date: m[1], tries: +m[2] } : null;
}

/** Vaults cracked, ever. */
export const VAULT_PRIZES: { at: number; gain: Bag; title?: string }[] = [
  { at: 5, gain: { gems: 15, chests: ['iron'] } },
  { at: 15, gain: { gems: 30, tickets: 2 }, title: 'safecracker' },
  { at: 40, gain: { gems: 60, chests: ['gold'] }, title: 'locksmith' },
];

export const vaultBookRef = (at: number) => `vaultbook:${at}`;

export interface VaultState {
  /** Today's result, once it's in: the tries it took (0: it stayed shut). */
  today: { tries: number } | null;
  /** Open once anything is logged today. */
  open: boolean;
  cracked: number;
  failed: number;
  /** Fewest tries ever. */
  best: number | null;
  /** Days in a row cracked, up to today (or yesterday, while today's is still shut). */
  run: number;
}

export function vaultOf(txs: Tx[], today: string, activeToday: boolean): VaultState {
  const days = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== 'crack') continue;
    const v = parseVaultRef(t.ref);
    if (v) days.set(v.date, v.tries);
  }
  const solved = [...days.values()].filter((n) => n > 0);
  let run = 0;
  for (let d = days.has(today) ? today : addDays(today, -1); (days.get(d) ?? 0) > 0; d = addDays(d, -1)) run++;
  return {
    today: days.has(today) ? { tries: days.get(today)! } : null,
    open: activeToday,
    cracked: solved.length,
    failed: days.size - solved.length,
    best: solved.length ? Math.min(...solved) : null,
    run,
  };
}

// ─── everything at once ─────────────────────────────────────────────────────

export interface MoreState {
  today: string;
  balls: { now: number; today: number };
  bouts: { now: number; today: number };
  pachi: PachiState;
  dojo: DojoState;
  vault: VaultState;
  /** Vault milestones ready to claim. */
  vaultToClaim: number[];
}

/** `stats` are each day's facts (arcade.ts `dayStats`), from the day the Arcade opened. */
export function moreOf(input: EarnInput, stats: Map<string, DayStat>): MoreState {
  const today = input.today;
  const active = new Set(input.activeDays);
  const pachi = pachiOf(input.txs);
  const dojo = dojoOf(input.txs);
  const ballsEarned = new Map<string, number>();
  const boutsEarned = new Map<string, number>();
  for (let d = MORE_FROM; d <= today; d = addDays(d, 1)) {
    const b = ballsFor(stats.get(d), active.has(d));
    if (b) ballsEarned.set(d, b);
    const c = boutsFor(stats.get(d), active.has(d));
    if (c) boutsEarned.set(d, c);
  }
  const vault = vaultOf(input.txs, today, active.has(today));
  const claimed = new Set(input.txs.filter((t) => t.type === 'claim' && t.ref.startsWith('vaultbook:')).map((t) => t.ref));
  return {
    today,
    balls: bankOf(ballsEarned, pachi.usedByDay, today, BALL_CAP),
    bouts: bankOf(boutsEarned, dojo.usedByDay, today, BOUT_CAP),
    pachi,
    dojo,
    vault,
    vaultToClaim: VAULT_PRIZES.filter((p) => vault.cracked >= p.at && !claimed.has(vaultBookRef(p.at))).map((p) => p.at),
  };
}

/** Something waiting in the new games: balls, a challenge, today's vault or a prize. */
export function moreWaiting(m: MoreState): number {
  return (m.balls.now > 0 ? 1 : 0) + (m.bouts.now > 0 ? 1 : 0) + (m.vault.open && !m.vault.today ? 1 : 0) + m.vaultToClaim.length;
}
