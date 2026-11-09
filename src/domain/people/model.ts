/**
 * People: the ones who matter, their birthdays and gift ideas, notes to remember, and who you
 * spent time with. lt_records under the cabinet section: `pp_person`, `pp_gift` and `pp_time`.
 * Pure functions only; tested in people.test.ts.
 */
import type { LtRecord } from '../../data/types';
import { addDays, dayCount } from '../log/dates';

export const RELATIONS = ['Family', 'Friend', 'School', 'Music', 'Sport', 'Other'] as const;
export type Relation = (typeof RELATIONS)[number];
export const NOTES_MAX = 1500;

export interface Person {
  id: string;
  name: string;
  relation: Relation;
  /** YYYY-MM-DD, or --MM-DD when the year isn't known. */
  birthday: string | null;
  notes: string;
  /** Close people get a nudge when it's been a while. */
  close: boolean;
}

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');
const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const bday = (v: unknown) => (typeof v === 'string' && /^(\d{4}-|--)\d{2}-\d{2}$/.test(v) ? v : null);

export function personOf(r: LtRecord): Person | null {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const name = str(d.name, 80).trim();
  if (!name) return null;
  const relation = (RELATIONS as readonly string[]).includes(d.relation as string) ? (d.relation as Relation) : 'Other';
  return { id: r.id, name, relation, birthday: bday(d.birthday), notes: str(d.notes, NOTES_MAX), close: !!d.close };
}

export const GIFT_STATES = ['Idea', 'Bought', 'Given'] as const;
export type GiftState = (typeof GIFT_STATES)[number];
export interface Gift {
  id: string;
  personId: string;
  title: string;
  occasion: string;
  state: GiftState;
  /** Price in the currency's main unit, or null. */
  price: number | null;
  /** When it was given. */
  date: string | null;
}
export function giftOf(r: LtRecord): Gift | null {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const title = str(d.title, 120).trim();
  if (!title || typeof d.personId !== 'string') return null;
  const state = (GIFT_STATES as readonly string[]).includes(d.state as string) ? (d.state as GiftState) : 'Idea';
  const price = typeof d.price === 'number' && Number.isFinite(d.price) && d.price >= 0 ? d.price : null;
  return { id: r.id, personId: d.personId, title, occasion: str(d.occasion, 40).trim(), state, price, date: day(d.date) };
}

/** Time spent with people: one row per get-together. */
export interface Together {
  id: string;
  date: string;
  personIds: string[];
  what: string;
  /** Minutes, or null when not given. */
  minutes: number | null;
}
export function togetherOf(r: LtRecord): Together | null {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const date = day(d.date);
  const ids = Array.isArray(d.personIds) ? (d.personIds as unknown[]).filter((x): x is string => typeof x === 'string') : [];
  if (!date || !ids.length) return null;
  const minutes = typeof d.minutes === 'number' && d.minutes > 0 ? Math.round(d.minutes) : null;
  return { id: r.id, date, personIds: ids, what: str(d.what, 200).trim(), minutes };
}

/** A birthday's next date on or after today, how many days away, and the age they'll turn if known. */
export function nextBirthday(birthday: string, today: string): { date: string; days: number; turns: number | null } {
  const md = birthday.slice(-5);
  const y = Number(today.slice(0, 4));
  // 29 February falls on 1 March in other years
  const on = (year: number) => {
    const iso = `${year}-${md}`;
    return md === '02-29' && !(year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? `${year}-03-01` : iso;
  };
  let date = on(y);
  if (date < today) date = on(y + 1);
  const born = birthday.startsWith('--') ? null : Number(birthday.slice(0, 4));
  return { date, days: dayCount(today, date) - 1, turns: born ? Number(date.slice(0, 4)) - born : null };
}

/** Birthdays in the next `within` days, soonest first. */
export function upcomingBirthdays(people: Person[], today: string, within = 30) {
  return people
    .filter((p) => p.birthday)
    .map((p) => ({ person: p, ...nextBirthday(p.birthday!, today) }))
    .filter((b) => b.days <= within)
    .sort((a, b) => a.days - b.days || a.person.name.localeCompare(b.person.name));
}

/** The last day you saw each person. */
export function lastSeen(times: Together[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const t of times) for (const id of t.personIds) if ((out.get(id) ?? '') < t.date) out.set(id, t.date);
  return out;
}

/** How many times you saw each person since `from`, most first. */
export function seenSince(times: Together[], from: string): { id: string; n: number }[] {
  const n = new Map<string, number>();
  for (const t of times) if (t.date >= from) for (const id of t.personIds) n.set(id, (n.get(id) ?? 0) + 1);
  return [...n].map(([id, k]) => ({ id, n: k })).sort((a, b) => b.n - a.n);
}

/** Close people you haven't seen for `days` days or more (or ever), longest gap first. */
export function overdue(people: Person[], times: Together[], today: string, days = 21) {
  const seen = lastSeen(times);
  return people
    .filter((p) => p.close)
    .map((p) => ({ person: p, last: seen.get(p.id) ?? null, gap: seen.get(p.id) ? dayCount(seen.get(p.id)!, today) - 1 : null }))
    .filter((x) => x.gap == null || x.gap >= days)
    .sort((a, b) => (b.gap ?? 9999) - (a.gap ?? 9999));
}

/** Minutes with people per day, for the Lab (a get-together with no length counts as an hour). */
export function socialMinutes(times: Together[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const t of times) out.set(t.date, (out.get(t.date) ?? 0) + (t.minutes ?? 60));
  return out;
}

/** Days in the last `n` with time with anyone. */
export const socialDays = (times: Together[], today: string, n = 7) => new Set(times.filter((t) => t.date > addDays(today, -n) && t.date <= today).map((t) => t.date)).size;
