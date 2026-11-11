/**
 * A video memory, read on the device before it is kept: its length, and a still from it for the
 * thumbnail. The file itself is kept as it is; phones already hand over a compressed copy.
 */
import { VIDEO_MAX_BYTES, VIDEO_MAX_SECONDS } from '../../domain/album/album';

/** What the private video bucket takes. */
const TYPES: Record<string, string> = { mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' };

export const isVideoFile = (f: File) => f.type.startsWith('video/') || /\.(mp4|m4v|mov|webm)$/i.test(f.name);

/** The file's type, from the browser or else its name; null if the album can't keep it. */
export function clipType(f: File): string | null {
  const t = f.type === 'video/x-m4v' ? 'video/mp4' : f.type;
  if (Object.values(TYPES).includes(t)) return t;
  if (t && t.startsWith('video/')) return null;
  return TYPES[f.name.split('.').pop()?.toLowerCase() ?? ''] ?? null;
}

export interface Clip {
  blob: Blob;
  dur: number;
  /** A still from early in the video (JPEG), or null if this browser couldn't draw one. */
  poster: Blob | null;
}

const once = (el: HTMLVideoElement, ok: string, ms: number) =>
  new Promise<boolean>((resolve) => {
    const done = (v: boolean) => {
      clearTimeout(t);
      el.removeEventListener(ok, yes);
      el.removeEventListener('error', no);
      resolve(v);
    };
    const yes = () => done(true);
    const no = () => done(false);
    const t = setTimeout(() => done(false), ms);
    el.addEventListener(ok, yes);
    el.addEventListener('error', no);
  });

/** Check a chosen video and read it. Throws a message fit to show when it can't be kept. */
export async function readClip(file: File): Promise<Clip> {
  const type = clipType(file);
  if (!type) throw new Error('That kind of video can’t be kept (MP4, MOV or WebM)');
  if (file.size > VIDEO_MAX_BYTES) throw new Error(`That video is ${Math.round(file.size / 1024 / 1024)} MB; the most is ${VIDEO_MAX_BYTES / 1024 / 1024} MB. Trim it first`);
  const blob = file.type === type ? file : new Blob([file], { type });
  const url = URL.createObjectURL(blob);
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.src = url;
  try {
    if (!(await once(v, 'loadedmetadata', 15_000))) throw new Error('That video couldn’t be opened on this device');
    let dur = v.duration;
    if (!Number.isFinite(dur)) {
      // recordings sometimes don't say how long they are until the end is looked for
      v.currentTime = 1e7;
      await once(v, 'seeked', 5000);
      dur = v.duration;
      v.currentTime = 0;
    }
    if (Number.isFinite(dur) && dur > VIDEO_MAX_SECONDS + 0.5) throw new Error(`That video is ${Math.round(dur)} seconds; the most is ${VIDEO_MAX_SECONDS}. Trim it first`);
    return { blob, dur: Number.isFinite(dur) ? dur : 0, poster: await still(v, Number.isFinite(dur) ? dur : 0) };
  } finally {
    v.removeAttribute('src');
    v.load();
    URL.revokeObjectURL(url);
  }
}

async function still(v: HTMLVideoElement, dur: number): Promise<Blob | null> {
  try {
    // a little way in, past a black first frame
    v.currentTime = Math.min(0.5, dur / 3);
    await once(v, 'seeked', 5000);
    if (v.readyState < 2) await once(v, 'loadeddata', 5000);
    if (!v.videoWidth || !v.videoHeight) return null;
    const scale = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    return await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.85));
  } catch {
    return null;
  }
}
