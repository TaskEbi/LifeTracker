/**
 * Reading's changes. A session is a Daily Log entry (book as subcategory, so it reads well in Curio
 * Cabinet's log) with a detail naming the book and the percentage. Logging also moves the book along:
 * started if it wasn't, finished if you said so. Everything goes through `withReward`, so what a save
 * earned comes straight from the records.
 */
import { closeSheet, openSheet } from '../../app/sheets';
import { ltToday, sectionEntries, sectionRecords, withReward } from '../../data/lt';
import { saveRecord } from '../../data/records';
import { saveSession } from '../../data/sessions';
import { commit, data, type DataState } from '../../data/store';
import type { LtRecord } from '../../data/types';
import { uuid } from '../../lib/random';
import type { ClippedBook } from '../../domain/reading/clippings';
import { bookOf, highlightOf, readSession, titleKey, type Book, type BookFormat, type BookStatus, type Highlight, type ReadSession } from '../../domain/reading/model';
import { focusStore, startFocus } from '../focus/focus';

const now = () => new Date().toISOString();

export const booksIn = (st: DataState): Book[] => sectionRecords(st, 'reading', 'book').map(bookOf).filter((b): b is Book => !!b);
export const linesIn = (st: DataState): Highlight[] => sectionRecords(st, 'reading', 'highlight').map(highlightOf).filter((h): h is Highlight => !!h);
export const sessionsIn = (st: DataState): ReadSession[] => sectionEntries(st, 'reading').map((s) => readSession(s.entry, s.detail));

export interface BookForm {
  title: string;
  author: string;
  status: BookStatus;
  format: BookFormat;
  genre: string | null;
  startedOn: string | null;
  finishedOn: string | null;
  rating: number | null;
  review: string;
  startPct: number;
  pages: number | null;
  coverId: number | null;
}

/** A book as it is stored: unknowns left out, and dates that follow from its status. */
function bookData(f: BookForm, today: string): Record<string, unknown> {
  const started = f.startedOn ?? (f.status === 'reading' ? today : null);
  const finished = f.status === 'finished' ? (f.finishedOn ?? today) : null;
  return {
    title: f.title.trim().slice(0, 200),
    ...(f.author.trim() ? { author: f.author.trim().slice(0, 120) } : {}),
    status: f.status,
    format: f.format,
    ...(f.genre ? { genre: f.genre } : {}),
    ...(started ? { startedOn: started } : {}),
    ...(finished ? { finishedOn: finished } : {}),
    ...(f.rating ? { rating: f.rating } : {}),
    ...(f.review.trim() ? { review: f.review.trim().slice(0, 2000) } : {}),
    ...(f.startPct ? { startPct: f.startPct } : {}),
    ...(f.pages ? { pages: f.pages } : {}),
    ...(f.coverId ? { coverId: f.coverId } : {}),
  };
}

export const formOf = (b: Book): BookForm => ({ title: b.title, author: b.author, status: b.status, format: b.format, genre: b.genre, startedOn: b.startedOn, finishedOn: b.finishedOn, rating: b.rating, review: b.review, startPct: b.startPct, pages: b.pages, coverId: b.coverId });

export const blankBook = (status: BookStatus = 'reading'): BookForm => ({ title: '', author: '', status, format: 'kindle', genre: null, startedOn: null, finishedOn: null, rating: null, review: '', startPct: 0, pages: null, coverId: null });

export function saveBook(f: BookForm, id?: string | null): LtRecord {
  let saved!: LtRecord;
  withReward(() => {
    saved = saveRecord('reading', 'book', bookData(f, ltToday()), id);
  });
  return saved;
}

export interface SessionForm {
  /** An existing book, or a new one to add with this session. */
  bookId: string | null;
  newBook: BookForm | null;
  minutes: number;
  date: string;
  percent: number | null;
  note: string;
  finished: boolean;
  rating: number | null;
  review: string;
}

/** Save a session and move its book along. Returns an error message, or null. */
export function logReading(f: SessionForm, editId?: string | null): string | null {
  let err: string | null = null;
  withReward(() => {
    const st = data.get();
    const existing = f.bookId ? st.lt_records.get(f.bookId) : undefined;
    const known = existing ? bookOf(existing) : null;
    const base: BookForm | null = known ? formOf(known) : f.newBook;
    if (!base || !base.title.trim()) {
      err = 'Which book? Pick one or add its title.';
      return false;
    }
    const finishing = f.finished;
    const next: BookForm = {
      ...base,
      // logging moves a book along; correcting an old session doesn't reopen a book you've set aside
      status: finishing ? 'finished' : base.status === 'finished' || editId ? base.status : 'reading',
      startedOn: base.startedOn && base.startedOn <= f.date ? base.startedOn : f.date,
      finishedOn: finishing ? (base.status === 'finished' && base.finishedOn ? base.finishedOn : f.date) : base.finishedOn,
      rating: finishing ? f.rating ?? base.rating : base.rating,
      review: finishing && f.review.trim() ? f.review : base.review,
    };
    // Check the session can be saved before anything changes.
    if (f.date > ltToday()) {
      err = "That day hasn't happened yet.";
      return false;
    }
    const saved = saveRecord('reading', 'book', bookData(next, ltToday()), known?.id);
    const percent = finishing ? 100 : f.percent;
    const r = saveSession(
      {
        section: 'reading',
        date: f.date,
        minutes: f.minutes,
        note: f.note,
        subcategory: next.title.trim().slice(0, 60),
        detail: { bookId: saved.id, book: next.title.trim().slice(0, 200), ...(percent != null ? { percent } : {}) },
      },
      editId,
    );
    if ('error' in r) {
      // nothing half-done: the book goes back to how it was
      commit('lt_records', [existing ? { ...existing, updated_at: now() } : { ...saved, deleted_at: now(), updated_at: now() }]);
      err = r.error;
      return false;
    }
    return true;
  });
  return err;
}

export interface LineForm {
  bookId: string | null;
  book: string;
  text: string;
  note: string;
  loc: string;
  addedOn: string | null;
  fav: boolean;
  key: string;
}

export function saveLine(f: LineForm, id?: string | null) {
  const value = {
    ...(f.bookId ? { bookId: f.bookId } : {}),
    ...(f.book ? { book: f.book } : {}),
    text: f.text.trim().slice(0, 4000),
    ...(f.note.trim() ? { note: f.note.trim().slice(0, 2000) } : {}),
    ...(f.loc.trim() ? { loc: f.loc.trim().slice(0, 40) } : {}),
    ...(f.addedOn ? { addedOn: f.addedOn } : {}),
    ...(f.fav ? { fav: true } : {}),
    ...(f.key ? { key: f.key } : {}),
  };
  withReward(() => {
    saveRecord('reading', 'highlight', value, id);
  });
}

/**
 * Bring in a Kindle file's books and lines in one commit. New books come in On hold: a clippings
 * file doesn't say whether a book was finished, so that stays yours to say, and no XP is implied.
 */
export function importClippings(books: ClippedBook[]): { books: number; lines: number } {
  const st = data.get();
  const existing = new Map(booksIn(st).map((b) => [titleKey(b.title), b]));
  const live = [...st.lt_records.values()].filter((r) => !r.deleted_at && r.section === 'reading');
  let order = live.reduce((m, r) => Math.max(m, r.sort_order), 0);
  const t = now();
  const row = (kind: string, value: Record<string, unknown>): LtRecord => ({ id: uuid(), section: 'reading', kind, data: value, sort_order: ++order, archived_at: null, created_at: t, updated_at: t, deleted_at: null });
  const rows: LtRecord[] = [];
  let newBooks = 0;
  let lines = 0;
  for (const b of books) {
    let id = existing.get(titleKey(b.title))?.id;
    if (!id) {
      const made = row('book', { title: b.title.slice(0, 200), ...(b.author ? { author: b.author.slice(0, 120) } : {}), status: 'paused', format: 'kindle' });
      rows.push(made);
      id = made.id;
      newBooks++;
    }
    for (const c of b.clippings) {
      rows.push(row('highlight', { bookId: id, book: b.title.slice(0, 200), text: c.text.slice(0, 4000), ...(c.note ? { note: c.note.slice(0, 2000) } : {}), ...(c.loc ? { loc: c.loc } : {}), ...(c.addedOn ? { addedOn: c.addedOn } : {}), key: c.key }));
      lines++;
    }
  }
  if (rows.length) {
    withReward(() => {
      commit('lt_records', rows);
    });
  }
  return { books: newBooks, lines };
}

// ─── the timer ──────────────────────────────────────────────────────────────

const TIMER_BOOK = 'lifetracker-reading-timer-book';

/** Start the focus timer on a book: its minutes come back to that book's log sheet. */
export function startReadingTimer(bookId: string | null) {
  try {
    if (bookId) localStorage.setItem(TIMER_BOOK, bookId);
    else localStorage.removeItem(TIMER_BOOK);
  } catch {
    /* private mode: the sheet falls back to the book last read */
  }
  if (!focusStore.get().focus) startFocus('reading', null);
  closeSheet();
  openSheet({ type: 'focus' });
}

export function timerBook(): string | null {
  try {
    return localStorage.getItem(TIMER_BOOK);
  } catch {
    return null;
  }
}
