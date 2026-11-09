import { describe, expect, it } from 'vitest';
import type { CheckIn } from '../hq/checkin';
import { averages, bestAndHard, checkInStreak, series, tagEffects, weekdayMoods, weekOnWeek } from './patterns';

const c = (date: string, mood: number, energy: number | null = null, stress: number | null = null, tags: string[] = []): CheckIn => ({ date, mood, energy, stress, tags, note: '' });

describe('mood patterns', () => {
  const list = [c('2026-11-01', 2, 2, 5, ['Exams']), c('2026-11-02', 3, 3, 4, ['Exams']), c('2026-11-03', 4, 4, 2, ['Friends']), c('2026-11-04', 5, 4, 1, ['Friends']), c('2026-11-05', 2, 1, 5, ['Exams']), c('2026-11-06', 4, null, null, ['Friends']), c('2026-11-08', 3)];

  it('averages what was given and ignores gaps', () => {
    const a = averages(list, '2026-11-05', '2026-11-08');
    expect(a.n).toBe(3);
    expect(a.mood).toBe(3);
    expect(a.energy).toBe(1);
    expect(a.stress).toBe(5);
    expect(averages([], '2026-01-01', '2026-01-02').mood).toBeNull();
  });

  it('compares the last week with the one before', () => {
    const w = weekOnWeek(list, '2026-11-08');
    expect(w.now.n).toBe(6);
    expect(w.before.n).toBe(1);
  });

  it('counts the streak from today or yesterday', () => {
    expect(checkInStreak(list, '2026-11-08')).toBe(1);
    expect(checkInStreak(list, '2026-11-09')).toBe(1);
    expect(checkInStreak(list, '2026-11-07')).toBe(6);
    expect(checkInStreak(list, '2026-11-11')).toBe(0);
  });

  it('draws a series with gaps', () => {
    const s = series(list, '2026-11-08', 3);
    expect(s.map((p) => p.mood)).toEqual([4, null, 3]);
  });

  it('finds what goes with good and bad days', () => {
    const t = tagEffects(list);
    expect(t.map((x) => x.tag)).toEqual(['Friends', 'Exams']);
    expect(t[1].mood).toBeCloseTo(7 / 3);
    expect(t[1].stress).toBeCloseTo(14 / 3);
    expect(tagEffects(list, 4)).toEqual([]);
  });

  it('picks best and hardest days once there are enough', () => {
    const { best, hard } = bestAndHard(list, 2);
    expect(best.map((x) => x.date)).toEqual(['2026-11-04', '2026-11-03']);
    expect(hard.map((x) => x.date)).toEqual(['2026-11-05', '2026-11-01']);
    expect(bestAndHard(list.slice(0, 3), 2).best).toEqual([]);
  });

  it('averages by weekday, Monday first', () => {
    const w = weekdayMoods([c('2026-11-09', 4, null, 2), c('2026-11-16', 2)]);
    expect(w.mood[0]).toBe(3);
    expect(w.stress[0]).toBe(2);
    expect(w.mood[1]).toBeNull();
  });
});
