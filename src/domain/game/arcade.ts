/**
 * 遊 The Arcade: three games played with what you've logged.
 *
 * - Bingo: a 4 × 4 card each Monday. Cells mark themselves from the week's records; every line pays,
 *   lines through the golden cell pay double, a full card pays a gold chest.
 * - Sugoroku: a board of 32 squares. Dice come from active days; each roll lands on a square that
 *   pays (or blows you on, or hands you another die or a fishing cast). Passing Start pays a lap.
 * - The pond: casts come from the day's XP. A cast hooks a fish drawn from the hour, the season and
 *   the sections you logged today; the catch goes in the fish book.
 *
 * Like the rest of the Hangar, what you earn is derived and only what you do is stored, as `gm_tx`
 * rows: `claim` (bingo, fish book), `roll` and `cast`. A roll's or cast's row id comes from its
 * number (the 5th roll ever is always the same row), so its dice value or fish is fixed before it's
 * played: walking away and coming back gets the same one.
 */
import type { SectionId } from '../../data/types';
import { addDays, weekStart } from '../log/dates';
import type { XpEvent } from '../progress/engine';
import type { Bag, ChestTier, Rarity } from './catalog';
import type { EarnInput } from './earn';
import { stream } from './loot';
import type { Tx } from './wallet';

/** Nothing before the Arcade opened pays dice or casts. */
export const ARCADE_FROM = '2026-11-09';

// ─── what each day held ─────────────────────────────────────────────────────

export interface DayStat {
  xp: number;
  sections: Set<SectionId>;
  /** Timed sessions (and gym sessions), by section. */
  sessions: Map<SectionId, number>;
  tasks: number;
  night: boolean;
  bedtime: boolean;
  screenUnder: boolean;
  quests: number;
  boss: boolean;
}

const emptyDay = (): DayStat => ({ xp: 0, sections: new Set(), sessions: new Map(), tasks: 0, night: false, bedtime: false, screenUnder: false, quests: 0, boss: false });

/** Each day's facts from the XP events (items used from the Hangar don't count). */
export function dayStats(xp: XpEvent[], from: string, to: string): Map<string, DayStat> {
  const out = new Map<string, DayStat>();
  for (const e of xp) {
    if (e.date < from || e.date > to || e.key.startsWith('item:')) continue;
    let d = out.get(e.date);
    if (!d) out.set(e.date, (d = emptyDay()));
    d.xp += e.xp;
    const real = e.section !== 'general' && e.section !== 'quests';
    if (real) d.sections.add(e.section as SectionId);
    if (real && e.key.startsWith('entry:') && (e.key.endsWith(':logged') || e.key.endsWith(':gym'))) {
      d.sessions.set(e.section as SectionId, (d.sessions.get(e.section as SectionId) ?? 0) + 1);
    }
    if (e.key.startsWith('task:')) d.tasks++;
    if (e.key.startsWith('night:') && e.key.endsWith(':logged')) d.night = true;
    if (e.key.startsWith('night:') && e.key.endsWith(':bedtime')) d.bedtime = true;
    if (e.key.startsWith('screen:') && e.key.endsWith(':under')) d.screenUnder = true;
    if (e.key.startsWith('quest:') && !e.key.endsWith(':sweep')) d.quests++;
    if (e.key.startsWith('boss:')) d.boss = true;
  }
  return out;
}

// ─── banks: dice and casts ──────────────────────────────────────────────────

/** Dice a day earns: one for turning up, one for three sections, one for a 120-XP day. */
export function diceFor(day: DayStat | undefined, active: boolean): number {
  if (!active) return 0;
  return 1 + (day && day.sections.size >= 3 ? 1 : 0) + (day && day.xp >= 120 ? 1 : 0);
}

/** Casts a day earns: one for turning up and one per 40 XP, five at most. */
export function castsFor(day: DayStat | undefined, active: boolean): number {
  if (!active) return 0;
  return Math.min(5, 1 + Math.floor((day?.xp ?? 0) / 40));
}

export const DICE_CAP = 12;
export const CAST_CAP = 15;

/**
 * What's in a bank today. Each day adds what it earned (up to the cap), then takes away what was used
 * that day; nothing goes below zero.
 */
export function bankOf(earned: Map<string, number>, used: Map<string, number>, today: string, cap: number): { now: number; today: number } {
  let n = 0;
  for (let d = ARCADE_FROM; d <= today; d = addDays(d, 1)) {
    n = Math.min(cap, n + (earned.get(d) ?? 0));
    n = Math.max(0, n - (used.get(d) ?? 0));
  }
  return { now: n, today: earned.get(today) ?? 0 };
}

// ─── bingo ──────────────────────────────────────────────────────────────────

export interface BingoWeek {
  xp: number;
  sections: Set<SectionId>;
  tasks: number;
  nights: number;
  bedtimes: number;
  screenUnder: number;
  sessions: number;
  bySection: Map<SectionId, number>;
  quests: number;
  boss: boolean;
  days: number;
  /** Most sections in one day. */
  widestDay: number;
  bestDayXp: number;
  hideoutDays: number;
  weekend: number;
}

export interface BingoCellDef {
  id: string;
  label: string;
  kanji: string;
  goal: number;
  measure: (w: BingoWeek) => number;
  section?: SectionId;
}

const GENERIC: BingoCellDef[] = [
  { id: 'xp400', label: 'Earn 400 XP', kanji: '経', goal: 400, measure: (w) => w.xp },
  { id: 'xp700', label: 'Earn 700 XP', kanji: '経', goal: 700, measure: (w) => w.xp },
  { id: 'day100', label: 'A 100-XP day', kanji: '百', goal: 1, measure: (w) => (w.bestDayXp >= 100 ? 1 : 0) },
  { id: 'wide3', label: '3 sections in one day', kanji: '三', goal: 3, measure: (w) => w.widestDay },
  { id: 'wide5', label: '5 sections this week', kanji: '五', goal: 5, measure: (w) => w.sections.size },
  { id: 'tasks3', label: 'Finish 3 tasks', kanji: '務', goal: 3, measure: (w) => w.tasks },
  { id: 'tasks6', label: 'Finish 6 tasks', kanji: '務', goal: 6, measure: (w) => w.tasks },
  { id: 'nights4', label: 'Log 4 nights', kanji: '眠', goal: 4, measure: (w) => w.nights },
  { id: 'nights6', label: 'Log 6 nights', kanji: '眠', goal: 6, measure: (w) => w.nights },
  { id: 'bed2', label: 'Keep bedtime twice', kanji: '床', goal: 2, measure: (w) => w.bedtimes },
  { id: 'screen3', label: 'Screen time under target ×3', kanji: '画', goal: 3, measure: (w) => w.screenUnder },
  { id: 'sess5', label: 'Log 5 sessions', kanji: '練', goal: 5, measure: (w) => w.sessions },
  { id: 'sess9', label: 'Log 9 sessions', kanji: '練', goal: 9, measure: (w) => w.sessions },
  { id: 'quest3', label: 'Clear 3 quests', kanji: '任', goal: 3, measure: (w) => w.quests },
  { id: 'quest6', label: 'Clear 6 quests', kanji: '任', goal: 6, measure: (w) => w.quests },
  { id: 'days4', label: 'Active on 4 days', kanji: '日', goal: 4, measure: (w) => w.days },
  { id: 'days6', label: 'Active on 6 days', kanji: '日', goal: 6, measure: (w) => w.days },
  { id: 'hq2', label: 'Use the Hideout on 2 days', kanji: '基', goal: 2, measure: (w) => w.hideoutDays },
  { id: 'weekend', label: 'Active Saturday and Sunday', kanji: '週', goal: 2, measure: (w) => w.weekend },
  { id: 'boss', label: "Defeat the week's boss", kanji: '討', goal: 1, measure: (w) => (w.boss ? 1 : 0) },
];

/** Sections with sessions of their own (sleep, screen and the cabinet don't have them). */
const TIMED: SectionId[] = ['violin', 'coding', 'sports', 'gym', 'study', 'chess', 'future', 'reading', 'maths'];
const KANJI: Partial<Record<SectionId, string>> = { violin: '弦', coding: '算', sports: '走', gym: '力', study: '学', chess: '将', future: '志', reading: '読', maths: '数' };
const NAME: Partial<Record<SectionId, string>> = { violin: 'violin', coding: 'coding', sports: 'sport', gym: 'gym', study: 'study', chess: 'chess', future: 'uni prep', reading: 'reading', maths: 'maths' };

const sectionCell = (s: SectionId, n: number): BingoCellDef => ({
  id: `s:${s}:${n}`,
  label: `${n} ${NAME[s]} session${n === 1 ? '' : 's'}`,
  kanji: KANJI[s] ?? '練',
  goal: n,
  section: s,
  measure: (w) => w.bySection.get(s) ?? 0,
});

export function bingoWeek(monday: string, input: EarnInput, stats?: Map<string, DayStat>): BingoWeek {
  const end = addDays(monday, 6);
  const days = stats ?? dayStats(input.xp, monday, end);
  const w: BingoWeek = { xp: 0, sections: new Set(), tasks: 0, nights: 0, bedtimes: 0, screenUnder: 0, sessions: 0, bySection: new Map(), quests: 0, boss: false, days: 0, widestDay: 0, bestDayXp: 0, hideoutDays: 0, weekend: 0 };
  for (let d = monday; d <= end; d = addDays(d, 1)) {
    const s = days.get(d);
    if (!s) continue;
    w.xp += s.xp;
    s.sections.forEach((x) => w.sections.add(x));
    w.tasks += s.tasks;
    w.nights += s.night ? 1 : 0;
    w.bedtimes += s.bedtime ? 1 : 0;
    w.screenUnder += s.screenUnder ? 1 : 0;
    for (const [sec, n] of s.sessions) {
      w.sessions += n;
      w.bySection.set(sec, (w.bySection.get(sec) ?? 0) + n);
    }
    w.quests += s.quests;
    w.boss ||= s.boss;
    w.widestDay = Math.max(w.widestDay, s.sections.size);
    w.bestDayXp = Math.max(w.bestDayXp, s.xp);
  }
  const active = new Set(input.activeDays.filter((d) => d >= monday && d <= end));
  w.days = active.size;
  w.weekend = (active.has(addDays(monday, 5)) ? 1 : 0) + (active.has(addDays(monday, 6)) ? 1 : 0);
  w.hideoutDays = new Set(input.rows.filter((r) => r.kind.startsWith('hq_') && r.day >= monday && r.day <= end).map((r) => r.day)).size;
  return w;
}

/** Timed sections with a session in the four weeks before this Monday: the card asks for those. */
export function bingoSections(monday: string, xp: XpEvent[]): SectionId[] {
  const from = addDays(monday, -28);
  const seen = new Map<SectionId, number>();
  for (const e of xp) {
    if (e.date < from || e.date >= monday) continue;
    if (!TIMED.includes(e.section as SectionId) || !e.key.startsWith('entry:') || !(e.key.endsWith(':logged') || e.key.endsWith(':gym'))) continue;
    seen.set(e.section as SectionId, (seen.get(e.section as SectionId) ?? 0) + 1);
  }
  return TIMED.filter((s) => seen.has(s));
}

export interface BingoCard {
  monday: string;
  cells: BingoCellDef[];
  /** Index of the golden cell. */
  gold: number;
}

/** The week's card: up to six cells for the sections you've been doing (asking for about what you did), the rest from the general pool. */
export function bingoCard(monday: string, xp: XpEvent[]): BingoCard {
  const r = stream(`bingo:${monday}`);
  const secs = [...bingoSections(monday, xp)];
  // How often each section came up in the four weeks before: the ask is about half that, 1–3.
  const from = addDays(monday, -28);
  const count = new Map<SectionId, number>();
  for (const e of xp) {
    if (e.date < from || e.date >= monday || !e.key.startsWith('entry:') || !(e.key.endsWith(':logged') || e.key.endsWith(':gym'))) continue;
    count.set(e.section as SectionId, (count.get(e.section as SectionId) ?? 0) + 1);
  }
  const pick: BingoCellDef[] = [];
  while (secs.length && pick.length < 6) {
    const s = secs.splice(Math.floor(r() * secs.length), 1)[0];
    const perWeek = (count.get(s) ?? 0) / 4;
    pick.push(sectionCell(s, Math.max(1, Math.min(3, Math.round(perWeek / 2)))));
  }
  const pool = [...GENERIC];
  while (pick.length < 16) pick.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  // Shuffle so the section cells don't sit together.
  for (let i = pick.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pick[i], pick[j]] = [pick[j], pick[i]];
  }
  return { monday, cells: pick, gold: Math.floor(r() * 16) };
}

/** The ten lines of a 4 × 4 card: four rows, four columns, two diagonals. */
export const LINES: number[][] = [
  ...[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => r * 4 + c)),
  ...[0, 1, 2, 3].map((c) => [0, 1, 2, 3].map((r) => r * 4 + c)),
  [0, 5, 10, 15],
  [3, 6, 9, 12],
];

export const lineName = (i: number) => (i < 4 ? `Row ${i + 1}` : i < 8 ? `Column ${i - 3}` : i === 8 ? 'Diagonal ↘' : 'Diagonal ↙');

export const LINE_PRIZE: Bag = { coins: 120, gems: 6 };
export const GOLD_LINE_PRIZE: Bag = { coins: 240, gems: 12, tickets: 1 };
export const FULL_PRIZE: Bag = { gems: 40, tickets: 2, chests: ['gold'], items: ['title:bingo'] };

export interface BingoState {
  card: BingoCard;
  progress: { def: BingoCellDef; done: number; marked: boolean }[];
  lines: { index: number; cells: number[]; complete: boolean; gold: boolean; claimed: boolean }[];
  full: boolean;
  fullClaimed: boolean;
  /** Line indexes (and 'full') ready to claim. */
  toClaim: (number | 'full')[];
}

export const bingoRef = (monday: string, line: number | 'full') => `bingo:${monday}:${line}`;

export function bingoState(monday: string, input: EarnInput): BingoState {
  const card = bingoCard(monday, input.xp);
  const w = bingoWeek(monday, input);
  const progress = card.cells.map((def) => {
    const done = Math.min(def.goal, def.measure(w));
    return { def, done, marked: done >= def.goal };
  });
  const claimed = new Set(input.txs.filter((t) => t.type === 'claim' && t.ref.startsWith(`bingo:${monday}:`)).map((t) => t.ref));
  const lines = LINES.map((cells, index) => ({
    index,
    cells,
    complete: cells.every((c) => progress[c].marked),
    gold: cells.includes(card.gold),
    claimed: claimed.has(bingoRef(monday, index)),
  }));
  const full = progress.every((p) => p.marked);
  const fullClaimed = claimed.has(bingoRef(monday, 'full'));
  const toClaim: (number | 'full')[] = lines.filter((l) => l.complete && !l.claimed).map((l) => l.index);
  if (full && !fullClaimed) toClaim.push('full');
  return { card, progress, lines, full, fullClaimed, toClaim };
}

export const bingoPrize = (s: BingoState, line: number | 'full'): Bag => (line === 'full' ? FULL_PRIZE : s.lines[line].gold ? GOLD_LINE_PRIZE : LINE_PRIZE);

/** Cells one short of a line: the ones worth chasing. */
export function hotCells(s: BingoState): Set<number> {
  const out = new Set<number>();
  for (const l of s.lines) {
    if (l.complete) continue;
    const open = l.cells.filter((c) => !s.progress[c].marked);
    if (open.length === 1) out.add(open[0]);
  }
  return out;
}

// ─── sugoroku ───────────────────────────────────────────────────────────────

export type TileKind = 'start' | 'coins' | 'gems' | 'mat' | 'ticket' | 'chest' | 'dust' | 'wind' | 'shrine' | 'pond' | 'dice' | 'tea';

export interface Tile {
  kind: TileKind;
  kanji: string;
  label: string;
  coins?: number;
  gems?: number;
  mats?: number;
  dust?: number;
  chest?: ChestTier;
  /** Squares the wind blows you on. */
  jump?: number;
}

const T = {
  start: { kind: 'start', kanji: '始', label: 'Start' },
  c1: { kind: 'coins', kanji: '両', label: '60 Ryō', coins: 60 },
  c2: { kind: 'coins', kanji: '両', label: '150 Ryō', coins: 150 },
  c3: { kind: 'coins', kanji: '両', label: '400 Ryō', coins: 400 },
  g1: { kind: 'gems', kanji: '玉', label: '3 Tama', gems: 3 },
  g2: { kind: 'gems', kanji: '玉', label: '8 Tama', gems: 8 },
  m: { kind: 'mat', kanji: '材', label: '6 materials', mats: 6 },
  m2: { kind: 'mat', kanji: '材', label: '12 materials', mats: 12 },
  tk: { kind: 'ticket', kanji: '券', label: 'Capsule ticket' },
  wood: { kind: 'chest', kanji: '木', label: 'Wooden crate', chest: 'wood' },
  iron: { kind: 'chest', kanji: '鉄', label: 'Iron strongbox', chest: 'iron' },
  dust: { kind: 'dust', kanji: '星', label: '30 Stardust', dust: 30 },
  wind: { kind: 'wind', kanji: '風', label: 'Wind: 3 squares on', jump: 3 },
  shrine: { kind: 'shrine', kanji: '神', label: 'Shrine: draw a fortune' },
  pond: { kind: 'pond', kanji: '池', label: 'Pond: 2 free casts' },
  dice: { kind: 'dice', kanji: '賽', label: 'Lucky die: roll again' },
  tea: { kind: 'tea', kanji: '茶', label: 'Tea house: a rest' },
} satisfies Record<string, Tile>;

/** The board, clockwise from Start. Wind never blows you onto wind. */
export const BOARD: Tile[] = [
  T.start, T.c1, T.m, T.shrine, T.c2, T.wind, T.g1, T.wood,
  T.pond, T.c1, T.tk, T.dust, T.wind, T.c2, T.m, T.dice,
  T.tea, T.g1, T.c1, T.shrine, T.iron, T.m2, T.wind, T.c2,
  T.pond, T.g2, T.c1, T.dust, T.dice, T.m, T.c3, T.tk,
];

/** Passing Start: Tama, Ryō and a strongbox; every fifth lap a gold chest; the third lap a title. */
export const LAP_PRIZE = (lap: number): Bag => ({ gems: 25, coins: 300, chests: [lap % 5 === 0 ? 'gold' : 'iron'], ...(lap === 3 ? { items: ['title:sugoroku'] } : {}) });

export const FORTUNES = [
  { id: 'daikichi', name: 'Great blessing', kanji: '大吉', gain: { gems: 15 } as Bag, weight: 1 },
  { id: 'kichi', name: 'Blessing', kanji: '吉', gain: { coins: 250 } as Bag, weight: 3 },
  { id: 'chukichi', name: 'Middle blessing', kanji: '中吉', gain: { coins: 120, tickets: 1 } as Bag, weight: 2 },
  { id: 'shokichi', name: 'Small blessing', kanji: '小吉', gain: { coins: 80 } as Bag, weight: 3 },
  { id: 'kyo', name: 'Curse (tied to the tree, no harm done)', kanji: '凶', gain: { coins: 10 } as Bag, weight: 1 },
];

export interface Roll {
  n: number;
  value: number;
  from: number;
  /** Where you ended (after any wind). */
  to: number;
  /** Laps finished after this roll. */
  lap: number;
  passedStart: boolean;
  tile: Tile;
  /** The square you landed on before the wind blew you on. */
  windFrom: number | null;
  fortune?: (typeof FORTUNES)[number];
  gain: Bag;
}

export const rollRef = (r: Pick<Roll, 'n' | 'value' | 'to' | 'lap'>) => `board:${r.n}:${r.value}:${r.to}:${r.lap}`;

export function parseRollRef(ref: string): { n: number; value: number; to: number; lap: number } | null {
  const m = /^board:(\d+):(\d):(\d+):(\d+)$/.exec(ref);
  return m ? { n: +m[1], value: +m[2], to: +m[3], lap: +m[4] } : null;
}

export interface BoardState {
  pos: number;
  lap: number;
  rolls: number;
  /** Extra dice and casts the board has handed out. */
  bonusDice: Map<string, number>;
  bonusCasts: Map<string, number>;
  last: { n: number; value: number; to: number } | null;
}

export function boardOf(txs: Tx[]): BoardState {
  const s: BoardState = { pos: 0, lap: 0, rolls: 0, bonusDice: new Map(), bonusCasts: new Map(), last: null };
  let top = 0;
  for (const t of txs) {
    if (t.type !== 'roll') continue;
    const r = parseRollRef(t.ref);
    if (!r) continue;
    s.rolls++;
    const kind = BOARD[r.to]?.kind;
    if (kind === 'dice') s.bonusDice.set(t.at, (s.bonusDice.get(t.at) ?? 0) + 1);
    if (kind === 'pond') s.bonusCasts.set(t.at, (s.bonusCasts.get(t.at) ?? 0) + 2);
    if (r.n > top) {
      top = r.n;
      s.pos = r.to;
      s.lap = r.lap;
      s.last = { n: r.n, value: r.value, to: r.to };
    }
  }
  return s;
}

/** The nth roll, from where you stand. `mats` are the sections a material square may pay in. */
export function rollDie(n: number, from: number, lap: number, mats: SectionId[]): Roll {
  const r = stream(`board:${n}`);
  const value = 1 + Math.floor(r() * 6);
  let at = from + value;
  let laps = lap;
  let passedStart = false;
  if (at >= BOARD.length) {
    at -= BOARD.length;
    laps++;
    passedStart = true;
  }
  let windFrom: number | null = null;
  if (BOARD[at].kind === 'wind') {
    windFrom = at;
    at += BOARD[at].jump ?? 0;
    if (at >= BOARD.length) {
      at -= BOARD.length;
      laps++;
      passedStart = true;
    }
  }
  const tile = BOARD[at];
  let gain: Bag = {};
  const add = (b: Bag) => (gain = merge(gain, b));
  if (passedStart) add(LAP_PRIZE(laps));
  let fortune: Roll['fortune'];
  switch (tile.kind) {
    case 'coins':
      add({ coins: tile.coins });
      break;
    case 'gems':
      add({ gems: tile.gems });
      break;
    case 'dust':
      add({ dust: tile.dust });
      break;
    case 'ticket':
      add({ tickets: 1 });
      break;
    case 'chest':
      add({ chests: [tile.chest!] });
      break;
    case 'mat': {
      const s = mats.length ? mats[Math.floor(r() * mats.length)] : 'cabinet';
      add({ mats: { [s]: tile.mats ?? 6 } });
      break;
    }
    case 'shrine': {
      const total = FORTUNES.reduce((a, f) => a + f.weight, 0);
      let v = r() * total;
      fortune = FORTUNES.find((f) => (v -= f.weight) < 0) ?? FORTUNES[0];
      add(fortune.gain);
      break;
    }
    case 'tea':
      add({ coins: 20 });
      break;
  }
  return { n, value, from, to: at, lap: laps, passedStart, tile, windFrom, fortune, gain };
}

function merge(a: Bag, b: Bag): Bag {
  const out: Bag = { ...a };
  for (const k of ['coins', 'gems', 'dust', 'tickets'] as const) if (b[k]) out[k] = (out[k] ?? 0) + (b[k] ?? 0);
  if (b.mats) {
    out.mats = { ...(out.mats ?? {}) };
    for (const [s, n] of Object.entries(b.mats)) out.mats[s as SectionId] = (out.mats[s as SectionId] ?? 0) + (n ?? 0);
  }
  if (b.chests) out.chests = [...(out.chests ?? []), ...b.chests];
  if (b.items) out.items = [...(out.items ?? []), ...b.items];
  return out;
}

// ─── the pond ───────────────────────────────────────────────────────────────

export type FishShape = 'fish' | 'long' | 'round' | 'flat' | 'squid';

export interface Fish {
  id: string;
  name: string;
  jp: string;
  rarity: Rarity;
  /** Length in cm, smallest to largest. */
  cm: [number, number];
  color: string;
  color2: string;
  shape: FishShape;
  /** Only bites at night (19:00–05:00) or by day. */
  when?: 'night' | 'day';
  /** Months (1–12) it's in season; all year if absent. */
  months?: number[];
  /** A spirit fish: only bites on a day you logged this section. */
  section?: SectionId;
  note: string;
}

export const FISH: Fish[] = [
  { id: 'funa', name: 'Crucian carp', jp: '鮒', rarity: 'common', cm: [10, 25], color: '#8a8f4e', color2: '#c9c58a', shape: 'fish', note: 'The first fish every angler in Japan is meant to start with.' },
  { id: 'haze', name: 'Goby', jp: '鯊', rarity: 'common', cm: [8, 18], color: '#a08a62', color2: '#e3d2a8', shape: 'fish', note: 'Sits on the bottom and bites at almost anything.' },
  { id: 'saba', name: 'Mackerel', jp: '鯖', rarity: 'common', cm: [25, 45], color: '#2f6f8f', color2: '#d8e6ee', shape: 'fish', note: 'Wavy stripes on its back, silver underneath.' },
  { id: 'aji', name: 'Horse mackerel', jp: '鯵', rarity: 'common', cm: [15, 35], color: '#7d9aa8', color2: '#f0f4f6', shape: 'fish', note: 'A pier favourite. Good fried.' },
  { id: 'dojo', name: 'Pond loach', jp: '鰌', rarity: 'common', cm: [8, 18], color: '#6b5a3e', color2: '#b8a47a', shape: 'long', note: 'Wriggles in rice-paddy mud and gulps air at the surface.' },
  { id: 'iwashi', name: 'Sardine', jp: '鰯', rarity: 'common', cm: [10, 22], color: '#4a6f9a', color2: '#e8eef5', shape: 'fish', note: 'Never alone: there are always a thousand more.' },
  { id: 'ayu', name: 'Sweetfish', jp: '鮎', rarity: 'rare', cm: [15, 28], color: '#9a9a52', color2: '#f2e48a', shape: 'fish', months: [6, 7, 8, 9], note: 'A summer river fish that smells faintly of melon.' },
  { id: 'yamame', name: 'Yamame trout', jp: '山女魚', rarity: 'rare', cm: [15, 35], color: '#6d7d5a', color2: '#e8c9c0', shape: 'fish', note: 'Lives in cold mountain streams; the dark marks on its side never fade.' },
  { id: 'hirame', name: 'Flounder', jp: '鮃', rarity: 'rare', cm: [30, 70], color: '#7a6448', color2: '#efe6d6', shape: 'flat', note: 'Both eyes on one side, lying flat on the sand.' },
  { id: 'namazu', name: 'Catfish', jp: '鯰', rarity: 'rare', cm: [30, 80], color: '#3d3f38', color2: '#8c8f80', shape: 'fish', note: 'Folklore says a giant one under Japan causes the earthquakes.' },
  { id: 'sanma', name: 'Pacific saury', jp: '秋刀魚', rarity: 'rare', cm: [25, 35], color: '#3b5f8a', color2: '#e6edf5', shape: 'long', months: [9, 10, 11], note: 'The taste of autumn, grilled whole with salt.' },
  { id: 'wakasagi', name: 'Pond smelt', jp: '公魚', rarity: 'rare', cm: [8, 14], color: '#9fb7c4', color2: '#f4f8fa', shape: 'fish', months: [12, 1, 2, 3], note: 'Caught through holes in frozen lakes.' },
  { id: 'sakuramasu', name: 'Cherry salmon', jp: '桜鱒', rarity: 'rare', cm: [40, 60], color: '#b77a8a', color2: '#f7dbe2', shape: 'fish', months: [3, 4, 5], note: 'Runs up the rivers when the cherry trees bloom.' },
  { id: 'koi', name: 'Nishikigoi', jp: '錦鯉', rarity: 'epic', cm: [40, 90], color: '#f5f1ea', color2: '#e0432f', shape: 'fish', note: 'A living brocade. Some are older than their owners.' },
  { id: 'fugu', name: 'Pufferfish', jp: '河豚', rarity: 'epic', cm: [15, 40], color: '#c9a35a', color2: '#f3ead2', shape: 'round', note: 'Puffs up when caught. Only licensed chefs may cut it.' },
  { id: 'unagi', name: 'Eel', jp: '鰻', rarity: 'epic', cm: [40, 100], color: '#3a3a2c', color2: '#9c9a6a', shape: 'long', note: 'Nobody has ever watched one spawn in the wild.' },
  { id: 'tai', name: 'Red sea bream', jp: '鯛', rarity: 'epic', cm: [30, 60], color: '#e0606a', color2: '#ffd6d0', shape: 'fish', note: 'The fish of celebrations: medetai.' },
  { id: 'hotaruika', name: 'Firefly squid', jp: '蛍烏賊', rarity: 'epic', cm: [5, 8], color: '#3a5bd6', color2: '#7df9ff', shape: 'squid', when: 'night', note: 'Glows blue in the dark. Only comes up at night.' },
  { id: 'trebla', name: 'Treble-fin', jp: '弦魚', rarity: 'epic', cm: [20, 40], color: '#b5651d', color2: '#ffd08a', shape: 'fish', section: 'violin', note: 'A spirit fish with f-holes for gills. Only bites on a day you practised.' },
  { id: 'bitfish', name: 'Bitfish', jp: '算魚', rarity: 'epic', cm: [10, 32], color: '#1fd17a', color2: '#0b2a1a', shape: 'fish', section: 'coding', note: 'Swims in binary. Bites on a day you coded.' },
  { id: 'sprat', name: 'Sprint sprat', jp: '走魚', rarity: 'epic', cm: [12, 24], color: '#ff7a2f', color2: '#ffe0c2', shape: 'long', section: 'sports', note: 'The fastest thing in the pond. Bites on a day you trained.' },
  { id: 'irongill', name: 'Iron-gill', jp: '力魚', rarity: 'epic', cm: [40, 80], color: '#7b8794', color2: '#dfe5ea', shape: 'round', section: 'gym', note: 'Heavier than it looks. Bites on a gym day.' },
  { id: 'scholar', name: 'Scholar scale', jp: '学魚', rarity: 'epic', cm: [20, 45], color: '#2f4f9f', color2: '#ffe9a8', shape: 'fish', section: 'study', note: 'Its scales are tiny pages. Bites on a day you studied.' },
  { id: 'knightray', name: 'Knight ray', jp: '将魚', rarity: 'epic', cm: [40, 90], color: '#2b2b2b', color2: '#efe9dc', shape: 'flat', section: 'chess', note: 'Moves in an L. Bites on a day you played chess.' },
  { id: 'bookworm', name: 'Bookworm eel', jp: '読魚', rarity: 'epic', cm: [40, 110], color: '#7a3e2a', color2: '#f0d9a8', shape: 'long', section: 'reading', note: 'Lives between the pages. Bites on a day you read.' },
  { id: 'piranha', name: 'Pi-ranha', jp: '数魚', rarity: 'epic', cm: [14, 31], color: '#c2185b', color2: '#ffd1e3', shape: 'fish', section: 'maths', note: 'Its length is never a whole number. Bites on a maths day.' },
  { id: 'compass', name: 'Compass fish', jp: '志魚', rarity: 'epic', cm: [20, 40], color: '#00897b', color2: '#c8fff4', shape: 'fish', section: 'future', note: 'Always faces north. Bites on a day you worked on uni prep.' },
  { id: 'dreamer', name: 'Dream drifter', jp: '眠魚', rarity: 'epic', cm: [25, 50], color: '#5c4bd6', color2: '#d8d0ff', shape: 'squid', section: 'sleep', when: 'night', note: 'Drifts up at night after a night of sleep you logged.' },
  { id: 'maguro', name: 'Bluefin tuna', jp: '鮪', rarity: 'legendary', cm: [120, 250], color: '#1d3557', color2: '#c8d6e5', shape: 'fish', note: 'Can cross an ocean in a month. You will need a bigger rod.' },
  { id: 'sansho', name: 'Giant salamander', jp: '大山椒魚', rarity: 'legendary', cm: [60, 150], color: '#5a4a32', color2: '#a8956e', shape: 'long', note: 'Not a fish at all. Has lived in these rivers since before the dinosaurs died.' },
  { id: 'ryugu', name: 'Oarfish', jp: '竜宮の使い', rarity: 'legendary', cm: [200, 500], color: '#d8dde6', color2: '#ff3b5c', shape: 'long', when: 'night', note: "The messenger from the Dragon King's palace. Only seen at night." },
  { id: 'kinkoi', name: 'Golden koi', jp: '金鯉', rarity: 'mythic', cm: [60, 100], color: '#ffc23d', color2: '#fff3c2', shape: 'fish', when: 'day', note: 'Said to bring a fortune to whoever lands it.' },
  { id: 'ryugyo', name: 'Dragon carp', jp: '登竜', rarity: 'mythic', cm: [100, 200], color: '#d62828', color2: '#ffd166', shape: 'fish', when: 'night', note: 'The carp that swam up the waterfall and became a dragon.' },
];

export const fishById = (id: string) => FISH.find((f) => f.id === id);

const FISH_ODDS: Record<Rarity, number> = { common: 58, rare: 28, epic: 10.5, legendary: 3, mythic: 0.5 };
export const FISH_COINS: Record<Rarity, number> = { common: 20, rare: 45, epic: 110, legendary: 300, mythic: 800 };
export const FIRST_CATCH_GEMS: Record<Rarity, number> = { common: 2, rare: 5, epic: 10, legendary: 25, mythic: 60 };
/** Taps on the reel needed to land it; one slip is allowed. */
export const REELS: Record<Rarity, number> = { common: 1, rare: 2, epic: 2, legendary: 3, mythic: 3 };
/** Width of the target on the reel bar, as a share of the bar. */
export const ZONE: Record<Rarity, number> = { common: 0.34, rare: 0.27, epic: 0.22, legendary: 0.17, mythic: 0.13 };

export interface PondContext {
  /** Hour on the Daily Log clock. */
  hour: number;
  /** 1–12. */
  month: number;
  /** Sections logged today: their spirit fish can bite. */
  sections: SectionId[];
}

export const isNight = (hour: number) => hour >= 19 || hour < 5;

/** Who could bite right now. */
export function biting(ctx: PondContext): Fish[] {
  const night = isNight(ctx.hour);
  return FISH.filter((f) => {
    if (f.when === 'night' && !night) return false;
    if (f.when === 'day' && night) return false;
    if (f.months && !f.months.includes(ctx.month)) return false;
    if (f.section && !ctx.sections.includes(f.section)) return false;
    return true;
  });
}

export interface Bite {
  n: number;
  fish: Fish;
  cm: number;
  /** Seconds before the float dips. */
  wait: number;
}

/** What's on the end of the nth cast. Spirit fish of today's sections are three times as likely within the epics. */
export function biteFor(n: number, ctx: PondContext): Bite {
  const r = stream(`cast:${n}`);
  const pool = biting(ctx);
  const rarities = (Object.keys(FISH_ODDS) as Rarity[]).filter((x) => pool.some((f) => f.rarity === x));
  const total = rarities.reduce((a, x) => a + FISH_ODDS[x], 0);
  let v = r() * total;
  const rarity = rarities.find((x) => (v -= FISH_ODDS[x]) < 0) ?? rarities[0];
  const options = pool.filter((f) => f.rarity === rarity);
  const weight = (f: Fish) => (f.section ? 3 : 1);
  let w = r() * options.reduce((a, f) => a + weight(f), 0);
  const fish = options.find((f) => (w -= weight(f)) < 0) ?? options[0];
  // Sizes bunch in the middle (two rolls averaged).
  const t = (r() + r()) / 2;
  const cm = Math.round((fish.cm[0] + t * (fish.cm[1] - fish.cm[0])) * 10) / 10;
  return { n, fish, cm, wait: 1.2 + r() * 2.6 };
}

/** What a landed fish pays: Ryō by rarity and size, a perfect reel 20% more, Tama the first time. */
export function catchPay(fish: Fish, cm: number, perfect: boolean, first: boolean): Bag {
  const size = 0.8 + 0.5 * ((cm - fish.cm[0]) / Math.max(1, fish.cm[1] - fish.cm[0]));
  const coins = Math.round(FISH_COINS[fish.rarity] * size * (perfect ? 1.2 : 1));
  return first ? { coins, gems: FIRST_CATCH_GEMS[fish.rarity] } : { coins };
}

export const ESCAPE_PAY: Bag = { coins: 5 };

export const castRef = (n: number, fish: string | null, cm: number, perfect: boolean) => `cast:${n}:${fish ?? 'away'}:${cm}:${perfect ? 1 : 0}`;

export function parseCastRef(ref: string): { n: number; fish: string | null; cm: number; perfect: boolean } | null {
  const m = /^cast:(\d+):([a-z]+):([\d.]+):([01])$/.exec(ref);
  return m ? { n: +m[1], fish: m[2] === 'away' ? null : m[2], cm: +m[3], perfect: m[4] === '1' } : null;
}

export interface BookEntry {
  fish: Fish;
  caught: number;
  best: number;
  first: string | null;
}

export interface PondState {
  casts: number;
  caught: number;
  escaped: number;
  book: Map<string, BookEntry>;
  usedByDay: Map<string, number>;
  /** The last catch, newest first, up to 8. */
  recent: { fish: Fish | null; cm: number; at: string; perfect: boolean }[];
}

export function pondOf(txs: Tx[]): PondState {
  const s: PondState = { casts: 0, caught: 0, escaped: 0, book: new Map(), usedByDay: new Map(), recent: [] };
  const seen: { n: number; fish: Fish | null; cm: number; at: string; perfect: boolean }[] = [];
  for (const t of txs) {
    if (t.type !== 'cast') continue;
    const c = parseCastRef(t.ref);
    if (!c) continue;
    s.casts++;
    s.usedByDay.set(t.at, (s.usedByDay.get(t.at) ?? 0) + 1);
    const fish = c.fish ? fishById(c.fish) ?? null : null;
    seen.push({ n: c.n, fish, cm: c.cm, at: t.at, perfect: c.perfect });
    if (!fish) {
      s.escaped++;
      continue;
    }
    s.caught++;
    const e = s.book.get(fish.id) ?? { fish, caught: 0, best: 0, first: null };
    e.caught++;
    e.best = Math.max(e.best, c.cm);
    if (!e.first || t.at < e.first) e.first = t.at;
    s.book.set(fish.id, e);
  }
  s.recent = seen.sort((a, b) => b.n - a.n).slice(0, 8);
  return s;
}

/** Fish book milestones: species caught. */
export const BOOK_PRIZES: { at: number; gain: Bag; title?: string }[] = [
  { at: 5, gain: { gems: 15, chests: ['iron'] } },
  { at: 10, gain: { gems: 25, tickets: 2 }, title: 'angler' },
  { at: 20, gain: { gems: 50, chests: ['gold'] } },
  { at: FISH.length, gain: { gems: 120, chests: ['mythic'] }, title: 'pondlord' },
];

export const bookRef = (at: number) => `fishbook:${at}`;

// ─── everything at once ─────────────────────────────────────────────────────

export interface ArcadeState {
  today: string;
  dice: { now: number; today: number };
  casts: { now: number; today: number };
  board: BoardState;
  pond: PondState;
  bingo: BingoState;
  /** Last week's card, while it has prizes left to claim. */
  lastBingo: BingoState | null;
  /** Fish-book milestones ready to claim. */
  bookToClaim: number[];
  /** Each day's facts since the Arcade opened. */
  stats: Map<string, DayStat>;
}

export function arcadeOf(input: EarnInput): ArcadeState {
  const today = input.today;
  const stats = dayStats(input.xp, ARCADE_FROM, today);
  const active = new Set(input.activeDays);
  const board = boardOf(input.txs);
  const pond = pondOf(input.txs);
  const diceEarned = new Map<string, number>();
  const castEarned = new Map<string, number>();
  for (let d = ARCADE_FROM; d <= today; d = addDays(d, 1)) {
    const n = diceFor(stats.get(d), active.has(d)) + (board.bonusDice.get(d) ?? 0);
    if (n) diceEarned.set(d, n);
    const c = castsFor(stats.get(d), active.has(d)) + (board.bonusCasts.get(d) ?? 0);
    if (c) castEarned.set(d, c);
  }
  const rollsUsed = new Map<string, number>();
  for (const t of input.txs) if (t.type === 'roll') rollsUsed.set(t.at, (rollsUsed.get(t.at) ?? 0) + 1);
  const monday = weekStart(today);
  const prev = addDays(monday, -7);
  const last = prev >= weekStart(ARCADE_FROM) ? bingoState(prev, input) : null;
  const claimedBook = new Set(input.txs.filter((t) => t.type === 'claim' && t.ref.startsWith('fishbook:')).map((t) => t.ref));
  return {
    today,
    dice: bankOf(diceEarned, rollsUsed, today, DICE_CAP),
    casts: bankOf(castEarned, pond.usedByDay, today, CAST_CAP),
    board,
    pond,
    bingo: bingoState(monday, input),
    lastBingo: last && last.toClaim.length ? last : null,
    bookToClaim: BOOK_PRIZES.filter((p) => pond.book.size >= p.at && !claimedBook.has(bookRef(p.at))).map((p) => p.at),
    stats,
  };
}

/** Something waiting in the Arcade: dice, casts or prizes. */
export function arcadeWaiting(a: ArcadeState): number {
  return (a.dice.now > 0 ? 1 : 0) + (a.casts.now > 0 ? 1 : 0) + a.bingo.toClaim.length + (a.lastBingo?.toClaim.length ?? 0) + a.bookToClaim.length;
}

