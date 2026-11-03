/**
 * 作戦室, the war room: the weekly review. Look at the tape, say what happened, choose this week's
 * theme and Big Three. One lt_records row per plan week (kind `hq_review`).
 */
import type { LtRecord, SectionId } from '../../data/types';
import { addDays, weekdayIndex, weekStart } from '../log/dates';
import { dayFacts } from '../progress/quests';
import { weekRecap, type WeekRecap } from '../progress/recap';
import type { ProgressInput } from '../progress/engine';
import type { CheckIn } from './checkin';

export interface BigThree {
  text: string;
  section: SectionId | null;
  done: boolean;
}

export interface Review {
  id: string;
  /** The Monday of the week it plans for. */
  week: string;
  win: string;
  stuck: string;
  change: string;
  theme: string;
  /** How last week felt, 1–5. */
  rating: number | null;
  big: BigThree[];
  sealedOn: string;
}

export function reviewOf(r: LtRecord): Review | null {
  if (r.deleted_at || r.kind !== 'hq_review') return null;
  const d = r.data;
  if (typeof d.week !== 'string') return null;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  return {
    id: r.id,
    week: d.week,
    win: str(d.win),
    stuck: str(d.stuck),
    change: str(d.change),
    theme: str(d.theme),
    rating: typeof d.rating === 'number' ? d.rating : null,
    big: Array.isArray(d.big) ? (d.big as BigThree[]).filter((b) => b && typeof b.text === 'string').slice(0, 3) : [],
    sealedOn: typeof d.sealedOn === 'string' ? d.sealedOn : r.created_at.slice(0, 10),
  };
}

/** From Friday on you plan next week; earlier in the week, this one. */
export function planWeekFor(today: string): string {
  const monday = weekStart(today);
  return weekdayIndex(today) >= 4 ? addDays(monday, 7) : monday;
}

/** Worth asking: the weekend and the first two days of the week, until it's done. */
export function reviewIsDue(today: string, reviews: Review[]): boolean {
  const w = weekdayIndex(today);
  return (w >= 5 || w <= 1) && !reviews.some((r) => r.week === planWeekFor(today));
}

export interface Tape {
  recap: WeekRecap;
  /** Average sleep over the nights logged. */
  sleep: number | null;
  screen: number | null;
  mood: number | null;
  /** Last week's own review, to keep yourself honest. */
  previous: Review | null;
}

/** The week before the plan week, in numbers. */
export function tapeFor(input: ProgressInput, week: string, checkIns: CheckIn[], reviews: Review[]): Tape {
  const monday = addDays(week, -7);
  const end = addDays(monday, 6);
  const recap = weekRecap(input, monday, [], dayFacts(input));
  const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const of = (m: string) => input.metrics.filter((x) => x.metric === m && x.date >= monday && x.date <= end).map((x) => x.minutes);
  return {
    recap,
    sleep: avg(of('sleep')),
    screen: avg(of('screen')),
    mood: avg(checkIns.filter((c) => c.date >= monday && c.date <= end).map((c) => c.mood)),
    previous: reviews.find((r) => r.week === monday) ?? null,
  };
}

/** Reviews in a row, counting back from the plan week (or the one before it, if this one's still open). */
export function reviewStreak(reviews: Review[], today: string): number {
  const weeks = new Set(reviews.map((r) => r.week));
  let w = planWeekFor(today);
  if (!weeks.has(w)) w = addDays(w, -7);
  let n = 0;
  while (weeks.has(w)) {
    n++;
    w = addDays(w, -7);
  }
  return n;
}

export const currentReview = (reviews: Review[], today: string) => reviews.find((r) => r.week === weekStart(today)) ?? null;
