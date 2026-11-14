import { describe, expect, it } from 'vitest';
import type { SectionId } from '../../data/types';
import { addDays, weekdayIndex } from '../log/dates';
import { SECTIONS } from '../sections';
import { buildMotion, fmtSpan, sampleMotion, WEEKS, type MotionInput } from './model';

const today = '2026-11-13'; // a Friday
const levels = Object.fromEntries(SECTIONS.map((s) => [s.id, { level: 3, pct: 0.5, xp: 400 }])) as MotionInput['sections'];
const input = (entries: MotionInput['entries']): MotionInput => ({
  today,
  entries,
  topicSection: new Map<string, SectionId>([
    ['t-violin', 'violin'],
    ['t-gym', 'gym'],
  ]),
  sections: levels,
  overall: { level: 9, pct: 0.25 },
  streak: 12,
});

describe('motion model', () => {
  it('lays a year out as whole weeks, Monday first, ending this Sunday', () => {
    const m = sampleMotion(today);
    expect(m.days).toHaveLength(WEEKS * 7);
    expect(weekdayIndex(m.days[0].date)).toBe(weekdayIndex('2026-11-09'));
    expect(m.days.at(-1)!.date).toBe('2026-11-15');
    expect(m.days.filter((d) => d.future).map((d) => d.date)).toEqual(['2026-11-14', '2026-11-15']);
    expect(m.days.filter((d) => d.future).every((d) => d.minutes === 0)).toBe(true);
  });

  it('uses sample numbers, and says so, when almost nothing is logged', () => {
    const m = buildMotion(input([{ date: today, minutes: 30, topic_id: 't-violin' }]));
    expect(m.sample).toBe(true);
    expect(m.total).toBeGreaterThan(0);
    expect(sampleMotion(today)).toEqual(sampleMotion(today));
  });

  it('adds up real sessions by day, section and week', () => {
    const entries = [0, 1, 2, 3, 4, 10].flatMap((d) => [
      { date: addDays(today, -d), minutes: 60, topic_id: 't-violin' },
      { date: addDays(today, -d), minutes: 20, topic_id: 't-gym' },
      { date: addDays(today, -d), minutes: 15, topic_id: 'unmapped' },
    ]);
    entries.push({ date: addDays(today, -400), minutes: 500, topic_id: 't-violin' }, { date: addDays(today, 1), minutes: 500, topic_id: 't-violin' });
    const m = buildMotion(input(entries));
    expect(m.sample).toBe(false);
    expect(m.active).toBe(6);
    expect(m.total).toBe(6 * 95);
    const day = m.days.find((d) => d.date === today)!;
    expect(day).toMatchObject({ minutes: 95, top: 'violin', future: false });
    const violin = m.sections.find((s) => s.id === 'violin')!;
    expect(violin).toMatchObject({ minutes: 360, week: 300, level: 3 });
    expect(m.sections.find((s) => s.id === 'gym')!.week).toBe(100);
    expect(m).toMatchObject({ level: 9, streak: 12 });
    expect(m.weekly.violin).toHaveLength(WEEKS);
    expect(m.weekly.violin!.at(-1)).toBe(300);
    expect(m.weekly.violin!.reduce((a, b) => a + b, 0)).toBe(360);
    expect(m.weekly.chess).toBeUndefined();
  });

  it('formats spans', () => {
    expect([fmtSpan(40), fmtSpan(95), fmtSpan(120)]).toEqual(['40m', '1h 35m', '2h']);
  });
});
