/** Repeat rule editor shared by new events and tasks: how often, which days, and when it ends. */
import type { Repeat, RepeatFreq } from '../../data/types';
import { nthOn, nthWeekday, repeatLabel } from '../../domain/calendar/repeat';
import { dayOfMonth, shortDay, weekdayIndex } from '../../domain/log/dates';
import { Picks, Stepper } from '../../ui/i/bits';

export interface RepeatState {
  freq: RepeatFreq | 'none';
  every: number;
  days: number[];
  by: 'date' | 'weekday';
  ends: 'never' | 'on' | 'after';
  until: string;
  count: number;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const UNIT: Record<RepeatFreq, string> = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' };
const NTH = ['', '1st', '2nd', '3rd', '4th'];
const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;

export const noRepeat = (anchor: string): RepeatState => ({ freq: 'none', every: 1, days: [weekdayIndex(anchor)], by: 'date', ends: 'never', until: '', count: 10 });

export function repeatState(r: Repeat | null | undefined, anchor: string): RepeatState {
  if (!r) return noRepeat(anchor);
  return { freq: r.freq ?? 'weekly', every: r.every ?? 1, days: r.days.length ? r.days : [weekdayIndex(anchor)], by: r.by ?? 'date', ends: r.until ? 'on' : 'never', until: r.until ?? '', count: 10 };
}

/** The rule to save (null when it doesn't repeat) and the "after n times" count, if any. */
export function toRepeat(s: RepeatState): { repeat: Repeat | null; count: number | null } {
  if (s.freq === 'none') return { repeat: null, count: null };
  const repeat: Repeat = { freq: s.freq, every: s.every, days: s.freq === 'weekly' ? [...s.days].sort() : [], until: s.ends === 'on' && s.until ? s.until : null };
  if (s.freq === 'monthly') repeat.by = s.by;
  return { repeat, count: s.ends === 'after' ? s.count : null };
}

export function RepeatPicker({ value: s, anchor, onChange, ends = true }: { value: RepeatState; anchor: string; onChange: (s: RepeatState) => void; ends?: boolean }) {
  const set = (p: Partial<RepeatState>) => onChange({ ...s, ...p });
  const { repeat, count } = toRepeat(s);
  const last = repeat && count ? nthOn(repeat, anchor, count) : null;
  const n = nthWeekday(anchor);
  return (
    <div className="i-field">
      <span className="i-lab">Repeat</span>
      <Picks
        label="Repeat"
        value={s.freq}
        onChange={(freq) => set({ freq, days: s.days.length ? s.days : [weekdayIndex(anchor)] })}
        options={[{ id: 'none', label: 'Never' }, { id: 'daily', label: 'Daily' }, { id: 'weekly', label: 'Weekly' }, { id: 'monthly', label: 'Monthly' }, { id: 'yearly', label: 'Yearly' }]}
      />
      {s.freq !== 'none' && (
        <div className="i-pnl i-pnl--flush" style={{ marginTop: 8 }}>
          <div className="i-kv">
            <span>Every</span>
            <Stepper value={`${s.every} ${UNIT[s.freq]}${s.every > 1 ? 's' : ''}`} label="interval" onStep={(d) => set({ every: Math.min(99, Math.max(1, s.every + d)) })} />
          </div>
          {s.freq === 'weekly' && (
            <div style={{ padding: '6px 0 10px' }}>
              <div className="i-picks" role="group" aria-label="Repeat on">
                {DAYS.map((d, i) => (
                  <button key={d} type="button" className="i-pick" aria-pressed={s.days.includes(i)} onClick={() => set({ days: s.days.includes(i) ? s.days.filter((x) => x !== i) : [...s.days, i] })}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="i-btns" style={{ marginTop: 6 }}>
                <button type="button" className="i-link" onClick={() => set({ days: [0, 1, 2, 3, 4] })}>Mon–Fri</button>
                <button type="button" className="i-link" onClick={() => set({ days: [5, 6] })}>Weekend</button>
                <button type="button" className="i-link" onClick={() => set({ days: [0, 1, 2, 3, 4, 5, 6] })}>Every day</button>
              </div>
            </div>
          )}
          {s.freq === 'monthly' && (
            <div style={{ padding: '6px 0 10px' }}>
              <Picks
                label="Monthly on"
                value={s.by}
                onChange={(by) => set({ by })}
                options={[{ id: 'date', label: `On the ${ordinal(dayOfMonth(anchor))}` }, { id: 'weekday', label: `On the ${n === -1 ? 'last' : NTH[n]} ${DAYS[weekdayIndex(anchor)]}` }]}
              />
            </div>
          )}
          {ends && (
            <>
              <div className="i-kv">
                <span>Ends</span>
                <Picks label="Ends" value={s.ends} onChange={(e) => set({ ends: e })} options={[{ id: 'never', label: 'Never' }, { id: 'on', label: 'On a day' }, { id: 'after', label: 'After…' }]} />
              </div>
              {s.ends === 'on' && (
                <label className="i-kv">
                  <span>Last day</span>
                  <input className="i-input" type="date" value={s.until} min={anchor} onChange={(e) => set({ until: e.target.value })} style={{ width: 'auto', minHeight: 42 }} />
                </label>
              )}
              {s.ends === 'after' && (
                <div className="i-kv">
                  <span>Times</span>
                  <Stepper value={s.count} label="times" onStep={(d) => set({ count: Math.min(500, Math.max(1, s.count + d * (s.count >= 20 ? 5 : 1))) })} />
                </div>
              )}
            </>
          )}
          {repeat && (
            <p className="i-note" style={{ padding: '8px 0' }}>
              {repeatLabel(repeat, anchor)}
              {repeat.until ? ` · until ${shortDay(repeat.until, anchor)}` : ''}
              {last ? ` · ${count} times, last on ${shortDay(last, anchor)}` : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
