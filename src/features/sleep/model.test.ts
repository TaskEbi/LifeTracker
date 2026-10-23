import { describe, expect, it } from 'vitest';
import type { LogDayMetric, LtNight } from '../../data/types';
import { DEFAULT_SLEEP } from '../../domain/prefs';
import { durationOf, nightsFrom, sleepStats, windDownAt } from './model';

const m = (date: string, metric: LogDayMetric['metric'], minutes: number): LogDayMetric => ({ id: `${metric}${date}`, date, metric, minutes, created_at: '', updated_at: '', deleted_at: null });
const n = (date: string, bed: string, wake: string): LtNight => ({ id: `n${date}`, date, bed, wake, created_at: '', updated_at: '', deleted_at: null });

describe('sleep', () => {
  it('counts across midnight', () => {
    expect(durationOf('23:15', '08:00')).toBe(525);
    expect(durationOf('00:10', '08:40')).toBe(510);
  });

  it('joins durations from the Daily Log with times when there are any', () => {
    const nights = nightsFrom(
      [m('2026-10-22', 'sleep', 420), m('2026-10-23', 'sleep', 465), m('2026-10-23', 'sleep_score', 81)],
      [n('2026-10-23', '22:50', '06:35'), n('2026-10-20', '23:00', '07:00')],
    );
    expect(nights).toEqual([
      { date: '2026-10-22', minutes: 420, bed: null, wake: null, score: null },
      { date: '2026-10-23', minutes: 465, bed: '22:50', wake: '06:35', score: 81 },
    ]);
  });

  it('averages bedtimes either side of midnight and judges the right window', () => {
    const nights = nightsFrom(
      [m('2026-10-23', 'sleep', 460), m('2026-10-24', 'sleep', 500)],
      [n('2026-10-23', '23:40', '07:20'), n('2026-10-24', '00:20', '08:40')],
    );
    const s = sleepStats(nights, '2026-10-18', '2026-10-24', DEFAULT_SLEEP);
    expect(s.avgBed).toBe('00:00');
    expect(s.spread).toBe(20);
    // Fri 23: school night planned 22:45 (55 min late); Sat 24: weekend 23:30 (50 min late)
    expect(s.inWindow).toBe(0);
    expect(s.avgMinutes).toBe(480);
  });

  it('times the wind-down from the night ahead', () => {
    expect(windDownAt('2026-10-24', DEFAULT_SLEEP)).toBe('23:00'); // Saturday night: weekend plan
    expect(windDownAt('2026-10-25', DEFAULT_SLEEP)).toBe('22:15'); // Sunday night: school night
  });
});
