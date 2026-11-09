/**
 * People records: lt_records under the cabinet section, kinds `pp_person`, `pp_gift` and
 * `pp_time`. No migration. Nothing here earns XP.
 */
import { sectionRecords } from '../../data/lt';
import { saveRecord } from '../../data/records';
import { data, type DataState } from '../../data/store';
import type { LtRecord } from '../../data/types';
import { giftOf, personOf, socialMinutes, togetherOf, type Gift, type Person, type Together } from '../../domain/people/model';
import { useStore } from '../../lib/createStore';

const SECTION = 'cabinet' as const;

export interface PeopleState {
  people: Person[];
  gifts: Gift[];
  times: Together[];
}

const parsed = <T,>(st: DataState, kind: string, fn: (r: LtRecord) => T | null): T[] => sectionRecords(st, SECTION, kind).map(fn).filter((x): x is T => x != null);

let lastMap: DataState['lt_records'] | null = null;
let last: PeopleState | null = null;
export function peopleOf(st: DataState): PeopleState {
  if (st.lt_records === lastMap && last) return last;
  lastMap = st.lt_records;
  const people = parsed(st, 'pp_person', personOf).sort((a, b) => a.name.localeCompare(b.name));
  const ids = new Set(people.map((p) => p.id));
  last = {
    people,
    gifts: parsed(st, 'pp_gift', giftOf).filter((g) => ids.has(g.personId)),
    times: parsed(st, 'pp_time', togetherOf)
      .map((t) => ({ ...t, personIds: t.personIds.filter((id) => ids.has(id)) }))
      .filter((t) => t.personIds.length)
      .sort((a, b) => b.date.localeCompare(a.date)),
  };
  return last;
}
export const usePeople = () => useStore(data, peopleOf);

/** Minutes with people per day, for the Lab and Mood. */
export const socialByDay = (st: DataState) => socialMinutes(peopleOf(st).times);

export const savePerson = (p: Omit<Person, 'id'>, id?: string) =>
  saveRecord(SECTION, 'pp_person', { name: p.name.trim().slice(0, 80), relation: p.relation, birthday: p.birthday, notes: p.notes.slice(0, 1500), close: p.close }, id);

export const saveGift = (g: Omit<Gift, 'id'>, id?: string) =>
  saveRecord(SECTION, 'pp_gift', { personId: g.personId, title: g.title.trim().slice(0, 120), occasion: g.occasion.trim().slice(0, 40), state: g.state, price: g.price, date: g.date }, id);

export const saveTogether = (t: Omit<Together, 'id'>, id?: string) => saveRecord(SECTION, 'pp_time', { date: t.date, personIds: t.personIds, what: t.what.trim().slice(0, 200), minutes: t.minutes }, id);
