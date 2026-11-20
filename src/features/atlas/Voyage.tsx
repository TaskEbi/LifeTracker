/**
 * Voyages 航: set sail on a route of ports, each one the next country along. A question at every
 * port; right trades there, wrong is a storm that costs the hull a plank. The chart above follows
 * the ship. Every answer is a real one (it moves the country's cards); the voyage's row is saved
 * port by port, so a voyage left halfway can be picked up again.
 */
import { useMemo, useRef, useState } from 'react';
import { navigate } from '../../app/router';
import { useToday } from '../../data/lt';
import { clue as clueFor, halve, type Clue } from '../../domain/atlas/aids';
import { CONTS, country, DIFFS, isDiff, makeQuestion, points, qtype, seeded, type Cont, type Diff, type Question } from '../../domain/atlas/model';
import { ship as shipOf, type SupplyId } from '../../domain/atlas/shop';
import { FOCI, isFocus, leg, LEGS, portType, route, voyageOver, voyagePay, VOYAGES_A_DAY, type Focus } from '../../domain/atlas/voyage';
import { shortDay } from '../../domain/log/dates';
import { Coin, Flag, ShipArt } from './bits';
import { MapView, type MapData } from './MapView';
import { Aids, Card, type Result } from './Play';
import { kitOf, passPort, patchHull, recordAnswer, recordFinish, spendSupply, startVoyage, useAtlas, useWallet } from './store';

interface Setup {
  leg: string;
  focus: Focus;
  diff: Diff;
  from: Cont | 'world';
}
const KEY = 'lt-atlas-voyage';
const FIRST: Setup = { leg: 'coastal', focus: 'mix', diff: 'normal', from: 'world' };
function readSetup(): Setup {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Setup> | null;
    if (s && LEGS.some((l) => l.id === s.leg) && isFocus(String(s.focus)) && isDiff(String(s.diff)) && (s.from === 'world' || CONTS.some((c) => c.id === s.from))) return s as Setup;
  } catch {
    /* start from the default */
  }
  return FIRST;
}

export function Voyage({ id }: { id: string | null }) {
  return id ? <Run id={id} /> : <Harbour />;
}

/** The harbour: the ship you sail, a voyage to plan, ones under way and the logbook. */
function Harbour() {
  const today = useToday();
  const atlas = useAtlas();
  const w = useWallet();
  const kit = kitOf(atlas, w);
  const sh = shipOf(kit.ship);
  const [setup, setSetup] = useState(readSetup);
  const change = (p: Partial<Setup>) => {
    const n = { ...setup, ...p };
    setSetup(n);
    try {
      localStorage.setItem(KEY, JSON.stringify(n));
    } catch {
      /* not remembered */
    }
  };
  const todays = atlas.voyages.filter((v) => v.date === today).length;
  const paying = Math.max(0, VOYAGES_A_DAY - todays);
  const open = atlas.voyages.filter((v) => !voyageOver(v));
  const past = atlas.voyages.filter((v) => voyageOver(v)).slice(0, 12);
  const sail = () => {
    const l = leg(setup.leg);
    const id = startVoyage({ date: today, legs: l.ports, route: route(l.ports, setup.from), diff: setup.diff, focus: setup.focus, ship: sh.id, hull: sh.hull });
    navigate('atlas', ['voyage', id]);
  };

  return (
    <div className="at-voy">
      <header className="at-hud at-hud--plain">
        <button type="button" className="at-hud__quit" aria-label="Back to the Atlas" onClick={() => navigate('atlas')}>
          ✕
        </button>
        <h1 className="at-hud__title">
          <span aria-hidden="true">航</span> Voyages
        </h1>
        <Coin n={w.balance} />
      </header>

      <section className="at-dock" aria-label="Your ship">
        <ShipArt id={sh.id} className="at-dock__ship" />
        <div>
          <p className="at-kick">Your ship</p>
          <h2>{sh.name}</h2>
          <p className="at-hint">
            Hull {sh.hull} · voyages pay +{Math.round(sh.bonus * 100)}% ·{' '}
            <button type="button" className="at-link" onClick={() => navigate('atlas', ['shop'])}>
              a better ship
            </button>
          </p>
        </div>
      </section>

      {open.length > 0 && (
        <section className="at-build" aria-label="Under way">
          <h2 className="at-h">Under way</h2>
          {open.map((v) => (
            <button key={v.id} type="button" className="at-voyrow" onClick={() => navigate('atlas', ['voyage', v.id])}>
              <Flag id={v.route[Math.max(0, v.i - 1)]} alt="" />
              <span>
                Port {v.i + 1} of {v.legs} · hull {v.hull}
                <small>
                  {shortDay(v.date)} · {DIFFS.find((d) => d.id === v.diff)!.name}
                </small>
              </span>
              <b>Sail on →</b>
            </button>
          ))}
        </section>
      )}

      <section className="at-build" aria-label="Plan a voyage">
        <h2 className="at-h">Plan a voyage</h2>
        <div className="at-field">
          <p className="at-lab">How far</p>
          <div className="at-seg" role="group" aria-label="Length">
            {LEGS.map((l) => (
              <button key={l.id} type="button" aria-pressed={setup.leg === l.id} onClick={() => change({ leg: l.id })}>
                <span aria-hidden="true">{l.kanji}</span> {l.name} <small>{l.ports}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="at-field">
          <p className="at-lab">From</p>
          <div className="at-chips" role="group" aria-label="Setting out from">
            <button type="button" aria-pressed={setup.from === 'world'} onClick={() => change({ from: 'world' })}>
              Anywhere
            </button>
            {CONTS.map((c) => (
              <button key={c.id} type="button" aria-pressed={setup.from === c.id} onClick={() => change({ from: c.id })}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="at-field">
          <p className="at-lab">Asked at each port</p>
          <div className="at-chips" role="group" aria-label="Questions">
            {FOCI.map((f) => (
              <button key={f.id} type="button" aria-pressed={setup.focus === f.id} onClick={() => change({ focus: f.id })}>
                {f.name}
              </button>
            ))}
          </div>
        </div>
        <div className="at-field">
          <p className="at-lab">Seas</p>
          <div className="at-seg at-seg--4" role="group" aria-label="Difficulty">
            {DIFFS.map((d) => (
              <button key={d.id} type="button" aria-pressed={setup.diff === d.id} onClick={() => change({ diff: d.id })}>
                <span aria-hidden="true">{d.kanji}</span> {d.name}
              </button>
            ))}
          </div>
          <p className="at-hint">
            Each port traded at pays; bring the ship home for a chest. Harder seas pay more. {paying ? `${paying} of today’s ${VOYAGES_A_DAY} paying voyages left.` : 'Today’s paying voyages are done: more sail for practice.'}
          </p>
        </div>
        <div className="at-go">
          <p>
            <b>{leg(setup.leg).ports} ports</b> · hull {sh.hull}
          </p>
          <button type="button" className="at-btn at-btn--big" onClick={sail}>
            Set sail
          </button>
        </div>
      </section>

      {past.length > 0 && (
        <section className="at-page" aria-label="Logbook">
          <header>
            <span aria-hidden="true">誌</span>
            <h2>Logbook</h2>
            <p>The latest voyages, where they began and how they ended.</p>
          </header>
          <ul className="at-log">
            {past.map((v) => (
              <li key={v.id}>
                <span className="at-log__flags">
                  <Flag id={v.route[0]} alt="" />
                  <i aria-hidden="true">→</i>
                  <Flag id={v.route[Math.max(0, v.i - 1)]} alt="" />
                </span>
                <span>
                  {country(v.route[0]).name} to {country(v.route[Math.max(0, v.i - 1)]).name}
                  <small>
                    {v.done ? 'Home' : 'Wrecked'} · {v.ok} of {v.legs} traded · {shortDay(v.date)}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** The route so far on the chart: a dashed wake from port to port, and the ship where it is. */
function wake(ids: string[], log: boolean[], shipId: string) {
  return (V: MapData) => {
    const at = ids.map((id) => V.pts[id]).filter(Boolean);
    if (!at.length) return null;
    const k = V.w / 1000;
    const [x, y] = [at[at.length - 1][0], at[at.length - 1][1]];
    return (
      <>
        <polyline className="at-wake" points={at.map((p) => `${p[0]},${p[1]}`).join(' ')} />
        {at.map((p, i) => (
          <circle key={ids[i]} className={`at-port${log[i] ? ' is-ok' : ' is-bad'}`} cx={p[0]} cy={p[1]} r={2.4 * k} />
        ))}
        <ShipArt id={shipId} className="at-shipmark" x={x - 13 * k} y={y - 22 * k} width={26 * k} height={19.5 * k} />
      </>
    );
  };
}

function Run({ id }: { id: string }) {
  const today = useToday();
  const atlas = useAtlas();
  const v = atlas.voyages.find((x) => x.id === id) ?? null;
  // the question at each port is fixed by the voyage and the port, so picking it up again asks the same
  const askAt = (vid: string, i: number, r: string[], focus: Focus, d: Diff): Question => {
    const rng = seeded(`${vid}:${i}`);
    const pid = r[i];
    return makeQuestion(pid, portType(pid, focus, rng), d, country(pid).cont, rng);
  };
  const [shown, setShown] = useState<{ i: number; q: Question; result: Result | null; helped: boolean; clue: Clue | null } | null>(null);
  const run = useRef(0);
  const [streak, setStreak] = useState(0);

  const q = shown?.q ?? (v && !voyageOver(v) ? askAt(v.id, v.i, v.route, v.focus, v.diff) : null);
  const cur = shown ?? (q && v ? { i: v.i, q, result: null, helped: false, clue: null } : null);

  const answer = (picked: string | null, info: { typed?: string; close?: boolean } = {}) => {
    if (!v || !cur || cur.result || voyageOver(v)) return;
    const right = picked === cur.q.id;
    const pts = right ? Math.round(points(cur.q.diff, run.current) / (cur.helped ? 2 : 1)) : 0;
    run.current = right ? run.current + 1 : 0;
    setStreak(run.current);
    recordAnswer({ id: cur.q.id, skills: qtype(cur.q.type)!.skills, right, diff: cur.helped ? 'easy' : cur.q.diff, pts, streak: run.current, typed: !!info.typed && !cur.helped }, today);
    const after = passPort(v.id, right);
    if (after?.done) recordFinish('voyage', after.ok, true, today);
    setShown({ ...cur, result: { right, picked: picked ?? undefined, ...info } });
  };
  const aid = (item: SupplyId) => {
    if (!v || !cur || item === 'anchor' || item === 'sand') return;
    if (item === 'heart') {
      patchHull(v.id, today);
      return;
    }
    if (cur.result || (item === 'fifty' && cur.q.options && cur.q.options.length <= 2) || !spendSupply(item, today)) return;
    if (item === 'fifty') setShown({ ...cur, q: halve(cur.q), helped: true });
    else {
      const c = clueFor(cur.q);
      setShown({ ...cur, q: c.drop && cur.q.options ? { ...cur.q, options: cur.q.options.filter((x) => x !== c.drop) } : cur.q, clue: c, helped: true });
    }
  };
  const sailOn = () => setShown(null);

  const passed = v ? v.route.slice(0, v.i) : [];
  const overlay = useMemo(() => (v ? wake(v.route.slice(0, v.i), v.log, v.ship) : undefined), [v]);

  if (!v) {
    return (
      <div className="at-voy">
        <p className="at-note">This voyage isn’t in the logbook.</p>
        <button type="button" className="at-btn at-btn--ghost" onClick={() => navigate('atlas', ['voyage'])}>
          To the harbour
        </button>
      </div>
    );
  }
  const sh = shipOf(v.ship);
  const ended = voyageOver(v) && (!shown || !shown.result);
  const t = cur ? qtype(cur.q.type)! : null;
  const cardHasMap = !!t && (t.show === 'map' || t.answer === 'map') && !cur?.result;

  return (
    <div className="at-voy">
      <header className="at-hud">
        <button type="button" className="at-hud__quit" aria-label="Leave the voyage (it waits in the harbour)" onClick={() => navigate('atlas', ['voyage'])}>
          ✕
        </button>
        <div className="at-hud__mid">
          <h1 className="at-hud__title">
            {sh.name} · {leg(v.legs === 6 ? 'coastal' : v.legs === 12 ? 'crossing' : 'grand').name}
          </h1>
          <ol className="at-route" aria-label={`Port ${Math.min(v.i + 1, v.legs)} of ${v.legs}`}>
            {v.route.map((pid, i) => (
              <li key={pid} className={i < v.i ? (v.log[i] ? 'is-ok' : 'is-bad') : i === v.i && !voyageOver(v) ? 'is-now' : undefined} />
            ))}
          </ol>
        </div>
        <dl className="at-hud__nums">
          <div>
            <dt>Port</dt>
            <dd>
              {cur && !ended ? cur.i + 1 : v.i}/{v.legs}
            </dd>
          </div>
          <div>
            <dt>Hull</dt>
            <dd className={v.hull <= 1 ? 'is-low' : undefined} aria-label={`${v.hull} planks`}>
              {v.hull}
            </dd>
          </div>
          <div>
            <dt>Run</dt>
            <dd className={streak >= 5 ? 'is-hot' : undefined}>{streak}</dd>
          </div>
        </dl>
      </header>

      {!cardHasMap && <MapView view="world" small marks={Object.fromEntries(passed.map((p, i) => [p, v.log[i] ? ('ok' as const) : ('bad' as const)]))} focus={passed[passed.length - 1] ?? null} overlay={overlay} />}

      {ended ? (
        <Landfall id={v.id} />
      ) : (
        cur && (
          <>
            {cur.result && (
              <p className={`at-storm${cur.result.right ? ' is-ok' : ''}`} role="status">
                {cur.result.right ? `Traded at ${country(cur.q.id).name}.` : v.sunk ? 'The storm took the last plank.' : `A storm off ${country(cur.q.id).name}: the hull lost a plank.`}
              </p>
            )}
            <Card
              key={`${v.id}:${cur.i}`}
              q={cur.q}
              result={cur.result}
              onAnswer={answer}
              onNext={sailOn}
              waits
              clue={cur.clue}
              nextLabel={voyageOver(v) ? 'Make landfall →' : 'Sail on →'}
              aids={
                <>
                  <Aids q={cur.q} answered={!!cur.result} onUse={aid} />
                  <HullPatch hull={v.hull} max={sh.hull} onPatch={() => aid('heart')} />
                </>
              }
            />
          </>
        )
      )}
    </div>
  );
}

function HullPatch({ hull, max, onPatch }: { hull: number; max: number; onPatch: () => void }) {
  const w = useWallet();
  if (!w.stock.heart || hull >= max + 2) return null;
  return (
    <div className="at-aids">
      <button type="button" onClick={onPatch} title="A spare heart patches the hull by one plank">
        <span aria-hidden="true">命</span> Patch the hull <small>×{w.stock.heart}</small>
      </button>
    </div>
  );
}

/** The end of a voyage: home with a chest, or wrecked; what it paid. */
function Landfall({ id }: { id: string }) {
  const atlas = useAtlas();
  const v = atlas.voyages.find((x) => x.id === id)!;
  const sameDay = atlas.voyages.filter((x) => x.date === v.date).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  const pays = sameDay.findIndex((x) => x.id === v.id) < VOYAGES_A_DAY;
  const pay = voyagePay(v, shipOf(v.ship).bonus);
  const last = v.route[Math.max(0, v.i - 1)];
  return (
    <div className="at-sum">
      <h2 className="at-sum__head">{v.done ? 'Home, with the hold full' : `Wrecked off ${country(last).name}`}</h2>
      <dl className="at-stats">
        <div>
          <dt>Ports</dt>
          <dd>
            {v.i}
            <small>/{v.legs}</small>
          </dd>
        </div>
        <div>
          <dt>Traded</dt>
          <dd>{v.ok}</dd>
        </div>
        <div>
          <dt>Storms</dt>
          <dd>{v.i - v.ok}</dd>
        </div>
        <div>
          <dt>Hull</dt>
          <dd>{v.hull}</dd>
        </div>
      </dl>
      {pays ? (
        <p className="at-pay at-pay--db">
          <Coin n={pay.ports + pay.home} />
          <small>
            {pay.ports} for the ports{pay.home ? `, ${pay.home} for the chest` : ''}
          </small>
        </p>
      ) : (
        <p className="at-note">Today’s first {VOYAGES_A_DAY} voyages have paid; this one was for the practice (the answers still count).</p>
      )}
      <section className="at-missed" aria-label="Ports">
        <h3>Ports of call</h3>
        <ul>
          {v.route.slice(0, v.i).map((pid, i) => (
            <li key={pid} className={v.log[i] ? undefined : 'is-bad'}>
              <Flag id={pid} alt="" />
              <span>
                {country(pid).name}
                <small>{v.log[i] ? country(pid).cap : `storm · ${country(pid).cap}`}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <div className="at-sum__go">
        <button type="button" className="at-btn" onClick={() => navigate('atlas', ['voyage'])}>
          Back to the harbour
        </button>
        <button type="button" className="at-btn at-btn--ghost" onClick={() => navigate('atlas')}>
          Back to the Atlas
        </button>
      </div>
    </div>
  );
}
