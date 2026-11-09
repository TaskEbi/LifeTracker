/**
 * Places records: lt_records under the cabinet section, kinds `pl_place`, `pl_trip` and `pl_out`,
 * plus a pref for the weekly time-outside goal. No migration.
 */
import { prefValue, sectionRecords, setPref } from '../../data/lt';
import { saveRecord } from '../../data/records';
import { data, type DataState } from '../../data/store';
import type { LtRecord } from '../../data/types';
import { outingOf, placeOf, tripOf, type Outing, type Place, type Trip } from '../../domain/places/model';
import { useStore } from '../../lib/createStore';

const SECTION = 'cabinet' as const;
export const DEFAULT_OUTSIDE_GOAL = 300;

export interface PlacesState {
  places: Place[];
  trips: Trip[];
  outings: Outing[];
  /** Minutes outside a week to aim for. */
  goal: number;
}

const parsed = <T,>(st: DataState, kind: string, fn: (r: LtRecord) => T | null): T[] => sectionRecords(st, SECTION, kind).map(fn).filter((x): x is T => x != null);

let lastRecs: DataState['lt_records'] | null = null;
let lastPrefs: DataState['lt_prefs'] | null = null;
let last: PlacesState | null = null;
export function placesOf(st: DataState): PlacesState {
  if (st.lt_records === lastRecs && st.lt_prefs === lastPrefs && last) return last;
  lastRecs = st.lt_records;
  lastPrefs = st.lt_prefs;
  const goal = prefValue(st, 'places_outside_goal');
  last = {
    places: parsed(st, 'pl_place', placeOf).sort((a, b) => (b.first ?? '').localeCompare(a.first ?? '') || a.name.localeCompare(b.name)),
    trips: parsed(st, 'pl_trip', tripOf).sort((a, b) => b.from.localeCompare(a.from)),
    outings: parsed(st, 'pl_out', outingOf).sort((a, b) => b.date.localeCompare(a.date)),
    goal: typeof goal === 'number' && goal > 0 ? goal : DEFAULT_OUTSIDE_GOAL,
  };
  return last;
}
export const usePlaces = () => useStore(data, placesOf);

export const savePlace = (p: Omit<Place, 'id'>, id?: string) =>
  saveRecord(SECTION, 'pl_place', { name: p.name.trim().slice(0, 120), country: p.country, lat: p.lat, lng: p.lng, state: p.state, first: p.first, note: p.note.trim().slice(0, 1000), bucketId: p.bucketId }, id);

export const saveTrip = (t: Omit<Trip, 'id'>, id?: string) => saveRecord(SECTION, 'pl_trip', { title: t.title.trim().slice(0, 120), from: t.from, to: t.to, placeIds: t.placeIds, note: t.note.trim().slice(0, 2000) }, id);

export const saveOuting = (o: Omit<Outing, 'id'>, id?: string) => saveRecord(SECTION, 'pl_out', { date: o.date, minutes: o.minutes, what: o.what.trim().slice(0, 120) }, id);

export const setOutsideGoal = (minutes: number) => setPref('places_outside_goal', minutes);
