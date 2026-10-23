/** Section things kept in lt_records: repertoire, gym templates, marks, study notes. */
import { uuid } from '../lib/random';
import { commit, data } from './store';
import type { LtRecord, SectionId } from './types';
import { toast } from './ui';

const now = () => new Date().toISOString();

export function saveRecord(section: SectionId, kind: string, value: Record<string, unknown>, id?: string | null): LtRecord {
  const st = data.get();
  const prev = id ? st.lt_records.get(id) : undefined;
  const t = now();
  const siblings = [...st.lt_records.values()].filter((r) => !r.deleted_at && r.section === section && r.kind === kind);
  const row: LtRecord = prev
    ? { ...prev, data: value, deleted_at: null, updated_at: t }
    : {
        id: uuid(),
        section,
        kind,
        data: value,
        sort_order: siblings.reduce((m, r) => Math.max(m, r.sort_order), 0) + 1,
        archived_at: null,
        created_at: t,
        updated_at: t,
        deleted_at: null,
      };
  commit('lt_records', [row]);
  return row;
}

export function setArchived(id: string, archived: boolean) {
  const r = data.get().lt_records.get(id);
  if (!r || !!r.archived_at === archived) return;
  commit('lt_records', [{ ...r, archived_at: archived ? now() : null, updated_at: now() }]);
}

export function deleteRecord(id: string, label = 'Deleted') {
  const r = data.get().lt_records.get(id);
  if (!r || r.deleted_at) return;
  const at = now();
  commit('lt_records', [{ ...r, deleted_at: at, updated_at: at }]);
  toast(label, {
    label: 'Undo',
    run: () => {
      const back = data.get().lt_records.get(id);
      if (back?.deleted_at === at) commit('lt_records', [{ ...back, deleted_at: null, updated_at: now() }]);
    },
  });
}
