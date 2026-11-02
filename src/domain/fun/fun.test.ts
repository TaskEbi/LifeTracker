import { describe, expect, it } from 'vitest';
import { guessRarity, rarityOf } from '../bucket/rarity';
import { addDays } from '../log/dates';
import { DEFAULT_SLEEP, DEFAULT_TARGETS } from '../prefs';
import type { ProgressInput } from '../progress/engine';
import { weekRecap } from '../progress/recap';
import { episodePanels, episodeTitle, weekChange } from './episode';
import { drawFortune, FORTUNE_RANKS, fortuneNudge } from './omikuji';
import { droneMood, hourIn, seasonOf, timeOfDay } from './season';

const T = '2026-11-02';
const entry = (date: string, minutes: number, section: string, id = `${section}${date}${minutes}`) => ({ id, date, topic_id: `topic-${section}`, subcategory_id: null, minutes, note: null, created_at: `${date}T10:00:00Z`, updated_at: `${date}T10:00:00Z`, deleted_at: null });
const input = (p: Partial<ProgressInput> = {}): ProgressInput => ({
  today: T,
  entries: [],
  topicSection: new Map([['topic-violin', 'violin'], ['topic-chess', 'chess'], ['topic-reading', 'reading']]),
  details: new Map(),
  metrics: [],
  nights: new Map(),
  todos: [],
  dayOf: (iso) => iso.slice(0, 10),
  restDays: [],
  cabinetDays: [],
  targets: DEFAULT_TARGETS,
  sleep: DEFAULT_SLEEP,
  ...p,
});

describe('omikuji', () => {
  it('is the same all day and changes with the day', () => {
    expect(drawFortune(T)).toEqual(drawFortune(T));
    const days = Array.from({ length: 60 }, (_, i) => JSON.stringify(drawFortune(addDays(T, i)).lines));
    expect(new Set(days).size).toBeGreaterThan(50);
  });

  it('draws three different headings and every rank turns up, the great and the bad less often', () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 3650; i++) {
      const f = drawFortune(addDays('2026-01-01', i));
      expect(new Set(f.lines.map((l) => l.label)).size).toBe(3);
      expect(f.stick).toBeGreaterThanOrEqual(1);
      expect(f.stick).toBeLessThanOrEqual(100);
      for (const l of f.lines) expect(l.text.length).toBeGreaterThan(0);
      counts.set(f.rank.id, (counts.get(f.rank.id) ?? 0) + 1);
    }
    for (const r of FORTUNE_RANKS) expect(counts.get(r.id)).toBeGreaterThan(100);
    expect(counts.get('kyo')!).toBeLessThan(counts.get('kichi')!);
  });

  it('nudges toward the section left longest, only from real records', () => {
    expect(fortuneNudge(input())).toBeNull();
    expect(fortuneNudge(input({ entries: [entry(T, 20, 'violin'), entry(addDays(T, -1), 20, 'chess')] }))).toBeNull();
    expect(fortuneNudge(input({ entries: [entry(T, 20, 'violin'), entry(addDays(T, -3), 20, 'chess'), entry(addDays(T, -6), 20, 'reading'), entry(addDays(T, -2), 20, 'reading')] }))).toEqual({ section: 'chess', days: 3 });
    expect(fortuneNudge(input({ entries: [entry(addDays(T, -9), 20, 'other')] }))).toBeNull();
  });
});

describe('the sky and the drone', () => {
  it('follows the months, with special days on top', () => {
    expect(seasonOf('2026-11-02').kind).toBe('maple');
    expect(seasonOf('2026-04-10').kind).toBe('sakura');
    expect(seasonOf('2026-06-10').kind).toBe('rain');
    expect(seasonOf('2026-08-10').kind).toBe('firefly');
    expect(seasonOf('2027-01-20').kind).toBe('snow');
    expect(seasonOf('2027-01-01').kind).toBe('firework');
    expect(seasonOf('2026-10-31').kind).toBe('bat');
    expect(seasonOf('2026-07-07').kind).toBe('star');
    for (let m = 1; m <= 12; m++) expect(seasonOf(`2026-${String(m).padStart(2, '0')}-15`).label).toBeTruthy();
  });

  it('knows the time of day, in the right time zone', () => {
    expect([3, 6, 12, 18, 22].map(timeOfDay)).toEqual(['night', 'dawn', 'day', 'dusk', 'night']);
    expect(hourIn('Asia/Tokyo', new Date('2026-11-02T00:30:00Z'))).toBe(9);
    expect(hourIn('Europe/London', new Date('2026-11-02T00:30:00Z'))).toBe(0);
    expect(hourIn('Not/AZone', new Date('2026-11-02T00:30:00Z'))).toBeGreaterThanOrEqual(0);
  });

  it('moods: sleep wins, then worry, then pride', () => {
    expect(droneMood({ hour: 2, streakHeld: true, dailyDone: true })).toBe('asleep');
    expect(droneMood({ hour: 12, streakHeld: true, dailyDone: true })).toBe('worried');
    expect(droneMood({ hour: 12, streakHeld: false, dailyDone: true })).toBe('proud');
    expect(droneMood({ hour: 12, streakHeld: false, dailyDone: false })).toBe('idle');
  });
});

describe('the episode', () => {
  it('names the week by what it held and shows only panels with something in them', () => {
    const quiet = weekRecap(input(), '2026-10-26');
    expect(episodeTitle(quiet)).toBe('The Quiet Week');
    expect(episodePanels(quiet)).toEqual(['title', 'boss', 'next']);
    const busy = weekRecap(input({ entries: [entry('2026-10-27', 60, 'reading'), entry('2026-10-28', 30, 'violin')] }), '2026-10-26');
    expect(episodeTitle(busy)).toBe('The Turning of Pages');
    expect(episodePanels(busy)).toEqual(['title', 'time', 'sections', 'facts', 'boss', 'next']);
    expect(episodeTitle({ sections: [], minutes: 10, activeDays: 7 })).toBe('Not One Day Missed');
  });

  it('says how the week compares', () => {
    expect(weekChange({ minutes: 150, prevMinutes: 100 })).toEqual({ text: 'Up 50% on the week before.', up: true });
    expect(weekChange({ minutes: 50, prevMinutes: 100 })).toEqual({ text: 'Down 50% on the week before.', up: false });
    expect(weekChange({ minutes: 100, prevMinutes: 100 }).up).toBeNull();
    expect(weekChange({ minutes: 0, prevMinutes: 0 }).text).toBe('');
  });
});

describe('rarity', () => {
  const wish = (title: string, data: Record<string, unknown> = {}) => ({ title, note: null, data });
  it('guesses from the section and keeps your choice', () => {
    expect(guessRarity(wish('Eat the best ramen in Tokyo', { cat: 'taste' }))).toBe('common');
    expect(guessRarity(wish('x', { cat: 'body' }))).toBe('epic');
    expect(guessRarity(wish('x', { cat: 'moments' }))).toBe('legendary');
    expect(rarityOf(wish('x', { cat: 'taste', rarity: 'legendary' }))).toBe('legendary');
    expect(rarityOf(wish('x', { cat: 'taste', rarity: 'mythic' }))).toBe('common');
  });
});
