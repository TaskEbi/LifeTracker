/**
 * Study notes: the subjects, their topics, and progress through them. The content is static;
 * what you have ticked as understood is kept in `nt_read` records (see features/notes/actions).
 */
import { CS } from './content/cs';
import { FURTHER } from './content/further';
import { MATHS } from './content/maths';
import { PHYSICS } from './content/physics';
import { plain } from './markup';
import type { Block, NoteSubject, NoteTopic, NoteUnit, SubjectId } from './types';

export const NOTE_SUBJECTS: NoteSubject[] = [PHYSICS, MATHS, FURTHER, CS];

export const subjectById = (id: string): NoteSubject | undefined => NOTE_SUBJECTS.find((s) => s.id === id);
export const topicsOf = (s: NoteSubject): NoteTopic[] => s.units.flatMap((u) => u.topics);

export interface TopicRef {
  subject: NoteSubject;
  unit: NoteUnit;
  topic: NoteTopic;
  /** Position among the subject's topics. */
  index: number;
}

export function findTopic(subject: SubjectId | string, topicId: string): TopicRef | undefined {
  const s = subjectById(subject);
  if (!s) return undefined;
  let index = 0;
  for (const unit of s.units)
    for (const topic of unit.topics) {
      if (topic.id === topicId) return { subject: s, unit, topic, index };
      index++;
    }
  return undefined;
}

/** The ids a topic's ticks use: the key terms, then each section. */
export const TERMS_ID = 'terms';
export const sectionIds = (t: NoteTopic): string[] => [TERMS_ID, ...t.sections.map((s) => s.id)];

export interface Progress {
  read: number;
  total: number;
  pct: number;
}

/** `read` holds the section ids ticked for this topic; ids no longer in the topic are ignored. */
export function topicProgress(t: NoteTopic, read: ReadonlySet<string> | undefined): Progress {
  const ids = sectionIds(t);
  const n = read ? ids.filter((id) => read.has(id)).length : 0;
  return { read: n, total: ids.length, pct: Math.round((n / ids.length) * 100) };
}

export function subjectProgress(s: NoteSubject, read: ReadonlyMap<string, ReadonlySet<string>>): Progress & { topics: number; done: number } {
  let n = 0;
  let total = 0;
  let done = 0;
  const all = topicsOf(s);
  for (const t of all) {
    const p = topicProgress(t, read.get(t.id));
    n += p.read;
    total += p.total;
    if (p.read === p.total) done++;
  }
  return { read: n, total, pct: total ? Math.round((n / total) * 100) : 0, topics: all.length, done };
}

/** Rough reading time in minutes, from the amount of text. */
export function minutesOf(t: NoteTopic): number {
  const words = (s: string) => plain(s).split(/\s+/).length;
  const block = (b: Block): number => {
    if (typeof b === 'string') return words(b);
    switch (b.k) {
      case 'ul':
      case 'ol':
        return b.items.reduce((a, x) => a + words(x), 0);
      case 'f':
        return b.lines.length * 6;
      case 'tbl':
        return b.rows.flat().reduce((a, x) => a + words(x), 0);
      case 'code':
        return b.t.split('\n').length * 5;
      case 'fig':
        return 20 + words(b.cap);
      default:
        return words(b.t);
    }
  };
  const total = t.terms.reduce((a, k) => a + words(k.d) + 2, 0) + t.sections.reduce((a, s) => a + s.body.reduce((x, b) => x + block(b), 0), 0);
  return Math.max(2, Math.round(total / 130));
}

export interface SearchHit {
  subject: NoteSubject;
  topic: NoteTopic;
  /** The key term matched, if the match was a term rather than the topic. */
  term?: string;
}

/** Topics and key terms matching a query, topics first. */
export function searchNotes(q: string, limit = 12): SearchHit[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  const topics: SearchHit[] = [];
  const terms: SearchHit[] = [];
  for (const subject of NOTE_SUBJECTS)
    for (const topic of topicsOf(subject)) {
      if (`${topic.title} ${topic.covers}`.toLowerCase().includes(needle)) topics.push({ subject, topic });
      for (const k of topic.terms) if (k.t.toLowerCase().includes(needle)) terms.push({ subject, topic, term: k.t });
    }
  return [...topics, ...terms].slice(0, limit);
}

export type { Block, FigId, NoteSection, NoteSubject, NoteTopic, NoteUnit, SubjectId } from './types';
