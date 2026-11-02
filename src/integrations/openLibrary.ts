/**
 * Book suggestions from Open Library's public search (no login). Only the title being typed is
 * sent. Used to fill in the author, cover and print length; a failure says so and nothing else
 * depends on it, since a book can always be typed in by hand.
 */
import { GENRES } from '../domain/reading/model';

export interface BookHit {
  title: string;
  author: string;
  coverId: number | null;
  pages: number | null;
  year: number | null;
  genre: string | null;
}

interface Doc {
  title?: unknown;
  author_name?: unknown;
  cover_i?: unknown;
  number_of_pages_median?: unknown;
  first_publish_year?: unknown;
  subject?: unknown;
}

/** Subject words to our genres, most specific first. */
const GENRE_WORDS: [(typeof GENRES)[number], RegExp][] = [
  ['Manga', /\b(manga|comics? & graphic|graphic novels?)\b/],
  ['Sci-fi', /\b(science fiction|sci-fi|dystopia)/],
  ['Fantasy', /\bfantasy\b/],
  ['Mystery', /\b(mystery|detective|crime fiction|thriller)/],
  ['Poetry', /\bpoetry\b/],
  ['Classics', /\bclassics?\b|classic literature/],
  ['Biography', /\b(biography|autobiography|memoir)/],
  ['Philosophy', /\bphilosophy\b/],
  ['Psychology', /\bpsychology\b/],
  ['Maths', /\bmathematic/],
  ['Tech', /\b(computer|programming|software|algorithms?)\b/],
  ['Science', /\b(science|physics|biology|chemistry|astronomy|evolution)\b/],
  ['Business', /\b(business|economics|management|finance)\b/],
  ['Self-help', /\b(self-help|self-improvement|personal development)\b/],
  ['History', /\bhistory\b/],
  ['Fiction', /\bfiction\b|\bnovels?\b/],
];

export function genreOf(subjects: unknown): string | null {
  if (!Array.isArray(subjects)) return null;
  const all = subjects.filter((s): s is string => typeof s === 'string').join(' | ').toLowerCase();
  return GENRE_WORDS.find(([, re]) => re.test(all))?.[0] ?? null;
}

const whole = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : null);

export function bookHit(d: Doc): BookHit | null {
  if (typeof d.title !== 'string' || !d.title.trim()) return null;
  const author = Array.isArray(d.author_name) ? d.author_name.filter((a): a is string => typeof a === 'string').slice(0, 2).join(', ') : '';
  return { title: d.title.trim(), author, coverId: whole(d.cover_i), pages: whole(d.number_of_pages_median), year: whole(d.first_publish_year), genre: genreOf(d.subject) };
}

const FIELDS = 'title,author_name,cover_i,number_of_pages_median,first_publish_year,subject';

export async function searchBooks(q: string, signal?: AbortSignal): Promise<BookHit[]> {
  const url = `https://openlibrary.org/search.json?${new URLSearchParams({ q, limit: '6', fields: FIELDS })}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Open Library: ${res.status}`);
  const body = (await res.json()) as { docs?: Doc[] };
  return (body.docs ?? []).map(bookHit).filter((b): b is BookHit => !!b);
}

export const coverUrl = (id: number, size: 'S' | 'M' | 'L' = 'M') => `https://covers.openlibrary.org/b/id/${id}-${size}.jpg`;
