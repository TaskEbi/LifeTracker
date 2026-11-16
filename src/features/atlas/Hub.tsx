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
import { MedalDot, Meter } from './bits';
import { atlasStreak, bestKey, deckOf, medalKey, useAtlas } from './store';

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
  const streak = atlasStreak(atlas, today);
  const day = atlas.days.find((d) => d.date === today);
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
