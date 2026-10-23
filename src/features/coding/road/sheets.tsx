/** Road to IOI sheets: a stage (date, target, cleared), one of the season's other contests, and the page's setup. */
import { useState } from 'react';
import { registerSheet } from '../../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../../app/sheets';
import { ltToday } from '../../../data/lt';
import { data } from '../../../data/store';
import { DEFAULT_DRAGON_URL, type RoadStageId } from '../../../data/types';
import { isDate, monthName, rangeLabel, shortDay } from '../../../domain/log/dates';
import { MAX_NOTE } from '../../../domain/log/validate';
import { useStore } from '../../../lib/createStore';
import { Toggle } from '../../../ui/i/bits';
import { Sheet } from '../../../ui/i/Sheet';
import { seasonCalendar, SEASON_EVENTS } from './calendar';
import { dragon, dragonBase, fetchDragon, forgetDragon } from './dragon';
import { STAGE_INFO, stageWhen } from './rules';
import { setRoad } from './setRoad';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function StageSheet({ spec }: { spec: SheetSpec }) {
  const id = spec.id as RoadStageId;
  const today = ltToday();
  const stage = data.get().settings.road.stages[id];
  const summary = data.get().settings.road.dragon_key ? dragon.get().summary : null;
  const filled = !stage.date ? stageWhen(id, stage, summary, today) : null;
  const [date, setDate] = useState(stage.date ?? filled?.date ?? '');
  const [time, setTime] = useState(stage.time ?? filled?.time ?? '');
  const [target, setTarget] = useState(stage.target);
  const [reason, setReason] = useState(stage.reason);
  const [cleared, setCleared] = useState(!!stage.cleared_on);
  const [clearedOn, setClearedOn] = useState(stage.cleared_on ?? (stage.date && stage.date <= today ? stage.date : today));
  const [memory, setMemory] = useState(stage.memory);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (date && !isDate(date)) return setError('That date is not valid.');
    if (time && !TIME.test(time)) return setError('Use a time like 13:00.');
    if (cleared && (!isDate(clearedOn) || clearedOn > today)) return setError('The day you qualified is today or earlier.');
    const road = data.get().settings.road;
    setRoad({
      stages: {
        ...road.stages,
        [id]: { date: date || null, time: date && time ? time : null, target: target.trim(), reason: reason.trim(), cleared_on: cleared ? clearedOn : null, memory: cleared ? memory.trim() : stage.memory },
      },
    });
    closeSheet();
  };

  return (
    <Sheet
      title={STAGE_INFO[id].name}
      onClose={closeSheet}
      accent="coding"
      footer={
        <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
          Save {STAGE_INFO[id].short}
        </button>
      }
    >
      <div className="i-kv">
        <label htmlFor="rd-date">Contest day</label>
        <input id="rd-date" className="i-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 'auto', minHeight: 42 }} />
      </div>
      <div className="i-kv">
        <label htmlFor="rd-time">Starts · Japan time</label>
        <input id="rd-time" className="i-input" type="time" value={time} disabled={!date} onChange={(e) => setTime(e.target.value)} style={{ width: 'auto', minHeight: 42 }} />
      </div>
      {filled?.from === 'dragon' && <p className="i-note">Filled in from your DragonCode targets. Save to keep it here.</p>}
      {filled?.from === 'schedule' && <p className="i-note">From the published schedule{filled.until ? `, ${rangeLabel(filled.date, filled.until)}` : ''}. Save to keep it, or change it.</p>}
      <label className="i-field">
        <span className="i-lab">My target</span>
        <input className="i-input" maxLength={200} value={target} onChange={(e) => setTarget(e.target.value)} placeholder={id === 'ioi' ? 'A medal' : 'Qualify with room to spare'} />
      </label>
      <label className="i-field">
        <span className="i-lab">Why this stage matters</span>
        <textarea className="i-textarea" maxLength={MAX_NOTE} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <Toggle on={cleared} label="I qualified" hint="stage cleared" onChange={setCleared} />
      {cleared && (
        <>
          <div className="i-kv">
            <label htmlFor="rd-cleared">The day I qualified</label>
            <input id="rd-cleared" className="i-input" type="date" max={today} value={clearedOn} onChange={(e) => setClearedOn(e.target.value)} style={{ width: 'auto', minHeight: 42 }} />
          </div>
          <label className="i-field">
            <span className="i-lab">The moment, in one line</span>
            <textarea className="i-textarea" maxLength={MAX_NOTE} value={memory} onChange={(e) => setMemory(e.target.value)} />
          </label>
        </>
      )}
      {stage.cleared_on && stage.memory && !cleared && <p className="i-note">Unticking keeps the memory: “{stage.memory}”.</p>}
      {stage.cleared_on && <p className="i-mono i-small i-dim">AC · {shortDay(stage.cleared_on)}</p>}
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}

function SeasonEventSheet({ spec }: { spec: SheetSpec }) {
  const id = spec.id as string;
  const event = SEASON_EVENTS.find((e) => e.id === id);
  const entry = seasonCalendar(data.get().settings.road.events).find((c) => c.event.id === id);
  const [date, setDate] = useState(entry && !entry.approx ? entry.date : '');
  const [time, setTime] = useState(entry?.time ?? '');
  const [hidden, setHidden] = useState(entry?.hidden ?? false);
  const [error, setError] = useState<string | null>(null);
  if (!event || !entry) return null;

  const write = (own: { date: string | null; time: string | null; hidden: boolean } | null) => {
    const rest = { ...data.get().settings.road.events };
    if (own && (own.date || own.hidden)) rest[id] = own;
    else delete rest[id];
    setRoad({ events: rest });
  };
  const save = () => {
    if (date && !isDate(date)) return setError('That date is not valid.');
    if (time && !TIME.test(time)) return setError('Use a time like 13:00.');
    // Leaving the day empty keeps the built-in one (exact or a placeholder).
    const builtIn = !date || (date === event.date && !event.approx && !time);
    write({ date: builtIn ? null : date, time: builtIn ? null : time || null, hidden });
    closeSheet();
  };

  return (
    <Sheet
      title={event.name}
      onClose={closeSheet}
      accent="coding"
      footer={
        <>
          {entry.mine && (
            <button type="button" className="i-btn" onClick={() => (write(hidden ? { date: null, time: null, hidden } : null), closeSheet())}>
              Use built-in date
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <p className="i-note">
        {event.where} ·{' '}
        <a className="i-link" href={event.url} target="_blank" rel="noreferrer">
          official site
        </a>
      </p>
      <p className="i-note">{entry.mine ? 'You set this date.' : event.approx ? `Rough date: around ${monthName(event.date, true)}. ${event.source}` : event.source}</p>
      <div className="i-kv">
        <label htmlFor="rd-ev-date">Exact day</label>
        <input id="rd-ev-date" className="i-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 'auto', minHeight: 42 }} />
      </div>
      <div className="i-kv">
        <label htmlFor="rd-ev-time">Starts · {event.zone.replace(/^.*\//, '').replace(/_/g, ' ')} time</label>
        <input id="rd-ev-time" className="i-input" type="time" value={time} disabled={!date} onChange={(e) => setTime(e.target.value)} style={{ width: 'auto', minHeight: 42 }} />
      </div>
      <Toggle on={hidden} label="Not doing this one" hint="hide it from the page" onChange={setHidden} />
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}

function RoadSetupSheet() {
  const road = useStore(data, (s) => s.settings.road);
  const [why, setWhy] = useState(road.why);
  const [url, setUrl] = useState(road.dragon_url || DEFAULT_DRAGON_URL);
  const [key, setKey] = useState(road.dragon_key);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const link = async () => {
    const base = dragonBase(url);
    if (!base) return setStatus({ ok: false, text: 'Use the DragonCode address starting with https://' });
    if (!key.trim()) return setStatus({ ok: false, text: 'Paste the key from DragonCode → Settings → Road to IOI link.' });
    setTesting(true);
    const error = await fetchDragon(base, key.trim());
    setTesting(false);
    if (error) return setStatus({ ok: false, text: error });
    setRoad({ dragon_url: base, dragon_key: key.trim() });
    setStatus({ ok: true, text: 'Linked. DragonCode training now counts here.' });
  };

  return (
    <Sheet title="Road to IOI setup" onClose={closeSheet} accent="coding">
      <label className="i-field">
        <span className="i-lab">Why do I want this?</span>
        <textarea className="i-textarea" maxLength={300} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="One sentence, in your own words." />
      </label>
      <button type="button" className="i-btn i-btn--sm" disabled={why.trim() === road.why} onClick={() => setRoad({ why: why.trim() })}>
        Save my why
      </button>
      <hr style={{ border: 0, borderTop: "1px solid var(--rule)", margin: "6px 0" }} />
      <span className="i-lab">DragonCode link · read-only</span>
      <p className="i-note">In DragonCode open Settings → Road to IOI link and copy the key. This page reads your days, results, reflections and upsolve queue. It can't change anything there.</p>
      <label className="i-field">
        <span className="i-lab">Address</span>
        <input className="i-input" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label className="i-field">
        <span className="i-lab">Link key</span>
        <input className="i-input" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder="dc1.…" />
      </label>
      <div className="i-btns">
        <button type="button" className="i-btn i-btn--sig" disabled={testing} onClick={() => void link()}>
          {testing ? 'Checking…' : road.dragon_key ? 'Save and check' : 'Link DragonCode'}
        </button>
        {road.dragon_key && (
          <button
            type="button"
            className="i-btn"
            onClick={() => {
              setRoad({ dragon_key: '' });
              forgetDragon();
              setKey('');
              setStatus({ ok: true, text: 'Unlinked. The DragonCode copy on this device is gone too.' });
            }}
          >
            Unlink
          </button>
        )}
      </div>
      {status && (
        <p className={status.ok ? 'i-note' : 'i-error'} role="status">
          {status.text}
        </p>
      )}
      <p className="i-note">These settings are shared with AnyStop's Road page: changing them here changes them there too.</p>
    </Sheet>
  );
}

registerSheet('road-stage', StageSheet);
registerSheet('road-event', SeasonEventSheet);
registerSheet('road-setup', RoadSetupSheet);
