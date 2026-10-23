import { addDays, shortDay } from '../../domain/log/dates';
import { formatMinutes } from '../../domain/log/duration';

/** Today / yesterday / two days ago, or any earlier day. */
export function DayPick({ value, onChange, today }: { value: string; onChange: (d: string) => void; today: string }) {
  return (
    <div className="i-field">
      <span className="i-lab">Day</span>
      <div className="i-picks" role="group" aria-label="Day">
        {[today, addDays(today, -1), addDays(today, -2)].map((d, i) => (
          <button key={d} type="button" className="i-pick" aria-pressed={value === d} onClick={() => onChange(d)}>
            {i === 0 ? 'Today' : i === 1 ? 'Yesterday' : shortDay(d)}
          </button>
        ))}
        <input className="i-input" type="date" max={today} value={value} onChange={(e) => e.target.value && onChange(e.target.value)} aria-label="Another day" style={{ width: 'auto', minHeight: 42 }} />
      </div>
    </div>
  );
}

/** Minutes with ±5 buttons and common presets. */
export function MinutesField({ value, onChange, presets = [15, 30, 45, 60, 90] }: { value: number; onChange: (m: number) => void; presets?: number[] }) {
  return (
    <div className="i-field">
      <div className="i-dial">
        <button type="button" className="i-sq" onClick={() => onChange(Math.max(5, value - 5))} aria-label="5 minutes less">
          −5
        </button>
        <output aria-live="polite" style={{ fontSize: 44 }}>
          {value}
          <small>minutes · {formatMinutes(value)}</small>
        </output>
        <button type="button" className="i-sq" onClick={() => onChange(Math.min(1440, value + 5))} aria-label="5 minutes more">
          +5
        </button>
      </div>
      <div className="i-picks" style={{ justifyContent: 'center' }} role="group" aria-label="Common durations">
        {presets.map((m) => (
          <button key={m} type="button" className="i-pick i-mono" aria-pressed={value === m} onClick={() => onChange(m)}>
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
