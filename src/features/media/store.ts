/** Media records: one lt_records row per title, kind `md_item` under the cabinet section. No migration. */
import { sectionRecords } from '../../data/lt';
import { saveRecord } from '../../data/records';
import { data, type DataState } from '../../data/store';
import { mediaOf, type MediaItem } from '../../domain/media/model';
import { useStore } from '../../lib/createStore';

const SECTION = 'cabinet' as const;

let lastMap: DataState['lt_records'] | null = null;
let last: MediaItem[] = [];
export function mediaIn(st: DataState): MediaItem[] {
  if (st.lt_records === lastMap) return last;
  lastMap = st.lt_records;
  last = sectionRecords(st, SECTION, 'md_item')
    .map(mediaOf)
    .filter((m): m is MediaItem => m != null);
  return last;
}
export const useMedia = () => useStore(data, mediaIn);

export function saveMedia(m: Omit<MediaItem, 'id'>, id?: string) {
  return saveRecord(
    SECTION,
    'md_item',
    { title: m.title.trim().slice(0, 160), type: m.type, by: m.by.trim().slice(0, 120), state: m.state, rating: m.rating, progress: m.progress, total: m.total, started: m.started, finished: m.finished, note: m.note.trim().slice(0, 1000), fav: m.fav },
    id,
  );
}

export function patchMedia(m: MediaItem, patch: Partial<MediaItem>) {
  const { id, ...rest } = { ...m, ...patch };
  saveMedia(rest, id);
}
