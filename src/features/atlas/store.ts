/**
 * Atlas records: lt_records under the cabinet section, no migration.
 *   geo_card   one per continent (id from the continent): `cards` = { '<country>.<skill>': [box, due day] }
 *   geo_day    one per day played (id from the date): answers, right ones, points, best run, the daily challenge
 *   geo_stamp  one per country mastered (id from the country), kept even if a card later slips
 *   geo_medal  one per deck and kind of question (id from both): the best medal won in a round
 *   geo_best   one per sprint or survival setting (id from it): the best score
 * Ids are derived, so two devices write the same rows. What it pays in the Hangar is derived
 * (src/domain/atlas/pay.ts), never stored.
 */
import { sectionRecords } from '../../data/lt';
import { pairId } from '../../data/logActions';
import { commit, data, type DataState } from '../../data/store';
import type { LtRecord } from '../../data/types';
import { cardKey, country, deck, mastered, nextMark, streakOf, TOP_BOX, weakIds, type Ask, type Deck, type Diff, type Marks, type Skill } from '../../domain/atlas/model';
import type { AtlasRow } from '../../domain/atlas/pay';
import { useStore } from '../../lib/createStore';

const SECTION = 'cabinet' as const;
const KINDS = ['geo_card', 'geo_day', 'geo_stamp', 'geo_medal', 'geo_best'] as const;

export interface GeoDay {
  date: string;
  n: number;
  ok: number;
  pts: number;
  best: number;
  daily: { ok: number; n: number; pts: number } | null;
}
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
export interface AtlasState {
  marks: Marks;
  /** Oldest first. */
  days: GeoDay[];
  /** Country → the day it was stamped. */
  stamps: Map<string, string>;
  medals: Map<string, Medal>;
  bests: Map<string, Best>;
  /** Every point ever scored. */
  miles: number;
  rows: AtlasRow[];
}

const isDay = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const int = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.floor(x) : 0);

export const medalKey = (deckId: string, type: string) => `${deckId}|${type}`;
export const bestKey = (style: string, deckId: string, type: string, level: string) => `${style}|${deckId}|${type}|${level}`;

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
  return { date: d.date, n: int(d.n), ok: int(d.ok), pts: int(d.pts), best: int(d.best), daily: raw && typeof raw === 'object' ? { ok: int(raw.ok), n: int(raw.n), pts: int(raw.pts) } : null };
}

let lastRecs: DataState['lt_records'] | null = null;
let last: AtlasState | null = null;
export function atlasOf(st: DataState): AtlasState {
  if (st.lt_records === lastRecs && last) return last;
  lastRecs = st.lt_records;
  const out: AtlasState = { marks: new Map(), days: [], stamps: new Map(), medals: new Map(), bests: new Map(), miles: 0, rows: [] };
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
        if (typeof d.deck === 'string' && typeof d.type === 'string' && isDay(d.date) && int(d.tier)) out.medals.set(medalKey(d.deck, d.type), { deck: d.deck, type: d.type, tier: Math.min(int(d.tier), 3), flawless: d.flawless === true, date: d.date });
      } else if (typeof d.style === 'string' && typeof d.deck === 'string' && typeof d.type === 'string' && typeof d.diff === 'string' && isDay(d.date)) {
        out.bests.set(bestKey(d.style, d.deck, d.type, d.diff), { style: d.style, deck: d.deck, type: d.type, diff: d.diff, score: int(d.score), date: d.date });
      }
    }
  }
  out.days.sort((a, b) => a.date.localeCompare(b.date));
  out.miles = out.days.reduce((n, d) => n + d.pts, 0);
  last = out;
  return out;
}
export const useAtlas = () => useStore(data, atlasOf);

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

export interface AnswerIn {
  id: string;
  skills: Skill[];
  right: boolean;
  diff: Diff;
  /** Points won by this answer. */
  pts: number;
  /** The run of right answers after it. */
  streak: number;
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

  const dayId = pairId('geo:day', today);
  const prev = live(dayId);
  const day = (prev && dayOfRow(prev)) || { date: today, n: 0, ok: 0, pts: 0, best: 0, daily: null };
  rows.push(upsert(dayId, 'geo_day', { date: today, n: day.n + 1, ok: day.ok + (a.right ? 1 : 0), pts: day.pts + a.pts, best: Math.max(day.best, a.streak), daily: day.daily }, t));

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
  const id = pairId('geo:day', today);
  const prev = live(id);
  const day = (prev && dayOfRow(prev)) || { date: today, n: 0, ok: 0, pts: 0, best: 0, daily: null };
  if (day.daily) return false;
  commit('lt_records', [upsert(id, 'geo_day', { ...day, daily: result }, new Date().toISOString())]);
  return true;
}

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

export const atlasStreak = (st: AtlasState, today: string) => streakOf(st.days, today);
