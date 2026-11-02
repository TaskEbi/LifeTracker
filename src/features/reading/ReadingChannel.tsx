/**
 * CH11 · Reading: a window seat on a rainy night. Desk is what's open now (with where each book
 * stands and when it should be done), Shelf the books as spines, Lines the highlights, and Year
 * the year in books. A Kindle shows no pages, so time and its percentage do all the work.
 */
import { useMemo, useState, type CSSProperties } from 'react';
import { navigate, useRoute } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { setPref, setTargets, useAchievements, useTargets, useToday, useYearGoal } from '../../data/lt';
import { data } from '../../data/store';
import { addDays, shortDay, weekStart } from '../../domain/log/dates';
import { formatMinutes } from '../../domain/log/duration';
import { bookProgress, dailyRate, finishBy, isFinished, lineOfDay, readingYears, sleepAfterReading, STATUS_LABEL, yearBooks, type Book, type Highlight, type ReadSession } from '../../domain/reading/model';
import { useStore } from '../../lib/createStore';
import { accent, Chips, H2, Meter, Stepper } from '../../ui/i/bits';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { Bars, Matrix } from '../../ui/i/charts';
import { Emblem } from '../../ui/i/Emblem';
import { Icon } from '../../ui/i/Icon';
import { RelatedTasks } from '../../ui/i/RelatedTasks';
import { booksIn, linesIn, sessionsIn, startReadingTimer } from './actions';
import { ReadingArt } from './Art';
import { clothOf, Cover, seedOfTitle, spineHeight, spineWidth } from './Cover';
import './sheets';
import './reading.css';
import './theme.css';

const TABS = [
  { id: '', label: 'Desk' },
  { id: 'shelf', label: 'Shelf' },
  { id: 'lines', label: 'Lines' },
  { id: 'year', label: 'Year' },
] as const;

const openBook = (b: Book) => openSheet({ type: 'reading-book', editId: b.id });

export function ReadingChannel() {
  const today = useToday();
  const route = useRoute();
  const tab = TABS.find((t) => t.id === (route.rest[0] ?? ''))?.id ?? '';
  const st = useStore(data, (s) => s);
  const books = useMemo(() => booksIn(st), [st]);
  const sessions = useMemo(() => sessionsIn(st), [st]);
  const lines = useMemo(() => linesIn(st), [st]);
  const reading = books.filter((b) => b.status === 'reading');
  const finished = books.filter(isFinished).sort((a, b) => a.finishedOn.localeCompare(b.finishedOn));
  const lastOpen = reading[0] ? bookProgress(reading[0], sessions).pct : null;

  return (
    <div style={accent('reading')} className="rd">
      <ChannelHead id="reading" art={<ReadingArt pct={lastOpen} finished={finished.length} titles={finished.slice(-6).map((b) => b.title)} />} />
      <nav className="rd-tabs" aria-label="Reading sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" className="rd-tab" aria-current={tab === t.id ? 'page' : undefined} onClick={() => navigate('reading', t.id ? [t.id] : [], { replace: true })}>
            {t.label}
          </button>
        ))}
      </nav>
      {tab === 'shelf' ? (
        <ShelfTab books={books} sessions={sessions} today={today} />
      ) : tab === 'lines' ? (
        <LinesTab lines={lines} books={books} today={today} />
      ) : tab === 'year' ? (
        <YearTab books={books} sessions={sessions} today={today} />
      ) : !books.length && !sessions.length ? (
        <Welcome />
      ) : (
        <Desk books={books} sessions={sessions} lines={lines} today={today} />
      )}
    </div>
  );
}

function Welcome() {
  return (
    <section className="rd-welcome">
      <h2>What are you reading?</h2>
      <p>Add the book on your Kindle, then log the time after each sitting. If you glance at its percentage, you'll also see how long is left and when you'll finish.</p>
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'reading-book' })}>
        <Icon name="plus" /> Add the book I'm reading
      </button>
      <button type="button" className="i-btn i-btn--block" onClick={() => openSheet({ type: 'reading-import' })}>
        Import highlights from Kindle
      </button>
    </section>
  );
}

// ─── Desk ───────────────────────────────────────────────────────────────────

function NowCard({ book, sessions, rate, today }: { book: Book; sessions: ReadSession[]; rate: number; today: string }) {
  const p = bookProgress(book, sessions);
  const by = finishBy(p.leftMinutes, rate, today);
  const idle = p.lastRead ? Math.round((Date.parse(today) - Date.parse(p.lastRead)) / 864e5) : null;
  return (
    <article className="rd-now">
      <button type="button" className="rd-now__book" onClick={() => openBook(book)} aria-label={`${book.title}, ${p.pct} percent. Open`}>
        <Cover book={book} />
        <span className="rd-now__t">
          <b>{book.title}</b>
          {book.author && <small>{book.author}</small>}
          <span className="rd-ribbon" style={{ '--p': `${p.pct}%` } as CSSProperties} aria-hidden="true">
            <i />
          </span>
          <span className="rd-now__nums">
            <em>{p.pct}%</em>
            <span>{formatMinutes(p.minutes)} so far</span>
          </span>
        </span>
      </button>
      <p className="rd-now__fore">
        {p.leftMinutes != null
          ? `About ${formatMinutes(p.leftMinutes)} left${by ? ` · done around ${shortDay(by)} at your pace` : ''}`
          : p.minutes
            ? "Add the Kindle's % next time to see how long is left"
            : 'Nothing logged on it yet'}
        {idle != null && idle >= 7 ? ` · last opened ${idle} days ago` : ''}
      </p>
      <div className="rd-now__do">
        <button type="button" className="i-btn" onClick={() => startReadingTimer(book.id)}>
          Timer
        </button>
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'reading', bookId: book.id })}>
          <Icon name="plus" /> Log time
        </button>
      </div>
    </article>
  );
}

function Desk({ books, sessions, lines, today }: { books: Book[]; sessions: ReadSession[]; lines: Highlight[]; today: string }) {
  const target = useTargets().readingWeek;
  const goal = useYearGoal();
  const monday = weekStart(today);
  const week = sessions.filter((s) => s.date >= monday && s.date <= today).reduce((n, s) => n + s.minutes, 0);
  const total = sessions.reduce((n, s) => n + s.minutes, 0);
  const rate = dailyRate(sessions, today);
  const reading = books.filter((b) => b.status === 'reading');
  const pile = books.filter((b) => b.status === 'want');
  const year = today.slice(0, 4);
  const doneThisYear = books.filter(isFinished).filter((b) => b.finishedOn.startsWith(year)).length;
  const line = lineOfDay(lines, today);
  const days = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sessions) m.set(s.date, (m.get(s.date) ?? 0) + s.minutes);
    return Array.from({ length: 28 }, (_, i) => addDays(today, i - 27)).map((date) => ({ date, minutes: m.get(date) ?? 0 }));
  }, [sessions, today]);

  return (
    <>
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'reading' })}>
        <Icon name="plus" /> Log reading
      </button>
      <div className="i-meters" style={{ marginTop: 10 }}>
        <Meter value={formatMinutes(week)} label={`of ${formatMinutes(target)} this week`} />
        <Meter value={`${doneThisYear}/${goal}`} label={`Books in ${year}`} />
        <Meter value={formatMinutes(total)} label="All time" />
      </div>
      <div className="rd-week" style={{ '--p': `${Math.min(1, week / Math.max(1, target)) * 100}%` } as CSSProperties} aria-hidden="true">
        <i />
      </div>

      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'reading-book' })}>+ Book</button>}>Now reading</H2>
      {reading.length ? (
        <div className="rd-nowlist">
          {reading.map((b) => (
            <NowCard key={b.id} book={b} sessions={sessions} rate={rate} today={today} />
          ))}
        </div>
      ) : (
        <p className="i-note">Nothing open. Take one from the pile, or add a book.</p>
      )}

      {line && (
        <button type="button" className="rd-today" onClick={() => openSheet({ type: 'reading-line', editId: line.id })}>
          <span className="rd-today__k">Today's line</span>
          <blockquote>{line.text}</blockquote>
          {line.book && <cite>{line.book}</cite>}
        </button>
      )}

      <H2 aside={formatMinutes(days.reduce((n, d) => n + d.minutes, 0))}>Last 4 weeks</H2>
      <div className="i-pnl">
        <Matrix days={days} today={today} label="Reading in the last 4 weeks" />
      </div>

      <Pile pile={pile} />
      <Awards />

      <H2 aside={`${sessions.length} sessions`}>Recent sessions</H2>
      <div className="i-pnl i-pnl--flush">
        {sessions.length ? (
          sessions.slice(0, 8).map((s) => (
            <button key={s.id} type="button" className="i-row" onClick={() => openSheet({ type: 'reading', editId: s.id })}>
              <span className="i-row__t">
                <b>{s.book ?? 'Reading'}</b> <span className="i-mono i-small i-dim">{shortDay(s.date)}</span>
                <small>{s.note ?? (s.bookId ? '' : 'From the Daily Log')}</small>
              </span>
              <span className="i-row__n">
                {s.minutes}m{s.percent != null ? ` · ${s.percent}%` : ''}
              </span>
            </button>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>Nothing logged yet.</p>
        )}
      </div>

      <div className="i-pnl rd-target">
        <span>
          Reading per week
          <br />
          <span className="i-mono i-small i-dim">applies from this week; past weeks keep theirs</span>
        </span>
        <Stepper value={formatMinutes(target)} label="weekly target" onStep={(s) => setTargets({ readingWeek: Math.max(15, target + 15 * s) })} />
      </div>
      <RelatedTasks section="reading" />
      <p className="i-note">Time goes into the Daily Log as “Reading” and earns XP like any section. Finishing a book earns 60 XP, reaching the year's goal 150. Books you add with an older finish date count for the shelf and emblems, not XP.</p>
    </>
  );
}

/** The pile by the bed: books lying flat, newest on top, and one chosen for you if you can't decide. */
function Pile({ pile }: { pile: Book[] }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const pickOne = () => {
    if (pile.length < 2) {
      if (pile[0]) setPicked(pile[0].id);
      return;
    }
    setRolling(true);
    let i = 0;
    const steps = 10;
    const spin = () => {
      setPicked(pile[Math.floor(Math.random() * pile.length)].id);
      if (++i < steps) window.setTimeout(spin, 70 + i * 16);
      else setRolling(false);
    };
    spin();
  };
  return (
    <>
      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'reading-book', status: 'want' })}>+ To the pile</button>}>Up next · 積ん読</H2>
      {pile.length ? (
        <>
          <ul className="rd-pile" aria-label="Up next">
            {pile.slice(0, 7).map((b) => {
              const [cloth, foil] = clothOf(b.title);
              const seed = seedOfTitle(b.title);
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    className={`rd-flat${picked === b.id ? ' is-picked' : ''}${rolling ? ' is-rolling' : ''}`}
                    style={{ '--cloth': cloth, '--foil': foil, '--w': `${78 + seed % 20}%`, '--x': `${seed % 9}%` } as CSSProperties}
                    onClick={() => openBook(b)}
                  >
                    <b>{b.title}</b>
                    {b.author && <small>{b.author}</small>}
                  </button>
                </li>
              );
            })}
          </ul>
          {pile.length > 7 && <p className="i-note">and {pile.length - 7} more on the Shelf tab.</p>}
          {pile.length > 1 && (
            <button type="button" className="i-btn i-btn--block" style={{ marginTop: 8 }} disabled={rolling} onClick={pickOne}>
              Pick my next book
            </button>
          )}
          {picked && !rolling && <p className="i-note rd-picked" role="status">How about {pile.find((b) => b.id === picked)?.title}? Tap it to open.</p>}
        </>
      ) : (
        <p className="i-note">Books you want to read wait here. The Japanese have a word for the pile: 積ん読, tsundoku.</p>
      )}
    </>
  );
}

/** Reading's emblems: the last one won and the nearest ones to go. */
function Awards() {
  const all = useAchievements();
  const mine = all.filter((a) => a.group === 'reading');
  const won = mine.filter((a) => a.unlockedOn).sort((a, b) => b.unlockedOn!.localeCompare(a.unlockedOn!));
  const next = mine.filter((a) => !a.unlockedOn).sort((a, b) => b.progress / b.goal - a.progress / a.goal).slice(0, 2);
  const shown = [...won.slice(0, 1), ...next].slice(0, 3);
  return (
    <>
      <H2 aside={<button type="button" className="i-link" onClick={() => navigate('progress', ['achievements'])}>{won.length} of {mine.length}</button>}>Emblems</H2>
      <div className="i-pnl i-pnl--flush">
        {shown.map((a) => (
          <div key={a.id} className="i-row i-row--lead rd-award">
            <Emblem a={a} size={46} locked={!a.unlockedOn} />
            <span className="i-row__t">
              <b>{a.title}</b>
              <small>{a.desc}</small>
            </span>
            <span className="i-row__n">{a.unlockedOn ? shortDay(a.unlockedOn) : `${a.progress}/${a.goal}`}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Shelf ──────────────────────────────────────────────────────────────────

function Spines({ list, minutes }: { list: Book[]; minutes: Map<string, number> }) {
  return (
    <div className="rd-shelf">
      {list.map((b, i) => {
        const [cloth, foil] = clothOf(b.title);
        const style = { '--cloth': cloth, '--foil': foil, width: spineWidth(b.title, minutes.get(b.id) ?? 0), height: spineHeight(b.title), animationDelay: `${Math.min(i, 14) * 26}ms` } as CSSProperties;
        return (
          <div className="rd-slot" key={b.id}>
            <button type="button" className={`rd-spine${b.rating === 5 ? ' is-five' : ''}`} style={style} onClick={() => openBook(b)} aria-label={`${b.title}${b.author ? ` by ${b.author}` : ''}${b.rating ? `, ${b.rating} stars` : ''}`}>
              <span>{b.title}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ShelfTab({ books, sessions, today }: { books: Book[]; sessions: ReadSession[]; today: string }) {
  const goal = useYearGoal();
  const minutes = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sessions) if (s.bookId) m.set(s.bookId, (m.get(s.bookId) ?? 0) + s.minutes);
    return m;
  }, [sessions]);
  const finished = books.filter(isFinished).sort((a, b) => a.finishedOn.localeCompare(b.finishedOn));
  const years = [...new Set(finished.map((b) => b.finishedOn.slice(0, 4)))].sort().reverse();
  const year = today.slice(0, 4);
  const done = finished.filter((b) => b.finishedOn.startsWith(year)).length;
  const rest = (['reading', 'want', 'paused', 'dropped'] as const).map((s) => [s, books.filter((b) => b.status === s)] as const).filter(([, l]) => l.length);
  return (
    <>
      <div className="i-pnl rd-goal">
        <div className="rd-goal__t">
          <b>{done} of {goal}</b>
          <small>books finished in {year}</small>
        </div>
        <Stepper value={goal} label="books a year" onStep={(s) => setPref('reading_goal', Math.max(1, Math.min(365, goal + s)))} />
        <div className="rd-goal__row" aria-hidden="true">
          {Array.from({ length: Math.min(goal, 36) }, (_, i) => (
            <i key={i} className={i < done ? 'is-on' : ''} />
          ))}
        </div>
      </div>
      <div className="rd-acts">
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'reading-book', status: 'finished' })}>
          <Icon name="plus" /> A book I've read
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'reading-import' })}>
          Import from Kindle
        </button>
      </div>
      {years.length ? (
        years.map((y) => {
          const list = finished.filter((b) => b.finishedOn.startsWith(y));
          return (
            <section key={y} aria-label={`Finished in ${y}`}>
              <H2 aside={`${list.length} ${list.length === 1 ? 'book' : 'books'}`}>{y}</H2>
              <Spines list={list} minutes={minutes} />
            </section>
          );
        })
      ) : (
        <div className="rd-shelf rd-shelf--empty">
          <p>Finished books stand here, wider the longer you spent in them.</p>
        </div>
      )}
      {rest.map(([s, list]) => (
        <section key={s} aria-label={STATUS_LABEL[s]}>
          <H2 aside={list.length}>{STATUS_LABEL[s]}</H2>
          <div className="i-pnl i-pnl--flush">
            {list.map((b) => {
              const p = bookProgress(b, sessions);
              return (
                <button key={b.id} type="button" className="i-row i-row--lead rd-row" onClick={() => openBook(b)}>
                  <Cover book={b} />
                  <span className="i-row__t">
                    <b>{b.title}</b>
                    <small>{[b.author, p.minutes ? formatMinutes(p.minutes) : null].filter(Boolean).join(' · ')}</small>
                  </span>
                  <span className="i-row__n">{p.pct ? `${p.pct}%` : ''}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

// ─── Lines ──────────────────────────────────────────────────────────────────

function LinesTab({ lines, books, today }: { lines: Highlight[]; books: Book[]; today: string }) {
  const [q, setQ] = useState('');
  const [bookFilter, setBookFilter] = useState('all');
  const [favs, setFavs] = useState(false);
  const [luck, setLuck] = useState<string | null>(null);
  const withLines = books.filter((b) => lines.some((h) => h.bookId === b.id));
  const ql = q.trim().toLowerCase();
  const shown = lines
    .filter((h) => bookFilter === 'all' || h.bookId === bookFilter)
    .filter((h) => !favs || h.fav)
    .filter((h) => !ql || `${h.text} ${h.note} ${h.book}`.toLowerCase().includes(ql))
    .sort((a, b) => (b.addedOn ?? '').localeCompare(a.addedOn ?? '') || a.id.localeCompare(b.id));
  const lucky = luck ? lines.find((h) => h.id === luck) : lineOfDay(lines, today);
  const shuffle = () => {
    const list = lines.filter((h) => h.text && h.id !== lucky?.id);
    if (list.length) setLuck(list[Math.floor(Math.random() * list.length)].id);
  };
  return (
    <>
      <div className="rd-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'reading-line' })}>
          <Icon name="plus" /> Add a line
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'reading-import' })}>
          Import from Kindle
        </button>
      </div>
      {lucky && (
        <div className="rd-today rd-today--box">
          <span className="rd-today__k">{luck ? 'From your lines' : "Today's line"}</span>
          <blockquote>{lucky.text}</blockquote>
          {lucky.book && <cite>{lucky.book}</cite>}
          {lines.length > 1 && (
            <button type="button" className="i-link rd-today__more" onClick={shuffle}>
              Another one
            </button>
          )}
        </div>
      )}
      {lines.length > 0 && (
        <>
          <input className="i-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your lines" aria-label="Search highlights" style={{ marginTop: 10 }} />
          <div className="rd-filter">
            {withLines.length > 1 && <Chips label="Book" value={bookFilter} onChange={setBookFilter} options={[{ id: 'all', label: 'All' }, ...withLines.map((b) => ({ id: b.id, label: b.title.length > 22 ? `${b.title.slice(0, 21)}…` : b.title }))]} />}
            <button type="button" className="i-pick" aria-pressed={favs} onClick={() => setFavs(!favs)}>
              ★ Favourites
            </button>
          </div>
        </>
      )}
      <H2 aside={`${shown.length}`}>Highlights</H2>
      {shown.length ? (
        <ul className="rd-lines">
          {shown.slice(0, 200).map((h) => (
            <li key={h.id}>
              <button type="button" className="rd-line" onClick={() => openSheet({ type: 'reading-line', editId: h.id })}>
                {h.text && <q>{h.text}</q>}
                {h.note && <span className="rd-line__note">{h.note}</span>}
                <small>
                  {h.fav ? '★ ' : ''}
                  {[h.book, h.loc ? `loc ${h.loc}` : null, h.addedOn ? shortDay(h.addedOn) : null].filter(Boolean).join(' · ')}
                </small>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="i-note">{lines.length ? 'Nothing matches.' : 'Keep the lines worth keeping. Type one in, or bring in everything you highlighted on your Kindle.'}</p>
      )}
      {shown.length > 200 && <p className="i-note">Showing the first 200. Search to find the rest.</p>}
    </>
  );
}

// ─── Year ───────────────────────────────────────────────────────────────────

/** Short enough for a chart's axis. */
const shortHours = (v: number) => (v >= 60 ? `${Math.round(v / 6) / 10}h` : `${Math.round(v)}m`);
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function YearTab({ books, sessions, today }: { books: Book[]; sessions: ReadSession[]; today: string }) {
  const years = useMemo(() => readingYears(books, sessions, today), [books, sessions, today]);
  const [pick, setPick] = useState(years[0]);
  const y = useMemo(() => yearBooks(pick, books, sessions), [pick, books, sessions]);
  const st = useStore(data, (s) => s);
  const sleep = useMemo(() => [...st.log_metrics.values()].filter((m) => !m.deleted_at && m.metric === 'sleep'), [st.log_metrics]);
  const compare = useMemo(() => sleepAfterReading(sessions, sleep, today), [sessions, sleep, today]);
  const topGenre = y.genres[0]?.n ?? 1;
  return (
    <>
      {years.length > 1 && <Chips label="Year" value={String(pick)} onChange={(v) => setPick(Number(v))} options={years.map((v) => ({ id: String(v), label: String(v) }))} />}
      <section className="rd-yearhero" aria-label={`${pick} in books`}>
        <span className="rd-yearhero__y">{pick}</span>
        <b>{y.finished.length}</b>
        <small>{y.finished.length === 1 ? 'book finished' : 'books finished'}</small>
      </section>
      <div className="i-meters">
        <Meter value={formatMinutes(y.minutes)} label="Time read" />
        <Meter value={y.days} label={y.days === 1 ? 'Day reading' : 'Days reading'} />
        <Meter value={y.avgRating != null ? `${y.avgRating} ★` : '—'} label="Average rating" />
      </div>
      {y.pages > 0 && <p className="i-note">About {y.pages.toLocaleString()} print pages in the books finished, going by their print lengths.</p>}

      <H2>By month</H2>
      <div className="i-pnl">
        <Bars values={y.months} labels={MONTHS} long={MONTHS_LONG.map((m) => `${m} ${pick}`)} hi={MONTHS.map((_, i) => i)} fmt={shortHours} caption={`Time read per month in ${pick}`} height={130} />
      </div>

      {(y.longest || y.fastest || (y.topAuthor && y.topAuthor.n > 1)) && (
        <>
          <H2>Stand-outs</H2>
          <div className="i-pnl i-pnl--flush">
            {y.longest && (
              <button type="button" className="i-row" onClick={() => openBook(y.longest!.book)}>
                <span className="i-row__t"><small>Lived in longest</small><b>{y.longest.book.title}</b></span>
                <span className="i-row__n">{formatMinutes(y.longest.minutes)}</span>
              </button>
            )}
            {y.fastest && (
              <button type="button" className="i-row" onClick={() => openBook(y.fastest!.book)}>
                <span className="i-row__t"><small>Fastest through</small><b>{y.fastest.book.title}</b></span>
                <span className="i-row__n">{y.fastest.days} {y.fastest.days === 1 ? 'day' : 'days'}</span>
              </button>
            )}
            {y.topAuthor && y.topAuthor.n > 1 && (
              <div className="i-row">
                <span className="i-row__t"><small>Most read author</small><b>{y.topAuthor.name}</b></span>
                <span className="i-row__n">{y.topAuthor.n} books</span>
              </div>
            )}
          </div>
        </>
      )}

      {y.genres.length > 0 && (
        <>
          <H2>Genres</H2>
          <div className="i-pnl rd-genres">
            {y.genres.map((g) => (
              <div key={g.name} className="rd-genre">
                <span>{g.name}</span>
                <i aria-hidden="true" style={{ '--p': `${(g.n / topGenre) * 100}%` } as CSSProperties} />
                <b>{g.n}</b>
              </div>
            ))}
          </div>
        </>
      )}

      <H2 aside={y.finished.length}>Finished</H2>
      <div className="i-pnl i-pnl--flush">
        {y.finished.length ? (
          [...y.finished].reverse().map((b) => (
            <button key={b.id} type="button" className="i-row i-row--lead rd-row" onClick={() => openBook(b)}>
              <Cover book={b} />
              <span className="i-row__t">
                <b>{b.title}</b>
                <small>{[b.author, shortDay(b.finishedOn)].filter(Boolean).join(' · ')}</small>
                {b.review && <small className="rd-row__rev">{b.review}</small>}
              </span>
              <span className="i-row__n">{b.rating ? `${b.rating} ★` : ''}</span>
            </button>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>Nothing finished in {pick} yet.</p>
        )}
      </div>

      {compare && (
        <>
          <H2 aside="last 60 days">Reading and sleep</H2>
          <div className="i-pnl rd-sleep">
            <p>
              After a day you read: <b>{formatMinutes(compare.read.avg)}</b> of sleep on average ({compare.read.nights} nights). After a day you didn't: <b>{formatMinutes(compare.other.avg)}</b> ({compare.other.nights} nights).
            </p>
            <small>Just the two averages side by side, from your own logs. It doesn't show that one causes the other.</small>
          </div>
        </>
      )}
    </>
  );
}
