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
  /** 1 calm … 5 swamped, or null if not given. */
  stress?: number | null;
  /** What was going on: a few words from MOOD_TAGS or your own. */
  tags?: string[];
  note: string;
}

export const STRESS = ['Calm', 'Settled', 'Some', 'Tense', 'Swamped'] as const;
export const stressName = (v: number) => STRESS[Math.min(5, Math.max(1, Math.round(v))) - 1];

/** The usual things going on in a day, to tag a check-in with in one tap. */
export const MOOD_TAGS = ['School', 'Exams', 'Homework', 'Friends', 'Family', 'Music', 'Sport', 'Outside', 'Unwell', 'Tired', 'Screens', 'Alone time'] as const;

const inRange = (v: unknown) => (typeof v === 'number' && v >= 1 && v <= 5 ? Math.round(v) : null);

export function checkInOf(r: LtRecord): CheckIn | null {
  const d = r.data;
  const mood = inRange(d.mood);
  if (r.deleted_at || mood == null || typeof d.date !== 'string') return null;
  const tags = Array.isArray(d.tags) ? (d.tags as unknown[]).filter((t): t is string => typeof t === 'string' && !!t.trim()).map((t) => t.trim().slice(0, 30)).slice(0, 12) : [];
  return { date: d.date, mood, energy: inRange(d.energy), stress: inRange(d.stress), tags, note: typeof d.note === 'string' ? d.note : '' };
}
