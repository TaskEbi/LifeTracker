/**
 * Study notes: which sections you've ticked as understood, and how well you know each flash
 * card. One `nt_read` row and one `nt_card` row per topic (lt_records, study section, no
 * migration), with ids derived from the topic so two devices write the same rows. No content
 * import here: Study and Home use this.
 */
import { sectionRecords } from '../../data/lt';
import { pairId } from '../../data/logActions';
import { commit, data, type DataState } from '../../data/store';
import type { LtRecord } from '../../data/types';

export const NOTE_KIND = 'nt_read';
const SECTION = 'study' as const;

/** Topic id → the section ids ticked. */
export type NotesRead = Map<string, Set<string>>;

export function notesIn(st: DataState): NotesRead {
  const out: NotesRead = new Map();
  for (const r of sectionRecords(st, SECTION, NOTE_KIND)) {
    const { topic, secs } = r.data;
    if (typeof topic !== 'string' || !Array.isArray(secs)) continue;
    const ids = secs.filter((x): x is string => typeof x === 'string');
    if (ids.length) out.set(topic, new Set(ids));
  }
  return out;
}

/** Ticks or unticks one section of a topic; a topic with nothing ticked has no row. */
export function setSection(topic: string, sec: string, on: boolean) {
  const id = pairId('nt:read', topic);
  const prev = data.get().lt_records.get(id);
  const live = prev && !prev.deleted_at ? prev : undefined;
  const secs = new Set(live && Array.isArray(live.data.secs) ? (live.data.secs as unknown[]).filter((x): x is string => typeof x === 'string') : []);
  if (secs.has(sec) === on) return;
  if (on) secs.add(sec);
  else secs.delete(sec);
  const t = new Date().toISOString();
  if (!secs.size) {
    if (live) commit('lt_records', [{ ...live, deleted_at: t, updated_at: t }]);
    return;
  }
  const value = { topic, secs: [...secs] };
  const row: LtRecord = prev
    ? { ...prev, data: value, deleted_at: null, updated_at: t }
    : { id, section: SECTION, kind: NOTE_KIND, data: value, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null };
  commit('lt_records', [row]);
}

// ── flash cards ──

export const CARD_KIND = 'nt_card';
const TOP_BOX = 5;

/** Card id (`<topic>#<key>`) → its box and the day it is next due. */
export type CardMarks = Map<string, { box: number; due: string }>;

const isDay = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);

/** A row's `cards` is `{ <key>: [box, due] }`; anything else in it is skipped. */
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

export function cardsIn(st: DataState): CardMarks {
  const out: CardMarks = new Map();
  for (const r of sectionRecords(st, SECTION, CARD_KIND)) {
    const { topic, cards } = r.data;
    if (typeof topic !== 'string') continue;
    for (const [key, box, due] of readCards(cards)) out.set(`${topic}#${key}`, { box, due });
  }
  return out;
}

/** Keeps one card's mark in its topic's row. */
export function markCard(topic: string, key: string, mark: { box: number; due: string }) {
  const id = pairId('nt:card', topic);
  const prev = data.get().lt_records.get(id);
  const live = prev && !prev.deleted_at ? prev : undefined;
  const cards: Record<string, [number, string]> = {};
  for (const [k, box, due] of readCards(live?.data.cards)) cards[k] = [box, due];
  cards[key] = [mark.box, mark.due];
  const t = new Date().toISOString();
  const value = { topic, cards };
  const row: LtRecord = prev
    ? { ...prev, data: value, deleted_at: null, updated_at: t }
    : { id, section: SECTION, kind: CARD_KIND, data: value, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null };
  commit('lt_records', [row]);
}

/** Forgets every mark for these topics, so their cards are new again. */
export function resetCards(topics: readonly string[]) {
  const t = new Date().toISOString();
  const rows: LtRecord[] = [];
  for (const topic of topics) {
    const prev = data.get().lt_records.get(pairId('nt:card', topic));
    if (prev && !prev.deleted_at) rows.push({ ...prev, deleted_at: t, updated_at: t });
  }
  if (rows.length) commit('lt_records', rows);
}

/** Cards due today or earlier, counted from the marks alone. */
export function cardsDue(marks: CardMarks, today: string): number {
  let n = 0;
  for (const m of marks.values()) if (m.due <= today) n++;
  return n;
}

/** The line under the door on Study and Home. */
export function notesLine(read: NotesRead, due = 0): string {
  let secs = 0;
  for (const s of read.values()) secs += s.size;
  const cards = due ? `${due} ${due === 1 ? 'flash card' : 'flash cards'} due` : '';
  if (!secs) return cards || 'Physics · Maths · Further Maths · Computer Science, topic by topic';
  return `${secs} ${secs === 1 ? 'section' : 'sections'} understood across ${read.size} ${read.size === 1 ? 'topic' : 'topics'}${cards ? ` · ${cards}` : ''}`;
}
