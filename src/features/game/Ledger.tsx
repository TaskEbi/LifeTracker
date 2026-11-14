/** 帳: where it all came from and where it went. Every line is a real record. */
import { useMemo, useState } from 'react';
import { shortDay, addDays } from '../../domain/log/dates';
import { SOURCE_INFO, itemName, upgradeName, type GrantSource, type Tx } from '../../domain/game/wallet';
import { consumableById } from '../../domain/game/catalog';
import { LUCKY_BAG, NIGHT_EXTRAS } from '../../domain/game/market';
import { SETS } from '../../domain/game/sets';
import { BOARD, fishById, lineName, parseCastRef, parseRollRef } from '../../domain/game/arcade';
import { masteryLine } from '../../domain/game/mastery';
import { H2 } from '../../ui/i/bits';
import { lootLines, num, Price } from './bits';
import { useGame } from './store';

const txLine = (t: Tx): string => {
  switch (t.type) {
    case 'mk':
    case 'buy':
      if (t.ref.startsWith('deal:')) return "Today's deal";
      if (t.ref === LUCKY_BAG.id) return 'Lucky bag';
      if (t.ref.startsWith('night:')) return `Night market: ${NIGHT_EXTRAS.find((x) => `night:${x.id}` === t.ref)?.name ?? 'a stall'}`;
      return consumableById(t.ref)?.name ?? itemName(t.ref);
    case 'upgrade':
      return `${upgradeName(t.ref)}, level ${t.ref.split(':')[1]}`;
    case 'open':
      return 'Chest opened';
    case 'spin':
      return `Capsule machine ×${t.ref.split(':')[1]}`;
    case 'claim':
      if (t.ref.startsWith('stamp:')) return `Stamp card ${t.ref.slice(6)} handed in`;
      if (t.ref.startsWith('set:')) return `Set complete: ${SETS.find((x) => x.id === t.ref.slice(4))?.name ?? t.ref.slice(4)}`;
      if (t.ref.startsWith('bingo:')) return t.ref.endsWith(':full') ? 'Bingo: full card' : `Bingo: ${lineName(Number(t.ref.split(':')[2]))}`;
      if (t.ref.startsWith('fishbook:')) return `Fish book: ${t.ref.slice(9)} kinds`;
      if (t.ref.startsWith('body:') || t.ref.startsWith('hall:')) return masteryLine(t.ref);
      return 'Festival prize';
    case 'use':
      return `Used: ${consumableById(t.ref)?.name ?? t.ref}`;
    case 'trade':
      return 'Exchange';
    case 'deliver':
      return 'Delivered a request';
    case 'roll': {
      const r = parseRollRef(t.ref);
      return r ? `Sugoroku: rolled ${r.value}, ${BOARD[r.to]?.label ?? 'a square'}` : 'Sugoroku';
    }
    case 'cast': {
      const c = parseCastRef(t.ref);
      const f = c?.fish ? fishById(c.fish) : null;
      return f ? `Pond: ${f.name}, ${c!.cm} cm` : 'Pond: it got away';
    }
    case 'works':
      return `Works counter: ${itemName(t.ref)}`;
    case 'pilot':
      return `Piloting: ${t.ref === 'drone' ? 'the drone' : itemName(`chassis:${t.ref}:1`).replace(/ Mk I$/, '')}`;
  }
};

export function LedgerTab() {
  const g = useGame();
  const [more, setMore] = useState(false);
  const week = addDays(g.today, -6);
  const rows = useMemo(() => {
    const m = new Map<GrantSource, { coins: number; gems: number; coinsWeek: number; gemsWeek: number; n: number }>();
    for (const x of g.grants) {
      const r = m.get(x.source) ?? { coins: 0, gems: 0, coinsWeek: 0, gemsWeek: 0, n: 0 };
      r.coins += x.gain.coins ?? 0;
      r.gems += x.gain.gems ?? 0;
      r.n++;
      if (x.date >= week) {
        r.coinsWeek += x.gain.coins ?? 0;
        r.gemsWeek += x.gain.gems ?? 0;
      }
      m.set(x.source, r);
    }
    return m;
  }, [g.grants, week]);
  const recent = useMemo(() => [...g.grants].sort((a, b) => b.date.localeCompare(a.date)), [g.grants]);
  const spent = useMemo(() => g.txs.filter((t) => t.type !== 'pilot').reverse(), [g.txs]);
  return (
    <>
      <H2 aside="last 7 days · all time">Where it comes from</H2>
      <div className="i-pnl i-pnl--flush">
        {(Object.keys(SOURCE_INFO) as GrantSource[]).map((s) => {
          const r = rows.get(s);
          return (
            <div key={s} className="gm-src">
              <span className="gm-src__k" aria-hidden="true">
                {SOURCE_INFO[s].kanji}
              </span>
              <span className="gm-src__t">
                <b>{SOURCE_INFO[s].name}</b>
                <small>{SOURCE_INFO[s].hint}</small>
              </span>
              <span className="gm-src__n">
                <b>
                  {num(r?.coinsWeek ?? 0)} 両 {num(r?.gemsWeek ?? 0)} 玉
                </b>
                <small>
                  {num(r?.coins ?? 0)} 両 {num(r?.gems ?? 0)} 玉
                </small>
              </span>
            </div>
          );
        })}
      </div>
      <p className="i-note">
        Earnings are worked out from your records, like XP, so nothing pays twice and deleting a session takes back what it paid. If that leaves you short, the balance shows 0 until you earn it back; what you've bought stays yours. Ryō and materials count from 1 Oct 2026. The Lighthouse's “I'm struggling” pays nothing, on purpose.
      </p>

      <H2>Latest earnings</H2>
      <div className="i-pnl i-pnl--flush">
        {recent.slice(0, more ? 60 : 10).map((x) => (
          <div key={x.key} className="i-row">
            <span className="i-row__t">
              <b>{x.label}</b>
              <small>
                {SOURCE_INFO[x.source].name} · {shortDay(x.date)}
              </small>
            </span>
            <span className="gm-row__loot">{lootLines(x.gain).slice(0, 3).map((l) => <span key={l.key}>{l.node}</span>)}</span>
          </div>
        ))}
        {!recent.length && <p className="i-note" style={{ padding: '12px 0' }}>Nothing yet. Log anything at all.</p>}
      </div>
      {recent.length > 10 && (
        <button type="button" className="i-link" onClick={() => setMore(!more)}>
          {more ? 'Show fewer' : 'Show more'}
        </button>
      )}

      <H2>Spent and opened</H2>
      <div className="i-pnl i-pnl--flush">
        {spent.slice(0, 30).map((t) => (
          <div key={t.id} className="i-row">
            <span className="i-row__t">
              <b>{txLine(t)}</b>
              <small>{shortDay(t.at)}</small>
            </span>
            <Price cost={t.cost} />
          </div>
        ))}
        {!spent.length && <p className="i-note" style={{ padding: '12px 0' }}>You haven't spent anything yet.</p>}
      </div>
    </>
  );
}
