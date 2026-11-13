/**
 * 本番 The Stage, at /stage: the days that count. Coming up (with a list to get ready and last time's lesson),
 * how it went, every result as a ticket stub, a trophy shelf, tests by subject, matches, races and chess,
 * and the patterns in how you perform. Results live where each activity already lives; see store.ts.
 */
import { useMemo, useState, type CSSProperties } from 'react';
import { navigate, useRoute } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { sectionRecords, useToday } from '../../data/lt';
import { data, type DataState } from '../../data/store';
import { formatMinutes } from '../../domain/log/duration';
import { dayCount, longDay, monthName, shortDay } from '../../domain/log/dates';
import {
  chessEvents,
  headToHead,
  lastNote,
  MATCH_STATS,
  nervesSplit,
  OUTCOME_LABEL,
  planLine,
  planOf,
  predictionGap,
  PREP,
  raceBests,
  readySplit,
  recordOf,
  revisionFor,
  revisionSplit,
  sleepSplit,
  STAGE_TYPES,
  stageLine,
  statAverages,
  subjectSummaries,
  trophies,
  wasPb,
  type Show,
  type StageType,
  type Split,
} from '../../domain/stage/model';
import { useStore } from '../../lib/createStore';
import { H2, Meter } from '../../ui/i/bits';
import { Empty, LifePage } from '../life/Frame';
import { SPORTS } from '../sports/model';
import { pieceName, pieceOf } from '../violin/model';
import { sleepLookup, stageDays, studyMinutes, useShows, type Upcoming } from './store';
import './sheets';
import './stage.css';

const TABS = ['all', 'tests', 'games', 'notes'] as const;
type Tab = '' | (typeof TABS)[number];

/** One line for Home's More page. */
export function stageHomeLine(st: DataState, shows: Show[], today: string): string {
  const next = stageDays(st, today).find((d) => d.date >= today && !d.result);
  return stageLine(shows, next ?? null, today);
}

const stamp = (d: string) => `'${d.slice(2, 4)} ${d.slice(5, 7)} ${d.slice(8, 10)}`;
const stars = (n: number | null) => (n ? '★'.repeat(n) : '');
const tc = (t: StageType) => ({ '--tc': STAGE_TYPES[t].c }) as CSSProperties;

function open(s: Show) {
  if (s.source === 'maths') navigate('maths', ['road']);
  else openSheet({ type: 'stage-log', editId: s.id });
}

function subLine(s: Show, names: Map<string, string>, extra?: string): string {
  const bits: string[] = [];
  if (s.type === 'test') bits.push(s.kind, s.where, s.predict != null ? `guessed ${s.predict}%` : '');
  else if (s.type === 'match') bits.push(s.kind, s.where, s.sets.length ? s.sets.map(([a, b]) => `${a}–${b}`).join(' ') : '');
  else if (s.type === 'race') bits.push(s.kind, s.km ? `${s.km} km` : '');
  else if (s.type === 'violin') bits.push(s.kind, s.where, s.pieces.map((p) => names.get(p) ?? '').filter(Boolean).join(', '));
  else if (s.type === 'chess') bits.push(s.kind, s.opp ? `vs ${s.opp}` : '');
  else bits.push(s.kind, s.where);
  if (extra) bits.push(extra);
  return bits.filter(Boolean).join(' · ');
}

function Ticket({ s, names, extra, badge }: { s: Show; names: Map<string, string>; extra?: string; badge?: string }) {
  const t = STAGE_TYPES[s.type];
  return (
    <button type="button" className={`stg-ticket${s.outcome ? ` is-${s.outcome}` : ''}`} style={tc(s.type)} onClick={() => open(s)} aria-label={`${t.one}: ${s.title}, ${shortDay(s.date)}, ${s.result}`}>
      <span className="stg-ticket__stub" aria-hidden="true">
        <i>{t.k}</i>
        <small>{stamp(s.date)}</small>
      </span>
      <span className="stg-ticket__t">
        <em>
          {t.one}
          {badge && <span className="stg-badge">{badge}</span>}
        </em>
        <b>{s.title}</b>
        <small>{subLine(s, names, extra)}</small>
      </span>
      <span className="stg-ticket__r">
        <b>{s.result}</b>
        {s.rating != null && s.result !== stars(s.rating) && <small className="stg-stars">{stars(s.rating)}</small>}
      </span>
    </button>
  );
}

function usePieceNames() {
  const recs = useStore(data, (st) => st.lt_records);
  return useMemo(() => new Map(sectionRecords(data.get(), 'violin', 'piece').map((r) => [r.id, pieceName(pieceOf(r))])), [recs]);
}

export function StagePage() {
  const route = useRoute();
  const tab: Tab = (TABS as readonly string[]).includes(route.rest[0]) ? (route.rest[0] as Tab) : '';
  const shows = useShows();
  const st = useStore(data, (x) => x);
  const today = useToday();
  const days = useMemo(() => stageDays(st, today), [st, today]);
  const ahead = days.filter((d) => d.date >= today && !d.result);
  const next = ahead[0];
  const tests = shows.filter((s) => s.type === 'test');
  const games = shows.filter((s) => s.type === 'match' || s.type === 'race' || s.type === 'chess');
  const left = next ? dayCount(today, next.date) - 1 : null;
  return (
    <LifePage
      id="stage"
      className="stg-page"
      line={stageLine(shows, next ?? null, today)}
      aside={
        next && left != null ? (
          <div className="lf-head__big stg-count">
            <b>{left === 0 ? 'TODAY' : `T−${left}`}</b>
            <span>{left === 0 ? next.title : `to ${next.title}`}</span>
          </div>
        ) : undefined
      }
      tabs={[
        { id: '', label: 'Now', n: ahead.length },
        { id: 'all', label: 'Results', n: shows.length },
        { id: 'tests', label: 'Tests', n: tests.length },
        { id: 'games', label: 'Games', n: games.length },
        { id: 'notes', label: 'Lessons' },
      ]}
      tab={tab}
    >
      {tab === 'all' ? <AllResults shows={shows} /> : tab === 'tests' ? <Tests shows={shows} st={st} /> : tab === 'games' ? <Games shows={shows} /> : tab === 'notes' ? <Lessons shows={shows} st={st} /> : <Now shows={shows} days={days} today={today} />}
    </LifePage>
  );
}

function Now({ shows, days, today }: { shows: Show[]; days: Upcoming[]; today: string }) {
  const names = usePieceNames();
  const [all, setAll] = useState(false);
  const ahead = days.filter((d) => d.date >= today && !d.result);
  const awaiting = days.filter((d) => d.date < today && !d.result && d.type !== 'maths');
  const year = shows.filter((s) => s.date.slice(0, 4) === today.slice(0, 4));
  const rec = recordOf(year.filter((s) => s.type === 'match' || s.type === 'chess' || s.type === 'other'));
  const recentTests = shows.filter((s) => (s.type === 'test' || s.type === 'maths') && s.pct != null).slice(0, 5);
  const shelf = trophies(shows).slice(0, 8);
  return (
    <div className="stg">
      <div className="lf-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'stage-pick' })}>
          + Log a result
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'stage-pick', plan: true })}>
          + Coming up
        </button>
      </div>

      {awaiting.map((d) => (
        <div key={d.key} className="lf-nudge stg-await" role="note" style={tc(d.type)}>
          <span>
            <b>{d.title}</b> was {shortDay(d.date, today)}. How did it go?
          </span>
          <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => openSheet({ type: 'stage-log', kind: d.type, event: d.key, date: d.date, title: d.title })}>
            Log it
          </button>
        </div>
      ))}

      <H2 aside={ahead.length > 4 ? <button type="button" className="i-link" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `All ${ahead.length} →`}</button> : undefined}>Coming up</H2>
      {ahead.length ? (
        <div className="stg-marquee" aria-label="Coming up">
          {(all ? ahead : ahead.slice(0, 4)).map((d) => (
            <ComingUp key={d.key} d={d} shows={shows} today={today} />
          ))}
        </div>
      ) : (
        <p className="i-note">Nothing planned yet. Add a concert, test, match or race with + Coming up and the Stage counts down to it. When it’s over, tap it to log how it went.</p>
      )}

      {shows.length > 0 && (
        <div className="i-meters" style={{ marginTop: 12 }}>
          <Meter value={year.length} label={`Results in ${today.slice(0, 4)}`} />
          <Meter value={rec.played ? `${rec.won}–${rec.lost}${rec.drawn ? `–${rec.drawn}` : ''}` : '—'} label="Won–lost this year" />
          <Meter value={recentTests.length ? `${Math.round(recentTests.reduce((a, s) => a + s.pct!, 0) / recentTests.length)}%` : '—'} label="Last 5 tests" />
        </div>
      )}

      <H2 aside={shows.length > 5 ? <button type="button" className="i-link" onClick={() => navigate('stage', ['all'], { replace: true })}>All {shows.length} →</button> : undefined}>Lately</H2>
      {shows.length ? (
        <div className="stg-tickets" aria-label="Lately">
          {shows.slice(0, 5).map((s) => (
            <Ticket key={s.id} s={s} names={names} />
          ))}
        </div>
      ) : (
        <Empty action="Log your first result" onAction={() => openSheet({ type: 'stage-pick' })}>
          Concerts, tests, matches, races, chess games and talks, each with how it went and one thing for next time. Tests also go into Study, and matches and races count as sport time.
        </Empty>
      )}

      {shelf.length > 0 && (
        <>
          <H2>Trophy shelf</H2>
          <div className="stg-shelf" aria-label="Trophy shelf">
            {shelf.map((t) => (
              <button key={t.show.id} type="button" className={`stg-trophy is-${t.tier}`} style={tc(t.show.type)} onClick={() => open(t.show)}>
                <span className="stg-trophy__m" aria-hidden="true">
                  {STAGE_TYPES[t.show.type].k}
                </span>
                <b>{t.why}</b>
                <small>{t.show.title}</small>
                <small className="i-mono">{shortDay(t.show.date, today)}</small>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ComingUp({ d, shows, today }: { d: Upcoming; shows: Show[]; today: string }) {
  const left = dayCount(today, d.date) - 1;
  const list = PREP[d.type];
  const ticked = d.prep ? d.prep.ticks.filter((t) => list.some((x) => x.id === t)).length : 0;
  const last = lastNote(shows, d.type, d.date);
  const line = planLine(d.type, planOf(d.event.data), null);
  return (
    <article className="stg-up" style={tc(d.type)} aria-label={d.title}>
      <div className="stg-up__top">
        <span className="stg-up__k" aria-hidden="true">
          {STAGE_TYPES[d.type].k}
        </span>
        <span className="stg-up__t">
          <em>{STAGE_TYPES[d.type].one}</em>
          <b>{d.title}</b>
          <small>
            {longDay(d.date)}
            {d.start ? ` · ${d.start}` : ''}
          </small>
        </span>
        <span className="stg-up__n">
          <b>{left === 0 ? 'Today' : left === 1 ? '1' : left}</b>
          {left > 0 && <small>{left === 1 ? 'day' : 'days'}</small>}
        </span>
      </div>
      <span className="lf-bar" style={{ '--p': `${(ticked / list.length) * 100}%` } as CSSProperties} aria-label={`Ready list ${ticked} of ${list.length}`}>
        <i />
      </span>
      {line && <p className="stg-up__plan">{line}</p>}
      {d.prep?.goal && <p className="stg-up__goal">Aim: {d.prep.goal}</p>}
      {last && (
        <p className="stg-last">
          Last time: <q>{last.next}</q>
        </p>
      )}
      <div className="stg-up__acts">
        <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'stage-prep', key: d.key })}>
          Get ready · {ticked}/{list.length}
        </button>
        {d.type === 'maths' ? (
          <button type="button" className="i-btn i-btn--sm" onClick={() => navigate('maths')}>
            Maths page
          </button>
        ) : (
          <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet(d.event.repeat ? { type: 'event', key: d.key } : { type: 'stage-plan', key: d.key })}>
            Edit plan
          </button>
        )}
        {d.type !== 'maths' && left === 0 && (
          <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => openSheet({ type: 'stage-log', kind: d.type, event: d.key, date: d.date, title: d.title })}>
            How did it go?
          </button>
        )}
      </div>
    </article>
  );
}

function AllResults({ shows }: { shows: Show[] }) {
  const names = usePieceNames();
  const present = (Object.keys(STAGE_TYPES) as StageType[]).filter((t) => shows.some((s) => s.type === t));
  const [type, setType] = useState<StageType | 'all'>('all');
  const [q, setQ] = useState('');
  const shown = shows.filter((s) => (type === 'all' || s.type === type) && (!q.trim() || `${s.title} ${s.kind} ${s.where} ${s.opp} ${s.well} ${s.next}`.toLowerCase().includes(q.trim().toLowerCase())));
  const months = new Map<string, Show[]>();
  for (const s of shown) months.set(s.date.slice(0, 7), [...(months.get(s.date.slice(0, 7)) ?? []), s]);
  if (!shows.length) return <Empty action="Log a result" onAction={() => openSheet({ type: 'stage-pick' })}>Every result you log shows up here as a ticket stub, month by month.</Empty>;
  return (
    <div className="stg">
      <div className="lf-pills" role="group" aria-label="Kind">
        {(['all', ...present] as const).map((t) => (
          <button key={t} type="button" className="lf-pill" aria-pressed={type === t} onClick={() => setType(t)}>
            {t === 'all' ? 'All' : `${STAGE_TYPES[t].k} ${STAGE_TYPES[t].name}`}
          </button>
        ))}
      </div>
      <input className="i-input lf-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names, places, notes" aria-label="Search results" />
      {[...months.entries()].map(([m, list]) => (
        <section key={m} aria-label={`${monthName(`${m}-01`, true)} ${m.slice(0, 4)}`}>
          <H2 aside={`${list.length}`}>
            {monthName(`${m}-01`, true)} {m.slice(0, 4)}
          </H2>
          <div className="stg-tickets">
            {list.map((s) => (
              <Ticket key={s.id} s={s} names={names} />
            ))}
          </div>
        </section>
      ))}
      {!shown.length && <p className="i-note">Nothing matches.</p>}
    </div>
  );
}

function Tests({ shows, st }: { shows: Show[]; st: DataState }) {
  const names = usePieceNames();
  const tests = shows.filter((s) => s.type === 'test');
  const study = useMemo(() => studyMinutes(st), [st]);
  if (!tests.length) return <Empty action="Log a test" onAction={() => openSheet({ type: 'stage-log', kind: 'test' })}>Log a test with your score and, if you like, your guess beforehand. Each subject gets a line over time, and the Stage checks how much you revised in the two weeks before.</Empty>;
  const subjects = subjectSummaries(tests);
  const gap = predictionGap(tests);
  const rev = revisionSplit(tests, study);
  return (
    <div className="stg">
      <div className="lf-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'stage-log', kind: 'test' })}>
          + Log a test
        </button>
      </div>
      {(gap || rev) && (
        <div className="stg-facts">
          {gap && (
            <p>
              {gap.gap === 0 ? 'Your guesses are spot on' : gap.gap > 0 ? <>You score <b>{gap.gap} points better</b> than you guess</> : <>You score <b>{-gap.gap} points lower</b> than you guess</>} on average ({gap.n} tests{gap.within5 ? `, ${gap.within5} within 5 points` : ''}).
              {gap.gap >= 5 ? ' You’re harder on yourself than the marks are.' : ''}
            </p>
          )}
          {rev && (
            <p>
              More than {formatMinutes(rev.median)} of revision in the fortnight before: <b>{rev.more}%</b> on average ({rev.nMore}). Less: <b>{rev.less}%</b> ({rev.nLess}).
            </p>
          )}
        </div>
      )}
      <H2>By subject</H2>
      <div className="stg-subjects">
        {subjects.map((x) => (
          <article key={x.subject} className="stg-subject" aria-label={x.subject}>
            <header>
              <b>{x.subject}</b>
              <span className="i-mono">
                {x.avg}%<small> avg</small>
              </span>
            </header>
            <div className="stg-spark" aria-label={`${x.subject} marks, oldest first: ${x.line.join(', ')} percent`}>
              {x.line.map((p, i) => (
                <i key={i} style={{ height: `${Math.max(6, p)}%` }} />
              ))}
            </div>
            <small>
              {x.n} {x.n === 1 ? 'test' : 'tests'} · best {x.best.pct}%{x.trend != null && x.trend !== 0 ? <span className={`lf-delta ${x.trend > 0 ? 'is-good' : 'is-bad'}`}> {x.trend > 0 ? '▲' : '▼'} {Math.abs(x.trend)} last</span> : ''}
            </small>
          </article>
        ))}
      </div>
      <H2>Every test</H2>
      <div className="stg-tickets">
        {tests.map((s) => {
          const r = revisionFor(s, study);
          return <Ticket key={s.id} s={s} names={names} extra={r ? `revised ${formatMinutes(r)} in the 2 weeks before` : ''} />;
        })}
      </div>
    </div>
  );
}

function Form({ list }: { list: ('win' | 'loss' | 'draw')[] }) {
  return (
    <span className="stg-form" aria-label={`Form, newest first: ${list.map((o) => OUTCOME_LABEL[o]).join(', ')}`}>
      {list.map((o, i) => (
        <i key={i} className={`is-${o}`} aria-hidden="true">
          {o === 'win' ? 'W' : o === 'loss' ? 'L' : 'D'}
        </i>
      ))}
    </span>
  );
}

function Games({ shows }: { shows: Show[] }) {
  const names = usePieceNames();
  const matches = shows.filter((s) => s.type === 'match');
  const races = shows.filter((s) => s.type === 'race');
  const chess = shows.filter((s) => s.type === 'chess');
  if (!matches.length && !races.length && !chess.length)
    return <Empty action="Log a match, race or game" onAction={() => openSheet({ type: 'stage-pick' })}>Matches get a win–loss record, form, sets and your own numbers (kills, aces, blocks, digs). Races get bests at 5K, 10K, half and full. Chess games add up by event.</Empty>;
  const sports = SPORTS.filter((sp) => matches.some((m) => m.kind === sp.name));
  return (
    <div className="stg">
      {sports.map((sp) => {
        const list = matches.filter((m) => m.kind === sp.name);
        const r = recordOf(list);
        const st = statAverages(list, (MATCH_STATS[sp.id] ?? []).map((x) => x.id));
        const h2h = headToHead(list).slice(0, 5);
        return (
          <section key={sp.id} aria-label={`${sp.name} matches`}>
            <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'stage-log', kind: 'match' })}>+ Match</button>}>{sp.name}</H2>
            <div className="i-pnl stg-rec">
              <div className="i-meters">
                <Meter value={`${r.won}–${r.lost}${r.drawn ? `–${r.drawn}` : ''}`} label="Won–lost" />
                <Meter value={r.played ? `${Math.round((r.won / r.played) * 100)}%` : '—'} label="Win rate" />
                <Meter value={r.setsWon + r.setsLost ? `${r.setsWon}–${r.setsLost}` : '—'} label="Sets" />
              </div>
              {r.form.length > 0 && (
                <p className="stg-rec__form">
                  <Form list={r.form} />
                  {r.streak && r.streak.n > 1 && <span> {r.streak.n} {r.streak.outcome === 'win' ? 'wins' : r.streak.outcome === 'loss' ? 'losses' : 'draws'} in a row</span>}
                </p>
              )}
              {st.length > 0 && (
                <div className="stg-avgs" aria-label={`${sp.name} numbers per match`}>
                  {st.map((x) => (
                    <span key={x.id}>
                      <b>{x.avg}</b>
                      <small>
                        {MATCH_STATS[sp.id].find((m) => m.id === x.id)!.name} / match · best {x.best}
                      </small>
                    </span>
                  ))}
                </div>
              )}
              {h2h.length > 0 && (
                <div className="stg-h2h" aria-label="Head to head">
                  {h2h.map((x) => (
                    <div key={x.opp} className="i-kv">
                      <span>vs {x.opp}</span>
                      <b className="i-mono">
                        {x.won}–{x.lost}
                        {x.drawn ? `–${x.drawn}` : ''}
                      </b>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="stg-tickets">
              {list.slice(0, 6).map((s) => (
                <Ticket key={s.id} s={s} names={names} />
              ))}
            </div>
          </section>
        );
      })}
      {races.length > 0 && (
        <section aria-label="Races">
          <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'stage-log', kind: 'race' })}>+ Race</button>}>Races</H2>
          {raceBests(races).length > 0 && (
            <div className="stg-bests">
              {raceBests(races).map((b) => (
                <button key={b.id} type="button" className="stg-best" onClick={() => open(b.best)}>
                  <small>{b.name}</small>
                  <b className="i-mono">{b.best.result.split(' · ')[0]}</b>
                  <small>{shortDay(b.best.date)}</small>
                </button>
              ))}
            </div>
          )}
          <div className="stg-tickets">
            {races.slice(0, 8).map((s) => (
              <Ticket key={s.id} s={s} names={names} badge={wasPb(s, races) ? 'PB' : undefined} />
            ))}
          </div>
        </section>
      )}
      {chess.length > 0 && (
        <section aria-label="Chess over the board">
          <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'stage-log', kind: 'chess' })}>+ Game</button>}>Chess over the board</H2>
          <div className="i-pnl stg-rec">
            {(() => {
              const r = recordOf(chess);
              return (
                <>
                  <div className="i-meters">
                    <Meter value={r.won} label="Won" />
                    <Meter value={r.drawn} label="Drawn" />
                    <Meter value={r.lost} label="Lost" />
                  </div>
                  {r.form.length > 0 && (
                    <p className="stg-rec__form">
                      <Form list={r.form} />
                    </p>
                  )}
                </>
              );
            })()}
            {chessEvents(chess).map((e) => (
              <div key={e.name} className="i-kv">
                <span>{e.name}</span>
                <b className="i-mono">
                  {e.points}/{e.games}
                </b>
              </div>
            ))}
          </div>
          <div className="stg-tickets">
            {chess.slice(0, 8).map((s) => (
              <Ticket key={s.id} s={s} names={names} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SplitLine({ s, hi, lo }: { s: Split; hi: string; lo: string }) {
  return (
    <p>
      {hi}: <b>{s.hi}★</b> on average ({s.nHi}). {lo}: <b>{s.lo}★</b> ({s.nLo}).
    </p>
  );
}

function Lessons({ shows, st }: { shows: Show[]; st: DataState }) {
  const ready = readySplit(shows);
  const nerves = nervesSplit(shows);
  const sleep = useMemo(() => sleepSplit(shows, sleepLookup(st)), [shows, st]);
  const notes = shows.filter((s) => s.next || s.well);
  const types = (Object.keys(STAGE_TYPES) as StageType[]).filter((t) => notes.some((s) => s.type === t));
  return (
    <div className="stg">
      <H2>Patterns</H2>
      {ready || nerves || sleep ? (
        <div className="stg-facts">
          {ready && <SplitLine s={ready} hi="When you felt ready (4–5), you rated it" lo="When you didn’t" />}
          {nerves && (
            <>
              <SplitLine s={nerves} hi="Very nervous (4–5)" lo="Calmer" />
              {nerves.hi >= nerves.lo && <p className="i-note">Nerves haven’t held you back so far: they’re a sign it matters, not a sign it’ll go badly.</p>}
            </>
          )}
          {sleep && <SplitLine s={sleep} hi="After 7½ hours’ sleep or more" lo="After less" />}
        </div>
      ) : (
        <p className="i-note">Patterns show once a few results have “Ready”, “Nerves” and “How it went” filled in (two or more on each side). Sleep comes from the Sleep page’s nights.</p>
      )}
      <H2>What you told yourself</H2>
      {types.length ? (
        types.map((t) => (
          <section key={t} className="stg-notes" style={tc(t)} aria-label={`Notes: ${STAGE_TYPES[t].name}`}>
            <h3>
              <span aria-hidden="true">{STAGE_TYPES[t].k}</span> {STAGE_TYPES[t].name}
            </h3>
            {notes
              .filter((s) => s.type === t)
              .slice(0, 12)
              .map((s) => (
                <button key={s.id} type="button" className="stg-note" onClick={() => open(s)}>
                  <small>
                    {s.title} · {shortDay(s.date)}
                  </small>
                  {s.next && (
                    <span>
                      <b>Next time</b> {s.next}
                    </span>
                  )}
                  {s.well && (
                    <span>
                      <b>Went well</b> {s.well}
                    </span>
                  )}
                </button>
              ))}
          </section>
        ))
      ) : (
        <p className="i-note">“What went well” and “Next time” from each result collect here, and the latest “Next time” shows up before the next one of its kind.</p>
      )}
    </div>
  );
}
