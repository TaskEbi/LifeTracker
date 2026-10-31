/** Bucket-list changes. Every write goes through `commit` (local-first, synced); crossing off shows its reward. */
import { withReward } from '../../data/lt';
import { commit, data, type DataState } from '../../data/store';
import { addTodo } from '../../data/todoActions';
import type { LtBucket } from '../../data/types';
import { toast } from '../../data/ui';
import { uuid } from '../../lib/random';

const now = () => new Date().toISOString();
export const BUCKET_TITLE_MAX = 200;

/** Live items: open ones newest first, then done ones most recently crossed off first. */
export function bucketItems(st: DataState): { open: LtBucket[]; done: LtBucket[] } {
  const live = [...st.lt_bucket.values()].filter((b) => !b.deleted_at);
  return {
    open: live.filter((b) => !b.done_at).sort((a, b) => b.sort_order - a.sort_order || b.created_at.localeCompare(a.created_at)),
    done: live.filter((b) => b.done_at).sort((a, b) => b.done_at!.localeCompare(a.done_at!)),
  };
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, BUCKET_TITLE_MAX);
/** One title per line of pasted text, without list markers ("- ", "• ", "1. ", "[ ] "). */
export const splitLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((l) => clean(l.replace(/^\s*(?:[-*•·–]|\d+[.)]|\[[ xX]?\])\s*/, '')))
    .filter(Boolean);

/** Add each title (skipping ones already on the list), with `extra` in its data (a section, say). Returns what was added and how many were already there. */
export function addBucket(titles: string[], extra: Record<string, unknown> = {}): { added: LtBucket[]; dupes: number } {
  const st = data.get();
  const live = [...st.lt_bucket.values()].filter((b) => !b.deleted_at);
  const seen = new Set(live.map((b) => b.title.toLowerCase()));
  let order = live.reduce((m, b) => Math.max(m, b.sort_order), 0);
  const t = now();
  const added: LtBucket[] = [];
  let dupes = 0;
  for (const raw of titles) {
    const title = clean(raw);
    if (!title) continue;
    if (seen.has(title.toLowerCase())) {
      dupes++;
      continue;
    }
    seen.add(title.toLowerCase());
    added.push({ id: uuid(), title, note: null, done_at: null, sort_order: ++order, data: { ...extra }, created_at: t, updated_at: t, deleted_at: null });
  }
  commit('lt_bucket', added);
  return { added, dupes };
}

export interface BucketPatch {
  title: string;
  note: string;
  /** A section id, or null to let the words decide again. */
  cat?: string | null;
  /** The year it is meant for, or null for someday. */
  by?: number | null;
  /** The smallest next step. */
  step?: string;
}

/** Set or clear keys of `data`; null removes a key, undefined leaves it. */
const merge = (d: Record<string, unknown>, patch: Record<string, unknown>) => {
  const out = { ...d };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (v === null || v === '') delete out[k];
    else out[k] = v;
  }
  return out;
};

export function updateBucket(id: string, patch: BucketPatch): string | null {
  const prev = data.get().lt_bucket.get(id);
  if (!prev || prev.deleted_at) return 'That one has gone.';
  const title = clean(patch.title);
  if (!title) return 'Write what it is.';
  const note = patch.note.trim().slice(0, 2000) || null;
  const step = patch.step === undefined ? undefined : clean(patch.step);
  const d = merge(prev.data, { cat: patch.cat, by: patch.by, step });
  commit('lt_bucket', [{ ...prev, title, note, data: d, updated_at: now() }]);
  return null;
}

/** Turn the next step into a task on the to-do list, linked from the item. */
export function stepToTask(id: string): string | null {
  const prev = data.get().lt_bucket.get(id);
  const step = typeof prev?.data.step === 'string' ? prev.data.step.trim() : '';
  if (!prev || prev.deleted_at) return 'That one has gone.';
  if (!step) return 'Write the next step first.';
  const todo = addTodo({ title: step, priority: 'normal', due: null, section: null });
  if ('error' in todo) return todo.error;
  commit('lt_bucket', [{ ...prev, data: { ...prev.data, task: todo.id }, updated_at: now() }]);
  toast('Added to your tasks');
  return null;
}

/** Crossed off and then un-crossed on this device this session: crossing again doesn't celebrate twice. */
const uncrossed = new Set<string>();

/** Cross it off. The XP is tied to the item, so it counts once however often it is crossed off. */
export function crossOff(id: string) {
  const prev = data.get().lt_bucket.get(id);
  if (!prev || prev.deleted_at || prev.done_at) return;
  const save = () => {
    const t = now();
    commit('lt_bucket', [{ ...prev, done_at: t, updated_at: t }]);
  };
  if (uncrossed.has(id)) {
    save();
    toast('Crossed off again');
  } else withReward(save);
}

export function uncross(id: string) {
  const prev = data.get().lt_bucket.get(id);
  if (!prev || prev.deleted_at || !prev.done_at) return;
  commit('lt_bucket', [{ ...prev, done_at: null, updated_at: now() }]);
  uncrossed.add(id);
  toast('Back on the list');
}

export function removeBucket(id: string) {
  const prev = data.get().lt_bucket.get(id);
  if (!prev || prev.deleted_at) return;
  const at = now();
  commit('lt_bucket', [{ ...prev, deleted_at: at, updated_at: at }]);
  toast('Removed from the list', {
    label: 'Undo',
    run: () => {
      const back = data.get().lt_bucket.get(id);
      if (back?.deleted_at === at) commit('lt_bucket', [{ ...back, deleted_at: null, updated_at: now() }]);
    },
  });
}
