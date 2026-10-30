import { describe, expect, it } from 'vitest';
import { convertZone, fromSchedule, parseScheduleBackup } from './scheduleImport';
import { occurrences } from './occurrences';
import type { LtEvent } from '../../data/types';

const SG = 'Asia/Singapore';
const stamp = { createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' };
const timed = (id: string, title: string, date: string, time: string, duration: number, extra: object = {}) => ({
  id, title, category: 'personal', notes: '', ...stamp, schedule: { kind: 'timed', date, time, zone: SG, duration }, ...extra,
});
const backup = (events: object[], exceptions: object[] = [], tasks: object[] = []) => JSON.stringify({ schemaVersion: 1, exportedAt: '2026-10-31T00:00:00Z', events, tasks, exceptions, settings: {} });
const run = (text: string) => fromSchedule(parseScheduleBackup(text), { zone: SG, today: '2026-10-31' });

/** Turn an imported event into a LifeTracker one so the calendar's own maths can check it. */
const asLt = (e: ReturnType<typeof run>['events'][number]): LtEvent => ({
  id: e.importId, title: e.title, section: null, kind: 'other', date: e.date, start: e.start, end: e.end, repeat: e.repeat, exceptions: e.exceptions,
  note: e.note, data: {}, cancelled_at: null, created_at: '', updated_at: '', deleted_at: null,
});

describe('Schedule backup import', () => {
  it('rejects files that are not a Schedule backup', () => {
    expect(() => parseScheduleBackup('nope')).toThrow(/not JSON/);
    expect(() => parseScheduleBackup('{"items":[]}')).toThrow(/not a Schedule backup/);
  });

  it('brings a one-off timed event across with its end time', () => {
    const r = run(backup([timed('a', 'Dentist', '2026-11-03', '15:30', 45, { notes: 'Bring forms' })]));
    expect(r.events).toEqual([expect.objectContaining({ importId: 'a', title: 'Dentist', date: '2026-11-03', start: '15:30', end: '16:15', repeat: null, note: 'Bring forms' })]);
  });

  it('keeps weekly repeats as one repeating event, with cancelled and moved days', () => {
    const lesson = timed('v', 'Violin', '2026-09-01', '17:00', 60, { recurrence: { kind: 'weekly', weekdays: [2, 4], until: '2026-12-31' } });
    const moved = timed('v', 'Violin', '2026-11-05', '18:00', 60);
    const r = run(backup([lesson], [{ seriesId: 'v', key: '2026-11-03T17:00', cancelled: true }, { seriesId: 'v', key: '2026-11-05T17:00', replacement: moved }]));
    expect(r.events).toHaveLength(1);
    expect(r.events[0].repeat).toEqual({ days: [1, 3], until: '2026-12-31' });
    const week = occurrences([asLt(r.events[0])], '2026-11-02', '2026-11-08');
    expect(week.map((o) => [o.date, o.start, o.end, o.cancelled])).toEqual([
      ['2026-11-03', '17:00', '18:00', true],
      ['2026-11-05', '18:00', '19:00', false],
    ]);
  });

  it('maps daily and weekday repeats onto weekdays', () => {
    const r = run(backup([
      timed('d', 'Read', '2026-10-01', '21:00', 30, { recurrence: { kind: 'daily' } }),
      timed('w', 'School', '2026-10-01', '08:00', 420, { recurrence: { kind: 'weekdays' } }),
    ]));
    expect(r.events.map((e) => e.repeat)).toEqual([{ days: [0, 1, 2, 3, 4, 5, 6], until: null }, { days: [0, 1, 2, 3, 4], until: null }]);
  });

  it('spells out monthly and every-other-week repeats as separate events', () => {
    const r = run(backup([
      timed('m', 'Haircut', '2026-01-31', '10:00', 30, { recurrence: { kind: 'monthly', until: '2026-04-30' } }),
      timed('f', 'Club', '2026-11-02', '16:00', 60, { recurrence: { kind: 'weekly', interval: 2, weekdays: [1], until: '2026-11-30' } }),
    ], [{ seriesId: 'm', key: '2026-03-31T10:00', cancelled: true }]));
    expect(r.events.filter((e) => e.title === 'Haircut').map((e) => e.date)).toEqual(['2026-01-31', '2026-02-28', '2026-04-30']);
    expect(r.events.filter((e) => e.title === 'Club').map((e) => e.date)).toEqual(['2026-11-02', '2026-11-16', '2026-11-30']);
    expect(r.events.every((e) => !e.repeat)).toBe(true);
    expect(r.warnings.join(' ')).toMatch(/separate events/);
  });

  it('turns a multi-day all-day event into a daily repeat through its last day', () => {
    const trip = { id: 't', title: 'Camp', category: 'personal', ...stamp, schedule: { kind: 'allDay', date: '2026-12-01', endDate: '2026-12-04' } };
    const r = run(backup([trip]));
    expect(r.events[0]).toMatchObject({ date: '2026-12-01', start: null, end: null, repeat: { days: [0, 1, 2, 3, 4, 5, 6], until: '2026-12-03' } });
  });

  it('keeps the start of an event that runs past midnight and notes the end', () => {
    const r = run(backup([timed('n', 'Flight', '2026-12-20', '23:00', 120)]));
    expect(r.events[0]).toMatchObject({ start: '23:00', end: null, note: 'Ends 01:00 the next day' });
  });

  it('moves times into the Daily Log time zone', () => {
    expect(convertZone('2026-11-03', '09:00', 'Asia/Tokyo', SG)).toEqual({ date: '2026-11-03', time: '08:00' });
    expect(convertZone('2026-11-03', '00:30', 'Asia/Tokyo', SG)).toEqual({ date: '2026-11-02', time: '23:30' });
    const r = run(backup([{ ...timed('j', 'Call', '2026-11-03', '00:30', 30, { recurrence: { kind: 'weekly', weekdays: [2] } }), schedule: { kind: 'timed', date: '2026-11-03', time: '00:30', zone: 'Asia/Tokyo', duration: 30 } }]));
    // Tuesday 00:30 in Tokyo is Monday 23:30 in Singapore.
    expect(r.events[0]).toMatchObject({ date: '2026-11-02', start: '23:30', repeat: { days: [0], until: null } });
  });

  it('brings tasks with their due dates and done state', () => {
    const r = run(backup([], [], [{ id: 'k', title: 'Pay fees', category: 'personal', ...stamp, dueDate: '2026-11-10', completedAt: '2026-11-09T05:00:00Z' }]));
    expect(r.tasks).toEqual([{ importId: 'k', title: 'Pay fees', due: '2026-11-10', done_at: '2026-11-09T05:00:00Z' }]);
  });
});
