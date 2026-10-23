import { useMemo, useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { ltToday, sectionRecords } from '../../data/lt';
import { data } from '../../data/store';
import { SECTION_IDS, type EventKind, type SectionId } from '../../data/types';
import { conflicts, occurrences } from '../../domain/calendar/occurrences';
import { addDays, shortDay, weekdayIndex } from '../../domain/log/dates';
import { sectionInfo } from '../../domain/sections';
import { Picks, Stepper, Toggle } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { pieceOf } from '../violin/model';
import { cancel, createEvent, deleteEvent, reschedule, restore, updateEventInfo } from './actions';

const KINDS: { id: EventKind; label: string }[] = [
  { id: 'session', label: 'Session' },
  { id: 'exam', label: 'Exam' },
  { id: 'performance', label: 'Performance' },
  { id: 'competition', label: 'Competition' },
  { id: 'school', label: 'School' },
  { id: 'other', label: 'Other' },
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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

function TimeFields({ date, setDate, allDay, setAllDay, start, setStart, end, setEnd }: {
  date: string; setDate: (v: string) => void; allDay: boolean; setAllDay: (v: boolean) => void;
  start: string; setStart: (v: string) => void; end: string; setEnd: (v: string) => void;
}) {
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
            <Stepper value={start} label="start time" onStep={(s) => {
              const len = minutesBetween(start, end);
              const next = shift(start, 15 * s);
              setStart(next);
              setEnd(shift(next, len > 0 ? len : 60));
            }} />
          </div>
          <div className="i-kv">
            <span>Ends</span>
            <Stepper value={end} label="end time" onStep={(s) => setEnd(shift(end, 15 * s))} />
          </div>
        </>
      )}
    </div>
  );
}

function NewEvent({ preset }: { preset: Record<string, unknown> }) {
  const today = ltToday();
  const [title, setTitle] = useState((preset.title as string) ?? '');
  const [section, setSection] = useState<SectionId | 'none'>((preset.section as SectionId) ?? 'none');
  const [kind, setKind] = useState<EventKind>((preset.kind as EventKind) ?? 'session');
  const [note, setNote] = useState('');
  const [pieces, setPieces] = useState<string[]>([]);
  const [date, setDate] = useState((preset.date as string) ?? addDays(today, 1));
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState((preset.start as string) ?? '16:00');
  const [end, setEnd] = useState(shift((preset.start as string) ?? '16:00', 60));
  const [repeats, setRepeats] = useState(false);
  const [days, setDays] = useState<number[]>([weekdayIndex(date)]);
  const [until, setUntil] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const made = createEvent({
      title, section: section === 'none' ? null : section, kind, date, note,
      start: allDay ? null : start, end: allDay ? null : end,
      repeat: repeats ? { days: [...days].sort(), until: until || null } : null,
      data: kind === 'performance' && pieces.length ? { pieces } : {},
    });
    if ('error' in made) return setError(made.error);
    closeSheet();
  };

  return (
    <Sheet title="New event" onClose={closeSheet} accent={section === 'none' ? undefined : section} footer={<button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save} disabled={!title.trim()}>Add to calendar</button>}>
      <InfoFields {...{ title, setTitle, section, setSection, kind, setKind, note, setNote, pieces, setPieces }} />
      <TimeFields {...{ date, setDate, allDay, setAllDay, start, setStart, end, setEnd }} />
      <Toggle on={repeats} label="Repeats weekly" hint="change one date or all later ones afterwards" onChange={setRepeats} />
      {repeats && (
        <>
          <div className="i-picks" role="group" aria-label="Repeat on">
            {DAYS.map((d, i) => (
              <button key={d} type="button" className="i-pick" aria-pressed={days.includes(i)} onClick={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i])}>
                {d}
              </button>
            ))}
          </div>
          <label className="i-kv">
            <span>Until · optional</span>
            <input className="i-input" type="date" value={until} min={date} onChange={(e) => setUntil(e.target.value)} style={{ width: 'auto', minHeight: 42 }} />
          </label>
        </>
      )}
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

  const save = () => {
    const err = updateEventInfo(ev.id, { title, section: section === 'none' ? null : section, kind, note, data: { ...ev.data, ...(kind === 'performance' ? { pieces } : {}) } });
    if (err) return setError(err);
    if (timeChanged) {
      if (!allDay && end <= start) return setError('It has to end after it starts.');
      reschedule(ev.id, occ.origDate, { date, start: allDay ? null : start, end: allDay ? null : end }, scope);
    }
    closeSheet();
  };

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
        {ev.repeat ? ` · WEEKLY ${ev.repeat.days.map((d) => DAYS[d].toUpperCase()).join('+')}${ev.repeat.until ? ` UNTIL ${shortDay(ev.repeat.until).toUpperCase()}` : ''}` : ''}
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
                  <small>splits the series</small>
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <InfoFields {...{ title, setTitle, section, setSection, kind, setKind, note, setNote, pieces, setPieces }} />
      <button type="button" className="i-link" onClick={() => (deleteEvent(ev.id), closeSheet())}>
        Delete {ev.repeat ? 'the whole series' : 'event'}
      </button>
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}

function EventSheet({ spec }: { spec: SheetSpec }) {
  if (typeof spec.key === 'string') return <ExistingEvent occKey={spec.key} />;
  return <NewEvent preset={(spec.preset as Record<string, unknown>) ?? { date: spec.date }} />;
}

registerSheet('event', EventSheet);
