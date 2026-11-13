/**
 * The study tools built on the notes: flash cards (one per key term, and one per section that
 * has formulas), the formula sheet, the glossary, and the list of examiner's tips and common
 * mistakes. All of it is read from the notes' content, so nothing is written twice; only how
 * well you know each card is kept (see features/notes/actions).
 */
import { addDays } from '../log/dates';
import { NOTE_SUBJECTS, topicsOf } from './index';
import { plain } from './markup';
import { slug, type NoteSubject, type NoteTopic, type NoteUnit } from './types';

export type Level = 'as' | 'a2' | 'all';
export const LEVELS: { id: Level; label: string }[] = [
  { id: 'as', label: 'AS' },
  { id: 'a2', label: 'A2' },
  { id: 'all', label: 'All' },
];
export const isLevel = (x: unknown): x is Level => x === 'as' || x === 'a2' || x === 'all';
export const inLevel = (u: NoteUnit, level: Level) => level === 'all' || (level === 'a2') === !!u.a2;
export const unitsAt = (s: NoteSubject, level: Level) => s.units.filter((u) => inLevel(u, level));

// ── flash cards ──

export type CardKind = 'term' | 'formula';

export interface Card {
  /** `<topic id>#<key>`. */
  id: string;
  /** The part after the #: what the topic's row stores. */
  key: string;
  kind: CardKind;
  subject: NoteSubject;
  unit: NoteUnit;
  topic: NoteTopic;
  /** The prompt, in the notes' markup. */
  front: string;
  /** The answer: one definition, or a section's formula lines. */
  back: string[];
}

export function cardsOfTopic(subject: NoteSubject, unit: NoteUnit, topic: NoteTopic): Card[] {
  const out: Card[] = [];
  const base = { subject, unit, topic };
  for (const k of topic.terms) {
    const key = `t-${slug(k.t)}`;
    out.push({ ...base, id: `${topic.id}#${key}`, key, kind: 'term', front: k.t, back: [k.d] });
  }
  for (const s of topic.sections) {
    const lines = s.body.flatMap((b) => (typeof b !== 'string' && b.k === 'f' ? b.lines : []));
    if (!lines.length) continue;
    const key = `f-${s.id}`;
    out.push({ ...base, id: `${topic.id}#${key}`, key, kind: 'formula', front: s.title, back: lines });
  }
  return out;
}

export interface DeckFilter {
  subject?: string;
  topic?: string;
  level?: Level;
  kind?: CardKind | 'all';
}

export function deck(filter: DeckFilter = {}): Card[] {
  const out: Card[] = [];
  for (const s of NOTE_SUBJECTS) {
    if (filter.subject && s.id !== filter.subject) continue;
    for (const u of s.units) {
      if (!filter.topic && !inLevel(u, filter.level ?? 'all')) continue;
      for (const t of u.topics) {
        if (filter.topic && t.id !== filter.topic) continue;
        for (const c of cardsOfTopic(s, u, t)) if (!filter.kind || filter.kind === 'all' || c.kind === filter.kind) out.push(c);
      }
    }
  }
  return out;
}

/** How well a card is known: a Leitner box (1 to 5) and the day it is next due. */
export interface CardMark {
  box: number;
  due: string;
}
/** Card id → its mark. A card never answered has none. */
export type CardMarks = ReadonlyMap<string, CardMark>;

/** Days until a card comes back after a right answer puts it in box 1, 2, 3, 4, 5. */
export const CARD_STEPS = [1, 3, 7, 16, 35] as const;
export const TOP_BOX = CARD_STEPS.length;
/** From this box up a card counts as known. */
export const KNOWN_BOX = 3;

/**
 * Right moves a card up a box and further away; wrong sends it back to box 1, due today.
 * `retry`: right on a second go in the same sitting, which only earns box 1 and tomorrow.
 */
export function gradeCard(prev: CardMark | undefined, right: boolean, today: string, retry = false): CardMark {
  if (!right) return { box: 1, due: today };
  if (retry) return { box: 1, due: addDays(today, 1) };
  const box = Math.min(TOP_BOX, (prev?.box ?? 0) + 1);
  return { box, due: addDays(today, CARD_STEPS[box - 1]) };
}

export interface DeckStats {
  total: number;
  fresh: number;
  due: number;
  learning: number;
  known: number;
}

export function deckStats(cards: readonly Card[], marks: CardMarks, today: string): DeckStats {
  const st: DeckStats = { total: cards.length, fresh: 0, due: 0, learning: 0, known: 0 };
  for (const c of cards) {
    const m = marks.get(c.id);
    if (!m) {
      st.fresh++;
      continue;
    }
    if (m.due <= today) st.due++;
    if (m.box >= KNOWN_BOX) st.known++;
    else st.learning++;
  }
  return st;
}

/** Marks that belong to a card that still exists and are due. */
export const dueCount = (marks: CardMarks, today: string, cards: readonly Card[] = deck()): number => deckStats(cards, marks, today).due;

export type SessionMode = 'due' | 'all';

/**
 * The cards for one sitting. `due`: what is due (the longest overdue first), then cards never
 * seen, in the notes' order. `all`: every card, the least known first. Cut to `limit`.
 */
export function sessionCards(cards: readonly Card[], marks: CardMarks, today: string, mode: SessionMode = 'due', limit = 20): Card[] {
  if (mode === 'all') {
    const box = (c: Card) => marks.get(c.id)?.box ?? 0;
    return [...cards].sort((a, b) => box(a) - box(b)).slice(0, limit);
  }
  const due = cards.filter((c) => (marks.get(c.id)?.due ?? '9') <= today).sort((a, b) => marks.get(a.id)!.due.localeCompare(marks.get(b.id)!.due));
  const fresh = cards.filter((c) => !marks.has(c.id));
  return [...due, ...fresh].slice(0, limit);
}

// ── the formula sheet ──

export interface FormulaGroup {
  unit: NoteUnit;
  topic: NoteTopic;
  section: string;
  lines: string[];
}

export function formulasOf(s: NoteSubject, level: Level = 'all'): FormulaGroup[] {
  const out: FormulaGroup[] = [];
  for (const unit of unitsAt(s, level))
    for (const topic of unit.topics)
      for (const sec of topic.sections) {
        const lines = sec.body.flatMap((b) => (typeof b !== 'string' && b.k === 'f' ? b.lines : []));
        if (lines.length) out.push({ unit, topic, section: sec.title, lines });
      }
  return out;
}

// ── the glossary ──

export interface GlossaryEntry {
  term: string;
  def: string;
  subject: NoteSubject;
  unit: NoteUnit;
  topic: NoteTopic;
}

/** Every key term, A to Z. `q` matches the term or its definition. */
export function glossary(opts: { subject?: string; level?: Level; q?: string } = {}): GlossaryEntry[] {
  const needle = (opts.q ?? '').trim().toLowerCase();
  const out: GlossaryEntry[] = [];
  for (const subject of NOTE_SUBJECTS) {
    if (opts.subject && subject.id !== opts.subject) continue;
    for (const unit of unitsAt(subject, opts.level ?? 'all'))
      for (const topic of unit.topics)
        for (const k of topic.terms) {
          if (needle && !`${k.t} ${plain(k.d)}`.toLowerCase().includes(needle)) continue;
          out.push({ term: k.t, def: k.d, subject, unit, topic });
        }
  }
  return out.sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
}

/** The letter an entry files under; anything not a letter goes under #. */
export const letterOf = (term: string) => {
  const c = term.replace(/^[^A-Za-z0-9]+/, '').charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
};

// ── tips and mistakes ──

export interface Callout {
  kind: 'tip' | 'trap';
  text: string;
  unit: NoteUnit;
  topic: NoteTopic;
  section: string;
}

export function calloutsOf(s: NoteSubject, level: Level = 'all', kind?: 'tip' | 'trap'): Callout[] {
  const out: Callout[] = [];
  for (const unit of unitsAt(s, level))
    for (const topic of unit.topics)
      for (const sec of topic.sections)
        for (const b of sec.body) if (typeof b !== 'string' && (b.k === 'tip' || b.k === 'trap') && (!kind || b.k === kind)) out.push({ kind: b.k, text: b.t, unit, topic, section: sec.title });
  return out;
}

// ── what to do next ──

export interface NextUp {
  subject: NoteSubject;
  topic: NoteTopic;
  /** Sections ticked so far. */
  read: number;
  total: number;
}

/** For each subject, the first topic at this level not yet fully understood: one started first. */
export function nextUp(read: ReadonlyMap<string, ReadonlySet<string>>, level: Level = 'as'): NextUp[] {
  const out: NextUp[] = [];
  for (const subject of NOTE_SUBJECTS) {
    const open = unitsAt(subject, level)
      .flatMap((u) => u.topics)
      .map((topic) => {
        const ids = ['terms', ...topic.sections.map((s) => s.id)];
        const done = read.get(topic.id);
        return { subject, topic, read: done ? ids.filter((id) => done.has(id)).length : 0, total: ids.length };
      })
      .filter((x) => x.read < x.total);
    const started = open.find((x) => x.read > 0);
    if (started ?? open[0]) out.push(started ?? open[0]);
  }
  return out;
}

export const countTopics = (level: Level) => NOTE_SUBJECTS.reduce((a, s) => a + (level === 'all' ? topicsOf(s).length : unitsAt(s, level).reduce((n, u) => n + u.topics.length, 0)), 0);
