import { describe, expect, it } from 'vitest';
import type { LtRecord } from '../../data/types';
import {
  harvard,
  logAsText,
  logOf,
  milestoneOf,
  milestoneState,
  minutesByWeek,
  paceOf,
  plannedMilestones,
  projectOf,
  quietDays,
  referenceList,
  sortMilestones,
  sourceOf,
  wordHistory,
  wordsOf,
  type Source,
} from './model';

const rec = (data: Record<string, unknown>, id = 'r', sort_order = 1): LtRecord => ({ id, section: 'study', kind: 'k', data, sort_order, archived_at: null, created_at: '2026-10-01T00:00:00Z', updated_at: '', deleted_at: null });
const src = (over: Partial<Source>): Source => ({ id: 's', title: 'T', author: '', year: '', type: 'Other', publisher: '', url: '', accessed: null, notes: '', trust: 2, used: true, ...over });

describe('epq', () => {
  it('reads the project with sensible defaults', () => {
    const p = projectOf(rec({ title: 'Should AI mark exams?', deadline: '2027-04-30', wordTarget: -3, subject: '  ' }));
    expect(p).toMatchObject({ title: 'Should AI mark exams?', deadline: '2027-04-30', wordTarget: 5000, hoursTarget: 120, subject: 'EPQ' });
    expect(projectOf(rec({ deadline: '30/04/2027' })).deadline).toBeNull();
  });

  it('spreads the usual milestones up to the deadline and sorts by date', () => {
    const plan = plannedMilestones('2026-11-09', '2027-05-08');
    expect(plan).toHaveLength(8);
    expect(plan[0].due >= '2026-11-09').toBe(true);
    expect(plan[plan.length - 1]).toEqual({ title: 'Hand in', due: '2027-05-08' });
    // without a deadline, half a year
    expect(plannedMilestones('2026-11-09', null).at(-1)!.due).toBe('2027-05-10');
    const list = [rec({ title: 'B', due: '2027-01-01' }, 'b', 1), rec({ title: 'A' }, 'a', 2), rec({ title: 'C', due: '2026-12-01' }, 'c', 3)].map(milestoneOf).filter((m) => m != null);
    expect(sortMilestones(list).map((m) => m.title)).toEqual(['C', 'B', 'A']);
    expect(milestoneOf(rec({ title: '  ' }))).toBeNull();
  });

  it('says whether a milestone is late, soon or done', () => {
    const m = (due: string | null, done: string | null = null) => ({ id: 'm', title: 'x', due, done, order: 1 });
    expect(milestoneState(m('2026-11-01'), '2026-11-09')).toBe('late');
    expect(milestoneState(m('2026-11-23'), '2026-11-09')).toBe('soon');
    expect(milestoneState(m('2026-11-24'), '2026-11-09')).toBe('later');
    expect(milestoneState(m(null), '2026-11-09')).toBe('undated');
    expect(milestoneState(m('2026-11-01', '2026-10-30'), '2026-11-09')).toBe('done');
  });

  it('keeps log entries tidy and writes the log out oldest first', () => {
    expect(logOf(rec({ text: '   ', date: '2026-11-09' }))).toBeNull();
    expect(logOf(rec({ text: 'Picked a question', date: '2026-11-09', kind: 'Rant' }))?.kind).toBe('Progress');
    const a = logOf(rec({ text: 'Narrowed to GCSE marking', date: '2026-11-12', kind: 'Decision', next: 'Email Ms Lee' }, 'a'))!;
    const b = logOf(rec({ text: 'Read three papers', date: '2026-11-09' }, 'b'))!;
    const text = logAsText([a, b], { title: 'AI marking' });
    expect(text.startsWith('Production log: AI marking')).toBe(true);
    expect(text.indexOf('9 November 2026')).toBeLessThan(text.indexOf('12 November 2026'));
    expect(text).toContain('Next: Email Ms Lee');
  });

  it('writes Harvard-style references and lists only used sources, by author', () => {
    expect(harvard(src({ title: 'Thinking, Fast and Slow', author: 'Kahneman, D.', year: '2011', type: 'Book', publisher: 'Penguin' }))).toBe('Kahneman, D. (2011) *Thinking, Fast and Slow*. Penguin.');
    expect(harvard(src({ title: 'Marking at scale', publisher: 'Ofqual', url: 'https://ofqual.gov.uk/x', accessed: '2026-11-09', type: 'Report' }))).toBe('Ofqual (n.d.) *Marking at scale*. Available at: https://ofqual.gov.uk/x (Accessed: 9 November 2026).');
    const list = referenceList([src({ title: 'Z', author: 'Young' }), src({ title: 'A', author: 'Adams' }), src({ title: 'Unused', author: 'Aaron', used: false })]);
    expect(list.map((r) => r.slice(0, 5))).toEqual(['Adams', 'Young']);
    expect(sourceOf(rec({ title: 'x', trust: 9, type: 'Podcast' }))).toMatchObject({ trust: 2, type: 'Other' });
  });

  it('keeps one word count per day, the latest', () => {
    const w = [rec({ date: '2026-11-02', words: 400 }), rec({ date: '2026-11-01', words: 100 }), rec({ date: '2026-11-02', words: 650 }), rec({ date: 'x', words: 3 })].map(wordsOf).filter((x) => x != null);
    expect(wordHistory(w)).toEqual([{ date: '2026-11-01', words: 100 }, { date: '2026-11-02', words: 650 }]);
  });

  it('works out the pace needed and whether you are ahead of an even pace', () => {
    // 100 days from start to deadline, 50 gone, 2000 of 5000 written: 500 behind
    const p = paceOf(2000, 5000, '2026-02-20', '2026-04-11', '2026-01-01');
    expect(p.expected).toBe(2500);
    expect(p.ahead).toBe(-500);
    expect(p.days).toBe(50);
    expect(p.perWeek).toBe(420);
    expect(paceOf(5200, 5000, '2026-02-20', '2026-04-11', null)).toMatchObject({ pct: 1, left: 0, perWeek: 0, expected: null });
    expect(paceOf(10, 120, '2026-02-20', null, null)).toMatchObject({ days: null, perWeek: null });
  });

  it('adds minutes per week and counts quiet days', () => {
    const w = minutesByWeek([{ date: '2026-11-09', minutes: 30 }, { date: '2026-11-08', minutes: 45 }, { date: '2026-11-02', minutes: 15 }, { date: '2026-08-01', minutes: 99 }], '2026-11-10', 3);
    expect(w).toEqual([{ monday: '2026-10-26', minutes: 0 }, { monday: '2026-11-02', minutes: 60 }, { monday: '2026-11-09', minutes: 30 }]);
    expect(quietDays('2026-11-10', ['2026-11-01', '2026-11-07'])).toBe(3);
    expect(quietDays('2026-11-10', [])).toBeNull();
  });
});
