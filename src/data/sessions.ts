/**
 * Saving time spent in a section, the same way for every timed section: one Daily Log entry
 * (authoritative minutes, day, note; visible in Curio Cabinet's log too) plus an optional
 * LifeTracker detail with the same id. Editing updates both; deleting soft-deletes both, with undo.
 */
import { ensureSectionTopic, ensureSubcategory, ltToday } from './lt';
import { addEntry, deleteEntry, restoreEntry, updateEntry } from './logActions';
import { commit, data } from './store';
import type { LtDetail, TimedSection } from './types';
import { toast } from './ui';

export interface SessionSave {
  section: TimedSection;
  date: string;
  minutes: number;
  note: string | null;
  /** Subcategory name under the section's topic (created if needed), e.g. "Lesson". */
  subcategory?: string | null;
  /** Section detail, or null for a plain entry. */
  detail: Record<string, unknown> | null;
}

const now = () => new Date().toISOString();

/** Create or update a session. Returns an error message, or the entry id. */
export function saveSession(s: SessionSave, editId?: string | null): { error: string } | { id: string } {
  const st = data.get();
  const prev = editId ? st.log_entries.get(editId) : undefined;
  if (editId && (!prev || prev.deleted_at)) return { error: 'That session has gone (deleted on another device?).' };
  if (s.date > ltToday()) return { error: "That day hasn't happened yet." };

  // Editing keeps the entry under its own topic (it may come from Curio Cabinet).
  let topicId: string;
  let subId: string | null = null;
  try {
    topicId = prev?.topic_id ?? ensureSectionTopic(s.section);
    subId = s.subcategory ? ensureSubcategory(topicId, s.subcategory) : prev?.subcategory_id ?? null;
  } catch (e) {
    return { error: (e as Error).message };
  }
  const draft = { date: s.date, topic_id: topicId, subcategory_id: subId, minutes: s.minutes, note: s.note?.trim() || null };

  let id: string;
  if (prev) {
    const err = updateEntry(prev.id, draft);
    if (err) return { error: err };
    id = prev.id;
  } else {
    const made = addEntry(draft);
    if ('error' in made) return made;
    id = made.id;
  }

  const existing = data.get().lt_details.get(id);
  const t = now();
  if (s.detail) {
    const row: LtDetail = existing
      ? { ...existing, section: s.section, data: s.detail, deleted_at: null, updated_at: t }
      : { id, section: s.section, data: s.detail, created_at: t, updated_at: t, deleted_at: null };
    commit('lt_details', [row]);
  } else if (existing && !existing.deleted_at) {
    commit('lt_details', [{ ...existing, deleted_at: t, updated_at: t }]);
  }
  return { id };
}

/** Delete a session (entry and detail) with an Undo toast. */
export function deleteSession(id: string, label = 'Session deleted') {
  const at = deleteEntry(id);
  if (!at) return;
  const d = data.get().lt_details.get(id);
  if (d && !d.deleted_at) commit('lt_details', [{ ...d, deleted_at: at, updated_at: at }]);
  toast(label, {
    label: 'Undo',
    run: () => {
      restoreEntry(id, at);
      const back = data.get().lt_details.get(id);
      if (back?.deleted_at === at) commit('lt_details', [{ ...back, deleted_at: null, updated_at: now() }]);
    },
  });
}
