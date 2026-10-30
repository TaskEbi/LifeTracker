import { useMemo, useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { ltToday, sectionRecords } from '../../data/lt';
import { data } from '../../data/store';
import { SECTION_IDS, type EventKind, type LtEvent, type Repeat, type SectionId } from '../../data/types';
import { conflicts, occurrences } from '../../domain/calendar/occurrences';
import { repeatLabel } from '../../domain/calendar/repeat';
import { addDays, shortDay } from '../../domain/log/dates';
import { sectionInfo } from '../../domain/sections';
import { Picks, Stepper, Toggle } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { pieceOf } from '../violin/model';
import { cancel, copyWeek, createEvent, deleteEvent, reschedule, restore, setRepeat, updateEventInfo, weekOneOffs } from './actions';
import { RepeatPicker, repeatState, toRepeat, type RepeatState } from './RepeatPicker';

const KINDS: { id: EventKind; label: string }[] = [
  { id: 'session', label: 'Session' },
  { id: 'exam', label: 'Exam' },
  { id: 'performance', label: 'Performance' },
  { id: 'competition', label: 'Competition' },
  { id: 'school', label: 'School' },
  { id: 'other', label: 'Other' },
];
const DURATIONS = [30, 45, 60, 90, 120, 180];
const durLabel = (m: number) => (m < 60 ? `${m}m` : `${m / 60}h`.replace('.5h', '½h'));
const shift = (t: string, m: number) => {
  const v = (((+t.slice(0, 2) * 60 + +t.slice(3)) + m) % 1440 + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
};
const minutesBetween = (a: string, b: string) => (+b.slice(0, 2) * 60 + +b.slice(3)) - (+a.slice(0, 2) * 60 + +a.slice(3));

function PiecesPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const pieces = sectionRecords(data.get(), 'violin', 'piece').map(pieceOf).filter((p) => !p.archived || value.includes(p.id));
  if (!pieces.length) return <p className="i-note">Add pieces in Violin to attach them to a performance.</p>;
  return (
    <div className="i-field">
      <span className="i-lab">Pieces</span>
      <div className="i-picks" role="group" aria-label="Pieces">
        {pieces.map((p) => (
          <button key={p.id} type="button" className="i-pick" aria-pressed={value.includes(p.id)} onClick={() => onChange(value.includes(p.id) ? value.filter((x) => x !== p.id) : [...value, p.id])}>
            {p.composer ? `${p.composer} · ` : ''}
            {p.title}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Info that belongs to the whole event (all occurrences). */
function InfoFields(p: {
  title: string; setTitle: (v: string) => void;
  section: SectionId | 'none'; setSection: (v: SectionId | 'none') => void;
  kind: EventKind; setKind: (v: EventKind) => void;
  note: string; setNote: (v: string) => void;
  pieces: string[]; setPieces: (v: string[]) => void;
}) {
  return (
    <>
      <label className="i-field">
        <span className="i-lab">Title</span>
        <input className="i-input" data-autofocus value={p.title} maxLength={120} onChange={(e) => p.setTitle(e.target.value)} placeholder="Violin lesson, Physics test…" />
      </label>
      <div className="i-field">
        <span className="i-lab">Kind</span>
        <Picks label="Kind" value={p.kind} onChange={p.setKind} options={KINDS} />
      </div>
      <div className="i-field">
        <span className="i-lab">Section</span>
        <Picks label="Section" value={p.section} onChange={p.setSection} options={[{ id: 'none', label: 'None' }, ...SECTION_IDS.map((id) => ({ id, label: sectionInfo(id).name }))]} />
      </div>
      {p.kind === 'performance' && p.section === 'violin' && <PiecesPicker value={p.pieces} onChange={p.setPieces} />}
      <label className="i-field">
        <span className="i-lab">Note · optional</span>
        <input className="i-input" value={p.note} maxLength={500} onChange={(e) => p.setNote(e.target.value)} placeholder="Where, what to bring…" />
      </label>
    </>
  );
}

function TimeInput({ value, label, onChange }: { value: string; label: string; onChange: (v: string) => void }) {
  return <input className="c-time" type="time" step={300} value={value} aria-label={label} onChange={(e) => /^\d\d:\d\d$/.test(e.target.value) && onChange(e.target.value)} />;
}

function TimeFields({ date, setDate, allDay, setAllDay, start, setStart, end, setEnd }: {
  date: string; setDate: (v: string) => void; allDay: boolean; setAllDay: (v: boolean) => void;
  start: string; setStart: (v: string) => void; end: string; setEnd: (v: string) => void;
}) {
  // Moving the start keeps the length.
  const moveStart = (next: string) => {
    const len = minutesBetween(start, end);
    setStart(next);
    setEnd(shift(next, len > 0 ? len : 60));
  };
  return (
    <div className="i-pnl i-pnl--flush">
      <div className="i-kv">
        <span>Day</span>
        <input className="i-input" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Day" style={{ width: 'auto', minHeight: 42 }} />
      </div>
      <Toggle on={allDay} label="All day" onChange={setAllDay} />
      {!allDay && (
        <>
          <div className="i-kv">
            <span>Starts</span>
            <Stepper value={<TimeInput value={start} label="Start time" onChange={moveStart} />} label="start time" onStep={(s) => moveStart(shift(start, 15 * s))} />
          </div>
          <div className="i-kv">
            <span>Ends</span>
            <Stepper value={<TimeInput value={end} label="End time" onChange={setEnd} />} label="end time" onStep={(s) => setEnd(shift(end, 15 * s))} />
          </div>
          <div className="i-picks" role="group" aria-label="Length" style={{ padding: '8px 0 10px' }}>
            {DURATIONS.map((m) => (
              <button key={m} type="button" className="i-pick" aria-pressed={minutesBetween(start, end) === m} onClick={() => setEnd(shift(start, m))}>
                {durLabel(m)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Recent distinct events, newest first, to fill a new one in a tap. */
function recentEvents(): LtEvent[] {
  const seen = new Set<string>();
  return [...data.get().lt_events.values()]
    .filter((e) => !e.deleted_at)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .filter((e) => !seen.has(e.title.toLowerCase()) && !!seen.add(e.title.toLowerCase()))
    .slice(0, 6);
}

function NewEvent({ preset }: { preset: Record<string, unknown> }) {
  const today = ltToday();
  const p0 = (preset.start as string | null | undefined) ?? '16:00';
  const [title, setTitle] = useState((preset.title as string) ?? '');
  const [section, setSection] = useState<SectionId | 'none'>((preset.section as SectionId) ?? 'none');
  const [kind, setKind] = useState<EventKind>((preset.kind as EventKind) ?? 'session');
  const [note, setNote] = useState((preset.note as string) ?? '');
  const [pieces, setPieces] = useState<string[]>((preset.pieces as string[]) ?? []);
  const [date, setDate] = useState((preset.date as string) ?? addDays(today, 1));
  const [allDay, setAllDay] = useState(preset.start === null);
  const [start, setStart] = useState(p0);
  const [end, setEnd] = useState((preset.end as string | null | undefined) ?? shift(p0, 60));
  const [rep, setRep] = useState<RepeatState>(() => repeatState(preset.repeat as Repeat | undefined, date));
  const [error, setError] = useState<string | null>(null);
  const recent = useMemo(recentEvents, []);

  const fill = (e: LtEvent) => {
    setTitle(e.title);
    setSection(e.section ?? 'none');
    setKind(e.kind);
    setNote(e.note ?? '');
    setAllDay(!e.start);
    if (e.start) setStart(e.start);
    if (e.end) setEnd(e.end);
  };

  const save = () => {
    const { repeat, count } = toRepeat(rep);
    const made = createEvent({
      title, section: section === 'none' ? null : section, kind, date, note,
      start: allDay ? null : start, end: allDay ? null : end,
      repeat, count,
      data: kind === 'performance' && pieces.length ? { pieces } : {},
    });
    if ('error' in made) return setError(made.error);
    closeSheet();
  };

  return (
    <Sheet title={preset.copy ? 'Copy of event' : 'New event'} onClose={closeSheet} accent={section === 'none' ? undefined : section} footer={<button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save} disabled={!title.trim()}>Add to calendar</button>}>
      {!title && recent.length > 0 && (
        <div className="i-field">
          <span className="i-lab">Again?</span>
          <div className="i-picks" role="group" aria-label="Recent events">
            {recent.map((e) => (
              <button key={e.id} type="button" className="i-pick" onClick={() => fill(e)}>
                {e.title}
                {e.start ? ` · ${e.start}` : ''}
              </button>
            ))}
          </div>
        </div>
      )}
      <InfoFields {...{ title, setTitle, section, setSection, kind, setKind, note, setNote, pieces, setPieces }} />
      <TimeFields {...{ date, setDate, allDay, setAllDay, start, setStart, end, setEnd }} />
      <RepeatPicker value={rep} anchor={date} onChange={setRep} />
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}

function ExistingEvent({ occKey }: { occKey: string }) {
  const [eventId, orig] = occKey.split('@');
  const ev = data.get().lt_events.get(eventId);
  const occ = useMemo(() => (ev ? occurrences([ev], addDays(orig, -40), addDays(orig, 40)).find((o) => o.key === occKey) : undefined), [ev, occKey, orig]);
  const [title, setTitle] = useState(ev?.title ?? '');
  const [section, setSection] = useState<SectionId | 'none'>(ev?.section ?? 'none');
  const [kind, setKind] = useState<EventKind>(ev?.kind ?? 'session');
  const [note, setNote] = useState(ev?.note ?? '');
  const [pieces, setPieces] = useState<string[]>(Array.isArray(ev?.data.pieces) ? (ev!.data.pieces as string[]) : []);
  const [date, setDate] = useState(occ?.date ?? orig);
  const [allDay, setAllDay] = useState(!occ?.start);
  const [start, setStart] = useState(occ?.start ?? '16:00');
  const [end, setEnd] = useState(occ?.end ?? shift(occ?.start ?? '16:00', 60));
  const [scope, setScope] = useState<'one' | 'future'>('one');
  const [rep, setRep] = useState<RepeatState>(() => repeatState(ev?.repeat, occ?.date ?? orig));
  const [repDirty, setRepDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ev || !occ) {
    return (
      <Sheet title="Event" onClose={closeSheet}>
        <p className="i-note">This event is no longer in the calendar.</p>
      </Sheet>
    );
  }
  const sameDay = occurrences(data.get().lt_events.values(), occ.date, occ.date);
  const clash = conflicts(sameDay).get(occ.key);
  const timeChanged = date !== occ.date || (allDay ? !!occ.start : start !== occ.start || end !== occ.end);

  // The rule belongs to the series: for a series it changes from this date on.
  const canRepeat = !ev.repeat || scope === 'future';
  const save = () => {
    if (!allDay && (timeChanged || repDirty) && end <= start) return setError('It has to end after it starts.');
    const err = updateEventInfo(ev.id, { title, section: section === 'none' ? null : section, kind, note, data: { ...ev.data, ...(kind === 'performance' ? { pieces } : {}) } });
    if (err) return setError(err);
    const change = { date, start: allDay ? null : start, end: allDay ? null : end };
    if (canRepeat && repDirty) {
      const { repeat, count } = toRepeat(rep);
      const rerr = setRepeat(ev.id, occ.origDate, change, repeat, count);
      if (rerr) return setError(rerr);
    } else if (timeChanged) reschedule(ev.id, occ.origDate, change, scope);
    closeSheet();
  };
  const duplicate = () =>
    openSheet({ type: 'event', preset: { copy: true, title: ev.title, section: ev.section, kind: ev.kind, note: ev.note ?? '', pieces, date: addDays(occ.date, 7), start: occ.start, end: occ.end } });

  return (
    <Sheet
      title={ev.title}
      onClose={closeSheet}
      accent={ev.section ?? undefined}
      footer={
        occ.cancelled ? (
          <button type="button" className="i-btn i-btn--block" onClick={() => (restore(ev.id, occ.origDate), closeSheet())}>Restore {ev.repeat ? 'this date' : 'event'}</button>
        ) : (
          <>
            <button type="button" className="i-btn i-btn--danger" onClick={() => (cancel(ev.id, occ.origDate, scope), closeSheet())}>
              {ev.repeat ? (scope === 'one' ? 'Cancel date' : 'End series') : 'Cancel'}
            </button>
            <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save} disabled={!title.trim()}>Save</button>
          </>
        )
      }
    >
      <p className="i-mono i-small i-mid">
        {shortDay(occ.date).toUpperCase()}
        {occ.start ? ` · ${occ.start}–${occ.end}` : ' · ALL DAY'}
        {ev.repeat ? ` · ${repeatLabel(ev.repeat, ev.date).toUpperCase()}${ev.repeat.until ? ` UNTIL ${shortDay(ev.repeat.until).toUpperCase()}` : ''}` : ''}
        {occ.cancelled ? ' · CANCELLED' : ''}
      </p>
      {clash && !occ.cancelled && (
        <div className="i-warnbox"><b>!CLASH</b><span>Overlaps {clash.join(', ')}. Nothing moves automatically: change one of them if you need to.</span></div>
      )}
      {!occ.cancelled && (
        <>
          <TimeFields {...{ date, setDate, allDay, setAllDay, start, setStart, end, setEnd }} />
          {ev.repeat && (
            <div className="i-field">
              <span className="i-lab">Apply changes to times and cancelling</span>
              <div className="i-opts">
                <button type="button" className="i-opt" aria-pressed={scope === 'one'} onClick={() => setScope('one')}>
                  <b>This one</b>
                  <small>{shortDay(occ.origDate)} only</small>
                </button>
                <button type="button" className="i-opt" aria-pressed={scope === 'future'} onClick={() => setScope('future')}>
                  <b>This + later</b>
                  <small>splits the series · can change the repeat</small>
                </button>
              </div>
            </div>
          )}
          {canRepeat && <RepeatPicker value={rep} anchor={date} onChange={(r) => (setRep(r), setRepDirty(true))} />}
        </>
      )}
      <InfoFields {...{ title, setTitle, section, setSection, kind, setKind, note, setNote, pieces, setPieces }} />
      <div className="i-btns">
        <button type="button" className="i-link" onClick={duplicate}>
          Duplicate
        </button>
        <button type="button" className="i-link" onClick={() => (deleteEvent(ev.id), closeSheet())}>
          Delete {ev.repeat ? 'the whole series' : 'event'}
        </button>
      </div>
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}

function EventSheet({ spec }: { spec: SheetSpec }) {
  if (typeof spec.key === 'string') return <ExistingEvent occKey={spec.key} />;
  return <NewEvent preset={(spec.preset as Record<string, unknown>) ?? { date: spec.date }} />;
}

/** Copy the week's one-off events forward: "repeat this week". */
function CopyWeekSheet({ spec }: { spec: SheetSpec }) {
  const monday = spec.monday as string;
  const evs = useMemo(() => weekOneOffs(monday), [monday]);
  const [weeks, setWeeks] = useState(1);
  return (
    <Sheet
      title="Copy this week"
      onClose={closeSheet}
      footer={
        <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!evs.length} onClick={() => (copyWeek(monday, weeks), closeSheet())}>
          Copy to {weeks === 1 ? 'next week' : `the next ${weeks} weeks`}
        </button>
      }
    >
      <p className="i-note">
        One-off events from {shortDay(monday)} – {shortDay(addDays(monday, 6))} are copied to the same weekday and time. Repeating events already repeat, and a copy is skipped when that day already has the same event.
      </p>
      <div className="i-field">
        <span className="i-lab">How many weeks</span>
        <Picks label="Weeks" value={String(weeks)} onChange={(v) => setWeeks(+v)} options={[1, 2, 3, 4, 8, 12].map((n) => ({ id: String(n), label: n === 1 ? 'Next week' : `${n} weeks` }))} />
      </div>
      <div className="i-pnl i-pnl--flush">
        {evs.length ? (
          evs.map((e) => (
            <div key={e.id} className="i-kv">
              <span>{e.title}</span>
              <span className="i-mono i-small i-mid">
                {shortDay(e.date)}
                {e.start ? ` · ${e.start}` : ''}
              </span>
            </div>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>No one-off events this week to copy.</p>
        )}
      </div>
    </Sheet>
  );
}

registerSheet('event', EventSheet);
registerSheet('copyweek', CopyWeekSheet);

