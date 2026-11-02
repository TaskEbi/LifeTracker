/**
 * Reads a Kindle's `My Clippings.txt` (in the Kindle's documents folder over USB): entries split by
 * a row of equals signs, each a title line, a "- Your Highlight on … | Added on …" line and the text.
 * The wording of the second line depends on the Kindle's language and age, so only the parts that
 * matter are looked for. Bookmarks carry no words and are skipped. A highlight changed on the Kindle
 * leaves its old version in the file too, so a line inside a longer one at the same place is dropped.
 */
import { highlightKey, titleKey } from './model';

export interface Clipping {
  title: string;
  author: string;
  text: string;
  note: string;
  loc: string;
  addedOn: string | null;
  key: string;
}

export interface ClippedBook {
  title: string;
  author: string;
  clippings: Clipping[];
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const pad2 = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => (m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${pad2(m)}-${pad2(d)}` : null);

/** The date in an "Added on" part, in the formats Kindles write, without trusting the device's parser. */
export function clippingDate(s: string): string | null {
  const jp = s.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  if (jp) return iso(+jp[1], +jp[2], +jp[3]);
  const lower = s.toLowerCase();
  const name = MONTHS.findIndex((m) => lower.includes(m));
  if (name >= 0) {
    const year = lower.match(/\b((?:19|20)\d{2})\b/);
    const dayOf = lower.replace(/\b(?:19|20)\d{2}\b/, '').replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/, '').match(/\b(\d{1,2})\b/);
    return year && dayOf ? iso(+year[1], name + 1, +dayOf[1]) : null;
  }
  const num = lower.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  return num ? iso(+num[1], +num[2], +num[3]) : null;
}

/** "Dune (Frank Herbert)": the last brackets are the author; "Herbert, Frank" reads the right way round. */
export function clippingTitle(line: string): { title: string; author: string } {
  const clean = line.replace(/﻿/g, '').trim();
  const m = clean.match(/^(.*\S)\s*[(（]([^()（）]*)[)）]\s*$/);
  if (!m) return { title: clean, author: '' };
  const raw = m[2].trim();
  const flip = /^[^,;]+,\s*[^,;]+$/.test(raw) ? raw.split(/,\s*/).reverse().join(' ') : raw;
  return { title: m[1].trim(), author: flip };
}

type Kind = 'highlight' | 'note' | 'bookmark';

function kindOf(meta: string): Kind {
  const s = meta.toLowerCase();
  if (s.includes('bookmark') || meta.includes('ブックマーク')) return 'bookmark';
  if (/\bnote\b/.test(s) || meta.includes('メモ')) return 'note';
  return 'highlight';
}

/** Where it is, for showing and for telling versions of a highlight apart: "Location 123-125". */
function locOf(meta: string): string {
  const m = meta.match(/(?:location|loc\.?)\s*(\d+(?:\s*-\s*\d+)?)/i) ?? meta.match(/位置No\.\s*(\d+(?:\s*-\s*\d+)?)/) ?? meta.match(/(?:page)\s*(\d+(?:\s*-\s*\d+)?)/i);
  return m ? m[1].replace(/\s+/g, '') : '';
}

const lastOf = (loc: string) => loc.split('-').at(-1) ?? '';
const firstOf = (loc: string) => loc.split('-')[0] ?? '';
const overlaps = (a: string, b: string) => !!a && !!b && (firstOf(a) === firstOf(b) || lastOf(a) === lastOf(b));

export function parseClippings(file: string): ClippedBook[] {
  const books = new Map<string, ClippedBook>();
  for (const part of file.replace(/\r\n?/g, '\n').split(/^={5,}\s*$/m)) {
    const lines = part.replace(/﻿/g, '').split('\n').map((l) => l.trim());
    while (lines.length && !lines[0]) lines.shift();
    if (lines.length < 2 || !lines[1].startsWith('-')) continue;
    const { title, author } = clippingTitle(lines[0]);
    if (!title) continue;
    const meta = lines[1];
    const kind = kindOf(meta);
    if (kind === 'bookmark') continue;
    const words = lines.slice(2).join('\n').trim();
    if (!words) continue;

    const id = titleKey(title);
    let book = books.get(id);
    if (!book) books.set(id, (book = { title, author, clippings: [] }));
    if (!book.author && author) book.author = author;
    const loc = locOf(meta);
    // the date is in the last part: earlier parts have page and location numbers
    const addedOn = clippingDate(meta.split('|').at(-1) ?? meta);

    if (kind === 'note') {
      // a note belongs to the highlight it was typed on (it shares its last location)
      const on = [...book.clippings].reverse().find((c) => c.text && !c.note && lastOf(c.loc) === lastOf(loc));
      if (on) on.note = words;
      else book.clippings.push({ title, author, text: '', note: words, loc, addedOn, key: highlightKey(title, words) });
      continue;
    }
    const earlier = book.clippings.find((c) => c.text && overlaps(c.loc, loc) && (c.text.includes(words) || words.includes(c.text)));
    if (earlier) {
      if (words.length > earlier.text.length) Object.assign(earlier, { text: words, loc, addedOn, key: highlightKey(title, words) });
      continue;
    }
    const key = highlightKey(title, words);
    if (!book.clippings.some((c) => c.key === key)) book.clippings.push({ title, author, text: words, note: '', loc, addedOn, key });
  }
  return [...books.values()].filter((b) => b.clippings.length);
}

/** What an import would add: known lines are left out, and each book says if it's already here. */
export function planImport(parsed: ClippedBook[], known: { titles: Set<string>; keys: Set<string> }) {
  const books = parsed
    .map((b) => ({ ...b, clippings: b.clippings.filter((c) => !known.keys.has(c.key)), isNew: !known.titles.has(titleKey(b.title)) }))
    .filter((b) => b.clippings.length || b.isNew);
  return { books, lines: books.reduce((n, b) => n + b.clippings.length, 0), newBooks: books.filter((b) => b.isNew).length };
}
