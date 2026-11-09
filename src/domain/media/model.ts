/**
 * Media: films, shows, anime, manga, music and games (books live in Reading). One lt_records row per title (kind `md_item`,
 * cabinet section): what it is, where you're up to, and what you thought. Pure functions only;
 * tested in media.test.ts.
 */
import type { LtRecord } from '../../data/types';

export const MEDIA_TYPES = ['Film', 'Show', 'Anime', 'Manga', 'Album', 'Song', 'Game'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];
export const TYPE_ICON: Record<MediaType, string> = { Film: '映', Show: '劇', Anime: 'ア', Manga: '漫', Album: '盤', Song: '曲', Game: '遊' };
/** What one step of progress is called, where it counts. */
export const UNIT: Partial<Record<MediaType, string>> = { Show: 'ep', Anime: 'ep', Manga: 'ch', Game: '%' };

export const STATES = ['Want', 'On it', 'Done', 'Dropped'] as const;
export type MediaState = (typeof STATES)[number];
/** The verb for "On it", by type. */
export const DOING: Record<MediaType, string> = { Film: 'Watching', Show: 'Watching', Anime: 'Watching', Manga: 'Reading', Album: 'On repeat', Song: 'On repeat', Game: 'Playing' };

export const NOTE_MAX = 1000;

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  /** Director, studio, author, artist or developer. */
  by: string;
  state: MediaState;
  /** 1–5, or null. */
  rating: number | null;
  /** Episodes or chapters so far (percent for games), or null. */
  progress: number | null;
  /** How many there are, if known. */
  total: number | null;
  started: string | null;
  finished: string | null;
  note: string;
  fav: boolean;
}

const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max).trim() : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : null);

export function mediaOf(r: LtRecord): MediaItem | null {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const title = str(d.title, 160);
  if (!title) return null;
  const type = (MEDIA_TYPES as readonly string[]).includes(d.type as string) ? (d.type as MediaType) : 'Film';
  const state = (STATES as readonly string[]).includes(d.state as string) ? (d.state as MediaState) : 'Want';
  const rating = typeof d.rating === 'number' && d.rating >= 1 && d.rating <= 5 ? Math.round(d.rating) : null;
  return { id: r.id, title, type, by: str(d.by, 120), state, rating, progress: num(d.progress), total: num(d.total) || null, started: day(d.started), finished: day(d.finished), note: str(d.note, NOTE_MAX), fav: !!d.fav };
}

/** One more episode or chapter; reaching the total finishes it. */
export function stepOn(m: MediaItem, today: string): Partial<MediaItem> {
  const progress = (m.progress ?? 0) + (m.type === 'Game' ? 10 : 1);
  const cap = m.type === 'Game' ? 100 : m.total;
  if (cap != null && progress >= cap) return { progress: cap, state: 'Done', finished: today, started: m.started ?? today };
  return { progress, state: 'On it', started: m.started ?? today };
}

/** "ep 7 of 12", "ch 140", "60%", or ''. */
export function progressLabel(m: MediaItem): string {
  const u = UNIT[m.type];
  if (!u || m.progress == null) return '';
  if (u === '%') return `${m.progress}%`;
  return `${u} ${m.progress}${m.total ? ` of ${m.total}` : ''}`;
}

export interface YearInMedia {
  finished: number;
  byType: { type: MediaType; n: number }[];
  avg: number | null;
  top: MediaItem[];
  favs: MediaItem[];
  /** Finished per month, January first. */
  months: number[];
}
/** What you finished in a year: how many of each, the average rating, the best. */
export function yearInMedia(items: MediaItem[], year: number): YearInMedia {
  const y = String(year);
  const done = items.filter((m) => m.state === 'Done' && m.finished?.startsWith(y));
  const by = new Map<MediaType, number>();
  for (const m of done) by.set(m.type, (by.get(m.type) ?? 0) + 1);
  const rated = done.filter((m) => m.rating != null);
  const months = Array(12).fill(0);
  for (const m of done) months[Number(m.finished!.slice(5, 7)) - 1]++;
  return {
    finished: done.length,
    byType: [...by].map(([type, n]) => ({ type, n })).sort((a, b) => b.n - a.n),
    avg: rated.length ? rated.reduce((a, m) => a + m.rating!, 0) / rated.length : null,
    top: [...rated].sort((a, b) => b.rating! - a.rating! || (b.finished ?? '').localeCompare(a.finished ?? '')).slice(0, 5),
    favs: done.filter((m) => m.fav),
    months,
  };
}

/** A fair pick from the want list: the longest-waiting get a little more weight. `r` is 0–1. */
export function pickNext(want: MediaItem[], r: number): MediaItem | null {
  if (!want.length) return null;
  const w = want.map((_, i) => 1 + i / want.length);
  let x = r * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < want.length; i++) {
    x -= w[i];
    if (x < 0) return want[i];
  }
  return want[want.length - 1];
}
