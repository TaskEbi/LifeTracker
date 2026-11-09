import { describe, expect, it } from 'vitest';
import type { LtRecord } from '../../data/types';
import { countriesBeen, countryCentre, outingOf, outsideByWeek, outsideStreak, placeOf, project, spotOf, tripDays, tripOf, type Outing, type Place } from './model';

const rec = (data: Record<string, unknown>): LtRecord => ({ id: 'r', section: 'cabinet', kind: 'pl_place', data, sort_order: 0, archived_at: null, created_at: '', updated_at: '', deleted_at: null });
const pl = (p: Partial<Place>): Place => ({ id: 'x', name: 'x', country: '', lat: null, lng: null, state: 'Been', first: null, note: '', bucketId: null, ...p });
const out = (date: string, minutes: number): Outing => ({ id: date, date, minutes, what: '' });

describe('places', () => {
  it('reads places, trips and outings defensively', () => {
    expect(placeOf(rec({ name: 'Kyoto', country: 'Japan', lat: 35, lng: 135.8, state: 'Been' }))).toMatchObject({ lat: 35, lng: 135.8 });
    expect(placeOf(rec({ name: 'Mars', lat: 95, lng: 10 }))).toMatchObject({ lat: null, lng: null, state: 'Been' });
    expect(tripOf(rec({ title: 'Japan', from: '2026-12-20', to: '2026-12-18' }))).toBeNull();
    expect(tripOf(rec({ title: 'Day trip', from: '2026-12-20' }))).toMatchObject({ to: '2026-12-20' });
    expect(outingOf(rec({ date: '2026-11-09', minutes: 0 }))).toBeNull();
  });

  it('knows where countries are', () => {
    const sg = countryCentre('Singapore')!;
    expect(sg.lat).toBeCloseTo(1.4, 0);
    expect(sg.lng).toBeCloseTo(103.8, 0);
    expect(spotOf(pl({ country: 'Japan' }))?.lat).toBeGreaterThan(30);
    expect(spotOf(pl({ country: 'Japan', lat: 1, lng: 2 }))).toEqual({ lat: 1, lng: 2 });
    expect(spotOf(pl({}))).toBeNull();
  });

  it('counts countries been to, not wished for', () => {
    expect(countriesBeen([pl({ country: 'Japan' }), pl({ country: 'Japan' }), pl({ country: 'France', state: 'Want' }), pl({ country: 'Singapore' })])).toEqual([
      { country: 'Japan', n: 2 },
      { country: 'Singapore', n: 1 },
    ]);
  });

  it('adds up time outside', () => {
    const list = [out('2026-11-09', 30), out('2026-11-08', 60), out('2026-11-07', 20), out('2026-11-02', 15), out('2026-10-01', 99)];
    const w = outsideByWeek(list, '2026-11-09', 2);
    expect(w).toEqual([
      { monday: '2026-11-02', minutes: 95 },
      { monday: '2026-11-09', minutes: 30 },
    ]);
    expect(outsideStreak(list, '2026-11-09')).toBe(3);
    expect(outsideStreak(list, '2026-11-10')).toBe(3);
    expect(outsideStreak(list, '2026-11-12')).toBe(0);
  });

  it('projects and counts trip days', () => {
    expect(project(0, 0, 360, 180)).toEqual({ x: 180, y: 90 });
    expect(tripDays({ id: 't', title: 't', from: '2026-12-20', to: '2026-12-27', placeIds: [], note: '' })).toBe(8);
  });
});
