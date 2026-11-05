/** 祭: seasonal festivals. Which one is on comes from the date; tokens come from what you log while it runs. */
import { useMemo, type CSSProperties } from 'react';
import { useProgress } from '../../data/lt';
import { toast } from '../../data/ui';
import { CHASSIS, chassisCost, RARITY } from '../../domain/game/catalog';
import { daysLeft, eventOn, eventStock, EVENTS, monthDay, nextEvent, trackOf, type EventRun } from '../../domain/game/events';
import { canAfford, chassisMk, itemName, type Tx } from '../../domain/game/wallet';
import { H2 } from '../../ui/i/bits';
import { daysWord, ItemThumb, num, Price, Rar, Thumb } from './bits';
import { showReveal } from './revealStore';
import { buyItem, buyMk, claimStep, useGame } from './store';

const claimedIn = (txs: Tx[], key: string) => new Set(txs.filter((t) => t.type === 'claim' && t.ref.startsWith(`${key}:`)).map((t) => Number(t.ref.split(':')[1])));

function Track({ run }: { run: EventRun }) {
  const g = useGame();
  const earned = g.wallet.tokensEarned[run.key] ?? 0;
  const claimed = useMemo(() => claimedIn(g.txs, run.key), [g.txs, run.key]);
  const steps = trackOf(run.def);
  const top = steps[steps.length - 1].at;
  return (
    <>
      <div className="gm-track__bar" role="progressbar" aria-label={`${run.def.name} prize track`} aria-valuemin={0} aria-valuemax={top} aria-valuenow={Math.min(earned, top)}>
        <i style={{ width: `${Math.min(100, (earned / top) * 100)}%` }} />
      </div>
      <ol className="gm-track">
        {steps.map((s) => {
          const reached = earned >= s.at;
          const got = claimed.has(s.at);
          return (
            <li key={s.at} className={got ? 'is-got' : reached ? 'is-ready' : ''}>
              <span className="gm-track__at">{num(s.at)}</span>
              <span className="gm-track__p">{s.label}</span>
              {got ? (
                <small>Claimed</small>
              ) : reached ? (
                <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => {
                    claimStep(run.key, s.at, s.gain);
                    toast(`Claimed: ${s.label}.`);
                  }}
                >
                  Claim
                </button>
              ) : (
                <small>{num(s.at - earned)} to go</small>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

function Running({ run }: { run: EventRun }) {
  const g = useGame();
  const stage = useProgress().overall.stage;
  const w = g.wallet;
  const def = run.def;
  const ch = CHASSIS.find((c) => c.id === def.chassis)!;
  const mk = chassisMk(w, ch.id);
  const nextMk = (mk + 1) as 1 | 2 | 3;
  const cost = mk < 3 ? chassisCost(ch, nextMk, run.key) : null;
  return (
    <>
      <section className="gm-fest" style={{ '--c': def.c, '--c2': def.c2 } as CSSProperties} aria-label={def.name}>
        <span className="gm-fest__k" aria-hidden="true">
          {def.kanji}
        </span>
        <div className="gm-fest__t">
          <h2>{def.name}</h2>
          <p>{def.blurb}</p>
          <small>
            {monthDay(run.start)} to {monthDay(run.end)} · {daysWord(daysLeft(run, g.today))}
          </small>
        </div>
        <div className="gm-fest__tok">
          <b>{num(w.tokens[run.key] ?? 0)}</b>
          <small>
            {def.token.kanji} {def.token.name} to spend
          </small>
        </div>
        <p className="gm-fest__boost">{def.boostLine}</p>
      </section>

      <H2 aside={`${num(w.tokensEarned[run.key] ?? 0)} earned`}>Prize track</H2>
      <Track run={run} />
      <p className="i-note">Every 4 XP you earn while it runs is worth a token (quicker in shorter festivals), plus a few for any active day. Spending tokens doesn't move you back along the track.</p>

      <H2 aside="only while it runs">Festival stall</H2>
      <div className="gm-fest__chassis" style={{ '--a': RARITY.legendary.color } as CSSProperties}>
        <Thumb look={{ chassis: ch.id }} mk={mk ? mk : 1} />
        <div>
          <b>{ch.name}</b> <Rar r={ch.rarity} />
          <p>{ch.blurb}</p>
          {cost ? (
            <>
              <Price cost={cost} w={w} tokenName={def.token.name} />
              <button type="button" className="i-btn i-btn--sig" disabled={!canAfford(w, cost)} onClick={() => buyMk(ch.id, nextMk, cost)}>
                {mk ? `Upgrade to Mk ${'I'.repeat(nextMk)}` : 'Build it'}
              </button>
            </>
          ) : (
            <p className="i-note">Fully built.</p>
          )}
        </div>
      </div>
      <div className="gm-shelf">
        {eventStock(def).map((s) => {
          const owned = w.items.has(s.item);
          const c = { tokens: { [run.key]: s.tokens } };
          return (
            <div key={s.item} className={`gm-shop${owned ? ' is-owned' : ''}`}>
              <ItemThumb item={s.item} stage={stage} />
              <b>{itemName(s.item)}</b>
              {owned ? (
                <small className="gm-shop__own">Owned</small>
              ) : (
                <>
                  <Price cost={c} w={w} tokenName={def.token.name} />
                  <button
                    type="button"
                    className="i-btn i-btn--sm"
                    disabled={!canAfford(w, c)}
                    onClick={() => {
                      if (buyItem(s.item, c)) showReveal({ kind: 'item', item: s.item });
                    }}
                  >
                    Buy
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Prizes from a festival that's over and were reached but not claimed stay claimable. */
function Unclaimed() {
  const g = useGame();
  const running = eventOn(g.today)?.key;
  const open = Object.keys(g.wallet.tokensEarned)
    .filter((k) => k !== running)
    .flatMap((key) => {
      const def = EVENTS.find((e) => key.startsWith(`${e.id}-`));
      if (!def) return [];
      const claimed = claimedIn(g.txs, key);
      const earned = g.wallet.tokensEarned[key];
      return trackOf(def)
        .filter((s) => earned >= s.at && !claimed.has(s.at))
        .map((s) => ({ key, def, s }));
    });
  if (!open.length) return null;
  const claimAll = () => {
    for (const { key, s } of open) claimStep(key, s.at, s.gain);
    toast(`Claimed ${open.length} prize${open.length === 1 ? '' : 's'}.`);
  };
  return (
    <>
      <H2 aside="from festivals you were part of">Left behind</H2>
      <button type="button" className="i-btn i-btn--sig" onClick={claimAll}>
        Claim all {open.length}
      </button>
      <ol className="gm-track gm-track--left">
        {open.map(({ key, def, s }) => (
          <li key={`${key}${s.at}`}>
            <span className="gm-track__p">
              {def.name}: {s.label}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

export function EventsTab() {
  const g = useGame();
  const run = eventOn(g.today);
  const next = nextEvent(g.today);
  const order = [...EVENTS].sort((a, b) => a.from.localeCompare(b.from));
  return (
    <>
      {run ? <Running run={run} /> : <p className="gm-next">No festival today. Next: <b>{next.def.name}</b> from {monthDay(next.start)}.</p>}
      <Unclaimed />
      <H2>The year</H2>
      <ol className="gm-year">
        {order.map((e) => {
          const ch = CHASSIS.find((c) => c.id === e.chassis)!;
          const on = run?.def.id === e.id;
          return (
            <li key={e.id} className={on ? 'is-on' : ''} style={{ '--c': e.c, '--c2': e.c2 } as CSSProperties}>
              <Thumb look={{ chassis: ch.id }} mk={chassisMk(g.wallet, ch.id) || 1} />
              <span>
                <b>
                  <span aria-hidden="true">{e.kanji}</span> {e.name}
                </b>
                <small>
                  {monthDay(`2026-${e.from}`)} to {monthDay(`2026-${e.to}`)} · {ch.name}
                </small>
              </span>
              {on && <i>Now</i>}
            </li>
          );
        })}
      </ol>
    </>
  );
}
