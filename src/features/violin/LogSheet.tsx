import { useEffect, useMemo, useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { ltToday, sectionEntries, sectionRecords, withReward } from '../../data/lt';
import { saveRecord } from '../../data/records';
import { saveSession } from '../../data/sessions';
import { data } from '../../data/store';
import { addDays, shortDay } from '../../domain/log/dates';
import { createStore, useStore } from '../../lib/createStore';
import { Stepper, Toggle } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { checkSession, isViolinDetail, pieceOf, SESSION_TYPES, suggestedType, type SessionType, type ViolinDetail } from './model';

/** A practice timer that survives closing the sheet (and keeps counting while the phone is locked). */
const timer = createStore<{ startedAt: number | null; banked: number }>({ startedAt: null, banked: 0 });
const elapsedSec = (t = timer.get()) => Math.floor(t.banked + (t.startedAt ? (Date.now() - t.startedAt) / 1000 : 0));
const clock = (s: number) => `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ':' : ''}${String(Math.floor((s % 3600) / 60)).padStart(Math.floor(s / 3600) ? 2 : 1, '0')}:${String(s % 60).padStart(2, '0')}`;

function TimerPanel({ onUse }: { onUse: (minutes: number) => void }) {
  const t = useStore(timer, (s) => s);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!t.startedAt) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [t.startedAt]);
  const secs = elapsedSec(t);
  return (
    <div className="i-pnl i-stack" style={{ textAlign: 'center' }}>
      <span className="i-lab">Timer</span>
      <b className="i-mono" style={{ fontSize: 52, fontWeight: 400, letterSpacing: '-.04em' }} aria-live="off">
        {clock(secs)}
      </b>
      <div className="i-btns" style={{ justifyContent: 'center' }}>
        {t.startedAt ? (
          <button type="button" className="i-btn i-btn--sm" onClick={() => timer.set({ startedAt: null, banked: elapsedSec() })}>
            Pause
          </button>
        ) : (
          <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => timer.set({ startedAt: Date.now() })}>
            {secs ? 'Resume' : 'Start'}
          </button>
        )}
        <button
          type="button"
          className="i-btn i-btn--sm"
          disabled={secs < 30}
          onClick={() => {
            onUse(Math.max(1, Math.round(secs / 60)));
            timer.set({ startedAt: null, banked: 0 });
          }}
        >
          Use {Math.max(1, Math.round(secs / 60))} min
        </button>
        {secs > 0 && !t.startedAt && (
          <button type="button" className="i-btn i-btn--sm" onClick={() => timer.set({ startedAt: null, banked: 0 })}>
            Reset
          </button>
        )}
      </div>
      <p className="i-note">The timer keeps running if you close this sheet.</p>
    </div>
  );
}

interface Draft {
  type: SessionType | null;
  date: string;
  minutes: number;
  pieces: string[];
  scales: string[];
  splitOn: boolean;
  split: Record<string, number>;
  note: string;
}

function ViolinLogSheet({ spec }: { spec: SheetSpec }) {
  const editId = (spec.editId as string | null | undefined) ?? null;
  const today = ltToday();
  const st = data.get();
  const editing = editId ? sectionEntries<ViolinDetail>(st, 'violin').find((s) => s.entry.id === editId) : undefined;

  const [step, setStep] = useState(editing ? 3 : 1);
  const [d, setD] = useState<Draft>(() => {
    if (editing) {
      const det = isViolinDetail(editing.detail) ? editing.detail : null;
      return {
        type: det?.type ?? 'solo',
        date: editing.entry.date,
        minutes: editing.entry.minutes,
        pieces: det?.pieces ?? [],
        scales: det?.scales ?? [],
        splitOn: !!det?.split && Object.keys(det.split).length > 0,
        split: det?.split ?? {},
        note: editing.entry.note ?? '',
      };
    }
    return { type: null, date: today, minutes: 30, pieces: [], scales: [], splitOn: false, split: {}, note: '' };
  });
  const [useTimer, setUseTimer] = useState(() => !editing && (timer.get().startedAt != null || timer.get().banked > 0));
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<{ kind: 'piece' | 'scale'; title: string } | null>(null);
  const recordsMap = useStore(data, (s) => s.lt_records);
  const items = useMemo(() => {
    const all = [...sectionRecords(data.get(), 'violin', 'piece'), ...sectionRecords(data.get(), 'violin', 'scale')].map(pieceOf);
    return all.filter((p) => !p.archived || d.pieces.includes(p.id) || d.scales.includes(p.id));
  }, [recordsMap, d.pieces, d.scales]);
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));

  const pickType = (type: SessionType) => {
    // Lessons and rehearsals usually cover the same things: start from the last one of that type.
    const last = sectionEntries<ViolinDetail>(data.get(), 'violin').find((s) => isViolinDetail(s.detail) && s.detail.type === type);
    const defaults: Record<SessionType, number> = { solo: 30, lesson: 45, orchestra: 90, trio: 60 };
    set({
      type,
      minutes: editing ? d.minutes : last?.entry.minutes ?? defaults[type],
      pieces: editing ? d.pieces : type === 'solo' ? [] : last && isViolinDetail(last.detail) ? last.detail.pieces : [],
      scales: editing ? d.scales : type === 'solo' ? [] : last && isViolinDetail(last.detail) ? last.detail.scales : [],
    });
    setStep(2);
  };

  const toggle = (kind: 'pieces' | 'scales', id: string) => {
    const list = d[kind].includes(id) ? d[kind].filter((x) => x !== id) : [...d[kind], id];
    const split = { ...d.split };
    if (!list.includes(id)) delete split[id];
    set({ [kind]: list, split } as Partial<Draft>);
  };
  const chosen = [...d.pieces, ...d.scales];
  const assigned = chosen.reduce((s, id) => s + (d.split[id] ?? 0), 0);

  const save = () => {
    const split = d.splitOn ? Object.fromEntries(chosen.filter((id) => (d.split[id] ?? 0) > 0).map((id) => [id, d.split[id]])) : null;
    const problem = checkSession({ minutes: d.minutes, date: d.date, split }, today);
    if (problem) return setError(problem);
    const type = d.type ?? 'solo';
    let result: { error: string } | { id: string } = { error: 'Not saved' };
    const ok = withReward(() => {
      result = saveSession(
        {
          section: 'violin',
          date: d.date,
          minutes: d.minutes,
          note: d.note,
          subcategory: SESSION_TYPES.find((t) => t.id === type)!.sub,
          detail: { type, pieces: d.pieces, scales: d.scales, ...(split && Object.keys(split).length ? { split } : {}) },
        },
        editId,
      );
      return !('error' in result);
    });
    if (!ok && 'error' in result) setError(result.error);
    else closeSheet();
  };

  const addItem = () => {
    if (!newItem?.title.trim()) return;
    const r = saveRecord('violin', newItem.kind, { title: newItem.title.trim(), composer: '', status: newItem.kind === 'piece' ? 'Learning' : '', group: '' });
    toggle(newItem.kind === 'piece' ? 'pieces' : 'scales', r.id);
    setNewItem(null);
  };

  const dayChoices = [today, addDays(today, -1), addDays(today, -2)];
  const typeName = SESSION_TYPES.find((t) => t.id === d.type)?.name ?? '';

  let body;
  let footer;
  if (step === 1) {
    const suggest = suggestedType(today);
    body = (
      <div className="i-opts" role="group" aria-label="Session type">
        {SESSION_TYPES.map((t) => (
          <button key={t.id} type="button" className="i-opt" aria-pressed={d.type === t.id || (!d.type && t.id === suggest)} onClick={() => pickType(t.id)}>
            <b>{t.name}</b>
            <small>{t.hint}</small>
          </button>
        ))}
      </div>
    );
    footer = (
      <button type="button" className="i-btn i-btn--block" onClick={closeSheet}>
        Cancel
      </button>
    );
  } else if (step === 2) {
    body = (
      <>
        {useTimer ? (
          <TimerPanel
            onUse={(m) => {
              set({ minutes: m });
              setUseTimer(false);
            }}
          />
        ) : (
          <>
            <div className="i-dial">
              <button type="button" className="i-sq" onClick={() => set({ minutes: Math.max(5, d.minutes - 5) })} aria-label="5 minutes less">
                −5
              </button>
              <output aria-live="polite">
                {d.minutes}
                <small>min total</small>
              </output>
              <button type="button" className="i-sq" onClick={() => set({ minutes: Math.min(1440, d.minutes + 5) })} aria-label="5 minutes more">
                +5
              </button>
            </div>
            <div className="i-picks" style={{ justifyContent: 'center' }} role="group" aria-label="Common durations">
              {[15, 20, 30, 45, 60, 90].map((m) => (
                <button key={m} type="button" className="i-pick i-mono" aria-pressed={d.minutes === m} onClick={() => set({ minutes: m })}>
                  {m}
                </button>
              ))}
            </div>
          </>
        )}
        <Toggle on={useTimer} label="Start/stop timer" hint="optional" onChange={setUseTimer} />
        <div className="i-field">
          <span className="i-lab">Day</span>
          <div className="i-picks" role="group" aria-label="Day">
            {dayChoices.map((day, i) => (
              <button key={day} type="button" className="i-pick" aria-pressed={d.date === day} onClick={() => set({ date: day })}>
                {i === 0 ? 'Today' : i === 1 ? 'Yesterday' : shortDay(day)}
              </button>
            ))}
            <input className="i-input" type="date" max={today} value={d.date} onChange={(e) => e.target.value && set({ date: e.target.value })} aria-label="Another day" style={{ width: 'auto', minHeight: 42 }} />
          </div>
        </div>
        <p className="i-note">One total can cover several pieces. Lessons, orchestra and trio count towards the weekly target.</p>
      </>
    );
    footer = (
      <>
        <button type="button" className="i-btn" onClick={() => setStep(1)}>
          Back
        </button>
        <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => setStep(3)} disabled={useTimer}>
          Next
        </button>
      </>
    );
  } else {
    const group = (kind: 'piece' | 'scale') => items.filter((p) => p.kind === kind);
    body = (
      <>
        <p className="i-mono i-small i-mid">
          {d.minutes} MIN · {typeName.toUpperCase()} · {shortDay(d.date).toUpperCase()}
        </p>
        {(['piece', 'scale'] as const).map((kind) => (
          <div className="i-field" key={kind}>
            <span className="i-lab">{kind === 'piece' ? 'Pieces' : 'Scales'}</span>
            <div className="i-picks" role="group" aria-label={kind === 'piece' ? 'Pieces' : 'Scales'}>
              {group(kind).map((p) => (
                <button key={p.id} type="button" className="i-pick" aria-pressed={(kind === 'piece' ? d.pieces : d.scales).includes(p.id)} onClick={() => toggle(kind === 'piece' ? 'pieces' : 'scales', p.id)}>
                  {p.composer ? `${p.composer} · ` : ''}
                  {p.title}
                </button>
              ))}
              {newItem?.kind === kind ? (
                <span style={{ display: 'flex', gap: 6, width: '100%' }}>
                  <input
                    className="i-input"
                    autoFocus
                    placeholder={kind === 'piece' ? 'e.g. Bruch Concerto, I' : 'e.g. G minor, 3 octaves'}
                    value={newItem.title}
                    onChange={(e) => setNewItem({ kind, title: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
                    aria-label={`New ${kind}`}
                  />
                  <button type="button" className="i-btn i-btn--sm" onClick={addItem} disabled={!newItem.title.trim()}>
                    Add
                  </button>
                </span>
              ) : (
                <button type="button" className="i-pick i-dim" onClick={() => setNewItem({ kind, title: '' })}>
                  + new {kind}
                </button>
              )}
            </div>
          </div>
        ))}
        <Toggle on={d.splitOn} label="Split time by piece" hint="optional · only recorded where you split" onChange={(on) => set({ splitOn: on })} />
        {d.splitOn && chosen.length > 0 && (
          <div>
            {chosen.map((id) => {
              const p = items.find((x) => x.id === id);
              return (
                <div className="i-kv" key={id}>
                  <span>{p ? (p.composer ? `${p.composer} · ${p.title}` : p.title) : 'Item'}</span>
                  <Stepper value={`${d.split[id] ?? 0} min`} label={`minutes on ${p?.title ?? 'item'}`} onStep={(s) => set({ split: { ...d.split, [id]: Math.max(0, (d.split[id] ?? 0) + 5 * s) } })} />
                </div>
              );
            })}
            <p className={`i-note${assigned > d.minutes ? ' i-note--warn' : ''}`} style={{ marginTop: 6 }}>
              {assigned > d.minutes ? `${assigned - d.minutes} min over the total.` : `${assigned}/${d.minutes} min assigned${assigned < d.minutes ? ' · the rest stays unassigned' : ''}.`}
            </p>
          </div>
        )}
        <label className="i-field">
          <span className="i-lab">Note · optional</span>
          <textarea className="i-textarea" value={d.note} maxLength={1000} onChange={(e) => set({ note: e.target.value })} placeholder="What went well, what to fix next time" />
        </label>
        {error && (
          <p className="i-error" role="alert">
            {error}
          </p>
        )}
      </>
    );
    footer = (
      <>
        <button type="button" className="i-btn" onClick={() => setStep(2)}>
          Back
        </button>
        <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save} disabled={d.splitOn && assigned > d.minutes}>
          {editing ? 'Save changes' : `Save ${d.minutes} min`}
        </button>
      </>
    );
  }

  return (
    <Sheet title={editing ? 'CH01 · edit session' : 'CH01 · log violin'} onClose={closeSheet} steps={['Type', 'Duration', 'Pieces']} step={step} accent="violin" footer={footer}>
      {body}
    </Sheet>
  );
}

registerSheet('violin', ViolinLogSheet);
