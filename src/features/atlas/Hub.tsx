/** The Atlas hub: where you stand, today's two things (the daily challenge and the review), and a game to set up. */
import { useMemo, useState } from 'react';
import { navigate } from '../../app/router';
import { useToday } from '../../data/lt';
import {
  askable,
  CONTS,
  COUNTRIES,
  DAILY_N,
  deck as deckById,
  DECKS,
  DIFFS,
  dueCount,
  isAsk,
  isDiff,
  isStyle,
  MEDALS,
  QTYPES,
  rankOf,
  reviewPlan,
  SKILLS,
  STREAK_OK,
  STYLES,
  subDecks,
  tally,
  weakIds,
  type Ask,
  type Diff,
  type Style,
} from '../../domain/atlas/model';
import { GAMES, gamePay } from '../../domain/atlas/games';
import { QUEST_SET_PAY, questsFor } from '../../domain/atlas/quests';
import { ship as shipOf, TITLES } from '../../domain/atlas/shop';
import { voyageOver, VOYAGES_A_DAY } from '../../domain/atlas/voyage';
import { tallyOf } from '../../domain/atlas/wallet';
import { MedalDot, Meter, ShipArt } from './bits';
import { bestKey, deckOf, kitOf, medalKey, useAtlas, useWallet } from './store';

interface Setup {
  style: Style;
  ask: Ask;
  deck: string;
  diff: Diff;
}
const KEY = 'lt-atlas-setup';
const FIRST: Setup = { style: 'round', ask: 'flag-name', deck: 'europe', diff: 'normal' };

function readSetup(): Setup {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Setup> | null;
    if (s && isStyle(String(s.style)) && isAsk(String(s.ask)) && isDiff(String(s.diff)) && (s.deck === 'weak' || deckById(String(s.deck)))) return s as Setup;
  } catch {
    /* a private window: start from the default */
  }
  return FIRST;
}

const ALL = COUNTRIES.map((c) => c.id);

export function Hub() {
  const today = useToday();
  const atlas = useAtlas();
  const [setup, setSetup] = useState(readSetup);
  const change = (patch: Partial<Setup>) => {
    const next = { ...setup, ...patch };
    setSetup(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* not remembered, still works */
    }
  };

  const all = useMemo(() => tally(ALL, atlas.marks), [atlas.marks]);
  const stamps = atlas.stamps.size;
  const { rank, next } = rankOf(stamps);
  const w = useWallet();
  const kit = kitOf(atlas, w);
  const title = TITLES.find((t) => t.id === kit.title);
  const streak = w.streak.streak;
  const day = atlas.days.find((d) => d.date === today);
  const quests = questsFor(today);
  const todayTally = tallyOf(day);
  const questsDone = quests.filter((q) => q.of(todayTally) >= q.target).length;
  const voyagesToday = atlas.voyages.filter((v) => v.date === today).length;
  const underWay = atlas.voyages.find((v) => !voyageOver(v));
  const due = dueCount(atlas.marks, today);
  const plan = useMemo(() => reviewPlan(ALL, atlas.marks, today, () => 0.5), [atlas.marks, today]);
  const weak = useMemo(() => weakIds(atlas.marks), [atlas.marks]);

  const picked = deckOf(setup.deck, atlas.marks) ?? deckById('world')!;
  const cont = picked.cont ?? null;
  const n = askable(picked.ids, setup.ask).length;
  const medal = atlas.medals.get(medalKey(picked.id, setup.ask));
  const best = setup.style === 'round' ? null : atlas.bests.get(bestKey(setup.style, picked.id, setup.ask, setup.diff));
  const style = STYLES.find((s) => s.id === setup.style)!;
  const level = DIFFS.find((d) => d.id === setup.diff)!;

  return (
    <div className="at-hub">
      <section className="at-hero" aria-label="Where you stand">
        <div className="at-rank">
          <span className="at-rank__k" aria-hidden="true">
            {rank.kanji}
          </span>
          <div>
            <p className="at-kick">Rank</p>
            <h2>{rank.name}</h2>
            {title && <p className="at-worn">“{title.name}”</p>}
            <p className="at-rank__next">{next ? `${next.at - stamps} more ${next.at - stamps === 1 ? 'stamp' : 'stamps'} to ${next.name}` : 'Every country stamped'}</p>
          </div>
        </div>
        <Meter value={stamps} max={next ? next.at : 195} label="Stamps towards the next rank" />
        <dl className="at-nums">
          <div>
            <dt>Stamps</dt>
            <dd>
              {stamps}
              <small>/195</small>
            </dd>
          </div>
          <div>
            <dt>Streak</dt>
            <dd>
              {streak}
              <small>{streak === 1 ? ' day' : ' days'}</small>
              {w.stock.anchor > 0 && (
                <i className="at-anchor" title={`${w.stock.anchor} streak ${w.stock.anchor === 1 ? 'anchor' : 'anchors'} held`} aria-label={`${w.stock.anchor} streak anchors held`}>
                  錨{w.stock.anchor > 1 ? w.stock.anchor : ''}
                </i>
              )}
            </dd>
          </div>
          <div>
            <dt>Points</dt>
            <dd>{atlas.miles.toLocaleString('en-GB')}</dd>
          </div>
        </dl>
        <ul className="at-skills">
          {SKILLS.map((s) => (
            <li key={s.id}>
              <span aria-hidden="true">{s.kanji}</span>
              <b>{s.name}</b>
              <Meter value={all.known[s.id]} max={195} label={`${s.name} known`} />
              <em>{all.known[s.id]}</em>
            </li>
          ))}
        </ul>
        <p className="at-hero__note">
          {day && day.ok >= STREAK_OK ? `${day.ok} right today. The streak is safe.` : `${STREAK_OK} right answers in a day keep the streak${day?.ok ? ` (${day.ok} so far)` : ''}.`} A country is stamped when you know its flag, place and capital.
        </p>
      </section>

      <section className="at-today" aria-label="Today">
        <button type="button" className={`at-tcard${day?.daily ? ' is-done' : ''}`} onClick={() => navigate('atlas', ['daily'])}>
          <span className="at-tcard__k" aria-hidden="true">
            日
          </span>
          <b>Daily challenge</b>
          <small>{day?.daily ? `Done: ${day.daily.ok} of ${day.daily.n} · ${day.daily.pts} points. Play again for practice` : `${DAILY_N} questions on the whole world, getting harder. Pays 40 Ryō`}</small>
        </button>
        <button type="button" className="at-tcard" onClick={() => navigate('atlas', ['review'])}>
          <span className="at-tcard__k" aria-hidden="true">
            復
          </span>
          <b>Review</b>
          <small>{due ? `${due} ${due === 1 ? 'card' : 'cards'} due${plan.fresh ? ` · ${plan.fresh} countries not met yet` : ''}` : plan.fresh ? `Nothing due · meet ${Math.min(4, plan.fresh)} new countries` : 'Nothing due today'}</small>
        </button>
        <section className="at-quests" aria-label="Today’s quests">
          <header>
            <h2 className="at-h">Quests</h2>
            <small>
              {questsDone}/3 · all three +{QUEST_SET_PAY}
            </small>
          </header>
          <ul>
            {quests.map((q) => {
              const got = Math.min(q.of(todayTally), q.target);
              const done = got >= q.target;
              return (
                <li key={q.id} className={done ? 'is-done' : undefined}>
                  <span className="at-quests__k" aria-hidden="true">
                    {done ? '✓' : q.kanji}
                  </span>
                  <span className="at-quests__t">
                    {q.text}
                    <Meter value={got} max={q.target} label={q.text} />
                  </span>
                  <b>
                    <i aria-hidden="true">金</i>
                    {q.pay}
                  </b>
                </li>
              );
            })}
          </ul>
        </section>
      </section>

      <section className="at-more" aria-label="More ways to play">
        <h2 className="at-h">More ways to play</h2>
        <div className="at-ways">
          <button type="button" className="at-way at-way--voyage" onClick={() => navigate('atlas', underWay ? ['voyage', underWay.id] : ['voyage'])}>
            <ShipArt id={kit.ship} className="at-way__ship" />
            <b>
              <span aria-hidden="true">航</span> Voyages
            </b>
            <small>{underWay ? `Under way: port ${underWay.i + 1} of ${underWay.legs}. Sail on` : `Sail the ${shipOf(kit.ship).name.toLowerCase()} port to port, a question at each. ${Math.max(0, VOYAGES_A_DAY - voyagesToday)} paying today`}</small>
          </button>
          {GAMES.map((g) => {
            const rec = day?.games[g.id];
            return (
              <button key={g.id} type="button" className="at-way" onClick={() => navigate('atlas', [g.id])}>
                <span className="at-way__k" aria-hidden="true">
                  {g.kanji}
                </span>
                <b>{g.name}</b>
                <small>{rec ? `Best today ${rec.best} · paid ${gamePay(g.id, rec)}` : g.hint}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="at-build" aria-label="Set up a game">
        <h2 className="at-h">Set up a game</h2>

        <div className="at-field">
          <p className="at-lab">How</p>
          <div className="at-seg" role="group" aria-label="Kind of game">
            {STYLES.map((s) => (
              <button key={s.id} type="button" aria-pressed={setup.style === s.id} onClick={() => change({ style: s.id })}>
                <span aria-hidden="true">{s.kanji}</span> {s.name}
              </button>
            ))}
          </div>
          <p className="at-hint">{style.hint}.</p>
        </div>

        <div className="at-field">
          <p className="at-lab">What</p>
          <div className="at-chips" role="group" aria-label="Kind of question">
            {QTYPES.map((q) => (
              <button key={q.id} type="button" aria-pressed={setup.ask === q.id} onClick={() => change({ ask: q.id })}>
                {q.name}
              </button>
            ))}
            <button type="button" aria-pressed={setup.ask === 'mix'} onClick={() => change({ ask: 'mix' })}>
              Mixed: all of them
            </button>
          </div>
        </div>

        <div className="at-field">
          <p className="at-lab">Where</p>
          <div className="at-decks" role="group" aria-label="Deck">
            {DECKS.filter((d) => d.group === 'world' || d.group === 'cont').map((d) => {
              const t = tally(d.ids, atlas.marks);
              const on = picked.id === d.id || (d.cont != null && cont === d.cont);
              return (
                <button key={d.id} type="button" className="at-deck" aria-pressed={on} onClick={() => change({ deck: d.id })}>
                  <span className="at-deck__k" aria-hidden="true">
                    {d.cont ? CONTS.find((c) => c.id === d.cont)!.kanji : '世'}
                  </span>
                  <b>{d.name}</b>
                  <small>
                    {t.mastered}/{d.ids.length}
                  </small>
                  <Meter value={t.mastered} max={d.ids.length} label={`${d.name} mastered`} />
                </button>
              );
            })}
          </div>
          {cont && subDecks(cont).length > 0 && (
            <div className="at-chips at-chips--sub" role="group" aria-label="Region">
              <button type="button" aria-pressed={picked.id === cont} onClick={() => change({ deck: cont })}>
                All {deckById(cont)!.ids.length}
              </button>
              {subDecks(cont).map((d) => (
                <button key={d.id} type="button" aria-pressed={picked.id === d.id} onClick={() => change({ deck: d.id })}>
                  {d.name} <small>{d.ids.length}</small>
                </button>
              ))}
            </div>
          )}
          <div className="at-chips at-chips--sub" role="group" aria-label="Special decks">
            {DECKS.filter((d) => d.group === 'special').map((d) => (
              <button key={d.id} type="button" aria-pressed={picked.id === d.id} onClick={() => change({ deck: d.id })} title={d.hint}>
                {d.name} <small>{d.ids.length}</small>
              </button>
            ))}
            <button type="button" aria-pressed={picked.id === 'weak'} disabled={!weak.length} onClick={() => change({ deck: 'weak' })} title="The countries you missed last time">
              Weak spots <small>{weak.length}</small>
            </button>
          </div>
          {picked.hint && <p className="at-hint">{picked.hint}.</p>}
        </div>

        <div className="at-field">
          <p className="at-lab">How hard</p>
          <div className="at-seg at-seg--4" role="group" aria-label="Difficulty">
            {DIFFS.map((d) => (
              <button key={d.id} type="button" aria-pressed={setup.diff === d.id} onClick={() => change({ diff: d.id })}>
                <span aria-hidden="true">{d.kanji}</span> {d.name}
              </button>
            ))}
          </div>
          <p className="at-hint">
            {level.hint}. Points ×{level.mult}.
          </p>
        </div>

        <div className="at-go">
          <p>
            <b>
              {n} {n === 1 ? 'country' : 'countries'}
            </b>{' '}
            · {picked.name}
            {setup.style === 'round' && picked.id !== 'weak' && (
              <span className="at-go__held">
                <MedalDot tier={medal?.tier ?? 0} flawless={medal?.flawless} />
                {medal ? `${MEDALS[medal.tier]} held` : 'No medal yet'}
              </span>
            )}
            {best && <span className="at-go__held">Best: {best.score}</span>}
          </p>
          <button type="button" className="at-btn at-btn--big" disabled={!n} onClick={() => navigate('atlas', ['play', setup.style, setup.ask, picked.id, setup.diff])}>
            Start
          </button>
        </div>
      </section>
    </div>
  );
}
