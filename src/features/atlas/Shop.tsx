/** The Chandlery 店: the purse, what Doubloons buy (supplies, ships, charts, titles) and where they came from. */
import { useState } from 'react';
import { useToday } from '../../data/lt';
import { shortDay } from '../../domain/log/dates';
import { CHARTS, SHIPS, SUPPLIES, TITLES, type Good, type Shelf } from '../../domain/atlas/shop';
import { DAILY_PAY, DAY_CAP, STAMP_PAY, STREAK_MILES } from '../../domain/atlas/wallet';
import { Coin, ShipArt } from './bits';
import { buy, kitOf, setKit, useAtlas, useWallet, type BuyResult } from './store';

const SHELVES: { id: Shelf; name: string; kanji: string }[] = [
  { id: 'supply', name: 'Supplies', kanji: '品' },
  { id: 'ship', name: 'Ships', kanji: '船' },
  { id: 'chart', name: 'Charts', kanji: '図' },
  { id: 'title', name: 'Titles', kanji: '号' },
];
const KEY = 'lt-atlas-shelf';
const SAY: Record<BuyResult, string> = { ok: 'Bought.', poor: 'Not enough Doubloons for that yet.', full: 'You can’t carry more of those.', owned: 'Already yours.', unknown: 'That isn’t for sale.' };

export function Shop() {
  const today = useToday();
  const atlas = useAtlas();
  const w = useWallet();
  const kit = kitOf(atlas, w);
  const [shelf, setShelf] = useState<Shelf>(() => {
    try {
      const s = localStorage.getItem(KEY);
      return SHELVES.some((x) => x.id === s) ? (s as Shelf) : 'supply';
    } catch {
      return 'supply';
    }
  });
  const [said, setSaid] = useState('');
  const pick = (s: Shelf) => {
    setShelf(s);
    setSaid('');
    try {
      localStorage.setItem(KEY, s);
    } catch {
      /* not remembered */
    }
  };
  const doBuy = (g: Good, n = 1) => {
    const r = buy(g.id, n, today);
    setSaid(r === 'ok' ? `${n > 1 ? `${n} × ` : ''}${g.name}: bought for ${(g.price * n).toLocaleString('en-GB')} Doubloons.` : SAY[r]);
  };
  const price = (g: Good, n = 1) => (
    <>
      <i aria-hidden="true">金</i> {(g.price * n).toLocaleString('en-GB')}
    </>
  );

  return (
    <div className="at-shop">
      <section className="at-purse-card" aria-label="Purse">
        <div>
          <p className="at-kick">Purse</p>
          <Coin n={w.balance} big />
          <p className="at-hint">
            {w.earned.toLocaleString('en-GB')} earned · {w.spent.toLocaleString('en-GB')} spent
          </p>
        </div>
        <ul className="at-earn">
          <li>
            <b>Answers</b> a tenth of the day’s points (up to {DAY_CAP})
          </li>
          <li>
            <b>Daily challenge</b> {DAILY_PAY}, twice that with all twelve
          </li>
          <li>
            <b>Quests</b> three a day, 20 to 40 each
          </li>
          <li>
            <b>Voyages</b> each port traded at, and a chest for coming home
          </li>
          <li>
            <b>Mini-games</b> your best each day
          </li>
          <li>
            <b>Stamps</b> {STAMP_PAY} each; <b>medals</b> by their deck
          </li>
          <li>
            <b>Streaks</b> {STREAK_MILES.slice(0, 4).map(([d, p]) => `${d} days ${p}`).join(', ')}…
          </li>
        </ul>
      </section>

      <div className="at-seg at-seg--4" role="group" aria-label="Shelf">
        {SHELVES.map((s) => (
          <button key={s.id} type="button" aria-pressed={shelf === s.id} onClick={() => pick(s.id)}>
            <span aria-hidden="true">{s.kanji}</span> {s.name}
          </button>
        ))}
      </div>
      <p className="at-said" role="status">
        {said}
      </p>

      {shelf === 'supply' && (
        <div className="at-goods">
          {SUPPLIES.map((g) => {
            const held = w.stock[g.id];
            const full = held >= (g.max ?? 99);
            return (
              <article key={g.id} className="at-good">
                <span className="at-good__k" aria-hidden="true">
                  {g.kanji}
                </span>
                <div className="at-good__body">
                  <h3>{g.name}</h3>
                  <p>{g.hint}.</p>
                  <small>
                    In hand: <b>{held}</b>
                    {g.max && g.max < 99 ? ` of ${g.max}` : ''}
                  </small>
                </div>
                <div className="at-good__buy">
                  <button type="button" className="at-btn" disabled={full || w.balance < g.price} onClick={() => doBuy(g)} aria-label={`Buy a ${g.name} for ${g.price} Doubloons`}>
                    {price(g)}
                  </button>
                  {g.id !== 'anchor' && (
                    <button type="button" className="at-btn at-btn--ghost" disabled={w.balance < g.price * 5} onClick={() => doBuy(g, 5)} aria-label={`Buy five ${g.name} for ${g.price * 5} Doubloons`}>
                      ×5 · {price(g, 5)}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
          <p className="at-note">A fifty-fifty or spyglass helps once: the answer counts, but the card moves only as far as Easy, scores half and isn’t “right first time”. Supplies can’t be used on the daily challenge.</p>
        </div>
      )}

      {shelf === 'ship' && (
        <div className="at-goods at-goods--grid">
          {SHIPS.map((g) => {
            const own = w.owned.has(g.id);
            const on = kit.ship === g.id;
            return (
              <article key={g.id} className={`at-good at-good--ship${on ? ' is-on' : ''}`}>
                <ShipArt id={g.id} className="at-good__art" />
                <div className="at-good__body">
                  <h3>
                    <span aria-hidden="true">{g.kanji}</span> {g.name}
                  </h3>
                  <p>{g.hint}.</p>
                  <small>
                    Hull {g.hull} · voyages pay +{Math.round(g.bonus * 100)}%
                  </small>
                </div>
                <div className="at-good__buy">
                  {on ? (
                    <span className="at-tag">Sailing</span>
                  ) : own ? (
                    <button type="button" className="at-btn at-btn--ghost" onClick={() => setKit({ ship: g.id })}>
                      Sail in it
                    </button>
                  ) : (
                    <button type="button" className="at-btn" disabled={w.balance < g.price} onClick={() => doBuy(g)} aria-label={`Buy the ${g.name} for ${g.price} Doubloons`}>
                      {price(g)}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {shelf === 'chart' && (
        <div className="at-goods at-goods--grid">
          {CHARTS.map((g) => {
            const own = w.owned.has(g.id);
            const on = kit.chart === g.id;
            return (
              <article key={g.id} className={`at-good at-good--chart${on ? ' is-on' : ''}`}>
                <span className="at-swatch" data-chart={g.id} aria-hidden="true">
                  <svg viewBox="0 0 120 60">
                    <path d="M8 14q14-8 28 0t20 14-4 20-30 2-14-16zM70 8q20-4 34 6t6 26-26 10-18-18 4-24z" className="at-swatch__land" />
                    <path d="M78 22q8-4 14 2t-2 12-12-4z" className="at-swatch__lit" />
                  </svg>
                </span>
                <div className="at-good__body">
                  <h3>
                    <span aria-hidden="true">{g.kanji}</span> {g.name}
                  </h3>
                  <p>{g.hint}.</p>
                </div>
                <div className="at-good__buy">
                  {on ? (
                    <span className="at-tag">On the table</span>
                  ) : own ? (
                    <button type="button" className="at-btn at-btn--ghost" onClick={() => setKit({ chart: g.id })}>
                      Use it
                    </button>
                  ) : (
                    <button type="button" className="at-btn" disabled={w.balance < g.price} onClick={() => doBuy(g)} aria-label={`Buy the ${g.name} chart for ${g.price} Doubloons`}>
                      {price(g)}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {shelf === 'title' && (
        <div className="at-goods">
          {TITLES.map((g) => {
            const own = w.owned.has(g.id);
            const on = kit.title === g.id;
            return (
              <article key={g.id} className={`at-good${on ? ' is-on' : ''}`}>
                <span className="at-good__k" aria-hidden="true">
                  {g.kanji}
                </span>
                <div className="at-good__body">
                  <h3>{g.name}</h3>
                  <p>{g.hint}.</p>
                </div>
                <div className="at-good__buy">
                  {on ? (
                    <button type="button" className="at-btn at-btn--ghost" onClick={() => setKit({ title: '' })}>
                      Take it off
                    </button>
                  ) : own ? (
                    <button type="button" className="at-btn at-btn--ghost" onClick={() => setKit({ title: g.id })}>
                      Wear it
                    </button>
                  ) : (
                    <button type="button" className="at-btn" disabled={w.balance < g.price} onClick={() => doBuy(g)} aria-label={`Buy the title ${g.name} for ${g.price} Doubloons`}>
                      {price(g)}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
          <p className="at-note">A title is worn under your rank on the Atlas’s front page and in the passport.</p>
        </div>
      )}

      <section className="at-page" aria-label="Ledger">
        <header>
          <span aria-hidden="true">帳</span>
          <h2>Ledger</h2>
          <p>Where the Doubloons came from, newest first.</p>
        </header>
        {w.grants.length ? (
          <ul className="at-ledger">
            {w.grants.slice(0, 40).map((g) => (
              <li key={g.key}>
                <span>
                  {g.label}
                  <small>{shortDay(g.date)}</small>
                </span>
                <b>+{g.amount.toLocaleString('en-GB')}</b>
              </li>
            ))}
          </ul>
        ) : (
          <p className="at-note">Nothing yet. Every right answer adds to the purse; the daily challenge and quests are the quickest start.</p>
        )}
      </section>
    </div>
  );
}
