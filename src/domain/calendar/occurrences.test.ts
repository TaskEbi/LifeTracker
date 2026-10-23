import { describe, expect, it } from 'vitest';
import type { LtEvent } from '../../data/types';
import { cancelFuture, cancelOne, changeFuture, changeOne, conflicts, matchDone, occurrences, restoreOne } from './occurrences';

const ev = (p: Partial<LtEvent>): LtEvent => ({
  id: p.id ?? 'e', title: 'Event', section: null, kind: 'session', date: '2026-09-01', start: '07:00', end: '08:00',
  repeat: null, exceptions: {}, note: null, data: {}, cancelled_at: null,
  created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', deleted_at: null, ...p,
});

// Volleyball: Tuesday and Thursday mornings (Monday = 0), busy season until 27 Nov.
const vb = ev({ id: 'vb', title: 'Volleyball', section: 'sports', repeat: { days: [1, 3], until: '2026-11-27' } });

describe('weekly repeats', () => {
  it('lands on the chosen weekdays from the first day until the end date', () => {
    const occ = occurrences([vb], '2026-10-19', '2026-10-25');
    expect(occ.map((o) => o.date)).toEqual(['2026-10-20', '2026-10-22']);
    expect(occurrences([vb], '2026-11-30', '2026-12-06')).toEqual([]);
    expect(occurrences([vb], '2026-08-24', '2026-08-31')).toEqual([]);
  });

  it('cancels one occurrence without touching the others', () => {
    const occ = occurrences([cancelOne(vb, '2026-10-27')], '2026-10-26', '2026-11-01');
    expect(occ.map((o) => [o.date, o.cancelled])).toEqual([['2026-10-27', true], ['2026-10-29', false]]);
    const back = occurrences([restoreOne(cancelOne(vb, '2026-10-27'), '2026-10-27')], '2026-10-26', '2026-11-01');
    expect(back.every((o) => !o.cancelled)).toBe(true);
  });

  it('moves one occurrence to another day, keeping its identity', () => {
    const moved = changeOne(vb, '2026-10-27', { date: '2026-10-28', start: '16:00', end: '17:00' });
    const occ = occurrences([moved], '2026-10-26', '2026-11-01');
    expect(occ.map((o) => [o.key, o.date, o.start, o.changed])).toEqual([
      ['vb@2026-10-27', '2026-10-28', '16:00', true],
      ['vb@2026-10-29', '2026-10-29', '07:00', false],
    ]);
  });

  it('shows an occurrence moved into the range from outside it', () => {
    const moved = changeOne(vb, '2026-10-22', { date: '2026-10-26', start: '07:00', end: '08:00' });
    expect(occurrences([moved], '2026-10-26', '2026-10-26').map((o) => o.key)).toEqual(['vb@2026-10-22']);
  });

  it('splits the series for "this and later" with the new weekday and times', () => {
    const [ended, next] = changeFuture(vb, '2026-11-03', { date: '2026-11-04', start: '15:30', end: '17:00' }, 'vb2');
    expect(ended.repeat!.until).toBe('2026-11-02');
    expect(next.repeat!.days).toEqual([2, 4]);
    const occ = occurrences([ended, next], '2026-10-26', '2026-11-08');
    expect(occ.map((o) => `${o.date} ${o.start}`)).toEqual(['2026-10-27 07:00', '2026-10-29 07:00', '2026-11-04 15:30', '2026-11-06 15:30']);
  });

  it('ends the series from an occurrence on', () => {
    const occ = occurrences([cancelFuture(vb, '2026-10-29')], '2026-10-19', '2026-11-08');
    expect(occ.map((o) => o.date)).toEqual(['2026-10-20', '2026-10-22', '2026-10-27']);
  });
});

describe('conflicts', () => {
  it('flags overlapping timed events and nothing else', () => {
    const lesson = ev({ id: 'l', title: 'Violin lesson', date: '2026-10-29', start: '16:00', end: '16:45' });
    const tennis = ev({ id: 't', title: 'Tennis', date: '2026-10-29', start: '16:30', end: '17:30' });
    const orch = ev({ id: 'o', title: 'Orchestra', date: '2026-10-29', start: '17:30', end: '19:00' });
    const allDay = ev({ id: 'a', title: 'Tournament', date: '2026-10-29', start: null, end: null });
    const c = conflicts(occurrences([lesson, tennis, orch, allDay], '2026-10-29', '2026-10-29'));
    expect(Object.fromEntries(c)).toEqual({ 'l@2026-10-29': ['Tennis'], 't@2026-10-29': ['Violin lesson'] });
  });

  it('ignores cancelled occurrences', () => {
    const a = ev({ id: 'a', date: '2026-10-29', start: '16:00', end: '17:00' });
    const b = cancelOne(ev({ id: 'b', date: '2026-10-29', start: '16:30', end: '17:00' }), '2026-10-29');
    expect(conflicts(occurrences([a, b], '2026-10-29', '2026-10-29')).size).toBe(0);
  });
});

describe('planned vs done', () => {
  it('marks past sessions done only when that section logged something that day', () => {
    const occ = occurrences([vb], '2026-10-19', '2026-10-25');
    const logged = new Map([['2026-10-20', new Set(['sports'])]]);
    const status = matchDone(occ, logged, '2026-10-24');
    expect([...status.values()]).toEqual(['done', 'unlogged']);
  });
});
