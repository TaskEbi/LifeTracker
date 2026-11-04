/**
 * The year's faces as a video file: a title card, every face with its date stamp, an end card. Drawn
 * on a canvas and recorded with MediaRecorder (MP4 where the browser can, else WebM), in real time,
 * so a year of faces takes about as long to make as to watch.
 */
import { frameMs, stamp, dayOfYear, daysInYear, type Shot } from '../../domain/album/album';
import { photoBlob } from '../../lib/photos';

const W = 720;
const H = 960;
const TYPES = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

export function videoType(): string | null {
  if (typeof MediaRecorder === 'undefined' || typeof HTMLCanvasElement === 'undefined' || !('captureStream' in HTMLCanvasElement.prototype)) return null;
  return TYPES.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? null;
}

async function bitmapOf(shot: Shot): Promise<ImageBitmap | null> {
  try {
    const blob = (await photoBlob(shot.path).catch(() => null)) ?? (shot.thumb ? await (await fetch(shot.thumb)).blob() : null);
    return blob ? await createImageBitmap(blob) : null;
  } catch {
    return null;
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function recordFaces(faces: Shot[], year: number, opts: { onProgress?: (done: number) => void; signal?: AbortSignal } = {}): Promise<{ blob: Blob; name: string }> {
  const type = videoType();
  if (!type) throw new Error('This browser can’t make videos');
  if (!faces.length) throw new Error('No faces to put in it');
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 4_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<void>((r) => (rec.onstop = () => r()));

  const card = (big: string, small: string) => {
    ctx.fillStyle = '#0d0a09';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffe9cf';
    ctx.textAlign = 'center';
    ctx.font = '700 150px system-ui, sans-serif';
    ctx.fillText(big, W / 2, H / 2);
    ctx.fillStyle = '#ff8a3d';
    ctx.font = '500 34px ui-monospace, monospace';
    ctx.fillText(small, W / 2, H / 2 + 70);
  };
  const frame = (bmp: ImageBitmap | null, shot: Shot) => {
    ctx.fillStyle = '#0d0a09';
    ctx.fillRect(0, 0, W, H);
    if (bmp) {
      // cover the frame, centred
      const s = Math.max(W / bmp.width, H / bmp.height);
      const w = bmp.width * s;
      const h = bmp.height * s;
      ctx.drawImage(bmp, (W - w) / 2, (H - h) / 2, w, h);
    }
    // the year so far, as a thin line along the bottom
    ctx.fillStyle = 'rgb(255 255 255 / 0.22)';
    ctx.fillRect(0, H - 6, W, 6);
    ctx.fillStyle = '#ff8a3d';
    ctx.fillRect(0, H - 6, (W * dayOfYear(shot.date)) / daysInYear(year), 6);
    ctx.textAlign = 'right';
    ctx.font = '600 38px ui-monospace, monospace';
    ctx.shadowColor = '#ff5a1f';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffae5c';
    ctx.fillText(stamp(shot.date), W - 30, H - 34);
    ctx.shadowBlur = 0;
  };

  // A still canvas sends no frames, so a card is drawn again and again while it holds.
  const hold = async (draw: () => void, ms: number) => {
    const end = performance.now() + ms;
    while (performance.now() < end) {
      draw();
      await wait(100);
    }
  };
  rec.start(500);
  await hold(() => card(String(year), `${faces.length} faces`), 1400);
  const ms = Math.max(83, frameMs(faces.length));
  // decode a few ahead so the pace holds
  const ahead = new Map<number, Promise<ImageBitmap | null>>();
  const get = (i: number) => {
    if (i >= faces.length) return null;
    if (!ahead.has(i)) ahead.set(i, bitmapOf(faces[i]));
    return ahead.get(i)!;
  };
  try {
    for (let i = 0; i < faces.length; i++) {
      if (opts.signal?.aborted) throw new DOMException('Stopped', 'AbortError');
      for (let k = 1; k <= 4; k++) void get(i + k);
      const t0 = performance.now();
      const bmp = await get(i)!;
      frame(bmp, faces[i]);
      bmp?.close();
      ahead.delete(i);
      opts.onProgress?.(i + 1);
      await wait(Math.max(0, ms - (performance.now() - t0)));
    }
    // hold the last face a moment, then the end card
    await wait(700);
    await hold(() => card(String(year), `${stamp(faces[0].date)} → ${stamp(faces.at(-1)!.date)}`), 1600);
  } finally {
    rec.stop();
    stream.getTracks().forEach((t) => t.stop());
    for (const p of ahead.values()) void p.then((b) => b?.close());
  }
  await done;
  if (opts.signal?.aborted) throw new DOMException('Stopped', 'AbortError');
  const blob = new Blob(chunks, { type: type.split(';')[0] });
  return { blob, name: `lifetracker-${year}-faces.${type.startsWith('video/mp4') ? 'mp4' : 'webm'}` };
}

/** Hand the file to the share sheet (Save Video on an iPhone), else download it. */
export async function saveFile(blob: Blob, name: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: name });
    return 'shared';
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
  return 'downloaded';
}
