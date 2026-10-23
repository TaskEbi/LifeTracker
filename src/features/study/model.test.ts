import { describe, expect, it } from 'vitest';
import type { LogEntry, LtRecord } from '../../data/types';
import { markOf, minutesBySubject, subjectMarks, subjectsOf, topicOf, type Mark, type StudySession } from './model';

const rec = (data: Record<string, unknown>): LtRecord => ({ id: 'r', section: 'study', kind: 'k', data, sort_order: 1, archived_at: null, created_at: '2026-10-01T00:00:00Z', updated_at: '', deleted_at: null });
const m = (subject: string, score: number, date: string): Mark => ({ id: date, subject, title: '', score, outOf: 50, date });

describe('study', () => {
  it('falls back to the default subjects and drops junk', () => {
    expect(subjectsOf(null)).toContain('Further Maths');
    expect(subjectsOf(['Physics', ' Physics ', 3, ''])).toEqual(['Physics']);
  });

  it('reads marks and topics defensively', () => {
    expect(markOf(rec({ subject: 'Physics', score: 41, outOf: 0 }))).toBeNull();
    expect(markOf(rec({ subject: 'Physics', score: 41, outOf: 50 }))).toMatchObject({ date: '2026-10-01', score: 41 });
    expect(topicOf(rec({ subject: 'Maths', name: 'Integration by parts', level: 7 }))?.level).toBe(2);
  });

  it('averages recent marks and shows the latest change', () => {
    const r = subjectMarks([m('Maths', 40, '2026-10-01'), m('Maths', 45, '2026-10-10'), m('Physics', 20, '2026-10-05')], 'Maths');
    expect(r).toEqual({ avg: 85, trend: 10, n: 2 });
    expect(subjectMarks([], 'Maths').avg).toBeNull();
  });

  it('adds minutes per subject within the range', () => {
    const s = (date: string, minutes: number, subject?: string): StudySession => ({ entry: { id: date + minutes, date, minutes } as LogEntry, detail: subject ? { subject } : null });
    const out = minutesBySubject([s('2026-10-20', 30, 'Maths'), s('2026-10-21', 45, 'Maths'), s('2026-10-21', 20), s('2026-10-01', 90, 'Maths')], '2026-10-19', '2026-10-25');
    expect([...out]).toEqual([['Maths', 75], ['Other', 20]]);
  });
});
