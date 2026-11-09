import { describe, expect, it } from 'vitest';
import type { LtRecord } from '../../data/types';
import { mediaOf, pickNext, progressLabel, stepOn, yearInMedia, type MediaItem } from './model';

const rec = (data: Record<string, unknown>): LtRecord => ({ id: 'r', section: 'cabinet', kind: 'md_item', data, sort_order: 0, archived_at: null, created_at: '', updated_at: '', deleted_at: null });
const m = (p: Partial<MediaItem>): MediaItem => ({ id: p.title ?? 'x', title: 'x', type: 'Anime', by: '', state: 'On it', rating: null, progress: null, total: null, started: null, finished: null, note: '', fav: false, ...p });

describe('media', () => {
  it('reads items defensively', () => {
    expect(mediaOf(rec({ title: 'Frieren', type: 'Anime', state: 'On it', progress: 7, total: 28, rating: 9 }))).toMatchObject({ type: 'Anime', progress: 7, total: 28, rating: null });
    expect(mediaOf(rec({ title: 'X', type: 'Podcast', state: 'Maybe' }))).toMatchObject({ type: 'Film', state: 'Want' });
    expect(mediaOf(rec({ title: ' ' }))).toBeNull();
  });

  it('steps on, and finishes at the total', () => {
    expect(stepOn(m({ progress: 6, total: 28 }), '2026-11-09')).toMatchObject({ progress: 7, state: 'On it', started: '2026-11-09' });
    expect(stepOn(m({ progress: 27, total: 28, started: '2026-10-01' }), '2026-11-09')).toEqual({ progress: 28, state: 'Done', finished: '2026-11-09', started: '2026-10-01' });
    expect(stepOn(m({ type: 'Game', progress: 95 }), '2026-11-09')).toMatchObject({ progress: 100, state: 'Done' });
  });

  it('labels progress', () => {
    expect(progressLabel(m({ progress: 7, total: 28 }))).toBe('ep 7 of 28');
    expect(progressLabel(m({ type: 'Manga', progress: 140 }))).toBe('ch 140');
    expect(progressLabel(m({ type: 'Film', progress: 1 }))).toBe('');
  });

  it('sums up a year', () => {
    const items = [m({ title: 'a', state: 'Done', finished: '2026-03-01', rating: 5, type: 'Film', fav: true }), m({ title: 'b', state: 'Done', finished: '2026-03-09', rating: 3 }), m({ title: 'c', state: 'Done', finished: '2025-12-01', rating: 5 }), m({ title: 'd', state: 'On it' })];
    const y = yearInMedia(items, 2026);
    expect(y.finished).toBe(2);
    expect(y.avg).toBe(4);
    expect(y.top.map((x) => x.title)).toEqual(['a', 'b']);
    expect(y.favs.map((x) => x.title)).toEqual(['a']);
    expect(y.months[2]).toBe(2);
    expect(y.byType).toEqual([
      { type: 'Film', n: 1 },
      { type: 'Anime', n: 1 },
    ]);
  });

  it('picks something from the want list', () => {
    const want = [m({ title: 'a' }), m({ title: 'b' })];
    expect(pickNext([], 0.5)).toBeNull();
    expect(pickNext(want, 0)?.title).toBe('a');
    expect(pickNext(want, 0.99)?.title).toBe('b');
  });
});
