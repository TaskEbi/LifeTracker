import { describe, expect, it } from 'vitest';
import { findTopic, minutesOf, NOTE_SUBJECTS, searchNotes, sectionIds, subjectProgress, topicProgress, topicsOf } from './index';
import { parseInline, plain } from './markup';
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
  it('covers the four subjects and every AS unit', () => {
    expect(NOTE_SUBJECTS.map((s) => s.name)).toEqual(['Physics', 'Maths', 'Further Maths', 'Computer Science']);
    expect(NOTE_SUBJECTS.flatMap((s) => s.units.map((u) => u.code))).toEqual(['WPH11', 'WPH12', 'WPH13', 'WMA11', 'WMA12', 'WME01', 'WST01', 'WFM01', 'Paper 1', 'Paper 2']);
    expect(topicsOf(NOTE_SUBJECTS[3])).toHaveLength(12);
    expect(all.length).toBeGreaterThanOrEqual(60);
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
    expect(p.topics).toBe(16);
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
