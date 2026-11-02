/**
 * How a book looks. A cover from Open Library when there is one (falling back if it won't load),
 * otherwise one made from the title: a cloth colour and pattern seeded by the title, so a book
 * looks the same everywhere. A Kindle book has no real spine, so a spine's thickness is the time
 * spent in it: the books you lived in longest stand widest on the shelf.
 */
import { useState, type CSSProperties } from 'react';
import { coverUrl } from '../../integrations/openLibrary';
import type { Book } from '../../domain/reading/model';

export const seedOfTitle = (t: string) => {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** Bookcloth: [cloth, foil]. */
const CLOTHS: [string, string][] = [
  ['#7b2d26', '#f0d9a8'],
  ['#25483f', '#e9d9a6'],
  ['#2b3a67', '#f1dfae'],
  ['#5a3e6b', '#f2dfb8'],
  ['#8a5a2b', '#fbeecb'],
  ['#35555f', '#f4e6c4'],
  ['#a2472f', '#fde9c4'],
  ['#3f4a2d', '#ece0ad'],
  ['#1f2c33', '#d9c28c'],
  ['#6e2f47', '#f6dcc0'],
  ['#44403c', '#e8d5a3'],
  ['#b0853a', '#2c1e0c'],
];

export const clothOf = (title: string): [string, string] => CLOTHS[seedOfTitle(title) % CLOTHS.length];

export function Cover({ book, className = '' }: { book: Pick<Book, 'title' | 'author' | 'coverId'>; className?: string }) {
  const [broken, setBroken] = useState(false);
  const [cloth, foil] = clothOf(book.title);
  const style = { '--cloth': cloth, '--foil': foil } as CSSProperties;
  const motif = seedOfTitle(book.title) % 3;
  return (
    <span className={`rd-cover rd-cover--m${motif} ${className}`} style={style} aria-hidden="true">
      <span className="rd-cover__made">
        <b>{book.title}</b>
        {book.author && <small>{book.author}</small>}
      </span>
      {book.coverId && !broken && <img src={coverUrl(book.coverId)} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />}
    </span>
  );
}

const MIN_W = 30;
const MAX_W = 58;
/** Width from hours read; a book with no logged time gets a width from its title. */
export function spineWidth(title: string, minutes: number): number {
  if (minutes <= 0) return MIN_W + seedOfTitle(title) % 10;
  return Math.round(MIN_W + Math.min(1, Math.sqrt(minutes / 900)) * (MAX_W - MIN_W));
}
export const spineHeight = (title: string) => 104 + (seedOfTitle(title) >>> 4) % 28;
