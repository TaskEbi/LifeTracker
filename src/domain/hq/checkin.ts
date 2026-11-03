/**
 * 心の天気, the inner weather: a ten-second check-in once a day. Stored as one lt_records row per day
 * (kind `hq_checkin`, id from the date), so two devices write the same row.
 */
import type { LtRecord } from '../../data/types';

export const WEATHER = [
  { v: 1, kanji: '嵐', name: 'Storm', c: '#7c6cf0' },
  { v: 2, kanji: '雨', name: 'Rain', c: '#4a93d9' },
  { v: 3, kanji: '曇', name: 'Cloudy', c: '#94a3b4' },
  { v: 4, kanji: '晴', name: 'Clear', c: '#f5b83d' },
  { v: 5, kanji: '虹', name: 'Rainbow', c: '#ff6f91' },
] as const;
export const weatherOf = (v: number) => WEATHER.find((w) => w.v === Math.round(v)) ?? WEATHER[2];

export interface CheckIn {
  date: string;
  /** 1 storm … 5 rainbow. */
  mood: number;
  /** 1 empty … 5 full, or null if only the weather was given. */
  energy: number | null;
  note: string;
}

const inRange = (v: unknown) => (typeof v === 'number' && v >= 1 && v <= 5 ? Math.round(v) : null);

export function checkInOf(r: LtRecord): CheckIn | null {
  const d = r.data;
  const mood = inRange(d.mood);
  if (r.deleted_at || mood == null || typeof d.date !== 'string') return null;
  return { date: d.date, mood, energy: inRange(d.energy), note: typeof d.note === 'string' ? d.note : '' };
}
