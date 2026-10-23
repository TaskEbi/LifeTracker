import { describe, expect, it } from 'vitest';
import type { LogEntry } from '../../data/types';
import { bests, paceOf, type SportSession } from './model';

const s = (date: string, minutes: number, sport: SportSession['detail'] & object): SportSession => ({ entry: { id: date + sport.sport + minutes, date, minutes } as LogEntry, detail: sport });

describe('sports', () => {
  it('works out pace and speed', () => {
    expect(paceOf('running', 41, 7.4)).toBe('5:32 /km');
    expect(paceOf('cycling', 62, 24.5)).toBe('23.7 km/h');
    expect(paceOf('swimming', 34, 1.5)).toBe('2:16 /100 m');
    expect(paceOf('running', 41, undefined)).toBeNull();
  });

  it('finds bests from the records, ignoring short efforts for pace', () => {
    const list = [s('2026-10-22', 41, { sport: 'running', km: 7.4 }), s('2026-10-18', 63, { sport: 'running', km: 11.2 }), s('2026-10-10', 10, { sport: 'running', km: 2.5 })];
    expect(bests(list)).toEqual([
      { sport: 'running', label: 'Longest', value: '11.2 km', date: '2026-10-18' },
      { sport: 'running', label: 'Fastest (5+ km)', value: '5:32 /km', date: '2026-10-22' },
    ]);
  });
});
