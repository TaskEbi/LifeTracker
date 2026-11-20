/**
 * Atlas records: lt_records under the cabinet section, no migration.
 *   geo_card    one per continent (id from the continent): `cards` = { '<country>.<skill>': [box, due day] }
 *   geo_day     one per day played (id from the date): answers, right ones, points, best run, the daily
 *               challenge, right answers by skill/continent/typed/review (`by`), supplies used (`used`)
 *               and sittings finished with their best scores (`games`)
 *   geo_stamp   one per country mastered (id from the country), kept even if a card later slips
 *   geo_medal   one per deck and kind of question (id from both): the best medal won in a round
 *   geo_best    one per sprint or survival setting (id from it): the best score
 *   geo_buy     one per purchase at the Chandlery: item, how many, what it cost. Ships, charts and
 *               titles take their id from the item (bought once); supplies get a fresh id each time
 *   geo_voyage  one per voyage (fresh id): the route, ports passed and traded, the hull, how it ended
 *   geo_kit     one row (id from 'kit'): the chart, ship and title in use
 * Ids are derived where two devices should write the same row. What it pays in the Hangar, and the
 * Doubloons in the purse, are derived (src/domain/atlas/pay.ts, wallet.ts), never stored.
 */
import { useMemo } from 'react';
import { sectionRecords, useToday } from '../../data/lt';
import { pairId } from '../../data/logActions';
import { commit, data, type DataState } from '../../data/store';
import type { LtRecord } from '../../data/types';
import { uuid } from '../../lib/random';
import { cardKey, country, deck, isDiff, mastered, nextMark, TOP_BOX, weakIds, type Ask, type Deck, type Diff, type Marks, type Skill } from '../../domain/atlas/model';
import type { AtlasRow } from '../../domain/atlas/pay';
import { CHARTS, good, isKeep, isSupply, ship, SHIPS, TITLES, type SupplyId } from '../../domain/atlas/shop';
import { isFocus, voyageOver, type VoyageRow } from '../../domain/atlas/voyage';
import { walletOf, type BuyRec, type DayRec, type MedalRec, type VoyageRec, type Wallet } from '../../domain/atlas/wallet';
import { useStore } from '../../lib/createStore';

const SECTION = 'cabinet' as const;
const KINDS = ['geo_card', 'geo_day', 'geo_stamp', 'geo_medal', 'geo_best', 'geo_buy', 'geo_voyage', 'geo_kit'] as const;

export type GeoDay = DayRec;
export interface Medal {
  deck: string;
  type: string;
  tier: number;
  flawless: boolean;
  date: string;
}
export interface Best {
  style: string;
  deck: string;
  type: string;
  diff: string;
  score: number;
  date: string;
}
export interface Kit {
  chart: string;
  ship: string;
  title: string;
}
export interface AtlasState {
  marks: Marks;
  /** Oldest first. */
  days: GeoDay[];
  /** Country → the day it was stamped. */
  stamps: Map<string, string>;
  medals: Map<string, Medal>;
  medalRecs: MedalRec[];
  bests: Map<string, Best>;
  buys: BuyRec[];
  /** Newest first. */
  voyages: VoyageRec[];
  kit: Kit;
  /** Every point ever scored. */
  miles: number;
  rows: AtlasRow[];
}

const isDay = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const int = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.floor(x) : 0);
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const counts = (x: unknown): Record<string, number> => Object.fromEntries(Object.entries(obj(x)).map(([k, v]) => [k, int(v)]).filter(([, v]) => v));

export const medalKey = (deckId: string, type: string) => `${deckId}|${type}`;
export const bestKey = (style: string, deckId: string, type: string, level: string) => `${style}|${deckId}|${type}|${level}`;
export const KIT_ID = pairId('geo', 'kit');
const DEFAULT_KIT: Kit = { chart: 'night', ship: 'raft', title: '' };

function readCards(raw: unknown): [string, number, string][] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const out: [string, number, string][] = [];
  for (const [key, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(v)) continue;
    const [box, due] = v as unknown[];
    if (typeof box === 'number' && Number.isInteger(box) && box >= 1 && box <= TOP_BOX && isDay(due)) out.push([key, box, due]);
  }
  return out;
}

function dayOfRow(r: LtRecord): GeoDay | null {
  const d = r.data;
  if (!isDay(d.date)) return null;
  const raw = d.daily as Record<string, unknown> | null | undefined;
  const games: GeoDay['games'] = {};
  for (const [k, v] of Object.entries(obj(d.games))) {
    const g = obj(v);
    if (int(g.n)) games[k] = { n: int(g.n), best: int(g.best), full: int(g.full) };
  }
  return {
    date: d.date,
    n: int(d.n),
    ok: int(d.ok),
    pts: int(d.pts),
    best: int(d.best),
    daily: raw && typeof raw === 'object' ? { ok: int(raw.ok), n: int(raw.n), pts: int(raw.pts) } : null,
    by: counts(d.by),
    used: counts(d.used),
    games,
  };
}

function voyageOfRow(r: LtRecord): VoyageRec | null {
  const d = r.data;
  const route = Array.isArray(d.route) ? d.route.filter((x): x is string => typeof x === 'string' && !!country(x)) : [];
  if (!isDay(d.date) || route.length < 2) return null;
  const log = Array.isArray(d.log) ? d.log.map((x) => x === true) : [];
  return {
    id: r.id,
    date: d.date,
    at: typeof d.at === 'string' ? d.at : r.created_at,
    legs: route.length,
    route,
    diff: isDiff(String(d.diff)) ? (d.diff as Diff) : 'normal',
    focus: isFocus(String(d.focus)) ? (d.focus as VoyageRow['focus']) : 'mix',
    ship: ship(String(d.ship)).id,
    hull: int(d.hull),
    i: Math.min(int(d.i), route.length),
    ok: Math.min(int(d.ok), route.length),
    log,
    done: d.done === true,
    sunk: d.sunk === true,
  };
}

let lastRecs: DataState['lt_records'] | null = null;
let last: AtlasState | null = null;
export function atlasOf(st: DataState): AtlasState {
  if (st.lt_records === lastRecs && last) return last;
  lastRecs = st.lt_records;
  const out: AtlasState = { marks: new Map(), days: [], stamps: new Map(), medals: new Map(), medalRecs: [], bests: new Map(), buys: [], voyages: [], kit: { ...DEFAULT_KIT }, miles: 0, rows: [] };
  for (const kind of KINDS) {
    for (const r of sectionRecords(st, SECTION, kind)) {
      const d = r.data;
      out.rows.push({ id: r.id, kind, data: d });
      if (kind === 'geo_card') {
        for (const [key, box, due] of readCards(d.cards)) out.marks.set(key, { box, due });
      } else if (kind === 'geo_day') {
        const day = dayOfRow(r);
        if (day) out.days.push(day);
      } else if (kind === 'geo_stamp') {
        if (typeof d.cc === 'string' && isDay(d.date)) out.stamps.set(d.cc, d.date);
      } else if (kind === 'geo_medal') {
        if (typeof d.deck === 'string' && typeof d.type === 'string' && isDay(d.date) && int(d.tier)) {
          const m = { deck: d.deck, type: d.type, tier: Math.min(int(d.tier), 3), flawless: d.flawless === true, date: d.date };
          out.medals.set(medalKey(d.deck, d.type), m);
          out.medalRecs.push({ id: r.id, ...m, ...(isDay(d.flawlessOn) ? { flawlessOn: d.flawlessOn } : {}) });
        }
      } else if (kind === 'geo_best') {
        if (typeof d.style === 'string' && typeof d.deck === 'string' && typeof d.type === 'string' && typeof d.diff === 'string' && isDay(d.date))
          out.bests.set(bestKey(d.style, d.deck, d.type, d.diff), { style: d.style, deck: d.deck, type: d.type, diff: d.diff, score: int(d.score), date: d.date });
      } else if (kind === 'geo_buy') {
        if (typeof d.item === 'string' && good(d.item) && isDay(d.date)) out.buys.push({ id: r.id, item: d.item, n: Math.max(1, int(d.n)), cost: int(d.cost), date: d.date });
      } else if (kind === 'geo_voyage') {
        const v = voyageOfRow(r);
        if (v) out.voyages.push(v);
      } else if (kind === 'geo_kit') {
        if (typeof d.chart === 'string' && CHARTS.some((c) => c.id === d.chart)) out.kit.chart = d.chart;
        if (typeof d.ship === 'string' && SHIPS.some((s) => s.id === d.ship)) out.kit.ship = d.ship;
        if (typeof d.title === 'string' && (d.title === '' || TITLES.some((t) => t.id === d.title))) out.kit.title = d.title;
      }
    }
  }
  out.days.sort((a, b) => a.date.localeCompare(b.date));
  out.voyages.sort((a, b) => b.at.localeCompare(a.at));
  out.miles = out.days.reduce((n, d) => n + d.pts, 0);
  last = out;
  return out;
}
export const useAtlas = () => useStore(data, atlasOf);

export function walletFor(st: AtlasState, today: string): Wallet {
  return walletOf({ days: st.days, stamps: st.stamps, medals: st.medalRecs, voyages: st.voyages, buys: st.buys, today });
}
export function useWallet(): Wallet {
  const atlas = useAtlas();
  const today = useToday();
  return useMemo(() => walletFor(atlas, today), [atlas, today]);
}
/** The kit in use, falling back to the free ones for anything no longer owned. */
export function kitOf(st: AtlasState, w: Wallet): Kit {
  const k = st.kit;
  return { chart: w.owned.has(k.chart) ? k.chart : 'night', ship: w.owned.has(k.ship) ? k.ship : 'raft', title: k.title && w.owned.has(k.title) ? k.title : '' };
}

/** A deck by id; "weak" is made from the cards you keep missing. */
export function deckOf(id: string, marks: Marks): Deck | undefined {
  if (id === 'weak') return { id: 'weak', name: 'Weak spots', group: 'special', ids: weakIds(marks), hint: 'The countries you missed last time' };
  return deck(id);
}

function upsert(id: string, kind: string, value: Record<string, unknown>, t: string): LtRecord {
  const prev = data.get().lt_records.get(id);
  return prev
    ? { ...prev, data: value, deleted_at: null, updated_at: t }
    : { id, section: SECTION, kind, data: value, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null };
}
const live = (id: string) => {
  const r = data.get().lt_records.get(id);
  return r && !r.deleted_at ? r : undefined;
};

/** Today's row as it stands, with every field kept (a newer version's fields too). */
function dayRow(today: string): { raw: Record<string, unknown>; day: GeoDay } {
  const prev = live(pairId('geo:day', today));
  const day = (prev && dayOfRow(prev)) || { date: today, n: 0, ok: 0, pts: 0, best: 0, daily: null, by: {}, used: {}, games: {} };
  return { raw: prev?.data ?? {}, day };
}
const dayRec = (raw: Record<string, unknown>, day: GeoDay, t: string) => upsert(pairId('geo:day', day.date), 'geo_day', { ...raw, ...day }, t);
const bump = (m: Record<string, number>, keys: string[]) => {
  const out = { ...m };
  for (const k of keys) out[k] = (out[k] ?? 0) + 1;
  return out;
};

export interface AnswerIn {
  id: string;
  skills: Skill[];
  right: boolean;
  /** The difficulty the card moves by (Easy when a supply helped). */
  diff: Diff;
  /** Points won by this answer. */
  pts: number;
  /** The run of right answers after it. */
  streak: number;
  /** Typed in (Expert), or part of a review: counted for quests. */
  typed?: boolean;
  review?: boolean;
}

/** Saves one answer: the country's cards, the day's totals, and a stamp if it has just been mastered. Returns the countries stamped. */
export function recordAnswer(a: AnswerIn, today: string): string[] {
  const t = new Date().toISOString();
  const st = atlasOf(data.get());
  const rows: LtRecord[] = [];

  const cont = country(a.id).cont;
  const cardId = pairId('geo:card', cont);
  const cards: Record<string, [number, string]> = {};
  for (const [k, box, due] of readCards(live(cardId)?.data.cards)) cards[k] = [box, due];
  const marks: Marks = new Map(st.marks);
  for (const skill of a.skills) {
    const key = cardKey(a.id, skill);
    const m = nextMark(marks.get(key), a.right, a.diff, today);
    marks.set(key, m);
    cards[key] = [m.box, m.due];
  }
  rows.push(upsert(cardId, 'geo_card', { cont, cards }, t));

  const { raw, day } = dayRow(today);
  const tags = a.right ? [...a.skills, cont, ...(a.typed ? ['typed'] : []), ...(a.review ? ['review'] : [])] : [];
  rows.push(dayRec(raw, { ...day, n: day.n + 1, ok: day.ok + (a.right ? 1 : 0), pts: day.pts + a.pts, best: Math.max(day.best, a.streak), by: bump(day.by, tags) }, t));

  const stamped: string[] = [];
  if (a.right && !st.stamps.has(a.id) && mastered(marks, a.id)) {
    rows.push(upsert(pairId('geo:stamp', a.id), 'geo_stamp', { cc: a.id, date: today }, t));
    stamped.push(a.id);
  }
  commit('lt_records', rows);
  return stamped;
}

/** The day's challenge counts once: the first finish. Returns false if today's was already in. */
export function recordDaily(today: string, result: { ok: number; n: number; pts: number }): boolean {
  const { raw, day } = dayRow(today);
  if (day.daily) return false;
  commit('lt_records', [dayRec(raw, { ...day, daily: result }, new Date().toISOString())]);
  return true;
}

/** A sitting finished (a round, sprint, voyage, mini-game…): counted for quests, its best kept for the day's pay. */
export function recordFinish(kind: string, score = 0, full = false, today: string) {
  const { raw, day } = dayRow(today);
  const g = day.games[kind] ?? { n: 0, best: 0, full: 0 };
  commit('lt_records', [dayRec(raw, { ...day, games: { ...day.games, [kind]: { n: g.n + 1, best: Math.max(g.best, Math.floor(score)), full: g.full + (full ? 1 : 0) } } }, new Date().toISOString())]);
}

/** Uses one supply, if there's one in hand. */
export function spendSupply(item: SupplyId, today: string): boolean {
  const w = walletFor(atlasOf(data.get()), today);
  if (item === 'anchor' || w.stock[item] <= 0) return false;
  const { raw, day } = dayRow(today);
  commit('lt_records', [dayRec(raw, { ...day, used: bump(day.used, [item]) }, new Date().toISOString())]);
  return true;
}

export type BuyResult = 'ok' | 'poor' | 'full' | 'owned' | 'unknown';
/** Buys from the Chandlery when the purse allows. */
export function buy(item: string, n: number, today: string): BuyResult {
  const g = good(item);
  if (!g || n < 1) return 'unknown';
  const w = walletFor(atlasOf(data.get()), today);
  if (isKeep(item)) {
    if (w.owned.has(item)) return 'owned';
    n = 1;
  } else if (isSupply(item) && w.stock[item] + n > (g.max ?? 99)) return 'full';
  const cost = g.price * n;
  if (cost > w.balance) return 'poor';
  const id = isKeep(item) ? pairId('geo:buy', item) : uuid();
  commit('lt_records', [upsert(id, 'geo_buy', { item, n, cost, date: today }, new Date().toISOString())]);
  return 'ok';
}

export function setKit(patch: Partial<Kit>) {
  const st = atlasOf(data.get());
  const prev = live(KIT_ID)?.data ?? {};
  commit('lt_records', [upsert(KIT_ID, 'geo_kit', { ...prev, ...st.kit, ...patch }, new Date().toISOString())]);
}

/** Sets sail: the voyage's row is written at once, so it can be picked up again. */
export function startVoyage(v: Omit<VoyageRow, 'i' | 'ok' | 'log' | 'done' | 'sunk' | 'at'>): string {
  const id = uuid();
  const t = new Date().toISOString();
  commit('lt_records', [upsert(id, 'geo_voyage', { ...v, at: t, i: 0, ok: 0, log: [], done: false, sunk: false }, t)]);
  return id;
}

/** One port passed: traded (right) or a storm (wrong, a plank off the hull). Returns the voyage as it now stands. */
export function passPort(id: string, right: boolean): VoyageRec | null {
  const r = live(id);
  const v = r && voyageOfRow(r);
  if (!r || !v || voyageOver(v)) return null;
  const hull = v.hull - (right ? 0 : 1);
  const i = v.i + 1;
  const sunk = hull <= 0;
  const done = !sunk && i >= v.route.length;
  const next: VoyageRec = { ...v, hull, i, ok: v.ok + (right ? 1 : 0), log: [...v.log, right], sunk, done };
  commit('lt_records', [upsert(id, 'geo_voyage', { ...r.data, hull, i, ok: next.ok, log: next.log, sunk, done }, new Date().toISOString())]);
  return next;
}

/** A spare heart patches the hull by one plank. */
export function patchHull(id: string, today: string): boolean {
  const r = live(id);
  const v = r && voyageOfRow(r);
  if (!r || !v || voyageOver(v) || !spendSupply('heart', today)) return false;
  commit('lt_records', [upsert(id, 'geo_voyage', { ...live(id)!.data, hull: v.hull + 1 }, new Date().toISOString())]);
  return true;
}

export const voyageById = (id: string): VoyageRec | null => {
  const r = live(id);
  return r && r.kind === 'geo_voyage' ? voyageOfRow(r) : null;
};

/** Keeps a round's medal if it beats the one held. Returns what changed. */
export function recordMedal(deckId: string, type: Ask, tier: number, flawless: boolean, today: string): 'new' | 'flawless' | null {
  if (!tier || !deck(deckId)) return null;
  const id = pairId('geo:medal', medalKey(deckId, type));
  const held = atlasOf(data.get()).medals.get(medalKey(deckId, type));
  const t = new Date().toISOString();
  if (!held || tier > held.tier) {
    commit('lt_records', [upsert(id, 'geo_medal', { deck: deckId, type, tier, flawless, date: today, ...(flawless ? { flawlessOn: today } : {}) }, t)]);
    return 'new';
  }
  if (tier === held.tier && flawless && !held.flawless) {
    commit('lt_records', [upsert(id, 'geo_medal', { deck: deckId, type, tier, flawless: true, date: held.date, flawlessOn: today }, t)]);
    return 'flawless';
  }
  return null;
}

/** Keeps a sprint or survival score if it's the best for that setting. */
export function recordBest(style: string, deckId: string, type: Ask, level: Diff, score: number, today: string): boolean {
  if (score <= 0 || !deck(deckId)) return false;
  const key = bestKey(style, deckId, type, level);
  const held = atlasOf(data.get()).bests.get(key);
  if (held && held.score >= score) return false;
  commit('lt_records', [upsert(pairId('geo:best', key), 'geo_best', { style, deck: deckId, type, diff: level, score, date: today }, new Date().toISOString())]);
  return true;
}

/** Days in a row with ten right, held through missed days by anchors. */
export const atlasStreak = (st: AtlasState, today: string) => walletFor(st, today).streak.streak;
