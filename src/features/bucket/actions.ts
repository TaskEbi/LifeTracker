/** Bucket-list changes. Every write goes through `commit` (local-first, synced); crossing off shows its reward. */
import { withReward } from '../../data/lt';
import { commit, data, type DataState } from '../../data/store';
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

/** Add each title (skipping ones already on the list). Returns what was added and how many were already there. */
export function addBucket(titles: string[]): { added: LtBucket[]; dupes: number } {
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
    added.push({ id: uuid(), title, note: null, done_at: null, sort_order: ++order, data: {}, created_at: t, updated_at: t, deleted_at: null });
  }
  commit('lt_bucket', added);
  return { added, dupes };
}

export function updateBucket(id: string, patch: { title: string; note: string }): string | null {
  const prev = data.get().lt_bucket.get(id);
  if (!prev || prev.deleted_at) return 'That one has gone.';
  const title = clean(patch.title);
  if (!title) return 'Write what it is.';
  const note = patch.note.trim().slice(0, 2000) || null;
  commit('lt_bucket', [{ ...prev, title, note, updated_at: now() }]);
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
