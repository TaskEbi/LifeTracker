import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { ltToday, sectionEntries, sectionRecords } from '../../data/lt';
import { deleteRecord, saveRecord, setArchived } from '../../data/records';
import { deleteSession, saveSession } from '../../data/sessions';
import { data } from '../../data/store';
import { addDays, shortDay } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { Stepper, Toggle } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { createEvent } from '../calendar/actions';
import { active, elapsedMinutes, finishWorkout, swapExercise } from './active';
import { isGymDetail, setsDone, setsTotal, templateOf, type GymDetail, type PlanExercise } from './model';

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

function FinishSheet() {
  const a = useStore(active, (s) => s.a);
  const [minutes, setMinutes] = useState(() => (a ? elapsedMinutes(a) : 60));
  const [effort, setEffort] = useState<number | null>(null);
  const [soreness, setSoreness] = useState<number | null>(null);
  const [pain, setPain] = useState(false);
  const [painNote, setPainNote] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  if (!a) return null;
  const done = setsDone(a.detail);
  return (
    <Sheet
      title="Check-in"
      onClose={closeSheet}
      accent="gym"
      footer={
        <button
          type="button"
          className="i-btn i-btn--sig i-btn--block"
          onClick={() => {
            const err = finishWorkout({ minutes, effort, soreness, pain, painNote, note });
            if (err) setError(err);
            else closeSheet();
          }}
        >
          Save session
        </button>
      }
    >
      <p className="i-mono i-small i-mid">
        {a.detail.name.toUpperCase()} · {done}/{setsTotal(a.detail)} SETS DONE
      </p>
      <div className="i-kv">
        <span>Duration</span>
        <Stepper value={`${minutes} min`} label="duration" onStep={(s) => setMinutes(Math.max(5, minutes + 5 * s))} />
      </div>
      <p className="i-note">The rest is optional. It helps plan the next sessions around sport and recovery.</p>
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

function SwapSheet({ spec }: { spec: SheetSpec }) {
  const a = active.get().a;
  const ei = spec.ei as number;
  const e = a?.detail.exercises[ei];
  const [custom, setCustom] = useState('');
  if (!e) return null;
  const pick = (name: string) => {
    swapExercise(ei, name);
    closeSheet();
  };
  return (
    <Sheet title="Swap exercise" onClose={closeSheet} accent="gym">
      <p className="i-mono i-small i-mid">REPLACE {e.name.toUpperCase()} · TODAY ONLY · SETS AND WEIGHTS STAY</p>
      <div className="i-rows">
        {e.alts.map((alt) => (
          <button key={alt} type="button" className="i-row" onClick={() => pick(alt)}>
            <span className="i-row__t">{alt}</span>
            <span className="i-row__n">↵</span>
          </button>
        ))}
      </div>
      <span style={{ display: 'flex', gap: 6 }}>
        <input className="i-input" value={custom} onChange={(ev) => setCustom(ev.target.value)} placeholder="Another exercise" aria-label="Another exercise" maxLength={60} />
        <button type="button" className="i-btn i-btn--sm" disabled={!custom.trim()} onClick={() => pick(custom.trim())}>
          Use
        </button>
      </span>
    </Sheet>
  );
}

function TemplateSheet({ spec }: { spec: SheetSpec }) {
  const editId = (spec.editId as string | undefined) ?? null;
  const rec = editId ? data.get().lt_records.get(editId) : undefined;
  const t = rec ? templateOf(rec) : null;
  const [name, setName] = useState(t?.name ?? '');
  const [focus, setFocus] = useState(t?.focus ?? '');
  const [estimate, setEstimate] = useState(t?.estimate ?? 60);
  const [exercises, setExercises] = useState<PlanExercise[]>(t?.exercises ?? []);
  const [newEx, setNewEx] = useState('');
  const patch = (i: number, p: Partial<PlanExercise>) => setExercises(exercises.map((e, j) => (j === i ? { ...e, ...p } : e)));
  const save = () => {
    if (!name.trim()) return;
    saveRecord('gym', 'gym_template', { name: name.trim().slice(0, 40), focus: focus.trim().slice(0, 60), estimate, exercises }, rec?.id);
    closeSheet();
  };
  return (
    <Sheet
      title={rec ? 'Edit template' : 'New template'}
      onClose={closeSheet}
      accent="gym"
      footer={
        <>
          {rec && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(rec.id, 'Template deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save} disabled={!name.trim()}>
            Save template
          </button>
        </>
      }
    >
      <label className="i-field">
        <span className="i-lab">Name</span>
        <input className="i-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Upper A" maxLength={40} />
      </label>
      <label className="i-field">
        <span className="i-lab">Focus · optional</span>
        <input className="i-input" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Push and pull" maxLength={60} />
      </label>
      <div className="i-kv">
        <span>About</span>
        <Stepper value={`${estimate} min`} label="estimated length" onStep={(s) => setEstimate(Math.max(15, Math.min(180, estimate + 5 * s)))} />
      </div>
      {exercises.map((e, i) => (
        <div key={i} className="i-pnl i-stack" style={{ padding: 10 }}>
          <span style={{ display: 'flex', gap: 6 }}>
            <input className="i-input" value={e.name} onChange={(ev) => patch(i, { name: ev.target.value })} aria-label={`Exercise ${i + 1} name`} maxLength={60} />
            <button type="button" className="i-btn i-btn--sm" onClick={() => setExercises(exercises.filter((_, j) => j !== i))} aria-label={`Remove ${e.name}`}>
              ✕
            </button>
          </span>
          <div className="i-kv"><span>Sets</span><Stepper value={e.sets} label={`${e.name} sets`} onStep={(s) => patch(i, { sets: Math.max(1, Math.min(10, e.sets + s)) })} /></div>
          <div className="i-kv"><span>{e.unit === 's' ? 'Seconds' : 'Reps'}</span><Stepper value={e.reps} label={`${e.name} reps`} onStep={(s) => patch(i, { reps: Math.max(1, e.reps + (e.unit === 's' ? 5 : 1) * s) })} /></div>
          <div className="i-kv"><span>Weight</span><Stepper value={e.weight ? `${e.weight} kg` : 'body'} label={`${e.name} weight`} onStep={(s) => patch(i, { weight: Math.max(0, e.weight + 2.5 * s) })} /></div>
          <div className="i-kv"><span>Rest</span><Stepper value={`${e.rest}s`} label={`${e.name} rest`} onStep={(s) => patch(i, { rest: Math.max(0, e.rest + 15 * s) })} /></div>
        </div>
      ))}
      <span style={{ display: 'flex', gap: 6 }}>
        <input className="i-input" value={newEx} onChange={(e) => setNewEx(e.target.value)} placeholder="Add an exercise" aria-label="New exercise" maxLength={60} />
        <button type="button" className="i-btn i-btn--sm" disabled={!newEx.trim()} onClick={() => (setExercises([...exercises, { name: newEx.trim(), sets: 3, reps: 10, weight: 0, rest: 90, alts: [] }]), setNewEx(''))}>
          Add
        </button>
      </span>
      {rec && (
        <button type="button" className="i-link" onClick={() => (setArchived(rec.id, !t!.archived), closeSheet())}>
          {t!.archived ? 'Use again' : 'Archive (keeps history)'}
        </button>
      )}
    </Sheet>
  );
}

function PlanSheet() {
  const today = ltToday();
  const templates = sectionRecords(data.get(), 'gym', 'gym_template').map(templateOf).filter((t) => !t.archived);
  const [tid, setTid] = useState(templates[0]?.id ?? '');
  const [date, setDate] = useState(today);
  const [start, setStart] = useState('16:00');
  const [error, setError] = useState<string | null>(null);
  const t = templates.find((x) => x.id === tid);
  const end = (() => {
    const m = +start.slice(0, 2) * 60 + +start.slice(3) + (t?.estimate ?? 60);
    return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  })();
  return (
    <Sheet
      title="Plan a gym session"
      onClose={closeSheet}
      accent="gym"
      footer={
        <button
          type="button"
          className="i-btn i-btn--sig i-btn--block"
          disabled={!t}
          onClick={() => {
            const made = createEvent({ title: `Gym — ${t!.name}`, section: 'gym', kind: 'session', date, start, end: end > start ? end : '23:45', repeat: null, note: '', data: { template: t!.id } });
            if ('error' in made) setError(made.error);
            else closeSheet();
          }}
        >
          Add to calendar
        </button>
      }
    >
      {templates.length ? (
        <div className="i-picks" role="group" aria-label="Template">
          {templates.map((x) => (
            <button key={x.id} type="button" className="i-pick" aria-pressed={x.id === tid} onClick={() => setTid(x.id)}>
              {x.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="i-note">Make a template first.</p>
      )}
      <div className="i-picks" role="group" aria-label="Day">
        {Array.from({ length: 7 }, (_, i) => addDays(today, i)).map((d) => (
          <button key={d} type="button" className="i-pick" aria-pressed={d === date} onClick={() => setDate(d)}>
            {shortDay(d)}
          </button>
        ))}
      </div>
      <div className="i-kv">
        <span>Starts</span>
        <Stepper value={`${start}–${end}`} label="start time" onStep={(s) => {
          const m = (+start.slice(0, 2) * 60 + +start.slice(3) + 15 * s + 1440) % 1440;
          setStart(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
        }} />
      </div>
      <p className="i-note">Clashes with other events are flagged in the calendar; nothing moves on its own.</p>
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}

function EditSessionSheet({ spec }: { spec: SheetSpec }) {
  const id = spec.editId as string;
  const s = sectionEntries<GymDetail>(data.get(), 'gym').find((x) => x.entry.id === id);
  const d = s && isGymDetail(s.detail) ? s.detail : null;
  const [minutes, setMinutes] = useState(s?.entry.minutes ?? 60);
  const [date, setDate] = useState(s?.entry.date ?? ltToday());
  const [effort, setEffort] = useState<number | null>(d?.effort ?? null);
  const [soreness, setSoreness] = useState<number | null>(d?.soreness ?? null);
  const [note, setNote] = useState(s?.entry.note ?? '');
  const [error, setError] = useState<string | null>(null);
  if (!s) return null;
  return (
    <Sheet
      title={`Edit ${d?.name ?? 'gym session'}`}
      onClose={closeSheet}
      accent="gym"
      footer={
        <>
          <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteSession(id, 'Gym session deleted'), closeSheet())}>
            Delete
          </button>
          <button
            type="button"
            className="i-btn i-btn--sig i-btn--block"
            onClick={() => {
              const r = saveSession({ section: 'gym', date, minutes, note, detail: d ? { ...d, effort, soreness } : null }, id);
              if ('error' in r) setError(r.error);
              else closeSheet();
            }}
          >
            Save
          </button>
        </>
      }
    >
      {d && (
        <div className="i-rows">
          {d.exercises.map((e, i) => (
            <div key={i} className="i-row" style={{ minHeight: 40 }}>
              <span className="i-row__t">
                {e.name}
                {e.swappedFrom ? <small>instead of {e.swappedFrom}</small> : null}
              </span>
              <span className="i-row__n i-small">{e.sets.filter((x) => x.done).map((x) => `${x.reps}×${x.weight || 'BW'}`).join(' ') || '—'}</span>
            </div>
          ))}
        </div>
      )}
      <div className="i-kv"><span>Duration</span><Stepper value={`${minutes} min`} label="duration" onStep={(x) => setMinutes(Math.max(5, minutes + 5 * x))} /></div>
      <label className="i-kv">
        <span>Day</span>
        <input className="i-input" type="date" max={ltToday()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} style={{ width: 'auto', minHeight: 42 }} />
      </label>
      {d && <Scale label="Effort" values={[5, 6, 7, 8, 9]} value={effort} onChange={setEffort} />}
      {d && <Scale label="Soreness" values={[0, 1, 2, 3, 4]} value={soreness} onChange={setSoreness} />}
      <label className="i-field">
        <span className="i-lab">Note</span>
        <input className="i-input" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
      </label>
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}

registerSheet('gym-finish', FinishSheet);
registerSheet('gym-swap', SwapSheet);
registerSheet('gym-template', TemplateSheet);
registerSheet('gym-plan', PlanSheet);
registerSheet('gym-edit', EditSessionSheet);
