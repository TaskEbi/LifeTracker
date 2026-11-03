/** 武器庫: shoes by the kilometre, strings by the hour. Wear comes from what you actually logged. */
import { useMemo, useState, type CSSProperties } from 'react';
import { registerSheet } from '../../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../../app/sheets';
import { progressInput, useToday } from '../../../data/lt';
import { deleteRecord } from '../../../data/records';
import { data } from '../../../data/store';
import { addTodo } from '../../../data/todoActions';
import { toast } from '../../../data/ui';
import { fmtWear, gearPreset, GEAR_PRESETS, wearOf, type Gear, type GearMetric, type GearSource } from '../../../domain/hq/gear';
import { shortDay } from '../../../domain/log/dates';
import { useStore } from '../../../lib/createStore';
import { Chips, H2, Source } from '../../../ui/i/bits';
import { Sheet } from '../../../ui/i/Sheet';
import { RoomHead } from '../HqView';
import { replaceGear, saveGear, useHq } from '../store';
import { wearEvents } from '../wearEvents';

const UNIT: Record<GearMetric, string> = { km: 'km', hours: 'hours', days: 'days' };
const SECTION_OF: Partial<Record<GearSource, 'sports' | 'violin' | 'gym'>> = { running: 'sports', cycling: 'sports', tennis: 'sports', volleyball: 'sports', violin: 'violin', gym: 'gym' };

function GearSheet({ spec }: { spec: SheetSpec }) {
  const today = useToday();
  const hq = useHq();
  const prev = spec.editId ? hq.gear.find((g) => g.id === spec.editId) : undefined;
  const [type, setType] = useState(prev?.type ?? 'shoes');
  const preset = gearPreset(type);
  const [name, setName] = useState(prev?.name ?? preset?.name ?? '');
  const [limit, setLimit] = useState(String(prev?.limit ?? preset?.limit ?? 100));
  const [since, setSince] = useState(prev?.since ?? today);
  const [baseline, setBaseline] = useState(String(prev?.baseline ?? 0));
  const metric: GearMetric = prev?.metric ?? preset?.metric ?? 'days';
  const source: GearSource = prev?.source ?? preset?.source ?? 'none';
  const choose = (id: string) => {
    setType(id);
    const p = gearPreset(id);
    if (p) {
      setName(p.name);
      setLimit(String(p.limit));
    }
  };
  const lim = Number(limit);
  const ok = name.trim() && lim > 0;
  return (
    <Sheet
      title={prev ? `Edit ${prev.name}` : 'Add to the rack'}
      onClose={closeSheet}
      footer={
        <>
          {prev && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(prev.id, 'Removed from the rack'), closeSheet())}>
              Remove
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!ok} onClick={() => (saveGear({ type, name: name.trim().slice(0, 60), metric, source, limit: lim, since, baseline: Number(baseline) || 0 }, prev?.id), closeSheet())}>
            Save
          </button>
        </>
      }
    >
      {!prev && <Chips label="What" value={type} onChange={choose} options={GEAR_PRESETS.map((p) => ({ id: p.id, label: p.name }))} />}
      {preset && <p className="i-note">{preset.tip}</p>}
      <label className="i-field">
        <span className="i-lab">Name it</span>
        <input data-autofocus className="i-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pegasus 41 · Evah Pirazzi set" maxLength={60} />
      </label>
      <label className="i-field">
        <span className="i-lab">Replace after ({UNIT[metric]})</span>
        <input className="i-input" inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ''))} />
      </label>
      <label className="i-field">
        <span className="i-lab">In use since</span>
        <input className="i-input" type="date" value={since} max={today} onChange={(e) => e.target.value && setSince(e.target.value)} />
      </label>
      {metric !== 'days' && (
        <label className="i-field">
          <span className="i-lab">{UNIT[metric][0].toUpperCase() + UNIT[metric].slice(1)} it had already done then</span>
          <input className="i-input" inputMode="numeric" value={baseline} onChange={(e) => setBaseline(e.target.value.replace(/\D/g, ''))} />
        </label>
      )}
    </Sheet>
  );
}
registerSheet('hq-gear', GearSheet);

function GearCard({ g, today, events }: { g: Gear; today: string; events: ReturnType<typeof wearEvents> }) {
  const w = wearOf(g, events, today);
  const preset = gearPreset(g.type);
  const [asking, setAsking] = useState(false);
  const pct = Math.min(1, w.pct);
  return (
    <article className={`hq-gear is-${w.status}`}>
      <button type="button" className="hq-gear__main" onClick={() => openSheet({ type: 'hq-gear', editId: g.id })}>
        <span className="hq-gear__ico" aria-hidden="true">
          {preset?.icon ?? '具'}
        </span>
        <span className="hq-gear__t">
          <b>{g.name}</b>
          <small>
            {fmtWear(g.metric, w.used)} of {fmtWear(g.metric, g.limit)}
            {w.status === 'due' ? ' · time to replace' : w.dueDate ? ` · about ${shortDay(w.dueDate, today)}` : ''}
          </small>
        </span>
        <b className="hq-gear__pct i-mono">{Math.round(w.pct * 100)}%</b>
      </button>
      <span className="hq-gear__bar" role="progressbar" aria-label={`${g.name} wear`} aria-valuenow={Math.round(w.pct * 100)} aria-valuemin={0} aria-valuemax={100} style={{ '--p': `${pct * 100}%` } as CSSProperties}>
        <i />
      </span>
      <div className="hq-gear__acts">
        {asking ? (
          <>
            <span className="i-note">Start counting again from today?</span>
            <button
              type="button"
              className="i-btn i-btn--sm i-btn--sig"
              onClick={() => {
                replaceGear(g, w.used, today);
                setAsking(false);
                toast(`${g.name}: counting from today`);
              }}
            >
              Replaced it
            </button>
            <button type="button" className="i-btn i-btn--sm" onClick={() => setAsking(false)}>
              Not yet
            </button>
          </>
        ) : (
          <>
            <button type="button" className="i-btn i-btn--sm" onClick={() => setAsking(true)}>
              Replaced
            </button>
            {w.status !== 'fresh' && (
              <button
                type="button"
                className="i-btn i-btn--sm"
                onClick={() => {
                  const made = addTodo({ title: `Replace ${g.name}`, priority: 'normal', due: null, section: SECTION_OF[g.source] ?? null });
                  toast('error' in made ? made.error : 'Added to your tasks');
                }}
              >
                Make it a task
              </button>
            )}
          </>
        )}
      </div>
      {g.past.length > 0 && <small className="hq-gear__past">Before: {g.past.slice(0, 3).map((p) => `${p.name}, ${fmtWear(g.metric, p.used)} to ${shortDay(p.until, today)}`).join(' · ')}</small>}
    </article>
  );
}

export function ArmouryRoom() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const hq = useHq();
  const events = useMemo(() => wearEvents(progressInput(st, today)), [st, today]);
  const sorted = useMemo(() => [...hq.gear].sort((a, b) => wearOf(b, events, today).pct - wearOf(a, events, today).pct), [hq.gear, events, today]);
  return (
    <div>
      <RoomHead room="armoury" />
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'hq-gear' })}>
        + Add to the rack
      </button>
      {sorted.length ? (
        <>
          <H2 aside={`${sorted.length} on the rack`}>Most worn first</H2>
          <div className="hq-rack">
            {sorted.map((g) => (
              <GearCard key={g.id} g={g} today={today} events={events} />
            ))}
          </div>
          <Source kind="live">Counted from your log since each one came into use: every run counts for every pair of running shoes on the rack. Limits are common guidelines; change them to suit.</Source>
        </>
      ) : (
        <p className="i-note" style={{ marginTop: 10 }}>
          Add your running shoes, violin strings and bow. The kilometres and hours you’ve logged since you got them wear them down, so you find out before your shins do.
        </p>
      )}
    </div>
  );
}
