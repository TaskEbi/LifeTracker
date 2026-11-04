import { describe, expect, it } from 'vitest';
import { DEFAULT_SLEEP } from '../prefs';
import { isBedtime, nightOf, nightPlan, onOpen, seasonId } from './special';

const S = DEFAULT_SLEEP; // weekday 22:45–06:30, weekend 23:30–08:00, wind-down 30
const at = (date: string, hhmm: string) => ({ date, hour: +hhmm.slice(0, 2), minute: +hhmm.slice(3) });
const seen = (lastDate: string | null, night: string | null = null) => ({ lastDate, night });

describe('special moments on open', () => {
  it('says good morning once, on the first open of the day before 14:00', () => {
    expect(onOpen(at('2026-11-04', '07:10'), seen('2026-11-03'), S)).toEqual(['morning']);
    expect(onOpen(at('2026-11-04', '09:00'), seen('2026-11-04'), S)).toEqual([]);
    expect(onOpen(at('2026-11-04', '15:00'), seen('2026-11-03'), S)).toEqual([]);
    expect(onOpen(at('2026-11-04', '03:30'), seen('2026-11-03', '2026-11-03'), S)).toEqual([]);
  });

  it('says good night from the wind-down until 04:00, once per night', () => {
    // Wednesday night, school tomorrow: bed 22:45, wind-down from 22:15
    expect(onOpen(at('2026-11-04', '22:00'), seen('2026-11-04'), S)).toEqual([]);
    expect(onOpen(at('2026-11-04', '22:20'), seen('2026-11-04'), S)).toEqual(['night']);
    expect(onOpen(at('2026-11-04', '23:50'), seen('2026-11-04', '2026-11-04'), S)).toEqual([]);
    // after midnight it is still Wednesday's night
    expect(onOpen(at('2026-11-05', '01:15'), seen('2026-11-04', '2026-11-04'), S)).toEqual([]);
    expect(onOpen(at('2026-11-05', '01:15'), seen('2026-11-04'), S)).toEqual(['night']);
    // Friday night is a weekend night: bed 23:30, wind-down from 23:00
    expect(onOpen(at('2026-11-06', '22:30'), seen('2026-11-06'), S)).toEqual([]);
    expect(onOpen(at('2026-11-06', '23:05'), seen('2026-11-06'), S)).toEqual(['night']);
  });

  it('marks a new week, month, season and year against the last visit, biggest first', () => {
    expect(onOpen(at('2026-11-09', '16:00'), seen('2026-11-06'), S)).toEqual(['new-week']);
    expect(onOpen(at('2026-11-09', '08:00'), seen('2026-11-06'), S)).toEqual(['morning', 'new-week']);
    expect(onOpen(at('2026-11-02', '16:00'), seen('2026-10-30'), S)).toEqual(['new-month']);
    expect(onOpen(at('2026-12-01', '16:00'), seen('2026-11-30'), S)).toEqual(['new-season']);
    expect(onOpen(at('2027-01-01', '16:00'), seen('2026-12-31'), S)).toEqual(['new-year']);
    // nothing at all on a device's very first visit
    expect(onOpen(at('2026-11-09', '16:00'), seen(null), S)).toEqual([]);
    expect(onOpen(at('2026-11-09', '08:00'), seen(null), S)).toEqual([]);
    expect(onOpen(at('2026-11-09', '23:30'), seen(null), S)).toEqual([]);
    // never more than two
    expect(onOpen(at('2027-01-04', '08:00'), seen('2026-12-20'), S)).toHaveLength(2);
  });

  it('works out the night and its plan', () => {
    expect(nightOf('2026-11-05', 2)).toBe('2026-11-04');
    expect(nightOf('2026-11-05', 4)).toBe('2026-11-05');
    expect(nightPlan('2026-11-04', S)).toEqual({ bed: '22:45', wake: '06:30', hours: 7.8 });
    expect(nightPlan('2026-11-07', S)).toEqual({ bed: '23:30', wake: '08:00', hours: 8.5 });
    expect(isBedtime(12, 0, '2026-11-04', S)).toBe(false);
  });

  it('names the season', () => {
    expect(['2026-12-01', '2027-02-28', '2026-03-01', '2026-08-31', '2026-09-01'].map(seasonId)).toEqual(['winter', 'winter', 'spring', 'summer', 'autumn']);
  });
});
