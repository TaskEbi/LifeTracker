import { describe, expect, it } from 'vitest';
import type { LogEntry } from '../../data/types';
import { detailFor, gymStats, musclesOf, overdue, sessionName, type GymDetail, type GymSession } from './model';

const sess = (date: string, d: Partial<GymDetail> | null): GymSession => ({ entry: { id: date, date, minutes: 60 } as LogEntry, detail: d as GymDetail | null });
const TODAY = '2026-11-13';

describe('gym muscle groups', () => {
  it('reads only known groups, once each, in the app order', () => {
    expect(musclesOf({ muscles: ['triceps', 'chest', 'chest', 'wings', 3] })).toEqual(['chest', 'triceps']);
    expect(musclesOf({ exercises: [] })).toEqual([]);
    expect(musclesOf(null)).toEqual([]);
  });

  it('names a session from its groups', () => {
    expect(sessionName([])).toBe('Gym');
    expect(sessionName(['chest', 'triceps'])).toBe('Chest · Triceps');
    expect(sessionName(['chest', 'back', 'shoulders', 'biceps', 'core'])).toBe('Chest · Back · Shoulders +2');
  });

  it('builds the saved detail with no exercises, and keeps an older session’s sets', () => {
    const d = detailFor(['back', 'biceps'], { effort: 7, soreness: null, pain: true, painNote: ' left elbow ' });
    expect(d).toMatchObject({ name: 'Back · Biceps', template: null, exercises: [], muscles: ['back', 'biceps'], effort: 7, pain: true, painNote: 'left elbow' });
    expect(detailFor(['triceps', 'chest'], { effort: null, soreness: null, pain: false, painNote: '' })).toMatchObject({ name: 'Chest · Triceps', muscles: ['chest', 'triceps'] }); // tapped in any order
    const old: GymDetail = { name: 'Upper A', template: 't1', exercises: [{ name: 'Bench press', rest: 90, alts: [], sets: [{ reps: 5, weight: 50, done: true }] }] };
    const kept = detailFor([], { effort: null, soreness: 2, pain: false, painNote: 'ignored' }, old);
    expect(kept.exercises).toEqual(old.exercises);
    expect(kept.name).toBe('Upper A');
    expect(kept.painNote).toBe('');
  });

  it('counts sessions per group over 7 days, 28 days and ever', () => {
    const s = [
      sess('2026-11-13', { name: 'a', exercises: [], muscles: ['chest', 'triceps'] }), // today
      sess('2026-11-07', { name: 'b', exercises: [], muscles: ['chest'] }), // 6 days ago: still in the last 7 days
      sess('2026-11-06', { name: 'c', exercises: [], muscles: ['back'] }), // 7 days ago: out of the week
      sess('2026-10-17', { name: 'd', exercises: [], muscles: ['back'] }), // 27 days ago
      sess('2026-10-16', { name: 'e', exercises: [], muscles: ['back'] }), // 28 days ago: out of the 28
      sess('2026-11-01', { name: 'Upper A', exercises: [{ name: 'Bench', rest: 90, alts: [], sets: [] }] }), // before groups
      sess('2026-11-02', null), // a plain Daily Log entry
      sess('2026-11-20', { name: 'future', exercises: [], muscles: ['core'] }),
    ];
    const r = gymStats(s, TODAY);
    const by = (id: string) => r.muscles.find((m) => m.id === id)!;
    expect(r.tagged).toBe(5);
    expect(r.untagged).toBe(2);
    expect(by('chest')).toMatchObject({ week: 2, month: 2, total: 2, last: '2026-11-13', daysAgo: 0 });
    expect(by('back')).toMatchObject({ week: 0, month: 2, total: 3, last: '2026-11-06', daysAgo: 7 });
    expect(by('core')).toMatchObject({ total: 0, last: null, daysAgo: null });
  });

  it('lists the groups not hit for a week, longest first, and nothing before any data', () => {
    expect(overdue(gymStats([], TODAY))).toEqual([]);
    expect(overdue(gymStats([sess('2026-11-02', null)], TODAY))).toEqual([]);
    const r = gymStats([sess('2026-11-13', { name: 'a', exercises: [], muscles: ['chest'] }), sess('2026-11-01', { name: 'b', exercises: [], muscles: ['back', 'core'] })], TODAY);
    const ids = overdue(r).map((m) => m.id);
    expect(ids).not.toContain('chest');
    expect(ids.slice(-2)).toEqual(['back', 'core']); // hit 12 days ago: after the ones never hit
    expect(ids).toContain('calves');
  });
});
