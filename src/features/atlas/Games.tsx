/**
 * The Atlas's mini-games: Fill the map 塗, Pairs 対 and Compass 羅. Practice that doesn't move the
 * boxes; each finished game is counted on the day's row (for quests), and the day's best pays.
 */
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { navigate } from '../../app/router';
import { useToday } from '../../data/lt';
import { COMPASS_N, compassRound, fillMatch, gamePay, GAMES, PAIR_KINDS, pairsBoard, pairsScore, PAIRS_N, type CompassQ, type FillMode, type GameId, type PairCard, type PairKind } from '../../domain/atlas/games';
import { CONTS, COUNTRIES, country, deck, matchCapital, matchName, type ViewId } from '../../domain/atlas/model';
import { Coin, Flag } from './bits';
import { loadMap, MapView, type MapMark } from './MapView';
import { atlasOf, recordFinish, useAtlas, useWallet, walletFor } from './store';
import { data } from '../../data/store';

const WHERE: { id: ViewId; name: string }[] = [{ id: 'world', name: 'World' }, ...CONTS.map((c) => ({ id: c.id as ViewId, name: c.name }))];
const idsOf = (v: ViewId) => (v === 'world' ? COUNTRIES.map((c) => c.id) : deck(v)!.ids);
const remember = <T,>(key: string, fallback: T, ok: (x: unknown) => boolean): T => {
  try {
    const s = JSON.parse(localStorage.getItem(key) ?? 'null');
    return ok(s) ? (s as T) : fallback;
  } catch {
    return fallback;
  }
};
const keep = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* not remembered */
  }
};
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** A seconds counter that runs while `on`. */
function useSecs(on: boolean) {
  const [secs, setSecs] = useState(0);
  const t0 = useRef(0);
  useEffect(() => {
    if (!on) return;
    t0.current = Date.now() - secs * 1000;
    const t = window.setInterval(() => setSecs(Math.floor((Date.now() - t0.current) / 1000)), 500);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);
  return [secs, setSecs] as const;
}

/** The top bar every mini-game shares. */
function Bar({ game, children }: { game: GameId; children?: React.ReactNode }) {
  const g = GAMES.find((x) => x.id === game)!;
  return (
    <header className="at-hud at-hud--plain">
      <button type="button" className="at-hud__quit" aria-label="Back to the Atlas" onClick={() => navigate('atlas')}>
        ✕
      </button>
      <h1 className="at-hud__title">
        <span aria-hidden="true">{g.kanji}</span> {g.name}
      </h1>
      {children}
    </header>
  );
}

/** What the game paid today, worked out before and after the finish is saved. */
function useFinish(game: GameId) {
  const today = useToday();
  return (score: number, full: boolean) => {
    const before = walletFor(atlasOf(data.get()), today).earned;
    recordFinish(game, score, full, today);
    return walletFor(atlasOf(data.get()), today).earned - before;
  };
}

function TodayBest({ game }: { game: GameId }) {
  const today = useToday();
  const atlas = useAtlas();
  const g = atlas.days.find((d) => d.date === today)?.games[game];
  if (!g) return <p className="at-hint">Your best today pays Doubloons, once.</p>;
  return (
    <p className="at-hint">
      Today: played {g.n}, best {g.best}, paying <Coin n={gamePay(game, g)} />. Beat it to earn the difference.
    </p>
  );
}

// ── Fill the map ──

export function Fill() {
  const [where, setWhere] = useState<ViewId>(() => remember('lt-atlas-fill', 'europe', (x) => WHERE.some((w) => w.id === x)));
  const [mode, setMode] = useState<FillMode>(() => remember('lt-atlas-fill-mode', 'name', (x) => x === 'name' || x === 'cap'));
  const [run, setRun] = useState(0);
  const [going, setGoing] = useState(false);
  if (!going)
    return (
      <div className="at-game">
        <Bar game="fill" />
        <section className="at-build" aria-label="Set up">
          <p className="at-hint">Type every country you can think of. Each one lights up on the map the moment it’s spelt right. No choices, no clues: the best test there is of what you know.</p>
          <div className="at-field">
            <p className="at-lab">Where</p>
            <div className="at-chips" role="group" aria-label="Map to fill">
              {WHERE.map((w) => (
                <button key={w.id} type="button" aria-pressed={where === w.id} onClick={() => (setWhere(w.id), keep('lt-atlas-fill', w.id))}>
                  {w.name} <small>{idsOf(w.id).length}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="at-field">
            <p className="at-lab">Type</p>
            <div className="at-seg" role="group" aria-label="What to type">
              <button type="button" aria-pressed={mode === 'name'} onClick={() => (setMode('name'), keep('lt-atlas-fill-mode', 'name'))}>
                Country names
              </button>
              <button type="button" aria-pressed={mode === 'cap'} onClick={() => (setMode('cap'), keep('lt-atlas-fill-mode', 'cap'))}>
                Capitals
              </button>
            </div>
          </div>
          <TodayBest game="fill" />
          <div className="at-go">
            <p>
              <b>{idsOf(where).length} to find</b>
            </p>
            <button type="button" className="at-btn at-btn--big" onClick={() => (setRun((n) => n + 1), setGoing(true))}>
              Start
            </button>
          </div>
        </section>
      </div>
    );
  return <FillRun key={run} where={where} mode={mode} again={() => setGoing(false)} />;
}

function FillRun({ where, mode, again }: { where: ViewId; mode: FillMode; again: () => void }) {
  const all = useMemo(() => idsOf(where), [where]);
  const [found, setFound] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [last, setLast] = useState<{ id: string; close: boolean } | null>(null);
  const [over, setOver] = useState<{ paid: number } | null>(null);
  const [secs] = useSecs(!over);
  const finish = useFinish('fill');
  const left = useMemo(() => all.filter((id) => !found.includes(id)), [all, found]);

  const end = (f: string[]) => setOver({ paid: finish(f.length, f.length === all.length) });
  const hit = (id: string, close: boolean) => {
    const f = [...found, id];
    setFound(f);
    setText('');
    setLast({ id, close });
    if (f.length === all.length) end(f);
  };
  const type = (t: string) => {
    setText(t);
    const id = fillMatch(t, left, mode);
    if (id) hit(id, false);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    // Enter forgives a small slip
    const id = left.find((x) => (mode === 'cap' ? matchCapital(text, x) : matchName(text, x)) === 2);
    if (id) hit(id, true);
  };
  const marks = useMemo(() => {
    const m: Record<string, MapMark> = {};
    for (const id of found) m[id] = 'ok';
    if (over) for (const id of left) m[id] = 'bad';
    return m;
  }, [found, left, over]);

  return (
    <div className="at-game">
      <Bar game="fill">
        <dl className="at-hud__nums">
          <div>
            <dt>Found</dt>
            <dd>
              {found.length}/{all.length}
            </dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{clock(secs)}</dd>
          </div>
        </dl>
      </Bar>
      <div className="at-bar" role="progressbar" aria-valuemin={0} aria-valuemax={all.length} aria-valuenow={found.length} aria-label="Found">
        <i style={{ width: `${(found.length / all.length) * 100}%` }} />
      </div>
      {!over ? (
        <form className="at-type at-type--fill" onSubmit={submit} autoComplete="off">
          <label htmlFor="at-fill">{mode === 'cap' ? 'Type a capital' : 'Type a country'}</label>
          <div className="at-type__row">
            <input id="at-fill" type="text" value={text} onChange={(e) => type(e.target.value)} autoFocus autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="done" />
            <button type="button" className="at-btn at-btn--ghost" onClick={() => end(found)}>
              Give up
            </button>
          </div>
          <p className="at-fill__last" role="status">
            {last ? (
              <>
                <Flag id={last.id} alt="" /> {country(last.id).name}
                {mode === 'cap' ? ` · ${country(last.id).cap}` : ''}
                {last.close ? ' (check the spelling)' : ''}
              </>
            ) : (
              'Names light up as soon as they’re right. Enter takes a small slip.'
            )}
          </p>
        </form>
      ) : (
        <div className="at-sum">
          <h2 className="at-sum__head">{found.length === all.length ? `All ${all.length}, in ${clock(secs)}` : `${found.length} of ${all.length}`}</h2>
          {over.paid > 0 && (
            <p className="at-pay at-pay--db">
              <Coin n={over.paid} />
              <small>a new best for today</small>
            </p>
          )}
          {left.length > 0 && <p className="at-note">The ones you missed are red on the map: {left.length > 12 ? `${left.length} of them` : left.map((id) => (mode === 'cap' ? `${country(id).cap} (${country(id).name})` : country(id).name)).join(', ')}.</p>}
          <div className="at-sum__go">
            <button type="button" className="at-btn" onClick={again}>
              Play again
            </button>
            <button type="button" className="at-btn at-btn--ghost" onClick={() => navigate('atlas')}>
              Back to the Atlas
            </button>
          </div>
        </div>
      )}
      <MapView view={where} marks={marks} />
      {found.length > 0 && (
        <ul className="at-found" aria-label="Found so far">
          {[...found].reverse().map((id) => (
            <li key={id} title={country(id).name}>
              <Flag id={id} alt={country(id).name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Pairs ──

export function Pairs() {
  const [kind, setKind] = useState<PairKind>(() => remember('lt-atlas-pairs', 'flag-name', (x) => PAIR_KINDS.some((k) => k.id === x)));
  const [where, setWhere] = useState<ViewId>(() => remember('lt-atlas-pairs-where', 'world', (x) => WHERE.some((w) => w.id === x)));
  const [run, setRun] = useState(0);
  return (
    <div className="at-game">
      <Bar game="pairs" />
      <div className="at-pairs__set">
        <div className="at-chips" role="group" aria-label="Match">
          {PAIR_KINDS.map((k) => (
            <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => (setKind(k.id), keep('lt-atlas-pairs', k.id), setRun((n) => n + 1))}>
              {k.name}
            </button>
          ))}
        </div>
        <div className="at-chips at-chips--sub" role="group" aria-label="From">
          {WHERE.map((w) => (
            <button key={w.id} type="button" aria-pressed={where === w.id} onClick={() => (setWhere(w.id), keep('lt-atlas-pairs-where', w.id), setRun((n) => n + 1))}>
              {w.name}
            </button>
          ))}
        </div>
      </div>
      <PairsBoard key={`${run}:${kind}:${where}`} kind={kind} where={where} again={() => setRun((n) => n + 1)} />
    </div>
  );
}

function PairsBoard({ kind, where, again }: { kind: PairKind; where: ViewId; again: () => void }) {
  const cards = useMemo(() => pairsBoard(idsOf(where), kind), [kind, where]);
  const [up, setUp] = useState<string[]>([]);
  const [got, setGot] = useState<string[]>([]);
  const [turns, setTurns] = useState(0);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState<{ score: number; paid: number } | null>(null);
  const [secs] = useSecs(started && !done);
  const finish = useFinish('pairs');
  const wait = useRef(0);
  useEffect(() => () => window.clearTimeout(wait.current), []);

  const flip = (c: PairCard) => {
    if (done || got.includes(c.id) || up.includes(c.key) || up.length >= 2) return;
    setStarted(true);
    const now = [...up, c.key];
    setUp(now);
    if (now.length < 2) return;
    setTurns((t) => t + 1);
    const [a, b] = now.map((k) => cards.find((x) => x.key === k)!);
    if (a.id === b.id) {
      const g = [...got, a.id];
      setGot(g);
      setUp([]);
      if (g.length === PAIRS_N) {
        const score = pairsScore(turns + 1, secs);
        setDone({ score, paid: finish(score, true) });
      }
    } else wait.current = window.setTimeout(() => setUp([]), 900);
  };
  const face = (c: PairCard) => (c.face === 'flag' ? <Flag id={c.id} alt={`Flag of ${country(c.id).name}`} /> : <span>{c.face === 'name' ? country(c.id).name : country(c.id).cap.split(',')[0]}</span>);

  return (
    <>
      <dl className="at-stats at-stats--3">
        <div>
          <dt>Pairs</dt>
          <dd>
            {got.length}
            <small>/{PAIRS_N}</small>
          </dd>
        </div>
        <div>
          <dt>Turns</dt>
          <dd>{turns}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{clock(secs)}</dd>
        </div>
      </dl>
      <div className="at-pairs" role="group" aria-label="Cards">
        {cards.map((c, i) => {
          const open = up.includes(c.key) || got.includes(c.id);
          return (
            <button
              key={c.key}
              type="button"
              className={`at-pc${open ? ' is-up' : ''}${got.includes(c.id) ? ' is-got' : ''}`}
              onClick={() => flip(c)}
              aria-label={open ? (c.face === 'flag' ? `Flag of ${country(c.id).name}` : c.face === 'name' ? country(c.id).name : country(c.id).cap) : `Card ${i + 1}, face down`}
            >
              <span className="at-pc__in">
                <span className="at-pc__back" aria-hidden="true">
                  対
                </span>
                <span className="at-pc__face">{open && face(c)}</span>
              </span>
            </button>
          );
        })}
      </div>
      {done ? (
        <div className="at-sum">
          <h2 className="at-sum__head">
            {done.score} points · {turns} turns
          </h2>
          {done.paid > 0 && (
            <p className="at-pay at-pay--db">
              <Coin n={done.paid} />
              <small>a new best for today</small>
            </p>
          )}
          <ul className="at-pairs__learnt">
            {got.map((id) => (
              <li key={id}>
                <Flag id={id} alt="" /> {country(id).name} <small>{country(id).cap}</small>
              </li>
            ))}
          </ul>
          <div className="at-sum__go">
            <button type="button" className="at-btn" onClick={again}>
              New board
            </button>
            <button type="button" className="at-btn at-btn--ghost" onClick={() => navigate('atlas')}>
              Back to the Atlas
            </button>
          </div>
        </div>
      ) : (
        <TodayBest game="pairs" />
      )}
    </>
  );
}

// ── Compass ──

const DIR_K: Record<string, string> = { north: '北', south: '南', east: '東', west: '西' };
const DIR_A: Record<string, string> = { north: '↑', south: '↓', east: '→', west: '←' };

export function Compass() {
  const [pts, setPts] = useState<Record<string, readonly number[]> | null | 'failed'>(null);
  const [run, setRun] = useState(0);
  useEffect(() => {
    let on = true;
    loadMap('world').then(
      (m) => on && setPts(m.pts),
      () => on && setPts('failed'),
    );
    return () => {
      on = false;
    };
  }, []);
  return (
    <div className="at-game">
      <Bar game="compass" />
      {pts === 'failed' ? <p className="at-mapfail">The map couldn’t load. Check the connection and open this page again.</p> : !pts ? <p className="at-note">Getting the bearings…</p> : <CompassRun key={run} pts={pts} again={() => setRun((n) => n + 1)} />}
    </div>
  );
}

function CompassRun({ pts, again }: { pts: Record<string, readonly number[]>; again: () => void }) {
  const qs = useMemo<CompassQ[]>(() => compassRound(pts), [pts]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [done, setDone] = useState<{ paid: number } | null>(null);
  const finish = useFinish('compass');
  const q = qs[i];
  const pick = (id: string) => {
    if (picked || done) return;
    setPicked(id);
    if (id === q.answer) setRight((r) => r + 1);
  };
  const next = () => {
    if (i + 1 >= qs.length) {
      const score = right;
      setDone({ paid: finish(score, score >= COMPASS_N) });
      return;
    }
    setI(i + 1);
    setPicked(null);
  };
  const marks = useMemo<Record<string, MapMark>>(() => (picked ? { [q.answer]: 'ok', [q.answer === q.a ? q.b : q.a]: picked === q.answer ? 'hl' : 'bad' } : {}), [picked, q]);

  if (done)
    return (
      <div className="at-sum">
        <h2 className="at-sum__head">
          {right} of {qs.length} the right way
        </h2>
        {done.paid > 0 && (
          <p className="at-pay at-pay--db">
            <Coin n={done.paid} />
            <small>a new best for today</small>
          </p>
        )}
        <div className="at-sum__go">
          <button type="button" className="at-btn" onClick={again}>
            Play again
          </button>
          <button type="button" className="at-btn at-btn--ghost" onClick={() => navigate('atlas')}>
            Back to the Atlas
          </button>
        </div>
      </div>
    );
  return (
    <>
      <div className="at-bar" role="progressbar" aria-valuemin={0} aria-valuemax={qs.length} aria-valuenow={i} aria-label="Progress">
        <i style={{ width: `${(i / qs.length) * 100}%` }} />
      </div>
      <div className="at-compass">
        <p className="at-compass__q">
          <span className="at-compass__dir" aria-hidden="true">
            {DIR_K[q.dir]}
            <i>{DIR_A[q.dir]}</i>
          </span>
          <span>
            Which is further <b>{q.dir}</b>?
          </span>
        </p>
        <div className="at-compass__two" role="group" aria-label="Pick one">
          {[q.a, q.b].map((id) => (
            <button key={id} type="button" className={`at-opt${picked ? (id === q.answer ? ' is-ok' : id === picked ? ' is-bad' : '') : ''}`} disabled={!!picked} onClick={() => pick(id)}>
              <Flag id={id} alt="" />
              <span>{country(id).name}</span>
            </button>
          ))}
        </div>
        {picked && (
          <div className={`at-fb ${picked === q.answer ? 'is-ok' : 'is-bad'}`} role="status">
            <div>
              <em>{picked === q.answer ? 'Right' : 'The other way'}</em>
              <strong>
                {country(q.answer).name} is further {q.dir}
              </strong>
              <small>Both are lit on the map: green the one further {q.dir}.</small>
            </div>
            <button type="button" className="at-btn" onClick={next} autoFocus>
              {i + 1 >= qs.length ? 'Finish' : 'Next →'}
            </button>
          </div>
        )}
      </div>
      <MapView view="world" small marks={marks} />
      <p className="at-hint">
        {right} right so far · <TodayBestInline />
      </p>
    </>
  );
}

function TodayBestInline() {
  const today = useToday();
  const atlas = useAtlas();
  const w = useWallet();
  const g = atlas.days.find((d) => d.date === today)?.games.compass;
  return <>{g ? `today’s best ${g.best}` : 'your best today pays'} · purse {w.balance.toLocaleString('en-GB')}</>;
}
