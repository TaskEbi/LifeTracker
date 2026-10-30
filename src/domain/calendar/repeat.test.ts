import { describe, expect, it } from 'vitest';
import type { LtEvent, Repeat } from '../../data/types';
import { changeFuture, occurrences } from './occurrences';
import { checkRepeat, nextTaskDue, nthOn, repeatLabel, repeatsOn } from './repeat';

const ev = (p: Partial<LtEvent>): LtEvent => ({
  id: p.id ?? 'e', title: 'Event', section: null, kind: 'session', date: '2026-11-03', start: '07:00', end: '08:00',
  repeat: null, exceptions: {}, note: null, data: {}, cancelled_at: null,
  created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', deleted_at: null, ...p,
});
const dates = (e: LtEvent, from: string, to: string) => occurrences([e], from, to).map((o) => o.date);
const r = (p: Partial<Repeat>): Repeat => ({ days: [], until: null, ...p });

describe('repeat rules', () => {
  it('treats an old rule with only days as weekly, every week', () => {
    const old = ev({ repeat: { days: [1, 3], until: null } }); // Tue 3 Nov 2026, Tue + Thu
    expect(dates(old, '2026-11-02', '2026-11-15')).toEqual(['2026-11-03', '2026-11-05', '2026-11-10', '2026-11-12']);
  });

  it('repeats every other week on the chosen days, counted from the first week', () => {
    const e = ev({ repeat: r({ freq: 'weekly', every: 2, days: [1, 4] }) });
    expect(dates(e, '2026-11-02', '2026-11-29')).toEqual(['2026-11-03', '2026-11-06', '2026-11-17', '2026-11-20']);
  });

  it('repeats every n days', () => {
    const e = ev({ repeat: r({ freq: 'daily', every: 3 }) });
    expect(dates(e, '2026-11-01', '2026-11-12')).toEqual(['2026-11-03', '2026-11-06', '2026-11-09', '2026-11-12']);
  });

  it('repeats monthly on the same date, skipping months without it', () => {
    const e = ev({ date: '2026-10-31', repeat: r({ freq: 'monthly' }) });
    expect(dates(e, '2026-10-01', '2027-01-31')).toEqual(['2026-10-31', '2026-12-31', '2027-01-31']);
  });

  it('repeats monthly on the nth or last weekday', () => {
    const second = r({ freq: 'monthly', by: 'weekday' }); // Tue 10 Nov 2026 is the 2nd Tuesday
    expect(repeatsOn(second, '2026-11-10', '2026-12-08')).toBe(true);
    expect(repeatsOn(second, '2026-11-10', '2026-12-15')).toBe(false);
    // Fri 30 Oct 2026 is the 5th (last) Friday: next is the last Friday of November, the 27th.
    expect(nthOn(second, '2026-10-30', 2)).toBe('2026-11-27');
    expect(repeatLabel(second, '2026-10-30')).toBe('Monthly on the last Fri');
  });

  it('repeats yearly, every n years', () => {
    const e = r({ freq: 'yearly', every: 2 });
    expect(repeatsOn(e, '2026-03-05', '2028-03-05')).toBe(true);
    expect(repeatsOn(e, '2026-03-05', '2027-03-05')).toBe(false);
  });

  it('turns "after n times" into a last day', () => {
    expect(nthOn(r({ freq: 'weekly', days: [0, 2] }), '2026-11-02', 5)).toBe('2026-11-16');
  });

  it('describes rules in words', () => {
    expect(repeatLabel(r({ freq: 'weekly', days: [0, 1, 2, 3, 4] }), '2026-11-02')).toBe('Weekdays');
    expect(repeatLabel(r({ freq: 'weekly', every: 2, days: [3, 1] }), '2026-11-03')).toBe('Every 2 weeks on Tue, Thu');
    expect(repeatLabel(r({ freq: 'monthly' }), '2026-11-22')).toBe('Monthly on the 22nd');
    expect(repeatLabel(r({ freq: 'daily', every: 3 }), '2026-11-03')).toBe('Every 3 days');
  });

  it('refuses rules that never land', () => {
    expect(checkRepeat(r({ freq: 'weekly' }), '2026-11-03')).toMatch(/at least one day/);
    expect(checkRepeat(r({ freq: 'daily', every: 0 }), '2026-11-03')).toMatch(/1 to 99/);
    expect(checkRepeat(r({ freq: 'daily', until: '2026-11-01' }), '2026-11-03')).toMatch(/ends before/);
    expect(checkRepeat(r({ freq: 'monthly' }), '2026-11-03')).toBeNull();
  });

  it('splits an every-2-weeks series without losing its rhythm', () => {
    const e = ev({ repeat: r({ freq: 'weekly', every: 2, days: [1] }) });
    const [ended, next] = changeFuture(e, '2026-11-17', { date: '2026-11-18', start: '09:00', end: '10:00' }, 'n');
    expect(occurrences([ended, next], '2026-11-02', '2026-12-31').map((o) => o.date)).toEqual(['2026-11-03', '2026-11-18', '2026-12-02', '2026-12-16', '2026-12-30']);
  });
});

describe('repeating tasks', () => {
  const weekly = r({ freq: 'weekly', days: [4] }); // Fridays

  it('comes back on the next matching day after today', () => {
    expect(nextTaskDue(weekly, '2026-11-06', '2026-11-04')).toBe('2026-11-13'); // done early
    expect(nextTaskDue(weekly, '2026-10-23', '2026-11-04')).toBe('2026-11-06'); // done late: no backlog
    expect(nextTaskDue(r({ freq: 'daily' }), '2026-11-01', '2026-11-04')).toBe('2026-11-05');
  });

  it('stops after its last day', () => {
    expect(nextTaskDue({ ...weekly, until: '2026-11-10' }, '2026-11-06', '2026-11-06')).toBeNull();
  });
});
