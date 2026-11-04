import { describe, expect, it } from 'vitest';
import { albumStreak, byDay, coverOf, daysToReel, frameMs, monthPicks, onThisDay, reelOpen, shotOf, stamp, tileOf, yearInPhotos, type Shot } from './album';

let n = 0;
const shot = (date: string, role: Shot['role'] = 'memory', extra: Partial<Shot> = {}): Shot => ({
  id: `s${++n}`,
  date,
  role,
  path: `local:${n}`,
  thumb: null,
  caption: '',
  star: false,
  at: `${date}T12:00:${String(n % 60).padStart(2, '0')}.000Z`,
  seq: n,
  ...extra,
});

describe('album shots', () => {
  it('reads a stored row and refuses broken ones', () => {
    const row = (data: Record<string, unknown>) => ({ id: 'x', data, created_at: '2026-11-04T08:00:00.000Z', sort_order: 3 });
    expect(shotOf(row({ date: '2026-11-04', role: 'face', path: 'album/a.webp', thumb: 'data:image/webp;base64,AA', caption: 'hi', star: true }))).toEqual({
      id: 'x',
      date: '2026-11-04',
      role: 'face',
      path: 'album/a.webp',
      thumb: 'data:image/webp;base64,AA',
      caption: 'hi',
      star: true,
      at: '2026-11-04T08:00:00.000Z',
      seq: 3,
    });
    expect(shotOf(row({ date: '2026-02-30', role: 'face', path: 'p' }))).toBeNull();
    expect(shotOf(row({ date: '2026-11-04', role: 'selfie', path: 'p' }))).toBeNull();
    expect(shotOf(row({ date: '2026-11-04', role: 'memory', path: '' }))).toBeNull();
    // only an image data: URL is used as a thumbnail
    expect(shotOf(row({ date: '2026-11-04', role: 'memory', path: 'p', thumb: 'javascript:alert(1)' }))!.thumb).toBeNull();
  });

  it('groups by day: one face (the later wins), memories in order, a starred cover', () => {
    const a = shot('2026-11-04', 'face');
    const b = shot('2026-11-04', 'memory');
    const c = shot('2026-11-04', 'memory', { star: true });
    const d = shot('2026-11-04', 'face');
    const days = byDay([d, c, b, a]);
    const day = days.get('2026-11-04')!;
    expect(day.face).toBe(d);
    expect(day.extraFaces).toEqual([a]);
    expect(day.memories).toEqual([b, c]);
    expect(coverOf(day)).toBe(c);
    expect(tileOf(day, 'face')).toBe(d);
    expect(tileOf({ date: 'x', face: d, extraFaces: [], memories: [] })).toBe(d);
    expect(coverOf(undefined)).toBeNull();
  });

  it('keeps save order for shots taken in the same instant', () => {
    const at = '2026-11-04T09:00:00.000Z';
    const [x, y, z] = [shot('2026-11-04', 'memory', { id: 'zz', at, seq: 1 }), shot('2026-11-04', 'memory', { id: 'aa', at, seq: 2 }), shot('2026-11-04', 'memory', { id: 'mm', at, seq: 3 })];
    expect(byDay([z, x, y]).get('2026-11-04')!.memories).toEqual([x, y, z]);
  });
});

describe('album streak', () => {
  it('counts today, or a run that ended yesterday, and the best run', () => {
    const dates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-11-02', '2026-11-03'];
    expect(albumStreak(dates, '2026-11-04')).toEqual({ current: 2, best: 4 });
    expect(albumStreak([...dates, '2026-11-04'], '2026-11-04')).toEqual({ current: 3, best: 4 });
    expect(albumStreak(dates, '2026-11-05')).toEqual({ current: 0, best: 4 });
    expect(albumStreak([], '2026-11-05')).toEqual({ current: 0, best: 0 });
    // across a month end and a leap day
    expect(albumStreak(['2028-02-28', '2028-02-29', '2028-03-01'], '2028-03-01')).toEqual({ current: 3, best: 3 });
  });
});

describe('the reel', () => {
  it('opens on New Year’s Eve, and stays open for past years', () => {
    expect(reelOpen(2026, '2026-11-04')).toBe(false);
    expect(reelOpen(2026, '2026-12-30')).toBe(false);
    expect(reelOpen(2026, '2026-12-31')).toBe(true);
    expect(reelOpen(2026, '2027-03-01')).toBe(true);
    expect(daysToReel(2026, '2026-11-04')).toBe(57);
    expect(daysToReel(2026, '2026-12-31')).toBe(0);
  });

  it('adds up the year', () => {
    const shots = [
      shot('2026-01-01', 'face'),
      shot('2026-01-01', 'memory', { caption: 'fireworks' }),
      shot('2026-01-02', 'face'),
      shot('2026-01-03', 'face'),
      shot('2026-03-10', 'memory'),
      shot('2026-03-10', 'memory'),
      shot('2026-03-10', 'memory'),
      shot('2026-03-11', 'face', { caption: 'tired' }),
      shot('2025-12-31', 'face'),
    ];
    const y = yearInPhotos(byDay(shots), 2026);
    expect(y.days).toBe(5);
    expect(y.faces.map((f) => f.date)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03', '2026-03-11']);
    expect(y.memories).toBe(4);
    expect(y.captions).toBe(2);
    expect(y.best).toBe(3);
    expect(y.busiest).toEqual({ date: '2026-03-10', n: 3 });
    expect(y.byMonth.slice(0, 3)).toEqual([3, 0, 2]);
    expect(y.memoriesByMonth.slice(0, 3)).toEqual([1, 0, 3]);
    expect(y.topMonth).toBe(2);
    // 4 Jan … 9 Mar
    expect(y.longestGap).toBe(65);
    expect([y.first, y.last]).toEqual(['2026-01-01', '2026-03-11']);
    const empty = yearInPhotos(new Map(), 2027);
    expect([empty.days, empty.busiest, empty.topMonth, empty.longestGap, empty.first]).toEqual([0, null, null, 0, null]);
  });

  it('picks a month’s memories: starred and captioned first, spread out, in date order', () => {
    const shots = [
      shot('2026-05-01'),
      shot('2026-05-01'),
      shot('2026-05-05'),
      shot('2026-05-09', 'memory', { caption: 'gig' }),
      shot('2026-05-12'),
      shot('2026-05-20', 'memory', { star: true }),
      shot('2026-05-28'),
      shot('2026-06-01'),
    ];
    const picks = monthPicks(byDay(shots), 2026, 4, 4);
    expect(picks).toHaveLength(4);
    expect(picks.map((p) => p.date)).toEqual([...picks.map((p) => p.date)].sort());
    expect(picks.some((p) => p.caption === 'gig')).toBe(true);
    expect(picks.some((p) => p.star)).toBe(true);
    expect(picks.every((p) => p.date.startsWith('2026-05'))).toBe(true);
    expect(new Set(picks.map((p) => p.id)).size).toBe(4);
    expect(monthPicks(byDay(shots), 2026, 5, 4)).toHaveLength(1);
  });

  it('times the timelapse to about ten seconds, within limits', () => {
    expect(frameMs(365)).toBe(70);
    expect(frameMs(100)).toBe(100);
    expect(frameMs(3)).toBe(260);
    expect(frameMs(0)).toBe(260);
  });

  it('stamps the date like a film camera', () => {
    expect(stamp('2026-11-04')).toBe("'26 11 04");
  });
});

describe('on this day', () => {
  it('finds the same day in past years, and 28 Feb for a leap day', () => {
    const days = byDay([shot('2025-11-04', 'face'), shot('2023-11-04'), shot('2027-02-28', 'face')]);
    expect(onThisDay(days, '2026-11-04').map((x) => x.years)).toEqual([1, 3]);
    expect(onThisDay(days, '2028-02-29').map((x) => x.years)).toEqual([1]);
    expect(onThisDay(days, '2026-11-05')).toEqual([]);
  });
});
