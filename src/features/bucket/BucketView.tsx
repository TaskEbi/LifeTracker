import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type CSSProperties, type FormEvent } from 'react';
import { ChannelBar } from '../../app/Shell';
import { openSheet } from '../../app/sheets';
import { dayOf, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { useTableMissing } from '../../data/sync';
import type { LtBucket } from '../../data/types';
import { toast } from '../../data/ui';
import { BUCKET_SECTION_IDS, bucketSection, groupBySection, guessSection, nextStep, sectionOf, targetYear, whenLabel, type BucketSectionId } from '../../domain/bucket/sections';
import { shortDay } from '../../domain/log/dates';
import { RULES } from '../../domain/progress/engine';
import { useStore } from '../../lib/createStore';
import { HomeLink } from '../../ui/i/ChannelHead';
import { Icon } from '../../ui/i/Icon';
import { addBucket, BUCKET_TITLE_MAX, bucketItems, crossOff, splitLines } from './actions';
import { BucketArt } from './Art';
import { Compass } from './Compass';
import { Ideas } from './Ideas';
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

/** Folded sections are remembered on this device only. */
const FOLD_KEY = 'lt.bucket.folded';
const readFolded = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(FOLD_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
};
const saveFolded = (s: Set<string>) => {
  try {
    localStorage.setItem(FOLD_KEY, JSON.stringify([...s]));
  } catch {
    /* private mode: folds just aren't remembered */
  }
};

export function BucketView() {
  const today = useToday();
  const year = Number(today.slice(0, 4));
  const st = useStore(data, (s) => s);
  const { open, done } = useMemo(() => bucketItems(st), [st]);
  const synced = st.mode === 'synced';
  const missing = useTableMissing('lt_bucket');
  const [draft, setDraft] = useState('');
  /** The section the next add goes to, when the user picked one by tapping the hint. */
  const [aim, setAim] = useState<BucketSectionId | null>(null);
  const [filter, setFilter] = useState<BucketSectionId | null>(null);
  const [folded, setFolded] = useState(readFolded);
  const [crossing, setCrossing] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const total = open.length + done.length;
  const pct = total ? Math.round((done.length / total) * 100) : 0;
  const groups = useMemo(() => groupBySection(open, done), [open, done]);
  const counts = useMemo(() => new Map(groups.map((g) => [g.section.id, { open: g.open.length, done: g.done.length }])), [groups]);
  const shown = filter ? groups.filter((g) => g.section.id === filter) : groups;
  const visibleOpen = shown.flatMap((g) => g.open);
  const soon = useMemo(() => open.filter((b) => (targetYear(b) ?? Infinity) <= year).sort((a, b) => targetYear(a)! - targetYear(b)!), [open, year]);
  const anyYear = open.some((b) => targetYear(b) !== null);
  const strongest = groups.reduce<(typeof groups)[number] | null>((m, g) => (!m || g.open.length + g.done.length > m.open.length + m.done.length ? g : m), null);
  const unexplored = BUCKET_SECTION_IDS.length - groups.length;
  const thisYearDone = done.filter((b) => b.done_at!.startsWith(String(year))).length;

  // where the next add goes: the picked section, else the section being looked at, else the words
  const dest: BucketSectionId | null = draft.trim() ? (aim ?? filter ?? guessSection(draft)) : null;

  const add = (titles: string[]) => {
    const extra = aim || filter ? { cat: aim ?? filter } : {};
    const { added, dupes } = addBucket(titles, extra);
    if (added.length > 1) toast(`Added ${added.length}${dupes ? ` · ${dupes} already on the list` : ''}`);
    else if (added.length === 1 && !filter) {
      const s = bucketSection(sectionOf(added[0]));
      toast(`Added to ${s.kanji} ${s.name}`);
    } else if (!added.length && dupes) toast('Already on your list');
    if (added.length) setAim(null);
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
  const cycleAim = () => {
    const at = BUCKET_SECTION_IDS.indexOf(dest ?? 'other');
    setAim(BUCKET_SECTION_IDS[(at + 1) % BUCKET_SECTION_IDS.length]);
    input.current?.focus();
  };

  const fold = (id: string) => {
    const next = new Set(folded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFolded(next);
    saveFolded(next);
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

  // "Pick one for me": a quick roulette over the open items in view that slows down and lands on one.
  const pick = () => {
    const pool = visibleOpen;
    if (rolling || pool.length < 2) return;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const sec = sectionOf(target);
    if (folded.has(sec)) fold(sec);
    const land = () => {
      setRolling(false);
      setPicked(target.id);
      document.getElementById(`bk-${target.id}`)?.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    };
    if (reduced()) return land();
    setRolling(true);
    const steps = Math.min(14, 6 + pool.length);
    const ti = pool.indexOf(target);
    let t = 0;
    for (let i = 0; i < steps; i++) {
      t += 55 + i * i * 2.2;
      const id = pool[(ti - (steps - 1 - i) + pool.length * 20) % pool.length].id;
      later(() => setPicked(id), t);
    }
    later(land, t + 120);
  };

  const row = (b: LtBucket) => {
    const y = targetYear(b);
    const step = nextStep(b);
    return (
      <li key={b.id} id={`bk-${b.id}`} className={`bk-row${crossing === b.id ? ' is-crossing' : ''}${picked === b.id ? (rolling ? ' is-rolling' : ' is-picked') : ''}`}>
        <button type="button" className="bk-ck" onClick={() => cross(b.id)} aria-label={`Cross off: ${b.title}`} disabled={!!crossing}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
        </button>
        <button type="button" className="bk-row__t" onClick={() => openSheet({ type: 'bucket', editId: b.id })}>
          <b>{b.title}</b>
          {(y || step) && (
            <span className="bk-row__meta">
              {y && <em className={y < year ? 'is-late' : y === year ? 'is-now' : ''}>{whenLabel(y, year)}</em>}
              {step && <span className="bk-row__step">→ {step}</span>}
            </span>
          )}
          {b.note && <small>{b.note}</small>}
        </button>
        <span className="bk-row__stamp" aria-hidden="true">
          叶
        </span>
      </li>
    );
  };

  // crossed off, by the year it happened, newest first
  const wall = useMemo(() => {
    const by = new Map<string, LtBucket[]>();
    for (const b of filter ? done.filter((d) => sectionOf(d) === filter) : done) {
      const y = dayOf(b.done_at!).slice(0, 4);
      by.set(y, [...(by.get(y) ?? []), b]);
    }
    return [...by.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [done, filter]);

  return (
    <div className="bk">
      <ChannelBar current="bucket" />
      <header className="i-chhead bk-head">
        <BucketArt open={open.length} done={done.length} />
        <HomeLink />
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

      {total > 0 && (
        <section className="bk-dash" aria-label="Your list at a glance">
          <Compass counts={counts} />
          <dl className="bk-dash__facts">
            <div>
              <dt>Strongest pull</dt>
              <dd style={{ color: strongest?.section.color }}>
                {strongest ? `${strongest.section.kanji} ${strongest.section.name}` : '—'}
                {strongest && <small> · {strongest.open.length + strongest.done.length}</small>}
              </dd>
            </div>
            <div>
              <dt>Unexplored</dt>
              <dd>{unexplored ? `${unexplored} of ${BUCKET_SECTION_IDS.length} sections` : 'None. Every direction!'}</dd>
            </div>
            <div>
              <dt>Crossed off in {year}</dt>
              <dd>{thisYearDone}</dd>
            </div>
            <div>
              <dt>Planned for {year}</dt>
              <dd>{soon.length}</dd>
            </div>
          </dl>
        </section>
      )}

      {soon.length > 0 ? (
        <section className="bk-year" aria-labelledby="bk-year-h">
          <h2 id="bk-year-h" className="bk-h2">
            <span aria-hidden="true">今</span> This year
          </h2>
          <ul className="bk-year__rope" aria-label="This year">
            {soon.map((b, i) => {
              const s = bucketSection(sectionOf(b));
              return (
                <li key={b.id} className="bk-ema" style={{ '--sc': s.color, '--i': i } as CSSProperties}>
                  <button type="button" className="bk-ema__board" onClick={() => openSheet({ type: 'bucket', editId: b.id })}>
                    <span className="bk-ema__k" aria-hidden="true">
                      {s.kanji}
                    </span>
                    <b>{b.title}</b>
                    {targetYear(b)! < year && <small>from {targetYear(b)}</small>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        open.length > 0 &&
        !anyYear && <p className="bk-hint">Tap a wish and give it a year: the ones for {year} hang up here.</p>
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
        {dest && (
          <button type="button" className="bk-add__dest" onClick={cycleAim} style={{ '--sc': bucketSection(dest).color } as CSSProperties} aria-label={`Goes to ${bucketSection(dest).name}. Tap to change`}>
            <span aria-hidden="true">{bucketSection(dest).kanji}</span> → {bucketSection(dest).name}
            <small>{aim ? 'tap to change' : filter ? 'this section · tap to change' : 'guessed · tap to change'}</small>
          </button>
        )}
      </form>

      {groups.length > 1 && (
        <div className="i-chips bk-filter" role="group" aria-label="Show section">
          <button type="button" className="i-chip" aria-pressed={!filter} onClick={() => setFilter(null)}>
            All · {open.length}
          </button>
          {groups.map((g) => (
            <button key={g.section.id} type="button" className="i-chip" aria-pressed={filter === g.section.id} onClick={() => setFilter(filter === g.section.id ? null : g.section.id)} style={{ '--c': g.section.color } as CSSProperties}>
              <span className="bk-filter__k" aria-hidden="true">
                {g.section.kanji}
              </span>
              {g.section.short} · {g.open.length}
            </button>
          ))}
        </div>
      )}

      {visibleOpen.length > 1 && (
        <button type="button" className="bk-pick" onClick={pick} disabled={rolling}>
          <span aria-hidden="true">運</span> {rolling ? 'Picking…' : filter ? `Pick one from ${bucketSection(filter).short.toLowerCase()}` : 'Pick one for me'}
        </button>
      )}

      {open.length > 0 ? (
        <div className="bk-secs">
          {shown
            .filter((g) => g.open.length)
            .map((g) => {
              const n = g.open.length + g.done.length;
              const isFolded = folded.has(g.section.id) && !filter;
              return (
                <section key={g.section.id} className="bk-sec" style={{ '--sc': g.section.color, '--p': `${Math.round((g.done.length / n) * 100)}%` } as CSSProperties}>
                  <button type="button" className="bk-sec__h" aria-expanded={!isFolded} onClick={() => fold(g.section.id)}>
                    <span className="bk-sec__seal" aria-hidden="true">
                      {g.section.kanji}
                    </span>
                    <span className="bk-sec__name">
                      <b>{g.section.name}</b>
                      <small>
                        {g.open.length} to go{g.done.length ? ` · ${g.done.length} done` : ''}
                      </small>
                    </span>
                    <span className="bk-sec__bar" aria-hidden="true">
                      <i />
                    </span>
                    <Icon name="right" />
                  </button>
                  {!isFolded && (
                    <ul className="bk-list" aria-label={g.section.name}>
                      {g.open.map(row)}
                    </ul>
                  )}
                </section>
              );
            })}
          {filter && !visibleOpen.length && <p className="i-note">Nothing to go in {bucketSection(filter).name.toLowerCase()}. Add one above, or take an idea below.</p>}
        </div>
      ) : (
        <div className="i-pnl i-empty bk-empty">
          <span className="bk-empty__k" aria-hidden="true">
            夢
          </span>
          <span>{done.length ? 'Everything crossed off. Time to dream bigger.' : 'Nothing here yet. Type the first thing above, or take an idea below.'}</span>
        </div>
      )}

      <Ideas items={[...open, ...done]} section={filter} />

      {wall.length > 0 && (
        <section className="bk-wall" aria-labelledby="bk-wall-h">
          <h2 id="bk-wall-h" className="bk-h2">
            <span aria-hidden="true">叶</span> Crossed off · {wall.reduce((n, [, l]) => n + l.length, 0)}
          </h2>
          <ul className="bk-wall__list" aria-label="Crossed off">
            {wall.map(([y, list]) => [
              <li key={`y${y}`} className="bk-wall__year" aria-hidden="true">
                {y} <small>· {list.length}</small>
              </li>,
              ...list.map((b) => {
                const s = bucketSection(sectionOf(b));
                return (
                  <li key={b.id} className="bk-slip" style={{ '--sc': s.color } as CSSProperties}>
                    <button type="button" className="bk-slip__b" onClick={() => openSheet({ type: 'bucket', editId: b.id })}>
                      <span className="bk-slip__k" aria-hidden="true">
                        {s.kanji}
                      </span>
                      <b>{b.title}</b>
                      <small>
                        {shortDay(dayOf(b.done_at!), today.slice(0, 4))}
                        {b.note ? ` · ${b.note}` : ''}
                      </small>
                      <span className="bk-slip__stamp" aria-hidden="true">
                        叶
                      </span>
                    </button>
                  </li>
                );
              }),
            ])}
          </ul>
        </section>
      )}

      <p className="i-note" style={{ marginTop: 14 }}>
        Each thing crossed off earns {RULES.bucketDone} XP once. Sections are guessed from the words; tap a line to move it, give it a year or a next step, or put it back.
        {synced && missing ? ' The bucket list is saved on this device for now: it syncs to your other devices once the database update is applied.' : ''}
      </p>
    </div>
  );
}
