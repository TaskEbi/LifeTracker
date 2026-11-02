/** Reading's sheets: log a session, a book, a highlight, and the Kindle import. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { ltToday, sectionEntries } from '../../data/lt';
import { deleteRecord } from '../../data/records';
import { deleteSession } from '../../data/sessions';
import { data } from '../../data/store';
import { toast } from '../../data/ui';
import { shortDay } from '../../domain/log/dates';
import { formatMinutes } from '../../domain/log/duration';
import { parseClippings, planImport } from '../../domain/reading/clippings';
import {
  bookOf,
  bookProgress,
  BOOK_STATUSES,
  clampPct,
  FORMAT_LABEL,
  FORMATS,
  GENRES,
  highlightOf,
  likelyBook,
  readSession,
  STATUS_LABEL,
  titleKey,
  type BookFormat,
  type BookStatus,
  type ReadingDetail,
} from '../../domain/reading/model';
import { searchBooks, type BookHit } from '../../integrations/openLibrary';
import { useStore } from '../../lib/createStore';
import { Picks, Toggle } from '../../ui/i/bits';
import { DayPick, MinutesField } from '../../ui/i/fields';
import { Icon } from '../../ui/i/Icon';
import { Sheet } from '../../ui/i/Sheet';
import { blankBook, booksIn, formOf, importClippings, linesIn, logReading, saveBook, saveLine, sessionsIn, startReadingTimer, timerBook, type BookForm } from './actions';
import { Cover } from './Cover';

// ─── small parts ────────────────────────────────────────────────────────────

export function Stars({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="rd-stars" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className="rd-star" aria-pressed={value != null && value >= n} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`} onClick={() => onChange(value === n ? null : n)}>
          ★
        </button>
      ))}
    </div>
  );
}

/** A book's title, with suggestions from Open Library as you type. Picking one fills in the rest. */
function TitleField({ value, onChange, onPick, autoFocus }: { value: string; onChange: (t: string) => void; onPick: (h: BookHit) => void; autoFocus?: boolean }) {
  const [hits, setHits] = useState<BookHit[]>([]);
  const [state, setState] = useState<'idle' | 'looking' | 'failed'>('idle');
  /** Don't search for what was just picked or was already there. */
  const settled = useRef(value);
  useEffect(() => {
    const q = value.trim();
    if (q.length < 3 || q === settled.current) {
      setHits([]);
      setState('idle');
      return;
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      setState('looking');
      searchBooks(q, ctrl.signal)
        .then((list) => {
          setHits(list);
          setState('idle');
        })
        .catch((e) => {
          if ((e as Error).name !== 'AbortError') {
            setHits([]);
            setState('failed');
          }
        });
    }, 450);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [value]);
  return (
    <div className="rd-title">
      <input className="i-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Title" aria-label="Title" maxLength={200} autoFocus={autoFocus} />
      {state === 'failed' && <p className="i-note">Couldn't reach Open Library for suggestions. Type it in yourself; nothing else depends on it.</p>}
      {hits.length > 0 && (
        <ul className="rd-hits" aria-label="Suggestions from Open Library">
          {hits.map((h, i) => (
            <li key={`${h.title}${i}`}>
              <button
                type="button"
                className="rd-hit"
                onClick={() => {
                  settled.current = h.title;
                  setHits([]);
                  onPick(h);
                }}
              >
                <Cover book={{ title: h.title, author: h.author, coverId: h.coverId }} />
                <span>
                  <b>{h.title}</b>
                  <small>{[h.author, h.year, h.pages ? `${h.pages} pages` : null].filter(Boolean).join(' · ')}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {hits.length > 0 && <p className="i-note">Suggestions from Open Library. Check they're the right edition.</p>}
    </div>
  );
}

const applyHit = (f: BookForm, h: BookHit): BookForm => ({ ...f, title: h.title, author: h.author || f.author, coverId: h.coverId, pages: h.pages ?? f.pages, genre: f.genre ?? h.genre });

/** The Kindle's percentage: typed exactly, or slid. Left alone it isn't recorded. */
function PercentField({ value, from, onChange }: { value: number | null; from: number; onChange: (v: number | null) => void }) {
  const [typed, setTyped] = useState(value == null ? '' : String(value));
  const set = (s: string) => {
    setTyped(s);
    const n = Number(s);
    onChange(s.trim() === '' || !Number.isFinite(n) ? null : clampPct(n));
  };
  return (
    <div className="i-field rd-pct">
      <label className="i-lab" htmlFor="rd-pct">
        Where you got to · Kindle's %, optional
      </label>
      <div className="rd-pct__row">
        <input className="rd-pct__range" type="range" min={0} max={100} value={value ?? from} onChange={(e) => set(e.target.value)} aria-label="Percentage slider" data-set={value != null || undefined} />
        <span className="rd-pct__typed">
          <input id="rd-pct" className="i-input" inputMode="numeric" value={typed} onChange={(e) => set(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))} placeholder={String(from)} />
          <i aria-hidden="true">%</i>
        </span>
      </div>
    </div>
  );
}

// ─── log a session ──────────────────────────────────────────────────────────

const NEW = '__new';

function ReadingSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const st = data.get();
  const books = useMemo(() => booksIn(st), [st]);
  const sessions = useMemo(() => sessionsIn(st), [st]);
  const editId = (spec.editId as string | undefined) ?? null;
  const prev = editId ? sectionEntries<ReadingDetail>(st, 'reading').find((s) => s.entry.id === editId) : undefined;
  const pd = prev ? readSession(prev.entry, prev.detail) : null;

  const fromTimer = spec.minutes != null ? timerBook() : null;
  const initial = (spec.bookId as string | undefined) ?? pd?.bookId ?? (fromTimer && books.some((b) => b.id === fromTimer) ? fromTimer : null) ?? likelyBook(books, sessions)?.id ?? NEW;
  const [pick, setPick] = useState<string>(initial);
  const [fresh, setFresh] = useState<BookForm>(blankBook());
  const [minutes, setMinutes] = useState(pd?.minutes ?? (spec.minutes as number | undefined) ?? 30);
  const [date, setDate] = useState(pd?.date ?? today);
  const [percent, setPercent] = useState<number | null>(pd?.percent ?? null);
  const [note, setNote] = useState(pd?.note ?? '');
  const [finished, setFinished] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [error, setError] = useState<string | null>(null);

  const book = books.find((b) => b.id === pick) ?? null;
  const at = book ? bookProgress(book, sessions).pct : 0;
  const alreadyDone = book?.status === 'finished';
  const open = books.filter((b) => b.status === 'reading' || b.status === 'paused' || b.id === pick);
  const next = books.filter((b) => b.status === 'want' && b.id !== pick).slice(0, 5);
  const options = [...open, ...next].map((b) => ({ id: b.id, label: b.title.length > 28 ? `${b.title.slice(0, 27)}…` : b.title }));

  const onPercent = (v: number | null) => {
    setPercent(v);
    if (v === 100 && !alreadyDone) setFinished(true);
  };
  const save = () => {
    const err = logReading({ bookId: pick === NEW ? null : pick, newBook: pick === NEW ? fresh : null, minutes, date, percent, note, finished, rating, review }, editId);
    if (err) setError(err);
    else closeSheet();
  };

  return (
    <Sheet
      title={prev ? 'Edit reading session' : 'CH11 · log reading'}
      onClose={closeSheet}
      accent="reading"
      footer={
        <>
          {prev && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteSession(prev.entry.id), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <Picks label="Book" value={pick} onChange={(v) => (setPick(v), setError(null))} options={[...options, { id: NEW, label: '+ New book' }]} />
      {pick === NEW && (
        <>
          <TitleField value={fresh.title} autoFocus={!spec.minutes} onChange={(title) => setFresh({ ...fresh, title })} onPick={(h) => setFresh(applyHit(fresh, h))} />
          <input className="i-input" value={fresh.author} onChange={(e) => setFresh({ ...fresh, author: e.target.value })} placeholder="Author · optional" aria-label="Author" maxLength={120} />
        </>
      )}
      <MinutesField value={minutes} onChange={setMinutes} presets={[15, 20, 30, 45, 60, 90]} />
      {!finished && <PercentField value={percent} from={at} onChange={onPercent} />}
      {book && bookProgress(book, sessions).minutesPerPct != null && percent == null && !finished && <p className="i-note">Last at {at}%. Leave it blank if you don't want to check.</p>}
      {!alreadyDone && <Toggle on={finished} label="I finished the book" hint="Puts it on the shelf" onChange={setFinished} />}
      {finished && (
        <>
          <Stars value={rating} onChange={setRating} />
          <textarea className="i-textarea" value={review} onChange={(e) => setReview(e.target.value)} maxLength={2000} placeholder="What will you remember? · optional" aria-label="Review" />
        </>
      )}
      <DayPick value={date} onChange={setDate} today={today} />
      <textarea className="i-textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="A thought from this session · optional" aria-label="Notes" />
      {error && (
        <p className="i-error" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  );
}

// ─── a book ─────────────────────────────────────────────────────────────────

function BookSheet({ spec }: { spec: SheetSpec }) {
  const st = useStore(data, (s) => s);
  const today = ltToday();
  const rec = spec.editId ? st.lt_records.get(spec.editId as string) : undefined;
  const book = rec ? bookOf(rec) : null;
  const [f, setF] = useState<BookForm>(() => (book ? formOf(book) : blankBook((spec.status as BookStatus) ?? 'reading')));
  const set = (patch: Partial<BookForm>) => setF((x) => ({ ...x, ...patch }));
  const sessions = useMemo(() => (book ? sessionsIn(st).filter((s) => s.bookId === book.id) : []), [st, book]);
  const lines = useMemo(() => (book ? linesIn(st).filter((h) => h.bookId === book.id) : []), [st, book]);
  const stats = book ? bookProgress(book, sessions) : null;
  const dupe = !book && f.title.trim() ? booksIn(st).find((b) => titleKey(b.title) === titleKey(f.title)) : null;
  const save = () => {
    saveBook(f, book?.id);
    closeSheet();
  };
  const showStart = f.status === 'reading' || f.status === 'paused';
  return (
    <Sheet
      title={book ? book.title : f.status === 'want' ? 'Add to the pile' : 'Add a book'}
      onClose={closeSheet}
      accent="reading"
      footer={
        <>
          {book && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(book.id, 'Book deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!f.title.trim()} onClick={save}>
            Save
          </button>
        </>
      }
    >
      {book && stats && (
        <div className="rd-card">
          <Cover book={book} />
          <div className="rd-card__facts">
            <b>{stats.pct}%</b>
            <span>{formatMinutes(stats.minutes)} over {stats.sessions} {stats.sessions === 1 ? 'session' : 'sessions'}</span>
            {stats.pagesRead != null && <span>about {stats.pagesRead} of {book.pages} print pages</span>}
            {stats.leftMinutes != null && <span>about {formatMinutes(stats.leftMinutes)} left at your pace</span>}
            <span>{lines.length} {lines.length === 1 ? 'highlight' : 'highlights'}</span>
          </div>
        </div>
      )}
      {book && (
        <div className="i-picks">
          <button type="button" className="i-pick" onClick={() => openSheet({ type: 'reading', bookId: book.id })}>
            Log time
          </button>
          <button type="button" className="i-pick" onClick={() => startReadingTimer(book.id)}>
            Start timer
          </button>
          <button type="button" className="i-pick" onClick={() => openSheet({ type: 'reading-line', bookId: book.id })}>
            Add a highlight
          </button>
        </div>
      )}
      <TitleField value={f.title} autoFocus={!book} onChange={(title) => set({ title })} onPick={(h) => setF((x) => applyHit(x, h))} />
      {dupe && <p className="i-note">“{dupe.title}” is already here ({STATUS_LABEL[dupe.status].toLowerCase()}).</p>}
      <input className="i-input" value={f.author} onChange={(e) => set({ author: e.target.value })} placeholder="Author · optional" aria-label="Author" maxLength={120} />
      <Picks label="Status" value={f.status} onChange={(status) => set({ status, finishedOn: status === 'finished' ? f.finishedOn ?? today : f.finishedOn })} options={BOOK_STATUSES.map((s) => ({ id: s, label: STATUS_LABEL[s] }))} />
      <Picks<BookFormat> label="Format" value={f.format} onChange={(format) => set({ format })} options={FORMATS.map((x) => ({ id: x, label: FORMAT_LABEL[x] }))} />
      <Picks label="Genre" value={f.genre} onChange={(genre) => set({ genre: genre === f.genre ? null : genre })} options={GENRES.map((g) => ({ id: g, label: g }))} />
      <div className="rd-dates">
        <label>
          <span className="i-lab">Started</span>
          <input className="i-input" type="date" max={today} value={f.startedOn ?? ''} onChange={(e) => set({ startedOn: e.target.value || null })} />
        </label>
        {f.status === 'finished' && (
          <label>
            <span className="i-lab">Finished</span>
            <input className="i-input" type="date" max={today} value={f.finishedOn ?? ''} onChange={(e) => set({ finishedOn: e.target.value || null })} />
          </label>
        )}
      </div>
      {showStart && (
        <label className="rd-inline">
          <span>Already at, before logging</span>
          <span className="rd-pct__typed">
            <input className="i-input" inputMode="numeric" value={f.startPct || ''} onChange={(e) => set({ startPct: clampPct(Number(e.target.value.replace(/[^0-9]/g, '')) || 0) })} placeholder="0" aria-label="Already at, percent" />
            <i aria-hidden="true">%</i>
          </span>
        </label>
      )}
      <label className="rd-inline">
        <span>Print pages · only for estimates</span>
        <input className="i-input" inputMode="numeric" value={f.pages ?? ''} onChange={(e) => set({ pages: Number(e.target.value.replace(/[^0-9]/g, '')) || null })} placeholder="—" aria-label="Print pages" />
      </label>
      {(f.status === 'finished' || f.status === 'dropped' || f.rating != null) && (
        <>
          <Stars value={f.rating} onChange={(rating) => set({ rating })} />
          <textarea className="i-textarea" value={f.review} onChange={(e) => set({ review: e.target.value })} maxLength={2000} placeholder="What will you remember? · optional" aria-label="Review" />
        </>
      )}
      {sessions.length > 0 && (
        <div className="i-rows rd-history" aria-label="Sessions on this book">
          {sessions.slice(0, 6).map((s) => (
            <button key={s.id} type="button" className="i-row" onClick={() => openSheet({ type: 'reading', editId: s.id })}>
              <span className="i-row__t">
                <b>{shortDay(s.date)}</b>
                {s.note && <small>{s.note}</small>}
              </span>
              <span className="i-row__n">{s.minutes}m{s.percent != null ? ` · ${s.percent}%` : ''}</span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}

// ─── a highlight ────────────────────────────────────────────────────────────

function LineSheet({ spec }: { spec: SheetSpec }) {
  const st = data.get();
  const today = ltToday();
  const rec = spec.editId ? st.lt_records.get(spec.editId as string) : undefined;
  const h = rec ? highlightOf(rec) : null;
  const books = useMemo(() => booksIn(st), [st]);
  const start = (spec.bookId as string | undefined) ?? h?.bookId ?? likelyBook(books, sessionsIn(st))?.id ?? '';
  const [bookId, setBookId] = useState(start);
  const [text, setText] = useState(h?.text ?? '');
  const [note, setNote] = useState(h?.note ?? '');
  const [loc, setLoc] = useState(h?.loc ?? '');
  const [fav, setFav] = useState(h?.fav ?? false);
  const book = books.find((b) => b.id === bookId);
  const save = () => {
    saveLine({ bookId: book?.id ?? null, book: book?.title ?? h?.book ?? '', text, note, loc, addedOn: h?.addedOn ?? today, fav, key: h?.key ?? '' }, h?.id);
    closeSheet();
  };
  return (
    <Sheet
      title={h ? 'Highlight' : 'Add a highlight'}
      onClose={closeSheet}
      accent="reading"
      footer={
        <>
          {h && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(h.id, 'Highlight deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!text.trim() && !note.trim()} onClick={save}>
            Save
          </button>
        </>
      }
    >
      <textarea className="i-textarea rd-linebox" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} placeholder="The line, as it's written" aria-label="The line" autoFocus={!h} />
      <label className="i-field">
        <span className="i-lab">Book</span>
        <select className="i-input" value={bookId} onChange={(e) => setBookId(e.target.value)}>
          <option value="">No book</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
      </label>
      <textarea className="i-textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="Your note · optional" aria-label="Your note" />
      <input className="i-input" value={loc} onChange={(e) => setLoc(e.target.value)} maxLength={40} placeholder="Location · optional" aria-label="Location" />
      <Toggle on={fav} label="Favourite" hint="Comes back more often as today's line" onChange={setFav} />
      {h?.text && (
        <button
          type="button"
          className="i-link"
          onClick={() => {
            navigator.clipboard?.writeText(`“${h.text}”${h.book ? ` — ${h.book}` : ''}`).then(
              () => toast('Copied'),
              () => toast("Couldn't copy here"),
            );
          }}
        >
          <Icon name="plus" /> Copy the line
        </button>
      )}
    </Sheet>
  );
}

// ─── Kindle import ──────────────────────────────────────────────────────────

function ImportSheet() {
  const [raw, setRaw] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const plan = useMemo(() => {
    if (!raw.trim()) return null;
    const st = data.get();
    const lines = linesIn(st);
    const known = { titles: new Set(booksIn(st).map((b) => titleKey(b.title))), keys: new Set(lines.map((h) => h.key).filter(Boolean)) };
    const parsed = parseClippings(raw);
    return { parsed, ...planImport(parsed, known) };
  }, [raw]);
  const read = (file: File | undefined) => {
    if (!file) return;
    setFailed(null);
    setFileName(file.name);
    file.text().then(setRaw, () => setFailed("That file couldn't be read."));
  };
  const go = () => {
    if (!plan) return;
    const done = importClippings(plan.books);
    closeSheet();
    toast(`Added ${done.lines} ${done.lines === 1 ? 'highlight' : 'highlights'} and ${done.books} ${done.books === 1 ? 'book' : 'books'}`);
  };
  return (
    <Sheet
      title="Import from Kindle"
      onClose={closeSheet}
      accent="reading"
      footer={
        <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!plan || (!plan.lines && !plan.newBooks)} onClick={go}>
          {plan && (plan.lines || plan.newBooks) ? `Add ${plan.lines} ${plan.lines === 1 ? 'highlight' : 'highlights'}` : 'Add'}
        </button>
      }
    >
      <p className="i-note">
        Plug the Kindle into a computer and find <b>documents/My Clippings.txt</b>. Choose that file here, or paste what's in it. Your highlights and notes come across; bookmarks don't. Importing twice adds nothing new.
      </p>
      <label className="i-btn i-btn--block rd-file">
        <input type="file" accept=".txt,text/plain" onChange={(e) => read(e.target.files?.[0])} aria-label="Choose My Clippings.txt" />
        {fileName ?? 'Choose My Clippings.txt'}
      </label>
      <textarea className="i-textarea" value={raw.length > 20000 ? `${raw.slice(0, 20000)}…` : raw} readOnly={raw.length > 20000} onChange={(e) => setRaw(e.target.value)} placeholder="…or paste it here" aria-label="Clippings text" />
      {failed && (
        <p className="i-error" role="alert">
          {failed}
        </p>
      )}
      {plan && !plan.parsed.length && (
        <p className="i-error" role="alert">
          That doesn't look like a Kindle clippings file: no highlights found.
        </p>
      )}
      {plan && plan.parsed.length > 0 && !plan.lines && !plan.newBooks && <p className="i-note">Nothing new: every highlight in it is already here.</p>}
      {plan && (plan.lines > 0 || plan.newBooks > 0) && (
        <>
          <p className="i-note">
            {plan.lines} new {plan.lines === 1 ? 'highlight' : 'highlights'} from {plan.books.length} {plan.books.length === 1 ? 'book' : 'books'}. New books come in as On hold, since the file doesn't say if you finished them: mark those you did.
          </p>
          <div className="i-rows rd-import" aria-label="What will come across">
            {plan.books.slice(0, 30).map((b) => (
              <div key={b.title} className="i-row">
                <span className="i-row__t">
                  <b>{b.title}</b>
                  <small>{[b.author, b.isNew ? 'new book' : 'already here'].filter(Boolean).join(' · ')}</small>
                </span>
                <span className="i-row__n">{b.clippings.length}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}

registerSheet('reading', ReadingSheet);
registerSheet('reading-book', BookSheet);
registerSheet('reading-line', LineSheet);
registerSheet('reading-import', ImportSheet);
