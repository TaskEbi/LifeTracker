import { describe, expect, it } from 'vitest';
import type { LogEntry, LtRecord } from '../../data/types';
import { progression, setsDone, startFrom, STARTER_TEMPLATES, templateOf, trackedExercises, type GymDetail, type GymSession } from './model';

const rec = (data: Record<string, unknown>): LtRecord => ({ id: 't1', section: 'gym', kind: 'gym_template', data, sort_order: 1, archived_at: null, created_at: '', updated_at: '', deleted_at: null });
const sess = (date: string, d: GymDetail): GymSession => ({ entry: { id: date, date, minutes: 60 } as LogEntry, detail: d });

describe('gym', () => {
  it('reads templates defensively', () => {
    const t = templateOf(rec({ name: 'Upper A', exercises: [{ name: 'Bench press', sets: 99, reps: 6, weight: -5 }] }));
    expect(t.exercises[0]).toMatchObject({ name: 'Bench press', sets: 3, reps: 6, weight: 0, rest: 90 });
  });

  it('starts a session with every set to do', () => {
    const d = startFrom({ ...STARTER_TEMPLATES[0], id: 'x', archived: false });
    expect(setsDone(d)).toBe(0);
    expect(d.exercises[0].sets).toHaveLength(4);
  });

  it('tracks the heaviest completed set, ignoring sets not done', () => {
    const a: GymDetail = { name: 'Upper A', template: null, exercises: [{ name: 'Bench press', rest: 90, alts: [], sets: [{ reps: 6, weight: 47.5, done: true }, { reps: 6, weight: 50, done: false }] }] };
    const b: GymDetail = { name: 'Upper A', template: null, exercises: [{ name: 'Bench press', rest: 90, alts: [], sets: [{ reps: 6, weight: 50, done: true }] }] };
    const s = [sess('2026-10-21', b), sess('2026-10-14', a)];
    expect(progression(s, 'Bench press')).toEqual([{ date: '2026-10-14', weight: 47.5 }, { date: '2026-10-21', weight: 50 }]);
    expect(trackedExercises(s)).toEqual(['Bench press']);
  });
});
