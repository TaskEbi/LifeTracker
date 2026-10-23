import { describe, expect, it } from 'vitest';
import type { LogEntry } from '../../data/types';
import { checkSession, dayGrid, itemStats, weekTotals, type Session, type ViolinDetail } from './model';

const T = '2026-10-24';
let n = 0;
const s = (date: string, minutes: number, detail: ViolinDetail | null = null): Session => ({
  entry: { id: `e${++n}`, date, minutes, topic_id: 'v', subcategory_id: null, note: null, created_at: date, updated_at: date, deleted_at: null } as LogEntry,
  detail,
});

describe('violin statistics come from the records', () => {
  const sessions = [
    s('2026-10-22', 45, { type: 'lesson', pieces: ['bruch'], scales: ['g'] }),
    s('2026-10-22', 90, { type: 'orchestra', pieces: ['dvorak'], scales: [] }),
    s('2026-10-21', 40, { type: 'solo', pieces: ['bruch', 'bach'], scales: ['g'], split: { bruch: 20, g: 10 } }),
    s('2026-10-12', 30), // logged in Curio Cabinet, no detail
    s('2026-10-25', 30), // tomorrow: not counted
  ];

  it('totals weeks, by type, with entries from Curio Cabinet as unspecified', () => {
    const w = weekTotals(sessions, T, 3);
    expect(w.map((x) => [x.week, x.minutes])).toEqual([['2026-10-05', 0], ['2026-10-12', 30], ['2026-10-19', 175]]);
    expect(w[2].byType).toEqual({ lesson: 45, orchestra: 90, solo: 40 });
    expect(w[1].byType).toEqual({ unspecified: 30 });
  });

  it('only reports per-piece minutes where the session was split', () => {
    expect(itemStats(sessions, 'bruch')).toEqual({ sessions: 2, last: '2026-10-22', preciseMinutes: 20, preciseSessions: 1 });
    expect(itemStats(sessions, 'bach')).toEqual({ sessions: 1, last: '2026-10-21', preciseMinutes: 0, preciseSessions: 0 });
  });

  it('lays out the last days oldest first', () => {
    const g = dayGrid(sessions, T, 4);
    expect(g).toEqual([
      { date: '2026-10-21', minutes: 40 },
      { date: '2026-10-22', minutes: 135 },
      { date: '2026-10-23', minutes: 0 },
      { date: '2026-10-24', minutes: 0 },
    ]);
  });
});

describe('checking a session', () => {
  it('refuses future days, silly durations and an over-full split', () => {
    expect(checkSession({ minutes: 0, date: T }, T)).toMatch(/between 1 minute/);
    expect(checkSession({ minutes: 30, date: '2026-10-25' }, T)).toMatch(/hasn't happened/);
    expect(checkSession({ minutes: 30, date: T, split: { a: 20, b: 15 } }, T)).toMatch(/more than the 30 min/);
    expect(checkSession({ minutes: 30, date: T, split: { a: 20 } }, T)).toBeNull();
  });
});
