/**
 * 道場, the dojo: spaced recall. A simplified SM-2 on whole days (Daily Log days), so a card comes back
 * just as you're about to forget it. Cards are ordinary lt_records rows (kind `hq_card`).
 * A card can be typed, cut from a Kindle highlight (a blank in the middle of the line) or written
 * from a mistake, with why it went wrong, so the dojo can show where marks leak.
 */
import type { LtRecord } from '../../data/types';
import { addDays } from '../log/dates';

export type Grade = 'again' | 'hard' | 'good' | 'easy';
export const GRADES: Grade[] = ['again', 'hard', 'good', 'easy'];

export interface Srs {
  due: string;
  /** Days until it next comes back. */
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
  /** The day it was first reviewed. */
  firstOn: string | null;
}

export type CardSource = 'typed' | 'highlight' | 'mistake';

export const CAUSES = [
  { id: 'careless', label: 'Careless slip' },
  { id: 'concept', label: 'Didn’t understand' },
  { id: 'recall', label: 'Forgot it' },
  { id: 'misread', label: 'Misread it' },
  { id: 'time', label: 'Ran out of time' },
  { id: 'method', label: 'Wrong method' },
] as const;
export type Cause = (typeof CAUSES)[number]['id'];

export interface Card {
  id: string;
  deck: string;
  front: string;
  back: string;
  source: CardSource;
  cause: Cause | null;
  /** The highlight it was cut from. */
  highlightId: string | null;
  srs: Srs;
  createdOn: string;
}

export const NEW_PER_DAY = 15;
const START_EASE = 2.5;
const MIN_EASE = 1.3;

export const freshSrs = (today: string): Srs => ({ due: today, interval: 0, ease: START_EASE, reps: 0, lapses: 0, firstOn: null });

export function schedule(s: Srs, grade: Grade, today: string): Srs {
  const firstOn = s.firstOn ?? today;
  if (grade === 'again') {
    return { ...s, due: addDays(today, 1), interval: 1, ease: Math.max(MIN_EASE, s.ease - 0.2), reps: 0, lapses: s.lapses + 1, firstOn };
  }
  let interval: number;
  let ease = s.ease;
  if (grade === 'hard') {
    interval = Math.max(1, Math.round(s.interval * 1.2));
    ease = Math.max(MIN_EASE, ease - 0.15);
  } else if (grade === 'good') {
    interval = s.reps === 0 ? 1 : s.reps === 1 ? 3 : Math.round(s.interval * ease);
  } else {
    interval = s.reps === 0 ? 4 : Math.round(Math.max(s.interval, 1) * ease * 1.3);
    ease += 0.15;
  }
  interval = Math.min(interval, 365 * 3);
  return { ...s, due: addDays(today, interval), interval, ease, reps: s.reps + 1, firstOn };
}

/** "tomorrow", "3d", "2mo": what each grade would do, on its button. */
export function intervalLabel(s: Srs, grade: Grade, today: string): string {
  const d = schedule(s, grade, today).interval;
  if (d <= 1) return '1d';
  if (d < 30) return `${d}d`;
  if (d < 365) return `${Math.round(d / 30)}mo`;
  return `${(d / 365).toFixed(1)}y`;
}

export function cardOf(r: LtRecord): Card | null {
  if (r.deleted_at || r.kind !== 'hq_card') return null;
  const d = r.data;
  if (typeof d.front !== 'string' || !d.front.trim()) return null;
  const raw = (d.srs && typeof d.srs === 'object' ? d.srs : {}) as Partial<Srs>;
  const createdOn = typeof d.createdOn === 'string' ? d.createdOn : r.created_at.slice(0, 10);
  return {
    id: r.id,
    deck: typeof d.deck === 'string' && d.deck ? d.deck : 'General',
    front: d.front,
    back: typeof d.back === 'string' ? d.back : '',
    source: d.source === 'highlight' || d.source === 'mistake' ? d.source : 'typed',
    cause: CAUSES.some((c) => c.id === d.cause) ? (d.cause as Cause) : null,
    highlightId: typeof d.highlightId === 'string' ? d.highlightId : null,
    createdOn,
    srs: {
      due: typeof raw.due === 'string' ? raw.due : createdOn,
      interval: typeof raw.interval === 'number' ? raw.interval : 0,
      ease: typeof raw.ease === 'number' ? raw.ease : START_EASE,
      reps: typeof raw.reps === 'number' ? raw.reps : 0,
      lapses: typeof raw.lapses === 'number' ? raw.lapses : 0,
      firstOn: typeof raw.firstOn === 'string' ? raw.firstOn : null,
    },
  };
}

/** Today's queue: everything due, oldest first, then new cards up to today's allowance. */
export function reviewQueue(cards: Card[], today: string, deck: string | null = null): Card[] {
  const inDeck = deck ? cards.filter((c) => c.deck === deck) : cards;
  const started = inDeck.filter((c) => c.srs.firstOn && c.srs.due <= today).sort((a, b) => a.srs.due.localeCompare(b.srs.due));
  const introducedToday = cards.filter((c) => c.srs.firstOn === today).length;
  const allowance = Math.max(0, NEW_PER_DAY - introducedToday);
  const fresh = inDeck.filter((c) => !c.srs.firstOn).sort((a, b) => a.createdOn.localeCompare(b.createdOn)).slice(0, allowance);
  return [...started, ...fresh];
}

export interface Blank {
  /** The text with the blank showing. */
  hidden: string;
  /** The words behind the blank. */
  answer: string;
  /** The whole line. */
  whole: string;
}

/** Make a line with {{a blank}} into a question and an answer. */
export function clozeOf(text: string): Blank {
  const parts: string[] = [];
  const hidden = text.replace(/\{\{(.+?)\}\}/g, (_, w: string) => {
    parts.push(w);
    return '[ … ]';
  });
  return { hidden, answer: parts.join(' · '), whole: text.replace(/\{\{(.+?)\}\}/g, '$1') };
}
export const hasBlank = (text: string) => /\{\{.+?\}\}/.test(text);

/** The words of a line, ready to tap: a word (with what follows it) at a time. */
export function tappableWords(line: string): string[] {
  return line.split(/(\s+)/).filter((w) => w.trim());
}

/** Blank out the chosen word positions, joining neighbours into one blank. */
export function blankWords(words: string[], picked: Set<number>): string {
  const out: string[] = [];
  let i = 0;
  while (i < words.length) {
    if (!picked.has(i)) {
      out.push(words[i++]);
      continue;
    }
    const run: string[] = [];
    while (i < words.length && picked.has(i)) run.push(words[i++]);
    const text = run.join(' ');
    const m = text.match(/^(.*?)([.,;:!?"”’)]*)$/);
    out.push(`{{${m?.[1] || text}}}${m?.[2] ?? ''}`);
  }
  return out.join(' ');
}

/** Which causes cost the most, from cards written after a mistake. */
export function leaks(cards: Card[]): { cause: Cause; label: string; n: number }[] {
  const by = new Map<Cause, number>();
  for (const c of cards) if (c.source === 'mistake' && c.cause) by.set(c.cause, (by.get(c.cause) ?? 0) + 1);
  return CAUSES.map((c) => ({ cause: c.id, label: c.label, n: by.get(c.id) ?? 0 })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
}

export interface DeckStat {
  deck: string;
  total: number;
  due: number;
  /** Interval of three weeks or more: it has stuck. */
  mature: number;
}
export function deckStats(cards: Card[], today: string): DeckStat[] {
  const by = new Map<string, DeckStat>();
  const queue = new Set(reviewQueue(cards, today).map((c) => c.id));
  for (const c of cards) {
    const s = by.get(c.deck) ?? { deck: c.deck, total: 0, due: 0, mature: 0 };
    s.total++;
    if (queue.has(c.id)) s.due++;
    if (c.srs.interval >= 21) s.mature++;
    by.set(c.deck, s);
  }
  return [...by.values()].sort((a, b) => b.due - a.due || a.deck.localeCompare(b.deck));
}
