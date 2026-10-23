import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { getSleepSchedule, ltToday } from '../../data/lt';
import { data } from '../../data/store';
import { addDays, shortDay } from '../../domain/log/dates';
import { Stepper, Toggle } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { formatMinutes } from '../../domain/log/duration';
import { clearNight, nightId, saveNight } from './actions';
import { durationOf, fromMin, nightsFrom, plannedFor, toMin } from './model';

/** Log (or correct) a night: bed and wake, or just the total, plus an optional score. */
function SleepSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const st = data.get();
  const [date, setDate] = useState((spec.date as string) ?? today);
  const existing = nightsFrom(st.log_metrics.values(), st.lt_nights.values()).find((n) => n.date === date);
  const plan = plannedFor(date, getSleepSchedule());
  const [bed, setBed] = useState(existing?.bed ?? plan.bed);
  const [wake, setWake] = useState(existing?.wake ?? plan.wake);
  const [timesKnown, setTimesKnown] = useState(existing ? !!existing.bed : true);
  const [minutes, setMinutes] = useState(existing?.minutes ?? 480);
  const [score, setScore] = useState<number | null>(existing?.score ?? null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const pickDate = (d: string) => {
    setDate(d);
    const ex = nightsFrom(st.log_metrics.values(), st.lt_nights.values()).find((n) => n.date === d);
    const p = plannedFor(d, getSleepSchedule());
    setBed(ex?.bed ?? p.bed);
    setWake(ex?.wake ?? p.wake);
    setTimesKnown(ex ? !!ex.bed : true);
    setMinutes(ex?.minutes ?? 480);
    setScore(ex?.score ?? null);
  };
  const total = timesKnown ? durationOf(bed, wake) : minutes;
  const hadTimes = !!st.lt_nights.get(nightId(date)) && !st.lt_nights.get(nightId(date))!.deleted_at;

  const save = () => {
    const err = saveNight({ date, bed: timesKnown ? bed : null, wake: timesKnown ? wake : null, minutes, score });
    if (err) setError(err);
    else closeSheet();
  };

  return (
    <Sheet
      title={existing ? 'CH07 · edit night' : 'CH07 · log sleep'}
      onClose={closeSheet}
      accent="sleep"
      footer={
        <>
          {existing && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (clearNight(date), closeSheet())}>
              Clear
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
            Save {formatMinutes(total)}
          </button>
        </>
      }
    >
      <div className="i-picks" role="group" aria-label="Which night">
        {[today, addDays(today, -1), addDays(today, -2)].map((d, i) => (
          <button key={d} type="button" className="i-pick" aria-pressed={date === d} onClick={() => pickDate(d)}>
            {i === 0 ? 'Last night' : `${shortDay(addDays(d, -1))} night`}
          </button>
        ))}
      </div>
      <p className="i-mono i-small i-mid">
        NIGHT BEFORE {shortDay(date).toUpperCase()} · PLAN {plan.bed}–{plan.wake}
      </p>
      {timesKnown ? (
        <div className="s-pair">
          {(
            [
              ['Bed', bed, setBed],
              ['Wake', wake, setWake],
            ] as const
          ).map(([label, v, set]) => (
            <div key={label} className="s-time">
              <span className="i-lab">{label}</span>
              <b className="i-mono">{v}</b>
              <span className="i-btns">
                <button type="button" className="i-btn i-btn--sm" onClick={() => (set(fromMin(toMin(v) - 15)), setDirty(true))} aria-label={`${label} 15 minutes earlier`}>
                  −15
                </button>
                <button type="button" className="i-btn i-btn--sm" onClick={() => (set(fromMin(toMin(v) + 15)), setDirty(true))} aria-label={`${label} 15 minutes later`}>
                  +15
                </button>
              </span>
              <input className="i-input" type="time" value={v} onChange={(e) => e.target.value && (set(e.target.value), setDirty(true))} aria-label={`${label} time`} style={{ minHeight: 40, textAlign: 'center' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="i-kv">
          <span>Total asleep</span>
          <Stepper value={formatMinutes(minutes)} label="total sleep" onStep={(s) => setMinutes(Math.max(30, Math.min(1200, minutes + 15 * s)))} />
        </div>
      )}
      <p className="i-mono">Δ {formatMinutes(total)} asleep</p>
      <Toggle on={timesKnown} label="I know when I went to bed and woke" hint="times give the bedtime-consistency stats" onChange={setTimesKnown} />
      <div className="i-kv">
        <span>
          Sleep score · optional
          <br />
          <span className="i-mono i-small i-dim">from a watch or app, 0–100</span>
        </span>
        <span className="i-btns" style={{ alignItems: 'center' }}>
          <Stepper value={score == null ? '—' : score} label="sleep score" onStep={(s) => setScore(Math.max(0, Math.min(100, (score ?? 75) + (score == null ? 0 : 5 * s))))} />
          {score != null && (
            <button type="button" className="i-btn i-btn--sm" onClick={() => setScore(null)}>
              None
            </button>
          )}
        </span>
      </div>
      {hadTimes && !timesKnown && <p className="i-note">Saving without times removes the bed and wake times kept for this night.</p>}
      {!dirty && !existing && <p className="i-note">Times start at your planned bedtime and wake-up. Adjust them to what actually happened.</p>}
      {error && (
        <p className="i-error" role="alert">
          {error}
        </p>
      )}
      <p className="i-note">Manual entry. A Garmin sleep import isn't built.</p>
    </Sheet>
  );
}

registerSheet('sleep', SleepSheet);
