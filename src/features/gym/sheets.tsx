import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { ltToday, sectionEntries } from '../../data/lt';
import { deleteSession } from '../../data/sessions';
import { data } from '../../data/store';
import { addDays, shortDay } from '../../domain/log/dates';
import { Stepper, Toggle } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { saveGym } from './actions';
import { isGymDetail, MUSCLES, musclesOf, type GymDetail, type MuscleId } from './model';

function Scale({ label, values, value, onChange }: { label: string; values: number[]; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="i-field">
      <span className="i-lab">{label}</span>
      <div className="i-n5" role="group" aria-label={label}>
        {values.map((v) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(value === v ? null : v)}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Log a session (pick the muscle groups), or edit one. Old sessions keep their sets on show. */
function LogSheet({ spec }: { spec: SheetSpec }) {
  const editId = (spec.editId as string | undefined) ?? null;
  const today = ltToday();
  const s = editId ? sectionEntries<GymDetail>(data.get(), 'gym').find((x) => x.entry.id === editId) : undefined;
  const d = s && isGymDetail(s.detail) ? s.detail : null;
  const [muscles, setMuscles] = useState<MuscleId[]>(() => musclesOf(d));
  const [date, setDate] = useState(s?.entry.date ?? today);
  const [minutes, setMinutes] = useState(s?.entry.minutes ?? 60);
  const [effort, setEffort] = useState<number | null>(d?.effort ?? null);
  const [soreness, setSoreness] = useState<number | null>(d?.soreness ?? null);
  const [pain, setPain] = useState(d?.pain === true);
  const [painNote, setPainNote] = useState(d?.painNote ?? '');
  const [note, setNote] = useState(s?.entry.note ?? '');
  const [error, setError] = useState<string | null>(null);
  if (editId && !s) return null;

  const toggle = (id: MuscleId) => setMuscles((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const save = () => {
    const err = saveGym({ date, minutes, muscles, effort, soreness, pain, painNote, note }, editId, d);
    if (err) setError(err);
    else closeSheet();
  };
  const yesterday = addDays(today, -1);

  return (
    <Sheet
      title={editId ? 'Edit gym session' : 'Log gym'}
      onClose={closeSheet}
      accent="gym"
      footer={
        <>
          {editId && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteSession(editId, 'Gym session deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <div className="i-field">
        <span className="i-lab">Muscle groups you hit</span>
        <div className="i-picks" role="group" aria-label="Muscle groups">
          {MUSCLES.map((m) => (
            <button key={m.id} type="button" className="i-pick" aria-pressed={muscles.includes(m.id)} onClick={() => toggle(m.id)}>
              {m.name}
            </button>
          ))}
        </div>
      </div>
      {d && d.exercises.length > 0 && (
        <div className="i-rows">
          <p className="i-note">Logged with a workout template, before groups were recorded.</p>
          {d.exercises.map((e, i) => (
            <div key={i} className="i-row" style={{ minHeight: 40 }}>
              <span className="i-row__t">{e.name}</span>
              <span className="i-row__n i-small">{e.sets.filter((x) => x.done).map((x) => `${x.reps}×${x.weight || 'BW'}`).join(' ') || '—'}</span>
            </div>
          ))}
        </div>
      )}
      <div className="i-kv">
        <span>Duration</span>
        <Stepper value={`${minutes} min`} label="duration" onStep={(x) => setMinutes(Math.max(5, Math.min(360, minutes + 5 * x)))} />
      </div>
      <div className="i-field">
        <span className="i-lab">Day</span>
        <div className="i-picks" role="group" aria-label="Day">
          <button type="button" className="i-pick" aria-pressed={date === today} onClick={() => setDate(today)}>Today</button>
          <button type="button" className="i-pick" aria-pressed={date === yesterday} onClick={() => setDate(yesterday)}>Yesterday</button>
        </div>
        <input className="i-input" type="date" aria-label="Day" max={today} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        {date !== today && <p className="i-mono i-small i-dim">{shortDay(date)}</p>}
      </div>
      <p className="i-note">The rest is optional. It helps plan around sport and recovery.</p>
      <Scale label="Effort (1 easy – 10 max)" values={[5, 6, 7, 8, 9]} value={effort} onChange={setEffort} />
      <Scale label="Soreness (0 none – 4 a lot)" values={[0, 1, 2, 3, 4]} value={soreness} onChange={setSoreness} />
      <Toggle on={pain} label="Any pain?" hint="e.g. shins, a joint" onChange={setPain} />
      {pain && <input className="i-input" value={painNote} maxLength={200} onChange={(e) => setPainNote(e.target.value)} placeholder="Where, and what made it worse?" aria-label="Pain details" />}
      <label className="i-field">
        <span className="i-lab">Note · optional</span>
        <input className="i-input" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
      </label>
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}

registerSheet('gym-log', LogSheet);
