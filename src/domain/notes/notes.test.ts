import { describe, expect, it } from 'vitest';
import { findTopic, minutesOf, NOTE_SUBJECTS, searchNotes, sectionIds, subjectProgress, topicProgress, topicsOf } from './index';
import { parseInline, plain } from './markup';
import { calloutsOf, cardsOfTopic, CARD_STEPS, countTopics, deck, deckStats, formulasOf, glossary, gradeCard, letterOf, nextUp, sessionCards, unitsAt, type CardMark } from './tools';
import { titleLines, type Block } from './types';

const all = NOTE_SUBJECTS.flatMap((s) => topicsOf(s).map((t) => ({ s, t })));

/** Every string a block shows. */
const strings = (b: Block): string[] => {
  if (typeof b === 'string') return [b];
  switch (b.k) {
    case 'ul':
    case 'ol':
      return b.items;
    case 'f':
      return b.lines;
    case 'tbl':
      return [...b.head, ...b.rows.flat()];
    case 'code':
      return [];
    case 'fig':
      return [b.cap];
    default:
      return [b.t];
  }
};

describe('notes content', () => {
  it('covers the four subjects, every AS unit and then the A2 units', () => {
    expect(NOTE_SUBJECTS.map((s) => s.name)).toEqual(['Physics', 'Maths', 'Further Maths', 'Computer Science']);
    expect(NOTE_SUBJECTS.flatMap((s) => unitsAt(s, 'as').map((u) => u.code))).toEqual(['WPH11', 'WPH12', 'WPH13', 'WMA11', 'WMA12', 'WME01', 'WST01', 'WFM01', 'Paper 1', 'Paper 2']);
    expect(NOTE_SUBJECTS.flatMap((s) => unitsAt(s, 'a2').map((u) => u.code))).toEqual(['WPH14', 'WPH15', 'WPH16', 'WMA13', 'WMA14', 'WME02', 'WST02', 'WFM02', 'WFM03', 'Paper 3', 'Paper 4']);
    // within a subject the AS units come first
    for (const s of NOTE_SUBJECTS) expect(s.units.map((u) => !!u.a2)).toEqual([...unitsAt(s, 'as').map(() => false), ...unitsAt(s, 'a2').map(() => true)]);
    expect(topicsOf(NOTE_SUBJECTS[3])).toHaveLength(20);
    expect(countTopics('as')).toBe(64);
    expect(countTopics('a2')).toBe(all.length - 64);
    expect(countTopics('a2')).toBeGreaterThanOrEqual(55);
  });

  it('gives every topic a unique id, terms, a hook and at least two sections with unique ids', () => {
    expect(new Set(all.map((x) => x.t.id)).size).toBe(all.length);
    for (const { t } of all) {
      expect(t.terms.length, t.id).toBeGreaterThan(0);
      for (const k of t.terms) {
        expect(k.t, t.id).not.toBe('');
        expect(k.d.length, `${t.id} ${k.t}`).toBeGreaterThan(8);
      }
      expect(t.hook.length, t.id).toBeGreaterThan(5);
      expect(t.sections.length, t.id).toBeGreaterThanOrEqual(2);
      const ids = sectionIds(t);
      expect(new Set(ids).size, t.id).toBe(ids.length);
      expect(t.lines.join(' '), t.id).toBe(t.title);
      for (const s of t.sections) expect(s.body.length, `${t.id} ${s.id}`).toBeGreaterThan(0);
    }
  });

  it('has no stray markup left after parsing, and tables with full rows', () => {
    for (const { t } of all)
      for (const s of t.sections)
        for (const b of s.body) {
          for (const str of strings(b)) {
            const text = plain(str);
            expect(text, `${t.id}: ${str}`).not.toMatch(/\*\*|\^\{|_\{|`/);
          }
          if (typeof b !== 'string' && b.k === 'tbl') for (const r of b.rows) expect(r.length, `${t.id} ${s.id}`).toBe(b.head.length);
        }
  });

  it('finds topics, measures progress and estimates reading time', () => {
    const ref = findTopic('physics', 'ph-solids');
    expect(ref?.unit.code).toBe('WPH11');
    expect(findTopic('maths', 'ph-solids')).toBeUndefined();
    const t = ref!.topic;
    const ids = sectionIds(t);
    expect(topicProgress(t, undefined)).toEqual({ read: 0, total: ids.length, pct: 0 });
    expect(topicProgress(t, new Set([ids[0], 'gone'])).read).toBe(1);
    expect(topicProgress(t, new Set(ids)).pct).toBe(100);
    const p = subjectProgress(ref!.subject, new Map([[t.id, new Set(ids)]]));
    expect(p.done).toBe(1);
    expect(p.topics).toBe(31);
    expect(minutesOf(t)).toBeGreaterThanOrEqual(2);
  });

  it('searches titles, what a topic covers and key terms', () => {
    expect(searchNotes('young modulus')[0].topic.id).toBe('ph-solids');
    expect(searchNotes('foreign key').some((h) => h.term === 'Foreign key' && h.topic.id === 'cs-databases')).toBe(true);
    expect(searchNotes('x')).toEqual([]);
  });
});

describe('notes markup', () => {
  it('parses bold, code, powers and subscripts', () => {
    expect(parseInline('v^2 = u^2 + 2as')).toEqual(['v', { k: 'sup', c: ['2'] }, ' = u', { k: 'sup', c: ['2'] }, ' + 2as']);
    expect(parseInline('u_{n+1} and **x_1**')).toEqual(['u', { k: 'sub', c: ['n+1'] }, ' and ', { k: 'b', c: ['x', { k: 'sub', c: ['1'] }] }]);
    expect(parseInline('`a_b ^ c` stays')).toEqual([{ k: 'code', t: 'a_b ^ c' }, ' stays']);
    expect(parseInline('a ^ b and _c')).toEqual(['a ^ b and _c']);
    expect(plain('10^{−3} **m**')).toBe('10−3 m');
  });

  it('splits a title into two balanced lines', () => {
    expect(titleLines('Work, Energy and Power')).toEqual(['Work, Energy', 'and Power']);
    expect(titleLines('Quadratics')).toEqual(['Quadratics']);
  });
});

describe('notes tools', () => {
  const today = '2026-11-13';
  const physics = NOTE_SUBJECTS[0];

  it('makes a card for every key term and every section with formulas, with unique ids', () => {
    const cards = deck();
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
    expect(cards.filter((c) => c.kind === 'term')).toHaveLength(all.reduce((a, x) => a + x.t.terms.length, 0));
    for (const c of cards) {
      expect(c.id).toBe(`${c.topic.id}#${c.key}`);
      expect(c.front, c.id).not.toBe('');
      expect(c.back.length, c.id).toBeGreaterThan(0);
    }
    const ref = findTopic('physics', 'ph-solids')!;
    const solids = cardsOfTopic(ref.subject, ref.unit, ref.topic);
    expect(solids.some((c) => c.kind === 'term' && c.front === 'Stress')).toBe(true);
    expect(solids.some((c) => c.kind === 'formula')).toBe(true);
    expect(deck({ topic: 'ph-solids' })).toEqual(solids);
    expect(deck({ subject: 'physics', level: 'as' }).every((c) => !c.unit.a2 && c.subject.id === 'physics')).toBe(true);
    expect(deck({ subject: 'cs', level: 'a2', kind: 'term' }).every((c) => c.unit.a2 && c.kind === 'term')).toBe(true);
  });

  it('moves a card up a box when right and back to the first when wrong', () => {
    let m: CardMark | undefined;
    const due: string[] = [];
    for (let i = 0; i < 7; i++) {
      m = gradeCard(m, true, today);
      due.push(m.due);
    }
    expect(m!.box).toBe(5);
    expect(due.slice(0, 5)).toEqual(['2026-11-14', '2026-11-16', '2026-11-20', '2026-11-29', '2026-12-18']);
    expect(due[6]).toBe(due[4]);
    expect(CARD_STEPS).toHaveLength(5);
    expect(gradeCard(m, false, today)).toEqual({ box: 1, due: today });
    expect(gradeCard(undefined, false, today)).toEqual({ box: 1, due: today });
    expect(gradeCard({ box: 1, due: today }, true, today, true)).toEqual({ box: 1, due: '2026-11-14' });
  });

  it('counts a deck and picks a sitting: due first, then new, the least known first when cramming', () => {
    const cards = deck({ topic: 'ph-solids' });
    const [a, b, c] = cards;
    const marks = new Map<string, CardMark>([
      [a.id, { box: 3, due: '2026-11-20' }],
      [b.id, { box: 1, due: '2026-11-13' }],
      [c.id, { box: 2, due: '2026-11-01' }],
      ['gone#t-x', { box: 5, due: '2026-11-01' }],
    ]);
    expect(deckStats(cards, marks, today)).toEqual({ total: cards.length, fresh: cards.length - 3, due: 2, learning: 2, known: 1 });
    const sitting = sessionCards(cards, marks, today);
    expect(sitting.slice(0, 2).map((x) => x.id)).toEqual([c.id, b.id]);
    expect(sitting).not.toContain(a);
    expect(sitting).toHaveLength(cards.length - 1);
    expect(sessionCards(cards, marks, today, 'due', 3)).toHaveLength(3);
    const cram = sessionCards(cards, marks, today, 'all');
    expect(cram).toHaveLength(cards.length);
    expect(cram[cram.length - 1].id).toBe(a.id);
  });

  it('gathers the formula sheet, the glossary and the tips and mistakes', () => {
    const fs = formulasOf(physics, 'as');
    expect(fs.length).toBeGreaterThan(15);
    expect(fs.every((g) => !g.unit.a2 && g.lines.length > 0)).toBe(true);
    expect(formulasOf(physics).length).toBeGreaterThan(fs.length);

    const g = glossary();
    expect(g).toHaveLength(all.reduce((a, x) => a + x.t.terms.length, 0));
    expect(g.map((e) => e.term.toLowerCase())).toEqual([...g.map((e) => e.term.toLowerCase())].sort((x, y) => x.localeCompare(y, 'en', { sensitivity: 'base' })));
    expect(glossary({ q: 'young modulus' }).some((e) => e.topic.id === 'ph-solids')).toBe(true);
    expect(glossary({ subject: 'cs', level: 'a2' }).every((e) => e.subject.id === 'cs' && e.unit.a2)).toBe(true);
    expect(letterOf('Young modulus')).toBe('Y');
    expect(letterOf('3NF')).toBe('#');

    const traps = calloutsOf(physics, 'all', 'trap');
    expect(traps.length).toBeGreaterThan(10);
    expect(traps.every((c) => c.kind === 'trap')).toBe(true);
    expect(calloutsOf(physics).length).toBeGreaterThan(traps.length);
  });

  it('suggests the next topic per subject, a started one first', () => {
    const fresh = nextUp(new Map());
    expect(fresh.map((n) => n.topic.id)).toEqual(NOTE_SUBJECTS.map((s) => topicsOf(s)[0].id));
    const ref = findTopic('physics', 'ph-solids')!;
    const started = nextUp(new Map([[ref.topic.id, new Set(['terms'])]]));
    expect(started[0]).toMatchObject({ topic: ref.topic, read: 1 });
    const first = topicsOf(physics)[0];
    const done = nextUp(new Map([[first.id, new Set(sectionIds(first))]]));
    expect(done[0].topic.id).toBe(topicsOf(physics)[1].id);
    expect(nextUp(new Map(), 'a2')[0].topic.id).toBe(unitsAt(physics, 'a2')[0].topics[0].id);
  });
});
