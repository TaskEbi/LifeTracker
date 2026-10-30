import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type CSSProperties, type FormEvent } from 'react';
import { ChannelBar } from '../../app/Shell';
import { openSheet } from '../../app/sheets';
import { dayOf, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { useTableMissing } from '../../data/sync';
import { toast } from '../../data/ui';
import { shortDay } from '../../domain/log/dates';
import { RULES } from '../../domain/progress/engine';
import { useStore } from '../../lib/createStore';
import { Icon } from '../../ui/i/Icon';
import { addBucket, BUCKET_TITLE_MAX, bucketItems, crossOff, splitLines } from './actions';
import './BucketSheet';
import './bucket.css';

const reduced = () => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};
/** How long the row's own strike-through plays before the save (and its celebration). */
const CROSS_MS = 460;

export function BucketView() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const { open, done } = useMemo(() => bucketItems(st), [st]);
  const synced = st.mode === 'synced';
  const missing = useTableMissing('lt_bucket');
  const [draft, setDraft] = useState('');
  const [crossing, setCrossing] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [showDone, setShowDone] = useState(true);
  const input = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const total = open.length + done.length;
  const pct = total ? Math.round((done.length / total) * 100) : 0;

  const add = (titles: string[]) => {
    const { added, dupes } = addBucket(titles);
    if (added.length > 1) toast(`Added ${added.length}${dupes ? ` · ${dupes} already on the list` : ''}`);
    else if (!added.length && dupes) toast('Already on your list');
    return added.length > 0 || dupes > 0;
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (add([draft])) setDraft('');
    input.current?.focus();
  };
  // Pasting a list adds every line at once.
  const paste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const lines = splitLines(text);
    if (lines.length < 2) return;
    e.preventDefault();
    add(lines);
  };

  const cross = (id: string) => {
    if (crossing) return;
    setPicked(null);
    if (reduced()) return crossOff(id);
    setCrossing(id);
    later(() => {
      setCrossing(null);
      crossOff(id);
    }, CROSS_MS);
  };

  // "Pick one for me": a quick roulette over the open items that slows down and lands on one.
  const pick = () => {
    if (rolling || open.length < 2) return;
    const target = open[Math.floor(Math.random() * open.length)].id;
    const land = () => {
      setRolling(false);
      setPicked(target);
      document.getElementById(`bk-${target}`)?.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    };
    if (reduced()) return land();
    setRolling(true);
    const steps = Math.min(14, 6 + open.length);
    let t = 0;
    for (let i = 0; i < steps; i++) {
      t += 55 + i * i * 2.2;
      const id = open[(open.findIndex((b) => b.id === target) - (steps - 1 - i) + open.length * 20) % open.length].id;
      later(() => setPicked(id), t);
    }
    later(land, t + 120);
  };

  return (
    <div className="bk">
      <ChannelBar current="bucket" />
      <header className="i-chhead">
        <div>
          <span className="i-chhead__k">夢 · bucket list</span>
          <h1>Bucket list</h1>
          <p className="i-chhead__sub">{total ? `${open.length} to go · ${done.length} crossed off` : 'Everything you want to do, one line each'}</p>
        </div>
      </header>

      {total > 0 && (
        <div className="bk-meter" role="progressbar" aria-label="Bucket list crossed off" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ '--p': `${pct}%` } as CSSProperties}>
          <span className="bk-meter__bar">
            <i />
          </span>
          <span className="bk-meter__n">
            <b>{done.length}</b>/{total} · {pct}%
          </span>
        </div>
      )}

      <form className="bk-add" onSubmit={submit}>
        <span className="bk-add__k" aria-hidden="true">
          夢
        </span>
        <input
          ref={input}
          className="bk-add__in"
          value={draft}
          maxLength={BUCKET_TITLE_MAX}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={paste}
          placeholder="Add something… (paste a list to add them all)"
          aria-label="Add to your bucket list"
          enterKeyHint="done"
        />
        <button type="submit" className="i-btn i-btn--sig bk-add__btn" disabled={!draft.trim()} aria-label="Add">
          <Icon name="plus" />
        </button>
      </form>

      {open.length > 1 && (
        <button type="button" className="bk-pick" onClick={pick} disabled={rolling}>
          <span aria-hidden="true">運</span> {rolling ? 'Picking…' : 'Pick one for me'}
        </button>
      )}

      {open.length > 0 ? (
        <ul className="bk-list" aria-label="To do">
          {open.map((b) => (
            <li key={b.id} id={`bk-${b.id}`} className={`bk-row${crossing === b.id ? ' is-crossing' : ''}${picked === b.id ? (rolling ? ' is-rolling' : ' is-picked') : ''}`}>
              <button type="button" className="bk-ck" onClick={() => cross(b.id)} aria-label={`Cross off: ${b.title}`} disabled={!!crossing}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7" />
                </svg>
              </button>
              <button type="button" className="bk-row__t" onClick={() => openSheet({ type: 'bucket', editId: b.id })}>
                <b>{b.title}</b>
                {b.note && <small>{b.note}</small>}
              </button>
              <span className="bk-row__stamp" aria-hidden="true">
                叶
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="i-pnl i-empty bk-empty">
          <span className="bk-empty__k" aria-hidden="true">
            夢
          </span>
          <span>{done.length ? 'Everything crossed off. Time to dream bigger.' : 'Nothing here yet. Type the first thing above.'}</span>
        </div>
      )}

      {done.length > 0 && (
        <section className="bk-done">
          <button type="button" className="bk-done__h" aria-expanded={showDone} onClick={() => setShowDone(!showDone)}>
            <span aria-hidden="true">叶</span> Crossed off · {done.length}
            <Icon name="right" />
          </button>
          {showDone && (
            <ul className="bk-list bk-list--done" aria-label="Crossed off">
              {done.map((b) => (
                <li key={b.id} className="bk-row is-done">
                  <span className="bk-ck is-done" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                  </span>
                  <button type="button" className="bk-row__t" onClick={() => openSheet({ type: 'bucket', editId: b.id })}>
                    <b>{b.title}</b>
                    <small>{shortDay(dayOf(b.done_at!), today.slice(0, 4))}{b.note ? ` · ${b.note}` : ''}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="i-note" style={{ marginTop: 14 }}>
        Each thing crossed off earns {RULES.bucketDone} XP once. Tap a line to edit it, add a note or put it back.
        {synced && missing ? ' The bucket list is saved on this device for now: it syncs to your other devices once the database update is applied.' : ''}
      </p>
    </div>
  );
}
