import { describe, expect, it } from 'vitest';
import type { LtRecord } from '../../data/types';
import { giftOf, lastSeen, nextBirthday, overdue, personOf, seenSince, socialDays, socialMinutes, togetherOf, upcomingBirthdays, type Person, type Together } from './model';

const rec = (data: Record<string, unknown>, id = 'r1'): LtRecord => ({ id, section: 'cabinet', kind: 'pp_person', data, sort_order: 0, archived_at: null, created_at: '', updated_at: '', deleted_at: null });
const p = (id: string, name: string, birthday: string | null = null, close = false): Person => ({ id, name, relation: 'Friend', birthday, notes: '', close });
const t = (date: string, ids: string[], minutes: number | null = null): Together => ({ id: date + ids.join(), date, personIds: ids, what: '', minutes });

describe('people', () => {
  it('reads people, gifts and get-togethers defensively', () => {
    expect(personOf(rec({ name: '  Mum ', relation: 'Family', birthday: '1980-03-14' }))).toMatchObject({ name: 'Mum', relation: 'Family', birthday: '1980-03-14' });
    expect(personOf(rec({ name: 'Ken', relation: 'Pet', birthday: '--07-01' }))).toMatchObject({ relation: 'Other', birthday: '--07-01' });
    expect(personOf(rec({ name: '' }))).toBeNull();
    expect(giftOf(rec({ title: 'Book', personId: 'a', state: 'Bought', price: 12 }))).toMatchObject({ state: 'Bought', price: 12 });
    expect(giftOf(rec({ title: 'Book' }))).toBeNull();
    expect(togetherOf(rec({ date: '2026-11-09', personIds: [] }))).toBeNull();
  });

  it('finds the next birthday and the age', () => {
    expect(nextBirthday('2010-11-20', '2026-11-09')).toEqual({ date: '2026-11-20', days: 11, turns: 16 });
    expect(nextBirthday('--01-02', '2026-11-09')).toEqual({ date: '2027-01-02', days: 54, turns: null });
    expect(nextBirthday('2008-11-09', '2026-11-09').days).toBe(0);
    expect(nextBirthday('2008-02-29', '2026-11-09').date).toBe('2027-03-01');
  });

  it('lists birthdays coming up', () => {
    const list = upcomingBirthdays([p('a', 'A', '2010-12-25'), p('b', 'B', '2011-11-10'), p('c', 'C')], '2026-11-09', 30);
    expect(list.map((x) => x.person.name)).toEqual(['B']);
  });

  it('knows who you see and who you have not', () => {
    const times = [t('2026-10-01', ['a']), t('2026-11-08', ['a', 'b'], 90), t('2026-11-08', ['b'])];
    expect(lastSeen(times).get('a')).toBe('2026-11-08');
    expect(seenSince(times, '2026-11-01')).toEqual([{ id: 'b', n: 2 }, { id: 'a', n: 1 }]);
    const o = overdue([p('a', 'A', null, true), p('c', 'C', null, true), p('d', 'D')], [t('2026-10-01', ['a'])], '2026-11-09');
    expect(o.map((x) => [x.person.id, x.gap])).toEqual([['c', null], ['a', 39]]);
    expect(socialMinutes(times).get('2026-11-08')).toBe(150);
    expect(socialDays(times, '2026-11-09')).toBe(1);
  });
});
