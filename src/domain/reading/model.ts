/**
 * Reading: books and highlights live in lt_records (kinds `book`, `highlight`); time read is a Daily
 * Log entry with a detail naming the book. A Kindle shows a percentage rather than pages, so progress
 * is a percentage, and everything about pace and what's left is worked out from time and that.
 */
import { addDays } from '../log/dates';
import type { LtRecord } from '../../data/types';

export const BOOK_STATUSES = ['reading', 'want', 'paused', 'finished', 'dropped'] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];
export const STATUS_LABEL: Record<BookStatus, string> = { reading: 'Reading', want: 'Up next', paused: 'On hold', finished: 'Finished', dropped: 'Dropped' };

export const FORMATS = ['kindle', 'paper', 'audio'] as const;
export type BookFormat = (typeof FORMATS)[number];
export const FORMAT_LABEL: Record<BookFormat, string> = { kindle: 'Kindle', paper: 'Paper', audio: 'Audio' };

export const GENRES = ['Fiction', 'Sci-fi', 'Fantasy', 'Mystery', 'Classics', 'Manga', 'Poetry', 'History', 'Biography', 'Science', 'Maths', 'Tech', 'Philosophy', 'Psychology', 'Business', 'Self-help', 'Other'] as const;

/** Finishing a book only earns XP from here on, so adding old favourites doesn't flood the levels. */
export const BOOK_XP_FROM = '2026-10-01';
export const DEFAULT_YEAR_GOAL = 12;
/** Most sessions' worth of days looked back on for the current reading rate. */
const RATE_DAYS = 14;

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  format: BookFormat;
  genre: string | null;
  startedOn: string | null;
  finishedOn: string | null;
  /** 1–5, or null. */
  rating: number | null;
  review: string;
  /** Where it stood before any logged session (a book already part read). */
  startPct: number;
  /** Print length, if known: only for an estimate of pages (a Kindle doesn't say). */
  pages: number | null;
  coverId: number | null;
  sort: number;
  createdAt: string;
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const positive = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
export const clampPct = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function bookOf(r: LtRecord): Book | null {
  if (r.kind !== 'book' || r.deleted_at) return null;
  const d = r.data;
  const title = text(d.title);
  if (!title) return null;
  const rating = positive(d.rating);
  return {
    id: r.id,
    title,
    author: text(d.author),
    status: (BOOK_STATUSES as readonly string[]).includes(d.status as string) ? (d.status as BookStatus) : 'want',
    format: (FORMATS as readonly string[]).includes(d.format as string) ? (d.format as BookFormat) : 'kindle',
    genre: text(d.genre) || null,
    startedOn: day(d.startedOn),
    finishedOn: day(d.finishedOn),
    rating: rating && rating <= 5 ? Math.round(rating) : null,
    review: text(d.review),
    startPct: clampPct(positive(d.startPct) ?? 0),
    pages: positive(d.pages),
    coverId: positive(d.coverId),
    sort: r.sort_order,
    createdAt: r.created_at,
  };
}

export const isFinished = (b: Book): b is Book & { finishedOn: string } => b.status === 'finished' && !!b.finishedOn;

/** Live books of a set of reading records. */
export const booksOf = (records: LtRecord[]): Book[] => records.map(bookOf).filter((b): b is Book => !!b);

export interface Highlight {
  id: string;
  bookId: string | null;
  book: string;
  text: string;
  note: string;
  loc: string;
  addedOn: string | null;
  fav: boolean;
  /** Identity for de-duplicating imports. */
  key: string;
}

export function highlightOf(r: LtRecord): Highlight | null {
  if (r.kind !== 'highlight' || r.deleted_at) return null;
  const d = r.data;
  const t = text(d.text);
  const note = text(d.note);
  if (!t && !note) return null;
  return { id: r.id, bookId: text(d.bookId) || null, book: text(d.book), text: t, note, loc: text(d.loc), addedOn: day(d.addedOn), fav: d.fav === true, key: text(d.key) };
}
export const highlightsOf = (records: LtRecord[]): Highlight[] => records.map(highlightOf).filter((h): h is Highlight => !!h);

/** The same line in a book, however it was spaced or quoted. */
export function highlightKey(title: string, line: string): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  return `${norm(title)}|${norm(line).slice(0, 160)}`;
}

/** Titles match whatever the case, spacing or subtitle ("Dune: Book One" is "Dune"). */
export function titleKey(title: string): string {
  return title.split(/\s*[:：]\s+|\s+[-–—]\s+/)[0].toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// ─── sessions ───────────────────────────────────────────────────────────────

export interface ReadingDetail {
  bookId?: string;
  book?: string;
  /** Where the Kindle said you'd got to at the end of the session. */
  percent?: number;
}

/** One logged session, whatever it came from. */
export interface ReadSession {
  id: string;
  date: string;
  createdAt: string;
  minutes: number;
  note: string | null;
  bookId: string | null;
  book: string | null;
  percent: number | null;
}

export function readSession(entry: { id: string; date: string; created_at: string; minutes: number; note: string | null }, detail: unknown): ReadSession {
  const d = (detail ?? {}) as ReadingDetail;
  const percent = typeof d.percent === 'number' && Number.isFinite(d.percent) ? clampPct(d.percent) : null;
  return { id: entry.id, date: entry.date, createdAt: entry.created_at, minutes: entry.minutes, note: entry.note, bookId: typeof d.bookId === 'string' ? d.bookId : null, book: typeof d.book === 'string' ? d.book : null, percent };
}

const oldestFirst = (a: ReadSession, b: ReadSession) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);

export interface BookProgress {
  minutes: number;
  sessions: number;
  /** The latest percentage said (100 once finished). */
  pct: number;
  lastRead: string | null;
  /** Minutes one percent takes; null until there is enough to go on. */
  minutesPerPct: number | null;
  /** Minutes left at that pace, or null. */
  leftMinutes: number | null;
  /** Pages so far, estimated from the print length, or null when it isn't known. */
  pagesRead: number | null;
}

/** Needs a little of both before a pace means anything. */
const MIN_PACE_PCT = 2;
const MIN_PACE_MIN = 15;

export function bookProgress(book: Book, sessions: ReadSession[]): BookProgress {
  const mine = sessions.filter((s) => s.bookId === book.id).sort(oldestFirst);
  const minutes = mine.reduce((n, s) => n + s.minutes, 0);
  let pct = book.startPct;
  let timed = 0;
  let upTo = 0;
  for (const s of mine) {
    timed += s.minutes;
    if (s.percent != null) {
      pct = s.percent;
      upTo = timed;
    }
  }
  const done = book.status === 'finished';
  const gained = pct - book.startPct;
  const pace = gained >= MIN_PACE_PCT && upTo >= MIN_PACE_MIN ? upTo / gained : null;
  const shown = done ? 100 : pct;
  // time read since the last percentage has already come off what's left
  const left = pace != null && !done ? Math.max(0, Math.round((100 - shown) * pace - (minutes - upTo))) : null;
  return {
    minutes,
    sessions: mine.length,
    pct: shown,
    lastRead: mine.at(-1)?.date ?? null,
    minutesPerPct: pace,
    leftMinutes: left,
    pagesRead: book.pages ? Math.round((book.pages * shown) / 100) : null,
  };
}

/** Minutes a day over the last two weeks, across every book. */
export function dailyRate(sessions: ReadSession[], today: string): number {
  const from = addDays(today, -(RATE_DAYS - 1));
  return sessions.filter((s) => s.date >= from && s.date <= today).reduce((n, s) => n + s.minutes, 0) / RATE_DAYS;
}

/** The day it should be done at the current rate, or null if there's no rate to go on. */
export function finishBy(leftMinutes: number | null, rate: number, today: string): string | null {
  if (leftMinutes == null || rate <= 0) return null;
  return addDays(today, Math.ceil(leftMinutes / rate));
}

/** The book a new session is most likely for: the one read last that's still open, else any open one. */
export function likelyBook(books: Book[], sessions: ReadSession[]): Book | null {
  const open = books.filter((b) => b.status === 'reading');
  const last = [...sessions].sort(oldestFirst).reverse().find((s) => s.bookId && open.some((b) => b.id === s.bookId));
  return (last && open.find((b) => b.id === last.bookId)) ?? open[0] ?? null;
}

// ─── a year in books ────────────────────────────────────────────────────────

export interface YearBooks {
  year: number;
  minutes: number;
  sessions: number;
  days: number;
  finished: (Book & { finishedOn: string })[];
  /** Minutes read per month, January first. */
  months: number[];
  avgRating: number | null;
  genres: { name: string; n: number }[];
  topAuthor: { name: string; n: number } | null;
  longest: { book: Book; minutes: number } | null;
  fastest: { book: Book; days: number } | null;
  /** Estimated pages of the books finished, where the print length is known. */
  pages: number;
}

export function yearBooks(year: number, books: Book[], sessions: ReadSession[]): YearBooks {
  const y = String(year);
  const inYear = sessions.filter((s) => s.date.startsWith(y));
  const months = Array.from({ length: 12 }, () => 0);
  for (const s of inYear) months[Number(s.date.slice(5, 7)) - 1] += s.minutes;
  const finished = books.filter(isFinished).filter((b) => b.finishedOn.startsWith(y)).sort((a, b) => a.finishedOn.localeCompare(b.finishedOn));
  const rated = finished.filter((b) => b.rating != null);
  const tallyOf = (names: (string | null)[]) => {
    const m = new Map<string, number>();
    for (const n of names) if (n) m.set(n, (m.get(n) ?? 0) + 1);
    return [...m].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  };
  const longest = finished.map((book) => ({ book, minutes: sessions.filter((s) => s.bookId === book.id).reduce((n, s) => n + s.minutes, 0) })).filter((x) => x.minutes > 0).sort((a, b) => b.minutes - a.minutes)[0] ?? null;
  const fastest =
    finished
      .filter((b) => b.startedOn)
      .map((book) => ({ book, days: dayGap(book.startedOn!, book.finishedOn) + 1 }))
      .filter((x) => x.days > 0)
      .sort((a, b) => a.days - b.days)[0] ?? null;
  return {
    year,
    minutes: inYear.reduce((n, s) => n + s.minutes, 0),
    sessions: inYear.length,
    days: new Set(inYear.map((s) => s.date)).size,
    finished,
    months,
    avgRating: rated.length ? Math.round((rated.reduce((n, b) => n + b.rating!, 0) / rated.length) * 10) / 10 : null,
    genres: tallyOf(finished.map((b) => b.genre)),
    topAuthor: tallyOf(finished.map((b) => b.author || null))[0] ?? null,
    longest,
    fastest,
    pages: finished.reduce((n, b) => n + (b.pages ?? 0), 0),
  };
}

export const dayGap = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

/** Years there is anything in, newest first, always including this one. */
export function readingYears(books: Book[], sessions: ReadSession[], today: string): number[] {
  const set = new Set<number>([Number(today.slice(0, 4))]);
  for (const s of sessions) set.add(Number(s.date.slice(0, 4)));
  for (const b of books) if (b.finishedOn) set.add(Number(b.finishedOn.slice(0, 4)));
  return [...set].sort((a, b) => b - a);
}

/** A line to come back to today: the same all day, favourites twice as likely. */
export function lineOfDay(lines: Highlight[], today: string): Highlight | null {
  const usable = lines.filter((h) => h.text).sort((a, b) => a.id.localeCompare(b.id));
  if (!usable.length) return null;
  const pool = [...usable, ...usable.filter((h) => h.fav)];
  let h = 2166136261;
  for (let i = 0; i < today.length; i++) h = Math.imul(h ^ today.charCodeAt(i), 16777619);
  return pool[(h >>> 0) % pool.length];
}

export interface SleepAfterReading {
  read: { nights: number; avg: number };
  other: { nights: number; avg: number };
}

/** Enough nights on each side before saying anything. */
const MIN_NIGHTS = 5;

/**
 * Sleep on nights after a day you read against nights after a day you didn't, over the last 60 days.
 * A sleep metric is dated by the morning you wake, so it follows the reading of the day before.
 */
export function sleepAfterReading(sessions: ReadSession[], sleep: { date: string; minutes: number }[], today: string): SleepAfterReading | null {
  const from = addDays(today, -60);
  const readDays = new Set(sessions.map((s) => s.date));
  const a: number[] = [];
  const b: number[] = [];
  for (const m of sleep) {
    if (m.date < from || m.date > today || m.minutes <= 0) continue;
    (readDays.has(addDays(m.date, -1)) ? a : b).push(m.minutes);
  }
  if (a.length < MIN_NIGHTS || b.length < MIN_NIGHTS) return null;
  const avg = (l: number[]) => Math.round(l.reduce((n, x) => n + x, 0) / l.length);
  return { read: { nights: a.length, avg: avg(a) }, other: { nights: b.length, avg: avg(b) } };
}

// ─── XP ─────────────────────────────────────────────────────────────────────

export const READING_XP = { bookFinished: 60, yearGoal: 150 } as const;

export interface ReadingXp {
  key: string;
  date: string;
  xp: number;
  reason: string;
}

/** The goal's book, by year: the day that year's count reached it (from BOOK_XP_FROM's year on). */
export function yearGoalsReached(books: Book[], goal: number): { year: number; date: string }[] {
  const perYear = new Map<number, string[]>();
  for (const b of books.filter(isFinished)) {
    const y = Number(b.finishedOn.slice(0, 4));
    perYear.set(y, [...(perYear.get(y) ?? []), b.finishedOn]);
  }
  const out: { year: number; date: string }[] = [];
  for (const [year, days] of perYear) {
    const on = days.sort()[goal - 1];
    if (on && on >= BOOK_XP_FROM) out.push({ year, date: on });
  }
  return out.sort((a, b) => a.year - b.year);
}

export function readingXp(records: LtRecord[], goal: number): ReadingXp[] {
  const books = booksOf(records);
  const out: ReadingXp[] = [];
  for (const b of books.filter(isFinished)) {
    if (b.finishedOn >= BOOK_XP_FROM) out.push({ key: `book:${b.id}`, date: b.finishedOn, xp: READING_XP.bookFinished, reason: `Finished: ${b.title}` });
  }
  for (const g of yearGoalsReached(books, goal)) out.push({ key: `books:${g.year}`, date: g.date, xp: READING_XP.yearGoal, reason: `${g.year} reading goal reached: ${goal} books` });
  return out;
}
