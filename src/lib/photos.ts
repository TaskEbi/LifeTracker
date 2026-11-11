import { useEffect, useState } from 'react';
import { currentSession, data } from '../data/store';
import { updateItem } from '../data/actions';
import { supabase } from './supabase';
import { uuid } from './random';
import { SHOT_KIND, VIDEO_PREFIX } from '../domain/album/album';
import { commit } from '../data/store';

/**
 * Photos live in IndexedDB first (image_path "local:<id>") so saving works offline,
 * then get uploaded to the Supabase bucket ("shared/<id>.webp") when synced.
 * A copy stays in IndexedDB under the remote path, so this device never re-downloads it.
 */

const MAX_EDGE = 1600;
const BUCKET = 'photos';
/**
 * The Album's videos have a bucket of their own (supabase/migrations/20261111120000_lifetracker_album_video.sql):
 * Curio Cabinet's `photos` takes images only, up to 15 MB.
 */
const VIDEO_BUCKET = 'lt-videos';
const bucketOf = (path: string) => (path.startsWith(VIDEO_PREFIX) ? VIDEO_BUCKET : BUCKET);
const VIDEO_EXT: Record<string, string> = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' };

/** Downscale to at most `maxEdge` px and re-encode as WebP (JPEG if WebP isn't supported). */
export async function shrinkImage(file: Blob, maxEdge = MAX_EDGE, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = drawScaled(bitmap, maxEdge);
  bitmap.close();
  return encode(canvas, quality);
}

function drawScaled(src: ImageBitmap | HTMLCanvasElement, maxEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(src.width, src.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(src.width * scale));
  canvas.height = Math.max(1, Math.round(src.height * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const toBlob = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
  const webp = await toBlob('image/webp');
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await toBlob('image/jpeg');
  if (!jpeg) throw new Error('This browser could not save the photo');
  return jpeg;
}

/**
 * A small inline copy (data: URL) that fits in a database row, so grids load at once on every
 * device. Shrinks until it is under `maxChars`; null if even the smallest is too big.
 */
export async function thumbnail(blob: Blob, maxChars: number): Promise<string | null> {
  const bitmap = await createImageBitmap(blob);
  try {
    for (const [edge, q] of [
      [240, 0.7],
      [200, 0.6],
      [150, 0.55],
      [110, 0.5],
    ] as const) {
      const out = drawScaled(bitmap, edge).toDataURL('image/webp', q);
      // Safari before 17 can't write WebP and falls back to PNG, which is far bigger: use JPEG then.
      const url = out.startsWith('data:image/webp') ? out : drawScaled(bitmap, edge).toDataURL('image/jpeg', q);
      if (url.length <= maxChars) return url;
    }
    return null;
  } finally {
    bitmap.close();
  }
}

/** Keep a photo on this device and return the image_path to store on the item. */
export async function storePhoto(file: Blob, maxEdge = MAX_EDGE): Promise<string> {
  return (await storePhotoBlob(file, maxEdge)).path;
}

/** Same as storePhoto, also handing back the shrunk blob (for a thumbnail). */
export async function storePhotoBlob(file: Blob, maxEdge = MAX_EDGE): Promise<{ path: string; blob: Blob }> {
  const s = currentSession();
  if (!s) throw new Error('Not ready');
  const blob = await shrinkImage(file, maxEdge);
  const path = `local:${uuid()}`;
  await s.db.putBlob(path, blob);
  return { path, blob };
}

/** Keep a video on this device as it is (no re-encoding) and return its local path. */
export async function storeVideoBlob(file: Blob): Promise<string> {
  const s = currentSession();
  if (!s) throw new Error('Not ready');
  const path = `local:${uuid()}`;
  await s.db.putBlob(path, file);
  return path;
}

/** Upload photos still only on this device, then point their items at the bucket copy. */
export async function uploadPendingPhotos(): Promise<void> {
  const s = currentSession();
  if (!s || !s.cloud || !supabase) return;
  const pending = [...data.get().items.values()].filter((i) => i.image_path?.startsWith('local:') && !i.deleted_at);
  for (const item of pending) {
    const localPath = item.image_path!;
    const blob = await s.db.getBlob(localPath);
    if (!blob) continue;
    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const remote = `shared/${uuid()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(remote, blob, { contentType: blob.type, upsert: false });
    if (error) throw error;
    await s.db.putBlob(remote, blob);
    // Only swap the path if the item still points at this local photo.
    if (data.get().items.get(item.id)?.image_path === localPath) updateItem(item.id, { image_path: remote });
  }
  // The Album's photos (lt_records): the same, with the path in data.path.
  const shots = [...data.get().lt_records.values()].filter((r) => r.kind === SHOT_KIND && !r.deleted_at && r.data.media !== 'video' && typeof r.data.path === 'string' && r.data.path.startsWith('local:'));
  // Videos are big: they go up on their own, after this sync, so they never hold up the rest.
  queueVideoUploads();
  for (const r of shots) {
    const localPath = r.data.path as string;
    const blob = await s.db.getBlob(localPath);
    if (!blob) continue;
    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const remote = `album/${uuid()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(remote, blob, { contentType: blob.type, upsert: false });
    if (error) throw error;
    await s.db.putBlob(remote, blob);
    const now = data.get().lt_records.get(r.id);
    if (now && now.data.path === localPath) commit('lt_records', [{ ...now, data: { ...now.data, path: remote }, updated_at: new Date().toISOString() }]);
  }
}

let videoRun: Promise<void> | null = null;
/** A video that failed to upload waits this long before it is tried again (no 50 MB retries every sync). */
const VIDEO_RETRY_MS = 15 * 60 * 1000;
const videoRetryAt = new Map<string, number>();

function queueVideoUploads() {
  if (videoRun) return;
  videoRun = uploadPendingVideos()
    .catch((e) => console.warn('LifeTracker: video upload failed', e))
    .finally(() => (videoRun = null));
}

/** The Album's videos still only on this device, one at a time, into their own bucket. */
async function uploadPendingVideos(): Promise<void> {
  const s = currentSession();
  if (!s || !s.cloud || !supabase) return;
  const pending = [...data.get().lt_records.values()].filter((r) => r.kind === SHOT_KIND && !r.deleted_at && r.data.media === 'video' && typeof r.data.path === 'string' && r.data.path.startsWith('local:'));
  for (const r of pending) {
    const localPath = r.data.path as string;
    if ((videoRetryAt.get(localPath) ?? 0) > Date.now()) continue;
    const blob = await s.db.getBlob(localPath);
    if (!blob) continue;
    const type = VIDEO_EXT[blob.type] ? blob.type : 'video/mp4';
    const remote = `${VIDEO_PREFIX}${uuid()}.${VIDEO_EXT[type]}`;
    const { error } = await supabase.storage.from(VIDEO_BUCKET).upload(remote, blob, { contentType: type, upsert: false });
    if (error) {
      // e.g. the bucket isn't there yet: the video stays on this device and is tried again later
      videoRetryAt.set(localPath, Date.now() + VIDEO_RETRY_MS);
      console.warn('LifeTracker: video upload failed, kept on this device', error);
      continue;
    }
    videoRetryAt.delete(localPath);
    await s.db.putBlob(remote, blob);
    const now = data.get().lt_records.get(r.id);
    if (now && now.data.path === localPath) commit('lt_records', [{ ...now, data: { ...now.data, path: remote }, updated_at: new Date().toISOString() }]);
  }
}

const urlCache = new Map<string, Promise<string | null>>();

/** A displayable URL for an image_path, cached like useImagePath's. */
export function photoUrl(path: string): Promise<string | null> {
  let p = urlCache.get(path);
  if (!p) {
    p = resolve(path).catch(() => null);
    urlCache.set(path, p);
    setTimeout(() => urlCache.delete(path), 1000 * 60 * 60 * 5);
    // a failed or missing lookup can be tried again later (e.g. once the upload has landed)
    void p.then((u) => u === null && urlCache.delete(path));
  }
  return p;
}

async function resolve(path: string): Promise<string | null> {
  const s = currentSession();
  const local = await s?.db.getBlob(path).catch(() => undefined);
  if (local) return URL.createObjectURL(local);
  if (path.startsWith('local:') || !supabase) return null;
  const { data: signed } = await supabase.storage.from(bucketOf(path)).createSignedUrl(path, 60 * 60 * 6);
  return signed?.signedUrl ?? null;
}

/** A displayable URL for an image_path (object URL for local blobs, signed URL otherwise). */
export function useImagePath(path: string | null): string | null {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!path) {
      setSrc(null);
      return;
    }
    let live = true;
    // Signed URLs expire; photoUrl forgets them before they do.
    void photoUrl(path).then((u) => live && setSrc(u));
    return () => {
      live = false;
    };
  }, [path]);
  return src;
}

/** Fetch a photo blob (for export). */
export async function photoBlob(path: string): Promise<Blob | null> {
  const s = currentSession();
  const local = await s?.db.getBlob(path);
  if (local) return local;
  if (!supabase || path.startsWith('local:')) return null;
  const { data: blob } = await supabase.storage.from(bucketOf(path)).download(path);
  return blob ?? null;
}
