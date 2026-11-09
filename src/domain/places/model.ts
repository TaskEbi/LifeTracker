/**
 * Places: where you've been and want to go (`pl_place`), trips (`pl_trip`) and time outside
 * (`pl_out`), all lt_records under the cabinet section. Pure functions; tested in places.test.ts.
 */
import type { LtRecord } from '../../data/types';
import { addDays, dayCount, weekStart } from '../log/dates';
import { COUNTRIES } from './countries';

export type PlaceState = 'Been' | 'Want';
export interface Place {
  id: string;
  name: string;
  /** Country name as in COUNTRIES, or ''. */
  country: string;
  lat: number | null;
  lng: number | null;
  state: PlaceState;
  /** First visit, for places you've been. */
  first: string | null;
  note: string;
  /** The bucket-list item it went onto, if any. */
  bucketId: string | null;
}

const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max).trim() : '');
const coord = (v: unknown, lim: number) => (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= lim ? v : null);

export function placeOf(r: LtRecord): Place | null {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const name = str(d.name, 120);
  if (!name) return null;
  const lat = coord(d.lat, 90);
  const lng = coord(d.lng, 180);
  return { id: r.id, name, country: str(d.country, 80), lat: lat != null && lng != null ? lat : null, lng: lat != null && lng != null ? lng : null, state: d.state === 'Want' ? 'Want' : 'Been', first: day(d.first), note: str(d.note, 1000), bucketId: typeof d.bucketId === 'string' ? d.bucketId : null };
}

export interface Trip {
  id: string;
  title: string;
  from: string;
  to: string;
  placeIds: string[];
  note: string;
}
export function tripOf(r: LtRecord): Trip | null {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const title = str(d.title, 120);
  const from = day(d.from);
  const to = day(d.to) ?? from;
  if (!title || !from || !to || to < from) return null;
  return { id: r.id, title, from, to, placeIds: Array.isArray(d.placeIds) ? (d.placeIds as unknown[]).filter((x): x is string => typeof x === 'string') : [], note: str(d.note, 2000) };
}

export interface Outing {
  id: string;
  date: string;
  minutes: number;
  what: string;
}
export function outingOf(r: LtRecord): Outing | null {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const date = day(d.date);
  const minutes = typeof d.minutes === 'number' && d.minutes > 0 ? Math.min(1440, Math.round(d.minutes)) : null;
  return date && minutes ? { id: r.id, date, minutes, what: str(d.what, 120) } : null;
}

/** A country's rough centre. */
export function countryCentre(name: string): { lat: number; lng: number } | null {
  const c = COUNTRIES.find((x) => x[1] === name);
  return c ? { lat: c[2], lng: c[3] } : null;
}

/** Where to put a place on the map: its own spot, else its country's centre. */
export function spotOf(p: Place): { lat: number; lng: number } | null {
  return p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : p.country ? countryCentre(p.country) : null;
}

/** Countries you've been to, with how many places in each. */
export function countriesBeen(places: Place[]): { country: string; n: number }[] {
  const m = new Map<string, number>();
  for (const p of places) if (p.state === 'Been' && p.country) m.set(p.country, (m.get(p.country) ?? 0) + 1);
  return [...m].map(([country, n]) => ({ country, n })).sort((a, b) => b.n - a.n || a.country.localeCompare(b.country));
}

export const tripDays = (t: Trip) => dayCount(t.from, t.to);

/** Minutes outside per week (Mondays), oldest first. */
export function outsideByWeek(outings: Outing[], today: string, weeks = 8): { monday: string; minutes: number }[] {
  const mon = weekStart(today);
  const out = Array.from({ length: weeks }, (_, i) => ({ monday: addDays(mon, -7 * (weeks - 1 - i)), minutes: 0 }));
  const first = out[0].monday;
  for (const o of outings) {
    if (o.date < first || o.date > today) continue;
    const i = Math.floor((dayCount(first, o.date) - 1) / 7);
    if (out[i]) out[i].minutes += o.minutes;
  }
  return out;
}

/** Days in a row with time outside, ending today (or yesterday, if today has none yet). */
export function outsideStreak(outings: Outing[], today: string): number {
  const days = new Set(outings.map((o) => o.date));
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Equirectangular: longitude and latitude to x and y in a w × h box. */
export const project = (lat: number, lng: number, w: number, h: number) => ({ x: ((lng + 180) / 360) * w, y: ((90 - lat) / 180) * h });
