import { describe, expect, it } from 'vitest';
import type { LtRecord } from '../../data/types';
import { bookHit, genreOf } from '../../integrations/openLibrary';
import { clippingDate, clippingTitle, parseClippings, planImport } from './clippings';
import { bookOf, bookProgress, dailyRate, finishBy, highlightKey, highlightOf, likelyBook, lineOfDay, readingXp, sleepAfterReading, titleKey, yearBooks, type ReadSession } from './model';

const T = '2026-11-02';
let n = 0;
const rec = (kind: string, data: Record<string, unknown>, extra: Partial<LtRecord> = {}): LtRecord => ({
  id: `r${++n}`,
  section: 'reading',
  kind,
  data,
  sort_order: n,
  archived_at: null,
  created_at: `2026-01-01T00:00:${String(n % 60).padStart(2, '0')}Z`,
  updated_at: '2026-01-01T00:00:00Z',
  deleted_at: null,
  ...extra,
});
const book = (data: Record<string, unknown> = {}, extra: Partial<LtRecord> = {}) => bookOf(rec('book', { title: 'Dune', status: 'reading', ...data }, extra))!;
const s = (bookId: string | null, date: string, minutes: number, percent: number | null = null): ReadSession => ({ id: `s${++n}`, date, createdAt: `${date}T20:00:00Z`, minutes, note: null, bookId, book: null, percent });

describe('books', () => {
  it('reads a record, keeping unknown fields out of the way', () => {
    const b = book({ author: ' Frank Herbert ', rating: 9, pages: 412, startPct: 130, genre: 'Sci-fi', status: 'odd', format: 'scroll', finishedOn: 'soon' });
    expect(b).toMatchObject({ title: 'Dune', author: 'Frank Herbert', rating: null, pages: 412, startPct: 100, genre: 'Sci-fi', status: 'want', format: 'kindle', finishedOn: null });
    expect(bookOf(rec('book', { title: '  ' }))).toBeNull();
    expect(bookOf(rec('book', { title: 'x' }, { deleted_at: T }))).toBeNull();
    expect(bookOf(rec('highlight', { title: 'x' }))).toBeNull();
  });

  it('treats a subtitle and case as the same title', () => {
    expect(titleKey('Dune: Book One')).toBe('dune');
    expect(titleKey('DUNE')).toBe('dune');
    expect(titleKey('Mistborn - The Final Empire')).toBe('mistborn');
    expect(titleKey('Catch-22')).toBe('catch 22');
  });
});

describe('progress in a book', () => {
  it('takes the latest percentage, works out the pace and what is left', () => {
    const b = book();
    const p = bookProgress(b, [s(b.id, '2026-10-01', 30, 10), s(b.id, '2026-10-02', 30, 20), s('other', '2026-10-02', 99, 90)]);
    expect(p).toMatchObject({ minutes: 60, sessions: 2, pct: 20, lastRead: '2026-10-02', minutesPerPct: 3, leftMinutes: 240 });
  });

  it('counts only from where the book stood when logging began', () => {
    const b = book({ startPct: 50 });
    const p = bookProgress(b, [s(b.id, '2026-10-01', 60, 60)]);
    expect(p.minutesPerPct).toBe(6);
    expect(p.leftMinutes).toBe(240);
  });

  it('takes time read since the last percentage off what is left', () => {
    const b = book();
    const p = bookProgress(b, [s(b.id, '2026-10-01', 60, 20), s(b.id, '2026-10-02', 30)]);
    expect(p.leftMinutes).toBe(210);
    expect(p.minutes).toBe(90);
  });

  it('says nothing about pace without a percentage or with too little to go on', () => {
    const b = book();
    expect(bookProgress(b, [s(b.id, '2026-10-01', 60)]).minutesPerPct).toBeNull();
    expect(bookProgress(b, [s(b.id, '2026-10-01', 60, 1)]).minutesPerPct).toBeNull();
    expect(bookProgress(b, [s(b.id, '2026-10-01', 5, 10)]).minutesPerPct).toBeNull();
    expect(bookProgress(b, [s(b.id, '2026-10-01', 60)]).leftMinutes).toBeNull();
  });

  it('never goes below nothing left, and a finished book is at 100', () => {
    const b = book();
    expect(bookProgress(b, [s(b.id, '2026-10-01', 30, 90), s(b.id, '2026-10-02', 200)]).leftMinutes).toBe(0);
    const f = book({ status: 'finished', finishedOn: T });
    const p = bookProgress(f, [s(f.id, '2026-10-01', 30, 90)]);
    expect(p.pct).toBe(100);
    expect(p.leftMinutes).toBeNull();
  });

  it('estimates pages only when the print length is known', () => {
    const b = book({ pages: 400 });
    expect(bookProgress(b, [s(b.id, T, 30, 25)]).pagesRead).toBe(100);
    expect(bookProgress(book(), [s('x', T, 30, 25)]).pagesRead).toBeNull();
  });

  it('forecasts a finish from the rate over two weeks', () => {
    const rate = dailyRate([s('a', T, 140), s('a', '2026-10-19', 999)], T);
    expect(rate).toBe(10);
    expect(finishBy(100, rate, T)).toBe('2026-11-12');
    expect(finishBy(100, 0, T)).toBeNull();
    expect(finishBy(null, rate, T)).toBeNull();
  });

  it('guesses the book last read that is still open', () => {
    const a = book({ title: 'A' });
    const b = book({ title: 'B' });
    const gone = book({ title: 'C', status: 'finished', finishedOn: T });
    expect(likelyBook([a, b, gone], [s(b.id, '2026-10-01', 10), s(gone.id, '2026-10-05', 10)])?.title).toBe('B');
    expect(likelyBook([a, b], [])?.title).toBe('A');
    expect(likelyBook([gone], [])).toBeNull();
  });
});

describe('a year in books', () => {
  it('adds up the year', () => {
    const a = book({ title: 'A', author: 'X', genre: 'Sci-fi', status: 'finished', startedOn: '2026-03-01', finishedOn: '2026-03-05', rating: 5, pages: 300 });
    const b = book({ title: 'B', author: 'X', genre: 'Sci-fi', status: 'finished', startedOn: '2026-01-01', finishedOn: '2026-02-20', rating: 4 });
    const c = book({ title: 'C', author: 'Y', genre: 'History', status: 'finished', finishedOn: '2025-12-30' });
    const y = yearBooks(2026, [a, b, c], [s(a.id, '2026-03-02', 60), s(b.id, '2026-02-01', 200), s(b.id, '2026-02-01', 20), s(c.id, '2025-12-30', 500)]);
    expect(y.finished.map((x) => x.title)).toEqual(['B', 'A']);
    expect(y).toMatchObject({ minutes: 280, sessions: 3, days: 2, avgRating: 4.5, topAuthor: { name: 'X', n: 2 }, pages: 300 });
    expect(y.genres).toEqual([{ name: 'Sci-fi', n: 2 }]);
    expect(y.months[1]).toBe(220);
    expect(y.months[2]).toBe(60);
    expect(y.longest?.book.title).toBe('B');
    expect(y.fastest).toMatchObject({ days: 5 });
    expect(y.fastest?.book.title).toBe('A');
  });
});

describe('XP', () => {
  it('pays once per book, only from the start date, and for the year goal once', () => {
    const list = [rec('book', { title: 'Old', status: 'finished', finishedOn: '2024-05-01' }), rec('book', { title: 'New', status: 'finished', finishedOn: '2026-10-20' }), rec('book', { title: 'Open', status: 'reading' })];
    const xp = readingXp(list, 12);
    expect(xp.map((x) => x.reason)).toEqual(['Finished: New']);
    expect(xp[0].key).toBe(`book:${list[1].id}`);
    const goal = readingXp(list, 1);
    expect(goal.map((x) => x.key)).toContain('books:2026');
    expect(goal.map((x) => x.key)).not.toContain('books:2024');
    expect(goal.find((x) => x.key === 'books:2026')?.date).toBe('2026-10-20');
  });
});

describe('lines and sleep', () => {
  it('shows the same line all day, whichever order they arrive in', () => {
    const list = ['a', 'b', 'c'].map((t, i) => highlightOf(rec('highlight', { text: t }, { id: `h${i}` }))!);
    expect(lineOfDay(list, T)?.id).toBe(lineOfDay([...list].reverse(), T)?.id);
    expect(lineOfDay([], T)).toBeNull();
    const seen = new Set(Array.from({ length: 30 }, (_, i) => lineOfDay(list, `2026-11-${String(i + 1).padStart(2, '0')}`)?.id));
    expect(seen.size).toBe(3);
  });

  it('compares nights after reading only when there are enough of each', () => {
    const nights = Array.from({ length: 12 }, (_, i) => ({ date: `2026-10-${String(i + 10).padStart(2, '0')}`, minutes: i % 2 ? 480 : 420 }));
    const readOn = nights.filter((_, i) => i % 2).map((x) => s('a', `2026-10-${String(Number(x.date.slice(8)) - 1).padStart(2, '0')}`, 20));
    expect(sleepAfterReading(readOn, nights, T)).toEqual({ read: { nights: 6, avg: 480 }, other: { nights: 6, avg: 420 } });
    expect(sleepAfterReading(readOn.slice(0, 2), nights, T)).toBeNull();
  });
});

describe('Open Library', () => {
  it('maps a search result, with no invented fields', () => {
    expect(bookHit({ title: ' Dune ', author_name: ['Frank Herbert', 'Someone', 'Third'], cover_i: 12, number_of_pages_median: 412, first_publish_year: 1965, subject: ['Science fiction', 'Fiction'] })).toEqual({ title: 'Dune', author: 'Frank Herbert, Someone', coverId: 12, pages: 412, year: 1965, genre: 'Sci-fi' });
    expect(bookHit({ title: 'Plain' })).toEqual({ title: 'Plain', author: '', coverId: null, pages: null, year: null, genre: null });
    expect(bookHit({ author_name: ['No title'] })).toBeNull();
  });

  it('prefers the most specific genre', () => {
    expect(genreOf(['Fiction', 'Fantasy'])).toBe('Fantasy');
    expect(genreOf(['Biography', 'History'])).toBe('Biography');
    expect(genreOf(['Cooking'])).toBeNull();
    expect(genreOf('nope')).toBeNull();
  });
});

describe('Kindle clippings', () => {
  const FILE = [
    '﻿Dune (Frank Herbert)',
    '- Your Highlight on Location 100-102 | Added on Monday, 3 January 2022 10:00:00',
    '',
    'Fear is the mind-killer.',
    '==========',
    'Dune (Frank Herbert)',
    '- Your Note on Location 102 | Added on Monday, 3 January 2022 10:01:00',
    '',
    'The litany!',
    '==========',
    'Dune (Frank Herbert)',
    '- Your Bookmark on Location 300 | Added on Monday, 3 January 2022 10:05:00',
    '',
    '',
    '==========',
    'Dune (Frank Herbert)',
    '- Your Highlight on page 12 | Location 500-501 | Added on Sunday, March 6, 2022 12:23:45 PM',
    '',
    'I must not fear.',
    '==========',
    'Dune (Frank Herbert)',
    '- Your Highlight on page 12 | Location 500-503 | Added on Sunday, March 6, 2022 12:24:45 PM',
    '',
    'I must not fear. Fear is the little-death.',
    '==========',
    "Sapiens (Harari, Yuval Noah)",
    '- Your Highlight at location 7-8 | Added on Tuesday, 1 February 2022 09:00:00',
    '',
    'Culture tends to argue',
    'that it forbids only that which is unnatural.',
    '==========',
    '吾輩は猫である (夏目漱石)',
    '- 位置No. 10-12のハイライト |2022年1月3日月曜日 10:00:00',
    '',
    '吾輩は猫である。名前はまだ無い。',
    '==========',
    '',
  ].join('\r\n');

  it('reads books, highlights, notes and dates, and skips bookmarks', () => {
    const books = parseClippings(FILE);
    expect(books.map((b) => b.title)).toEqual(['Dune', 'Sapiens', '吾輩は猫である']);
    expect(books[1].author).toBe('Yuval Noah Harari');
    expect(books[2].author).toBe('夏目漱石');
    const dune = books[0];
    expect(dune.clippings[0]).toMatchObject({ text: 'Fear is the mind-killer.', note: 'The litany!', loc: '100-102', addedOn: '2022-01-03' });
    expect(books[1].clippings[0].text).toBe('Culture tends to argue\nthat it forbids only that which is unnatural.');
    expect(books[2].clippings[0].addedOn).toBe('2022-01-03');
  });

  it('keeps only the longest version of a highlight that was changed', () => {
    const dune = parseClippings(FILE)[0];
    expect(dune.clippings).toHaveLength(2);
    expect(dune.clippings[1]).toMatchObject({ text: 'I must not fear. Fear is the little-death.', loc: '500-503', addedOn: '2022-03-06' });
  });

  it('reads the date in each format and the title with brackets in it', () => {
    expect(clippingDate('Added on Sunday, March 6, 2022 12:23:45 PM')).toBe('2022-03-06');
    expect(clippingDate('Added on Monday, 13 June 2022 01:02:03')).toBe('2022-06-13');
    expect(clippingDate('2022年11月3日木曜日')).toBe('2022-11-03');
    expect(clippingDate('nothing here')).toBeNull();
    expect(clippingTitle('Thinking (and Fast) (Daniel Kahneman)')).toEqual({ title: 'Thinking (and Fast)', author: 'Daniel Kahneman' });
    expect(clippingTitle('No Author Here')).toEqual({ title: 'No Author Here', author: '' });
  });

  it('copes with something that is not a clippings file', () => {
    expect(parseClippings('hello\nworld')).toEqual([]);
    expect(parseClippings('')).toEqual([]);
  });

  it('plans an import without what is already here', () => {
    const parsed = parseClippings(FILE);
    const plan = planImport(parsed, { titles: new Set(['dune']), keys: new Set([highlightKey('Dune', 'Fear is the mind-killer.')]) });
    expect(plan.newBooks).toBe(2);
    expect(plan.lines).toBe(3);
    expect(plan.books[0]).toMatchObject({ title: 'Dune', isNew: false });
    const again = planImport(parsed, { titles: new Set(['dune', 'sapiens', titleKey('吾輩は猫である')]), keys: new Set(parsed.flatMap((b) => b.clippings.map((c) => c.key))) });
    expect(again).toEqual({ books: [], lines: 0, newBooks: 0 });
  });
});

