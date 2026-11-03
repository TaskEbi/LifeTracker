/** 日課: small things on a cue, with a chain that survives one missed day. */
import { useMemo, useState, type CSSProperties } from 'react';
import { registerSheet } from '../../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../../app/sheets';
import { useToday } from '../../../data/lt';
import { deleteRecord, setArchived } from '../../../data/records';
import { appliesOn, chainOf, RITUAL_IDEAS, SLOTS, type Ritual, type RitualSlot } from '../../../domain/hq/rituals';
import { H2, Picks } from '../../../ui/i/bits';
import { Sheet } from '../../../ui/i/Sheet';
import { RoomHead } from '../HqView';
import { saveRitual, toggleRitual, useHq } from '../store';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function RitualSheet({ spec }: { spec: SheetSpec }) {
  const today = useToday();
  const hq = useHq();
  const prev = spec.editId ? hq.rituals.find((r) => r.id === spec.editId) : undefined;
  const preset = spec.preset as { title: string; cue: string; slot: RitualSlot } | undefined;
  const [title, setTitle] = useState(prev?.title ?? preset?.title ?? '');
  const [cue, setCue] = useState(prev?.cue ?? preset?.cue ?? '');
  const [slot, setSlot] = useState<RitualSlot>(prev?.slot ?? preset?.slot ?? 'morning');
  const [days, setDays] = useState<number[]>(prev?.days ?? []);
  const flip = (d: number) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort());
  return (
    <Sheet
      title={prev ? 'Edit ritual' : 'New ritual'}
      onClose={closeSheet}
      footer={
        <>
          {prev && (
            <button type="button" className="i-btn" onClick={() => (setArchived(prev.id, !prev.archived), closeSheet())}>
              {prev.archived ? 'Bring back' : 'Retire'}
            </button>
          )}
          {prev && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(prev.id, 'Ritual deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!title.trim()} onClick={() => (saveRitual({ title, cue, slot, days, since: prev?.since ?? today }, prev?.id), closeSheet())}>
            Save
          </button>
        </>
      }
    >
      <label className="i-field">
        <span className="i-lab">What</span>
        <input data-autofocus className="i-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Small enough that you can’t say no" maxLength={100} />
      </label>
      <label className="i-field">
        <span className="i-lab">When: the cue that sets it off</span>
        <input className="i-input" value={cue} onChange={(e) => setCue(e.target.value)} placeholder="After I…" maxLength={100} />
      </label>
      <div className="i-field">
        <span className="i-lab">Part of the day</span>
        <Picks label="Part of the day" value={slot} onChange={setSlot} options={SLOTS.map((s) => ({ id: s.id, label: s.label }))} />
      </div>
      <div className="i-field">
        <span className="i-lab">Days {days.length ? '' : '(every day)'}</span>
        <div className="i-picks" role="group" aria-label="Which days">
          {DAYS.map((d, i) => (
            <button key={i} type="button" className="i-pick" aria-pressed={days.includes(i)} onClick={() => flip(i)} aria-label={DAY_NAMES[i]}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
registerSheet('hq-ritual', RitualSheet);

/** One ritual: the big tick, its cue, its chain. */
export function RitualRow({ r, today, compact }: { r: Ritual; today: string; compact?: boolean }) {
  const hq = useHq();
  const c = useMemo(() => chainOf(r, hq.ritualDays, today), [r, hq.ritualDays, today]);
  const done = hq.ritualDays.get(today)?.has(r.id) ?? false;
  return (
    <div className={`hq-rit${done ? ' is-done' : ''}`}>
      <button type="button" role="checkbox" aria-checked={done} className="hq-rit__ck" onClick={() => toggleRitual(r.id, today)} aria-label={`Done: ${r.title}`}>
        {done ? '✓' : ''}
      </button>
      <button type="button" className="hq-rit__t" onClick={() => openSheet({ type: 'hq-ritual', editId: r.id })}>
        <b>{r.title}</b>
        {r.cue && <small>{r.cue}</small>}
      </button>
      {!compact && (
        <span className="hq-rit__chain" role="img" aria-label={`Last 14 days: ${c.recent.filter((x) => x === true).length} done`}>
          {c.recent.map((x, i) => (
            <i key={i} className={x === true ? 'is-on' : x === false ? 'is-miss' : ''} style={{ '--i': i } as CSSProperties} />
          ))}
        </span>
      )}
      <span className={`hq-rit__n i-mono${c.held ? ' is-held' : ''}`} title={c.held ? 'One missed day: do it today or the chain breaks' : undefined}>
        {c.n}
      </span>
    </div>
  );
}

export function RitualsRoom() {
  const today = useToday();
  const hq = useHq();
  const live = hq.rituals.filter((r) => !r.archived);
  const retired = hq.rituals.filter((r) => r.archived);
  const notToday = live.filter((r) => !appliesOn(r, today));
  const taken = new Set(live.map((r) => r.title.toLowerCase()));
  const ideas = RITUAL_IDEAS.filter((i) => !taken.has(i.title.toLowerCase()));
  const best = useMemo(() => {
    const scored = live.map((r) => ({ r, c: chainOf(r, hq.ritualDays, today) })).filter((x) => x.c.rate > 0);
    return scored.sort((a, b) => b.c.rate - a.c.rate)[0];
  }, [live, hq.ritualDays, today]);
  return (
    <div>
      <RoomHead room="rituals" />
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'hq-ritual' })}>
        + New ritual
      </button>
      {SLOTS.map((s) => {
        const list = live.filter((r) => r.slot === s.id && appliesOn(r, today));
        if (!list.length) return null;
        return (
          <section key={s.id} aria-label={s.label}>
            <H2>
              <span aria-hidden="true">{s.kanji}</span> {s.label}
            </H2>
            <div className="hq-rits">
              {list.map((r) => (
                <RitualRow key={r.id} r={r} today={today} />
              ))}
            </div>
          </section>
        );
      })}
      {live.length > 0 && <p className="i-note">The number is the chain. Miss one day and it holds; miss two and it starts again. Never miss twice.</p>}
      {best && <p className="i-note">Most reliable: {best.r.title}, {Math.round(best.c.rate * 100)}% of the days it’s due.</p>}
      {notToday.length > 0 && <p className="i-note">Not today: {notToday.map((r) => r.title).join(', ')}.</p>}
      {ideas.length > 0 && (
        <>
          <H2 aside="tap to adapt">Ideas</H2>
          <div className="i-chips i-chips--wrap">
            {ideas.slice(0, live.length ? 6 : 12).map((i) => (
              <button key={i.title} type="button" className="i-chip" onClick={() => openSheet({ type: 'hq-ritual', preset: i })}>
                {i.title}
              </button>
            ))}
          </div>
        </>
      )}
      {retired.length > 0 && (
        <details className="hq-more">
          <summary>{retired.length} retired</summary>
          <div className="i-pnl i-pnl--flush">
            {retired.map((r) => (
              <button key={r.id} type="button" className="i-row" onClick={() => openSheet({ type: 'hq-ritual', editId: r.id })}>
                <span className="i-row__t">
                  <b>{r.title}</b>
                </span>
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
