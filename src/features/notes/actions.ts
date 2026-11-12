/**
 * Study notes: which sections you've ticked as understood. One `nt_read` row per topic
 * (lt_records, study section, no migration), with an id derived from the topic so two devices
 * ticking the same topic write the same row. No content import here: Study and Home use this.
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

/** The line under the door on Study and Home. */
export function notesLine(read: NotesRead): string {
  let secs = 0;
  for (const s of read.values()) secs += s.size;
  if (!secs) return 'Physics · Maths · Further Maths · Computer Science, topic by topic';
  return `${secs} ${secs === 1 ? 'section' : 'sections'} understood across ${read.size} ${read.size === 1 ? 'topic' : 'topics'}`;
}
