/**
 * The Album's records. No new table and no migration: one lt_records row per photo (kind
 * `album_shot`) under the cabinet section, like the Hideout's rows. The image itself is a blob on the
 * device ("local:<id>") until the sync loop uploads it to the private `photos` bucket that Curio
 * Cabinet already uses (src/lib/photos.ts); the row also keeps a small inline thumbnail. Nothing here
 * earns XP.
 */
import { saveRecord, deleteRecord } from '../../data/records';
import { commit, data, type DataState } from '../../data/store';
import type { LtRecord, SectionId } from '../../data/types';
import { byDay, CAPTION_MAX, MEMORIES_PER_DAY, shotOf, SHOT_KIND, THUMB_MAX, type AlbumDay, type Shot, type ShotRole } from '../../domain/album/album';
import { useStore } from '../../lib/createStore';
import { storePhotoBlob, storeVideoBlob, thumbnail } from '../../lib/photos';
import type { Clip } from './clip';

export const ALBUM_SECTION: SectionId = 'cabinet';
/** Faces are portraits for the timelapse; memories keep more detail. */
const EDGE: Record<ShotRole, number> = { face: 1440, memory: 1600 };

export interface AlbumState {
  shots: Shot[];
  days: Map<string, AlbumDay>;
}

let lastMap: DataState['lt_records'] | null = null;
let last: AlbumState | null = null;

export function albumOf(st: DataState): AlbumState {
  if (st.lt_records === lastMap && last) return last;
  lastMap = st.lt_records;
  const shots: Shot[] = [];
  for (const r of st.lt_records.values()) {
    if (r.deleted_at || r.section !== ALBUM_SECTION || r.kind !== SHOT_KIND) continue;
    const s = shotOf(r);
    if (s) shots.push(s);
  }
  last = { shots, days: byDay(shots) };
  return last;
}
export const useAlbum = () => useStore(data, albumOf);

/** Keep a photo for a day. Saved on this device first; uploaded by the sync loop when sync is on. */
export async function addShot(file: Blob, date: string, role: ShotRole, caption = ''): Promise<Shot> {
  const day = albumOf(data.get()).days.get(date);
  if (role === 'memory' && (day?.memories.length ?? 0) >= MEMORIES_PER_DAY) throw new Error(`A day holds ${MEMORIES_PER_DAY} memories`);
  const { path, blob } = await storePhotoBlob(file, EDGE[role]);
  const thumb = await thumbnail(blob, THUMB_MAX).catch(() => null);
  const row = saveRecord(ALBUM_SECTION, SHOT_KIND, { date, role, path, thumb, caption: caption.trim().slice(0, CAPTION_MAX), star: false, at: new Date().toISOString() });
  // A new face replaces the day's old one (soft-deleted, like any removal).
  if (role === 'face' && day?.face) retire([day.face, ...day.extraFaces].map((f) => f.id));
  return shotOf(row)!;
}

/**
 * Keep a video as a memory (read and checked by readClip first). Kept on this device as it is;
 * uploaded to its own private bucket by the sync loop when sync is on. Its thumbnail is a still.
 */
export async function addClip(clip: Clip, date: string, caption = ''): Promise<Shot> {
  const day = albumOf(data.get()).days.get(date);
  if ((day?.memories.length ?? 0) >= MEMORIES_PER_DAY) throw new Error(`A day holds ${MEMORIES_PER_DAY} memories`);
  const path = await storeVideoBlob(clip.blob);
  const thumb = clip.poster ? await thumbnail(clip.poster, THUMB_MAX).catch(() => null) : null;
  const row = saveRecord(ALBUM_SECTION, SHOT_KIND, { date, role: 'memory', media: 'video', dur: Math.round(clip.dur * 10) / 10, path, thumb, caption: caption.trim().slice(0, CAPTION_MAX), star: false, at: new Date().toISOString() });
  return shotOf(row)!;
}

function retire(ids: string[]) {
  const at = new Date().toISOString();
  const rows = ids.map((id) => data.get().lt_records.get(id)).filter((r): r is LtRecord => !!r && !r.deleted_at);
  if (rows.length) commit('lt_records', rows.map((r) => ({ ...r, deleted_at: at, updated_at: at })));
}

const patch = (id: string, p: Record<string, unknown>) => {
  const r = data.get().lt_records.get(id);
  if (r && !r.deleted_at) commit('lt_records', [{ ...r, data: { ...r.data, ...p }, updated_at: new Date().toISOString() }]);
};

export const setCaption = (id: string, caption: string) => patch(id, { caption: caption.trim().slice(0, CAPTION_MAX) });

/** Make one memory the day's cover (and no other). */
export function starShot(id: string) {
  const shot = albumOf(data.get()).shots.find((s) => s.id === id);
  if (!shot) return;
  const day = albumOf(data.get()).days.get(shot.date);
  const on = !shot.star;
  for (const m of day?.memories ?? []) if (m.star && m.id !== id) patch(m.id, { star: false });
  patch(id, { star: on });
}

export const removeShot = (id: string, label = 'Photo removed') => deleteRecord(id, label);
