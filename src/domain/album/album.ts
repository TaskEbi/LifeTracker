/**
 * The Album: a photo of your face and a few memories each day, and at the end of the year a reel.
 * Pure logic only: what a stored shot looks like, days, streaks, the year in numbers and when the
 * year's reel opens. Screens are in src/features/album.
 */
import { addDays, dayCount, isDate } from '../log/dates';

/** lt_records kind for one photo (under the cabinet section, like the Hideout's rows). */
export const SHOT_KIND = 'album_shot';
export type ShotRole = 'face' | 'memory';

/** Memories per day: enough for a busy day, few enough that the reel stays a reel. */
export const MEMORIES_PER_DAY = 8;
export const CAPTION_MAX = 140;
/** Longest inline thumbnail (a data: URL) kept in the row; rows hold 32 KB at most. */
export const THUMB_MAX = 20_000;
/** The year's reel opens on New Year's Eve. */
export const reelOpensOn = (year: number) => `${year}-12-31`;

export interface Shot {
  id: string;
  date: string;
  role: ShotRole;
  /** image_path: "local:<id>" until uploaded, then the bucket path. */
  path: string;
  /** A small inline image (data: URL), so grids and the reel's mosaic load at once on any device. */
  thumb: string | null;
  caption: string;
  /** The day's cover memory. */
  star: boolean;
  /** When it was taken (ISO), for ordering within a day. */
  at: string;
  /** Save order (the row's sort_order), for shots taken in the same instant. */
  seq: number;
}

export function shotOf(r: { id: string; data: Record<string, unknown>; created_at: string; sort_order?: number }): Shot | null {
  const d = r.data;
  if (!isDate(d.date) || (d.role !== 'face' && d.role !== 'memory') || typeof d.path !== 'string' || !d.path) return null;
  return {
    id: r.id,
    date: d.date,
    role: d.role,
    path: d.path,
    thumb: typeof d.thumb === 'string' && d.thumb.startsWith('data:image/') ? d.thumb : null,
    caption: typeof d.caption === 'string' ? d.caption.slice(0, CAPTION_MAX) : '',
    star: d.star === true,
    at: typeof d.at === 'string' ? d.at : r.created_at,
    seq: Number(r.sort_order) || 0,
  };
}

export interface AlbumDay {
  date: string;
  /** The day's face; if two devices both took one, the later wins and the other stays in `extraFaces`. */
  face: Shot | null;
  extraFaces: Shot[];
  memories: Shot[];
}

export function byDay(shots: Shot[]): Map<string, AlbumDay> {
  const out = new Map<string, AlbumDay>();
  const sorted = [...shots].sort((a, b) => a.at.localeCompare(b.at) || a.seq - b.seq || a.id.localeCompare(b.id));
  for (const s of sorted) {
    let day = out.get(s.date);
    if (!day) out.set(s.date, (day = { date: s.date, face: null, extraFaces: [], memories: [] }));
    if (s.role === 'face') {
      if (day.face) day.extraFaces.push(day.face);
      day.face = s;
    } else day.memories.push(s);
  }
  return out;
}

/** The memory that stands for the day: the starred one, else the first. */
export const coverOf = (day: AlbumDay | undefined): Shot | null => (day ? (day.memories.find((m) => m.star) ?? day.memories[0] ?? null) : null);

/** Something from the day to show in a grid: the cover memory, else the face. */
export const tileOf = (day: AlbumDay | undefined, prefer: ShotRole = 'memory'): Shot | null =>
  !day ? null : prefer === 'face' ? (day.face ?? coverOf(day)) : (coverOf(day) ?? day.face);

/**
 * Days in a row with anything in the album. The current run counts today, or ends yesterday so a
 * morning without a photo yet doesn't break it.
 */
export function albumStreak(dates: Iterable<string>, today: string): { current: number; best: number } {
  const set = new Set(dates);
  const sorted = [...set].filter((d) => d <= today).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  let current = 0;
  let at = set.has(today) ? today : addDays(today, -1);
  while (set.has(at)) {
    current++;
    at = addDays(at, -1);
  }
  return { current, best };
}

/** Whether the year's reel is open: from 31 Dec of that year, and for every year before. */
export const reelOpen = (year: number, today: string) => today >= reelOpensOn(year);
export const daysToReel = (year: number, today: string) => Math.max(0, dayCount(today, reelOpensOn(year)) - 1);

export const daysInYear = (year: number) => dayCount(`${year}-01-01`, `${year}-12-31`);
/** Day number in the year, 1 on 1 Jan. */
export const dayOfYear = (date: string) => dayCount(`${date.slice(0, 4)}-01-01`, date);

export interface YearInPhotos {
  year: number;
  /** Days with a face or a memory. */
  days: number;
  faces: Shot[];
  memories: number;
  captions: number;
  best: number;
  /** Most memories in one day (ties: the earliest). */
  busiest: { date: string; n: number } | null;
  /** Days with anything, per month (0 = January). */
  byMonth: number[];
  /** Memories per month. */
  memoriesByMonth: number[];
  topMonth: number | null;
  /** Longest run of days without a photo, inside the stretch from the first photo to the last. */
  longestGap: number;
  first: string | null;
  last: string | null;
}

export function yearInPhotos(days: Map<string, AlbumDay>, year: number): YearInPhotos {
  const inYear = [...days.values()].filter((d) => d.date.startsWith(`${year}-`) && (d.face || d.memories.length)).sort((a, b) => a.date.localeCompare(b.date));
  const byMonth = Array<number>(12).fill(0);
  const memoriesByMonth = Array<number>(12).fill(0);
  let busiest: YearInPhotos['busiest'] = null;
  let captions = 0;
  let longestGap = 0;
  for (let i = 0; i < inYear.length; i++) {
    const d = inYear[i];
    const m = Number(d.date.slice(5, 7)) - 1;
    byMonth[m]++;
    memoriesByMonth[m] += d.memories.length;
    captions += d.memories.filter((x) => x.caption).length + (d.face?.caption ? 1 : 0);
    if (d.memories.length && (!busiest || d.memories.length > busiest.n)) busiest = { date: d.date, n: d.memories.length };
    if (i > 0) longestGap = Math.max(longestGap, dayCount(inYear[i - 1].date, d.date) - 2);
  }
  const top = memoriesByMonth.reduce((best, n, i) => (n > (best === null ? 0 : memoriesByMonth[best]) ? i : best), null as number | null);
  return {
    year,
    days: inYear.length,
    faces: inYear.flatMap((d) => (d.face ? [d.face] : [])),
    memories: inYear.reduce((n, d) => n + d.memories.length, 0),
    captions,
    best: albumStreak(
      inYear.map((d) => d.date),
      `${year}-12-31`,
    ).best,
    busiest,
    byMonth,
    memoriesByMonth,
    topMonth: top,
    longestGap,
    first: inYear[0]?.date ?? null,
    last: inYear.at(-1)?.date ?? null,
  };
}

/** Up to `n` memories of a month for the reel: covers first, then the ones with words, then spread over the month. */
export function monthPicks(days: Map<string, AlbumDay>, year: number, month: number, n = 4): Shot[] {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
  const list = [...days.values()].filter((d) => d.date.startsWith(prefix)).sort((a, b) => a.date.localeCompare(b.date));
  const all = list.flatMap((d) => d.memories);
  if (all.length <= n) return all;
  const score = (s: Shot) => (s.star ? 2 : 0) + (s.caption ? 1 : 0);
  const picked: Shot[] = [];
  // one per day first, best-scored days spread across the month
  const covers = list.map((d) => coverOf(d)).filter((s): s is Shot => !!s);
  const step = covers.length / n;
  const ranked = [...covers].sort((a, b) => score(b) - score(a));
  for (const s of ranked) if (picked.length < Math.ceil(n / 2) && score(s) > 0) picked.push(s);
  for (let i = 0; picked.length < n && i < n; i++) {
    const s = covers[Math.floor(i * step)];
    if (s && !picked.includes(s)) picked.push(s);
  }
  for (const s of all) if (picked.length < n && !picked.includes(s)) picked.push(s);
  return picked.sort((a, b) => a.date.localeCompare(b.date) || a.at.localeCompare(b.at));
}

/** On this day, a year (or more) ago, newest first. */
export function onThisDay(days: Map<string, AlbumDay>, today: string): { years: number; day: AlbumDay }[] {
  const out: { years: number; day: AlbumDay }[] = [];
  const y = Number(today.slice(0, 4));
  const md = today.slice(4);
  for (let back = 1; back <= 10; back++) {
    let date = `${y - back}${md}`;
    // 29 Feb looks back to 28 Feb in other years
    if (!isDate(date)) date = `${y - back}-02-28`;
    const day = days.get(date);
    if (day && (day.face || day.memories.length)) out.push({ years: back, day });
  }
  return out;
}

/** How long each face shows in the timelapse: about ten seconds for the year, never a blur or a slideshow. */
export const frameMs = (n: number) => Math.round(Math.max(70, Math.min(260, 10_000 / Math.max(1, n))));

/** The date stamp in the corner of a print, like a film camera's: '26 11 04. */
export const stamp = (date: string) => `'${date.slice(2, 4)} ${date.slice(5, 7)} ${date.slice(8, 10)}`;

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
