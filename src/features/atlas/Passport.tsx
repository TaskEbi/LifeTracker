/** The passport: a stamp for every country mastered, the ranks, the medals won in rounds, and the best sprint and survival scores. */
import { useMemo } from 'react';
import { useToday } from '../../data/lt';
import { CONTS, COUNTRIES, country, deck as deckById, DECKS, diff as diffInfo, QTYPES, rankOf, RANKS, STYLES, tally } from '../../domain/atlas/model';
import { CONT_PRIZE, payTotal, STAMP_COINS } from '../../domain/atlas/pay';
import { shortDay } from '../../domain/log/dates';
import { Flag, MedalDot, Pips } from './bits';
import { atlasStreak, medalKey, useAtlas } from './store';

const ASKS = [...QTYPES.map((q) => ({ id: q.id as string, name: q.name })), { id: 'mix', name: 'Mixed' }];
/** A stamp sits a little crooked, the same way every time. */
const tilt = (id: string) => ((id.charCodeAt(0) * 7 + id.charCodeAt(1) * 13) % 13) - 6;

export function Passport() {
  const today = useToday();
  const atlas = useAtlas();
  const stamps = atlas.stamps.size;
  const { i: rankAt } = rankOf(stamps);
  const paid = useMemo(() => payTotal(atlas.rows), [atlas.rows]);
  const answers = atlas.days.reduce((n, d) => n + d.n, 0);
  const right = atlas.days.reduce((n, d) => n + d.ok, 0);
  const medalDecks = DECKS.filter((d) => d.group !== 'sub' || ASKS.some((a) => atlas.medals.has(medalKey(d.id, a.id))));
  const bests = [...atlas.bests.values()].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="at-pass">
      <section className="at-ranks" aria-label="Ranks">
        <ol>
          {RANKS.map((r, i) => (
            <li key={r.name} className={i < rankAt ? 'is-past' : i === rankAt ? 'is-now' : undefined} aria-current={i === rankAt ? 'step' : undefined}>
              <span aria-hidden="true">{r.kanji}</span>
              <b>{r.name}</b>
              <small>{r.at}</small>
            </li>
          ))}
        </ol>
      </section>

      <dl className="at-stats">
        <div>
          <dt>Stamps</dt>
          <dd>
            {stamps}
            <small>/195</small>
          </dd>
        </div>
        <div>
          <dt>Answers</dt>
          <dd>{answers.toLocaleString('en-GB')}</dd>
        </div>
        <div>
          <dt>Accuracy</dt>
          <dd>
            {answers ? Math.round((right / answers) * 100) : 0}
            <small>%</small>
          </dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd>
            {atlasStreak(atlas, today)}
            <small>d</small>
          </dd>
        </div>
      </dl>
      <p className="at-pay">
        <span aria-hidden="true">両</span>
        <b>{paid.coins.toLocaleString('en-GB')} Ryō</b>
        {paid.gems > 0 && <b>{paid.gems} Tama</b>}
        <small>
          earned for the Hangar so far. A stamp pays {STAMP_COINS} Ryō; a whole continent {CONT_PRIZE.coins} Ryō, {CONT_PRIZE.gems} Tama and a gold chest.
        </small>
      </p>

      {CONTS.map((k, at) => {
        const ids = COUNTRIES.filter((c) => c.cont === k.id).map((c) => c.id);
        const t = tally(ids, atlas.marks);
        const got = ids.filter((id) => atlas.stamps.has(id)).length;
        return (
          <details key={k.id} className="at-page" open={got > 0 || (!stamps && at === 0)}>
            <summary>
            <header>
              <span aria-hidden="true">{k.kanji}</span>
              <h2>{k.name}</h2>
              <p>
                {got} of {ids.length} stamped · flags {t.known.flag} · places {t.known.map} · capitals {t.known.cap}
              </p>
            </header>
            </summary>
            <div className="at-stamps">
              {ids.map((id) => {
                const on = atlas.stamps.get(id);
                return (
                  <div key={id} className={`at-stampcell${on ? ' is-on' : ''}`}>
                    <span className={`at-stamp${on ? ' is-on' : ''}`} style={on ? { transform: `rotate(${tilt(id)}deg)` } : undefined}>
                      <Flag id={id} alt="" />
                    </span>
                    <b>{country(id).name}</b>
                    {on ? <small>{shortDay(on)}</small> : <Pips id={id} marks={atlas.marks} />}
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}

      <section className="at-page" aria-label="Medals">
        <header>
          <span aria-hidden="true">章</span>
          <h2>Medals</h2>
          <p>Win a round with nine in ten right first time: bronze on Normal, silver on Hard, gold on Expert. A star means not one miss.</p>
        </header>
        <div className="at-medals" role="table" aria-label="Medals by deck and kind of question">
          <div className="at-medals__row at-medals__row--head" role="row">
            <span role="columnheader">Deck</span>
            {ASKS.map((a) => (
              <span key={a.id} role="columnheader" title={a.name}>
                {a.name.replace(' → ', '→').replace('Find on the map', 'Find').replace('find on the map', 'find').replace('country', 'name').replace('Country', 'Name').replace('Outline', 'Shape').replace('capital', 'cap.').replace('Capital', 'Cap.')}
              </span>
            ))}
          </div>
          {medalDecks.map((d) => (
            <div key={d.id} className="at-medals__row" role="row">
              <b role="rowheader">{d.name}</b>
              {ASKS.map((a) => {
                const m = atlas.medals.get(medalKey(d.id, a.id));
                return (
                  <span key={a.id} role="cell">
                    <MedalDot tier={m?.tier ?? 0} flawless={m?.flawless} />
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="at-page" aria-label="Best scores">
        <header>
          <span aria-hidden="true">録</span>
          <h2>Best scores</h2>
          <p>Sprint counts points in a minute; survival counts right answers on three lives.</p>
        </header>
        {bests.length ? (
          <ul className="at-bests">
            {bests.map((b) => (
              <li key={`${b.style}|${b.deck}|${b.type}|${b.diff}`}>
                <b>{b.score}</b>
                <span>
                  {STYLES.find((s) => s.id === b.style)?.name ?? b.style} · {deckById(b.deck)?.name ?? b.deck}
                  <small>
                    {ASKS.find((a) => a.id === b.type)?.name ?? b.type} · {diffInfo(b.diff).name} · {shortDay(b.date)}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="at-note">No sprint or survival played yet.</p>
        )}
      </section>
    </div>
  );
}
