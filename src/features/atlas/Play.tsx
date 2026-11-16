/**
 * One sitting of the Atlas: a round, a sprint, a survival run, the day's review or the daily
 * challenge. Every answer is saved as it's given (the country's cards and the day's totals); the
 * medal, best score or daily result is saved when the sitting ends.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { navigate } from '../../app/router';
import { ltToday } from '../../data/lt';
import { data } from '../../data/store';
import {
  askable,
  contName,
  country,
  dailyItems,
  diff as diffInfo,
  LIVES,
  makeQuestion,
  matchCapital,
  matchName,
  medalFor,
  MEDALS,
  points,
  qtype,
  reviewPlan,
  shuffle,
  SPRINT_PENALTY,
  SPRINT_SECS,
  STYLES,
  typesFor,
  viewOf,
  type Ask,
  type Deck,
  type Diff,
  type Item,
  type Question,
  type Style,
  type ViewId,
} from '../../domain/atlas/model';
import { payTotal } from '../../domain/atlas/pay';
import { Flag, MedalDot } from './bits';
import { MapView, Outline, type MapMark } from './MapView';
import { atlasOf, recordAnswer, recordBest, recordDaily, recordMedal } from './store';

export type Mode = { kind: 'game'; style: Style; ask: Ask; deck: Deck; diff: Diff } | { kind: 'review'; deck: Deck } | { kind: 'daily' };

interface Result {
  right: boolean;
  picked?: string;
  typed?: string;
  close?: boolean;
}

interface Sess {
  queue: Item[];
  cur: Question | null;
  result: Result | null;
  /** Finite sittings: how many there are to clear, and how many are. */
  total: number;
  done: number;
  asked: number;
  ok: number;
  firstTry: number;
  missed: string[];
  streak: number;
  best: number;
  pts: number;
  lives: number;
  stamped: string[];
  over: boolean;
}

interface Outcome {
  medal: { tier: number; flawless: boolean; change: 'new' | 'flawless' | null } | null;
  newBest: boolean;
  dailyCounted: boolean | null;
  coins: number;
  gems: number;
}

const endless = (m: Mode) => m.kind === 'game' && m.style !== 'round';
const homeView = (m: Mode): ViewId => (m.kind === 'daily' ? 'world' : viewOf(m.deck));

function itemsFor(mode: Mode, only: string[] | null, today: string): Item[] {
  if (mode.kind === 'daily') return dailyItems(today);
  if (mode.kind === 'review') {
    const items = reviewPlan(mode.deck.ids, atlasOf(data.get()).marks, today).items;
    return only ? items.filter((i) => only.includes(i.id)) : items;
  }
  const ids = shuffle(askable(only ?? mode.deck.ids, mode.ask));
  return ids.map((id) => {
    const pool = typesFor(id);
    return { id, type: mode.ask === 'mix' ? pool[Math.floor(Math.random() * pool.length)] : mode.ask, diff: mode.diff };
  });
}

const titleOf = (m: Mode) => (m.kind === 'daily' ? 'Daily challenge' : m.kind === 'review' ? `Review · ${m.deck.name}` : `${STYLES.find((s) => s.id === m.style)!.name} · ${m.deck.name}`);

export function Play({ mode }: { mode: Mode }) {
  const [run, setRun] = useState<{ n: number; only: string[] | null }>({ n: 0, only: null });
  return <Sitting key={run.n} mode={mode} only={run.only} again={(only) => setRun((r) => ({ n: r.n + 1, only: only ?? null }))} />;
}

function Sitting({ mode, only, again }: { mode: Mode; only: string[] | null; again: (only?: string[]) => void }) {
  const today = useMemo(() => ltToday(), []);
  const home = homeView(mode);
  const startPay = useRef(payTotal(atlasOf(data.get()).rows));
  const ask = useCallback((it: Item) => makeQuestion(it.id, it.type, it.diff, home), [home]);
  const [s, setS] = useState<Sess>(() => {
    const items = itemsFor(mode, only, today);
    const [first, ...rest] = items;
    return { queue: rest, cur: first ? ask(first) : null, result: null, total: items.length, done: 0, asked: 0, ok: 0, firstTry: 0, missed: [], streak: 0, best: 0, pts: 0, lives: LIVES, stamped: [], over: !first };
  });
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const sprint = mode.kind === 'game' && mode.style === 'sprint';
  const endsAt = useRef(Date.now() + SPRINT_SECS * 1000);
  const [left, setLeft] = useState(SPRINT_SECS);
  const auto = useRef(0);
  // the sitting as it stands right now, so two quick taps can't both count
  const live = useRef(s);
  const ended = useRef(false);
  const put = (n: Sess) => {
    live.current = n;
    setS(n);
  };

  const finish = useCallback(
    (f: Sess) => {
      if (ended.current) return;
      ended.current = true;
      window.clearTimeout(auto.current);
      let medal: Outcome['medal'] = null;
      let newBest = false;
      let dailyCounted: boolean | null = null;
      if (mode.kind === 'daily') dailyCounted = f.asked >= f.total ? recordDaily(today, { ok: f.ok, n: f.total, pts: f.pts }) : null;
      else if (mode.kind === 'game' && !only) {
        if (mode.style === 'round') {
          const m = medalFor(mode.diff, f.firstTry, f.total);
          if (m.tier) medal = { ...m, change: recordMedal(mode.deck.id, mode.ask, m.tier, m.flawless, today) };
        } else newBest = recordBest(mode.style, mode.deck.id, mode.ask, mode.diff, mode.style === 'sprint' ? f.pts : f.ok, today);
      }
      const now = payTotal(atlasOf(data.get()).rows);
      setOutcome({ medal, newBest, dailyCounted, coins: now.coins - startPay.current.coins, gems: now.gems - startPay.current.gems });
      put({ ...f, over: true, cur: null, result: null });
    },
    [mode, only, today],
  );

  const next = useCallback(() => {
    window.clearTimeout(auto.current);
    const p = live.current;
    if (p.over || !p.result) return;
    if ((mode.kind === 'game' && mode.style === 'survival' && p.lives <= 0) || (!endless(mode) && !p.queue.length)) return finish(p);
    let queue = p.queue;
    // an endless sitting deals the deck again, without the country just asked coming straight back
    if (!queue.length) queue = itemsFor(mode, only, today).filter((i, n) => n > 0 || i.id !== p.cur?.id);
    const [head, ...rest] = queue;
    if (!head) return finish(p);
    put({ ...p, queue: rest, cur: ask(head), result: null });
  }, [ask, finish, mode, only, today]);

  const answer = useCallback(
    (picked: string | null, info: { typed?: string; close?: boolean } = {}) => {
      const p = live.current;
      const q = p.cur;
      if (!q || p.result || p.over) return;
      const right = picked === q.id;
      const streak = right ? p.streak + 1 : 0;
      const pts = right ? points(q.diff, p.streak) : 0;
      const stamped = recordAnswer({ id: q.id, skills: qtype(q.type)!.skills, right, diff: q.diff, pts, streak }, today);
      const wasMissed = p.missed.includes(q.id);
      const finite = !endless(mode);
      const again = finite && mode.kind !== 'daily' && !right;
      const queue = again ? [...p.queue.slice(0, 3), { id: q.id, type: q.type, diff: q.diff }, ...p.queue.slice(3)] : p.queue;
      const n: Sess = {
        ...p,
        queue,
        result: { right, picked: picked ?? undefined, ...info },
        asked: p.asked + 1,
        ok: p.ok + (right ? 1 : 0),
        done: p.done + (right || mode.kind === 'daily' ? 1 : 0),
        firstTry: p.firstTry + (right && !wasMissed ? 1 : 0),
        missed: right || wasMissed ? p.missed : [...p.missed, q.id],
        streak,
        best: Math.max(p.best, streak),
        pts: p.pts + pts,
        lives: p.lives - (!right && mode.kind === 'game' && mode.style === 'survival' ? 1 : 0),
        stamped: [...p.stamped, ...stamped],
      };
      put(n);
      if (sprint && !right) endsAt.current -= SPRINT_PENALTY * 1000;
      // right answers move on by themselves; a wrong one waits to be read (a sprint can't wait)
      if (right) auto.current = window.setTimeout(next, sprint ? 450 : info.close ? 2400 : 1100);
      else if (sprint) auto.current = window.setTimeout(next, 1100);
    },
    [mode, next, sprint, today],
  );

  // the sprint clock
  useEffect(() => {
    if (!sprint || s.over) return;
    const t = window.setInterval(() => {
      const ms = endsAt.current - Date.now();
      setLeft(Math.max(0, Math.ceil(ms / 1000)));
      if (ms <= 0) finish(live.current);
    }, 200);
    return () => window.clearInterval(t);
  }, [sprint, s.over, finish]);
  useEffect(() => () => window.clearTimeout(auto.current), []);

  // keys: 1–8 pick an answer, Enter or → moves on
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const q = live.current.cur;
      if (!q) return;
      const inField = (e.target as HTMLElement | null)?.tagName === 'INPUT';
      if (!live.current.result && q.options && qtype(q.type)!.answer !== 'map' && !inField && /^[1-8]$/.test(e.key) && q.options[+e.key - 1]) {
        answer(q.options[+e.key - 1]);
        e.preventDefault();
      } else if (live.current.result && (e.key === 'ArrowRight' || (e.key === 'Enter' && (e.target as HTMLElement | null)?.tagName !== 'BUTTON'))) {
        next();
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [answer, next]);

  if (s.over) return <Summary mode={mode} only={only} s={s} outcome={outcome} again={again} />;
  const q = s.cur!;
  return (
    <div className="at-play">
      <header className="at-hud">
        <button type="button" className="at-hud__quit" aria-label="Leave this game" onClick={() => navigate('atlas')}>
          ✕
        </button>
        <div className="at-hud__mid">
          <h1 className="at-hud__title">{titleOf(mode)}</h1>
          {sprint ? (
            <div className="at-bar at-bar--time" role="timer" aria-label={`${left} seconds left`}>
              <i style={{ width: `${(left / SPRINT_SECS) * 100}%` }} />
            </div>
          ) : mode.kind === 'game' && mode.style === 'survival' ? (
            <p className="at-lives" aria-label={`${s.lives} ${s.lives === 1 ? 'life' : 'lives'} left`}>
              {Array.from({ length: LIVES }, (_, i) => (
                <span key={i} className={i < s.lives ? 'is-on' : undefined} aria-hidden="true">
                  ♥
                </span>
              ))}
            </p>
          ) : (
            <div className="at-bar" role="progressbar" aria-valuemin={0} aria-valuemax={s.total} aria-valuenow={s.done} aria-label="Progress">
              <i style={{ width: `${(s.done / Math.max(s.total, 1)) * 100}%` }} />
            </div>
          )}
        </div>
        <dl className="at-hud__nums">
          <div>
            <dt>{sprint ? 'Time' : endless(mode) ? 'Right' : 'Card'}</dt>
            <dd>{sprint ? `${left}s` : endless(mode) ? s.ok : `${Math.min(s.done + 1, s.total)}/${s.total}`}</dd>
          </div>
          <div>
            <dt>Run</dt>
            <dd className={s.streak >= 5 ? 'is-hot' : undefined}>{s.streak}</dd>
          </div>
          <div>
            <dt>Points</dt>
            <dd>{s.pts}</dd>
          </div>
        </dl>
      </header>
      <Card key={`${s.asked}:${q.id}:${q.type}`} q={q} result={s.result} onAnswer={answer} onNext={next} waits={!sprint} />
    </div>
  );
}

function Card({ q, result, onAnswer, onNext, waits }: { q: Question; result: Result | null; onAnswer: (picked: string | null, info?: { typed?: string; close?: boolean }) => void; onNext: () => void; waits: boolean }) {
  const t = qtype(q.type)!;
  const c = country(q.id);
  const level = diffInfo(q.diff);
  const [text, setText] = useState('');
  const nextRef = useRef<HTMLButtonElement>(null);
  const fbRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!result) return;
    if (!result.right) nextRef.current?.focus({ preventScroll: true });
    fbRef.current?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [result]);

  const mapMarks = useMemo<Record<string, MapMark>>(() => {
    if (result) return { ...(result.picked && result.picked !== q.id && t.answer === 'map' ? { [result.picked]: 'bad' as const } : {}), [q.id]: 'ok' };
    return t.show === 'map' ? { [q.id]: 'hl' } : {};
  }, [result, q.id, t.answer, t.show]);
  const hasMap = t.show === 'map' || t.answer === 'map';
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || result) return;
    const r = t.answer === 'cap' ? matchCapital(text, q.id) : matchName(text, q.id);
    onAnswer(r ? q.id : null, { typed: text.trim(), close: r === 2 });
  };
  const label = (id: string) => (t.answer === 'cap' ? country(id).cap : country(id).name);
  const wrong = result && !result.right && result.picked ? country(result.picked) : null;

  return (
    <div className={`at-card${hasMap ? ' at-card--map' : ''}`}>
      <div className="at-ask">
        <p className="at-ask__q">
          {t.ask}
          <span className="at-ask__lv" title={level.hint}>
            {level.kanji} {level.name}
          </span>
        </p>
        {t.show === 'flag' && <Flag id={q.id} className="at-ask__flag" alt="The flag to identify" />}
        {t.show === 'name' && <h2 className="at-ask__big">{c.name}</h2>}
        {t.show === 'cap' && <h2 className="at-ask__big">{c.cap}</h2>}
        {t.show === 'shape' && <Outline id={q.id} />}
        {t.answer === 'map' && !result && (
          <p className="at-ask__hint">{q.options ? `It’s one of the ${q.options.length} lit up.` : q.view === 'world' ? 'Anywhere in the world. Pinch or use + to zoom; small countries are ringed.' : `Somewhere in ${contName(q.view)}. Pinch or use + to zoom; small countries are ringed.`}</p>
        )}
      </div>

      {hasMap && <MapView view={q.view} marks={mapMarks} cands={t.answer === 'map' && !result ? q.options : null} onPick={t.answer === 'map' && !result ? (id) => onAnswer(id) : undefined} focus={result || t.show === 'map' ? q.id : null} />}

      <div className="at-ans">
        {t.answer !== 'map' && q.options && (
          <div className={t.answer === 'flag' ? 'at-opts at-opts--flags' : 'at-opts'} role="group" aria-label="Answers">
            {q.options.map((id, i) => {
              const state = result ? (id === q.id ? ' is-ok' : id === result.picked ? ' is-bad' : '') : '';
              return (
                <button key={id} type="button" className={`at-opt${state}`} disabled={!!result} onClick={() => onAnswer(id)} aria-label={t.answer === 'flag' ? `Flag ${i + 1}` : undefined}>
                  <kbd aria-hidden="true">{i + 1}</kbd>
                  {t.answer === 'flag' ? <Flag id={id} alt="" /> : <span>{label(id)}</span>}
                </button>
              );
            })}
          </div>
        )}
        {q.typed && !result && (
          <form className="at-type" onSubmit={submit} autoComplete="off">
            <label htmlFor="at-ans">{t.answer === 'cap' ? 'Type the capital' : 'Type the country'}</label>
            <div className="at-type__row">
              <input id="at-ans" type="text" value={text} onChange={(e) => setText(e.target.value)} autoFocus autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="go" />
              <button type="submit" className="at-btn">
                Check
              </button>
            </div>
            <button type="button" className="at-link" onClick={() => onAnswer(null)}>
              I don’t know, show me
            </button>
          </form>
        )}

        {result && (
          <div className={`at-fb ${result.right ? 'is-ok' : 'is-bad'}`} role="status" ref={fbRef}>
            <Flag id={q.id} alt={`Flag of ${c.name}`} />
            <div>
              <em>
                {result.right
                  ? result.close
                    ? 'Close enough. Check the spelling:'
                    : 'Correct'
                  : result.typed
                    ? `You typed “${result.typed}”.`
                    : wrong
                      ? t.answer === 'cap'
                        ? `${wrong.cap} is the capital of ${wrong.name}.`
                        : `That was ${wrong.name}.`
                      : 'Here it is.'}
              </em>
              <strong>{c.name}</strong>
              <small>
                Capital: {c.cap} · {c.sub}
              </small>
            </div>
            {(waits || result.right) && (
              <button type="button" className="at-btn" ref={nextRef} onClick={onNext}>
                Next →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Summary({ mode, only, s, outcome, again }: { mode: Mode; only: string[] | null; s: Sess; outcome: Outcome | null; again: (only?: string[]) => void }) {
  const acc = s.asked ? Math.round((s.ok / s.asked) * 100) : 0;
  const head =
    !s.asked && !s.total
      ? 'Nothing to ask here yet'
      : mode.kind === 'daily'
        ? `${s.ok} of ${s.total} on today’s challenge`
        : mode.kind === 'review'
          ? `${s.firstTry} of ${s.total} right first time`
          : mode.style === 'round'
            ? `${s.firstTry} of ${s.total} right first time`
            : mode.style === 'sprint'
              ? `${s.pts} points in a minute`
              : `${s.ok} right before the lives ran out`;
  const medal = outcome?.medal;
  const practice = mode.kind === 'game' && mode.style === 'round' && !only && mode.diff === 'easy';
  return (
    <div className="at-sum">
      <h1 className="at-kick">{titleOf(mode)} · finished</h1>
      <h2 className="at-sum__head">{head}</h2>

      {!s.asked && !s.total ? (
        <p className="at-note">{mode.kind === 'review' ? 'No cards are due and there are no new countries left in this deck. Come back tomorrow, or play a round.' : 'This deck has no countries for that kind of question.'}</p>
      ) : (
        <dl className="at-stats">
          <div>
            <dt>Right</dt>
            <dd>
              {s.ok}
              <small>/{s.asked}</small>
            </dd>
          </div>
          <div>
            <dt>Accuracy</dt>
            <dd>
              {acc}
              <small>%</small>
            </dd>
          </div>
          <div>
            <dt>Best run</dt>
            <dd>{s.best}</dd>
          </div>
          <div>
            <dt>Points</dt>
            <dd>{s.pts}</dd>
          </div>
        </dl>
      )}

      {medal && (
        <div className={`at-prize at-prize--m${medal.tier}`}>
          <MedalDot tier={medal.tier} flawless={medal.flawless} big />
          <div>
            <strong>
              {MEDALS[medal.tier]} medal{medal.flawless ? ', flawless' : ''}
            </strong>
            <small>{medal.change === 'new' ? 'New in your passport.' : medal.change === 'flawless' ? 'Now flawless: not one miss.' : 'You already hold this one.'}</small>
          </div>
        </div>
      )}
      {mode.kind === 'game' && mode.style === 'round' && !only && !medal && s.total > 0 && (
        <p className="at-note">{practice ? 'Easy rounds are practice: medals start at Normal (bronze), Hard (silver) and Expert (gold).' : 'A medal needs nine in ten right first time.'}</p>
      )}
      {outcome?.newBest && (
        <div className="at-prize">
          <span className="at-prize__k" aria-hidden="true">
            新
          </span>
          <div>
            <strong>New best</strong>
            <small>
              {mode.kind === 'game' && mode.style === 'sprint' ? `${s.pts} points` : `${s.ok} right`} for this setting.
            </small>
          </div>
        </div>
      )}
      {outcome?.dailyCounted === false && <p className="at-note">Today’s challenge was already in, so this one was for practice.</p>}
      {s.stamped.length > 0 && (
        <div className="at-prize at-prize--stamps">
          <div className="at-prize__flags">
            {s.stamped.map((id) => (
              <span key={id} className="at-stamp is-on" title={country(id).name}>
                <Flag id={id} alt={country(id).name} />
              </span>
            ))}
          </div>
          <div>
            <strong>
              {s.stamped.length} new passport {s.stamped.length === 1 ? 'stamp' : 'stamps'}
            </strong>
            <small>Flag, place and capital all known: {s.stamped.map((id) => country(id).name).join(', ')}.</small>
          </div>
        </div>
      )}
      {outcome && (outcome.coins > 0 || outcome.gems > 0) && (
        <p className="at-pay">
          <span aria-hidden="true">両</span>
          <b>+{outcome.coins} Ryō</b>
          {outcome.gems > 0 && <b>+{outcome.gems} Tama</b>}
          <small>added to the Hangar</small>
        </p>
      )}

      {s.missed.length > 0 && (
        <section className="at-missed" aria-label="Missed">
          <h3>Worth another look</h3>
          <ul>
            {s.missed.map((id) => (
              <li key={id}>
                <Flag id={id} alt="" />
                <span>
                  {country(id).name}
                  <small>{country(id).cap}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="at-sum__go">
        {s.missed.length > 0 && mode.kind === 'game' && (
          <button type="button" className="at-btn" onClick={() => again(s.missed)}>
            Drill the {s.missed.length} missed
          </button>
        )}
        {mode.kind !== 'daily' && s.total > 0 && (
          <button type="button" className={`at-btn${s.missed.length && mode.kind === 'game' ? ' at-btn--ghost' : ''}`} onClick={() => again()}>
            {mode.kind === 'review' ? 'Review more' : 'Play again'}
          </button>
        )}
        <button type="button" className="at-btn at-btn--ghost" onClick={() => navigate('atlas')}>
          Back to the Atlas
        </button>
        <button type="button" className="at-btn at-btn--ghost" onClick={() => navigate('atlas', ['passport'])}>
          Passport
        </button>
      </div>
    </div>
  );
}
