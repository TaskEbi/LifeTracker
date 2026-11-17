/**
 * Computer Science is arranged by the 9618 syllabus topics (1 to 20) rather than by paper. Each
 * topic is a unit, and its pages follow the decks of class slides: a page's `ref` is the slide
 * number ("9618 · 2.1.3"), and the number before the first dot says which topic it belongs to.
 * A topic without slides yet has a single page.
 */
import type { NoteTopic, NoteUnit } from '../../types';

/** The syllabus names of the twenty topics. */
export const CS_TOPIC_NAMES: Record<number, string> = {
  1: 'Information Representation',
  2: 'Communication',
  3: 'Hardware',
  4: 'Processor Fundamentals',
  5: 'System Software',
  6: 'Security, Privacy and Data Integrity',
  7: 'Ethics and Ownership',
  8: 'Databases',
  9: 'Algorithm Design and Problem-solving',
  10: 'Data Types and Structures',
  11: 'Programming',
  12: 'Software Development',
  13: 'Data Representation',
  14: 'Communication and Internet Technologies',
  15: 'Hardware and Virtual Machines',
  16: 'System Software',
  17: 'Security',
  18: 'Artificial Intelligence',
  19: 'Computational Thinking and Problem-solving',
  20: 'Further Programming',
};

/** The topic number a page belongs to, from its ref ("9618 · 2.1.3" → 2). */
export function topicNumber(page: NoteTopic): number {
  const m = /9618 · (\d+)/.exec(page.ref);
  if (!m) throw new Error(`No topic number in ${page.id}: ${page.ref}`);
  return Number(m[1]);
}

/** One unit per syllabus topic, in order, holding its pages in the order given. */
export function topicUnits(pages: NoteTopic[], a2 = false): NoteUnit[] {
  const units: NoteUnit[] = [];
  for (const page of pages) {
    const n = topicNumber(page);
    let unit = units.find((u) => u.id === `t${n}`);
    if (!unit) {
      unit = { id: `t${n}`, code: `Topic ${n}`, name: CS_TOPIC_NAMES[n] ?? page.title, a2: a2 || undefined, topics: [] };
      units.push(unit);
    }
    unit.topics.push(page);
  }
  return units.sort((x, y) => Number(x.id.slice(1)) - Number(y.id.slice(1)));
}
