/**
 * Atlas 地: every country's flag, place on the map and capital, learnt by playing. This file is
 * the way in: it reads the address and shows the hub, a game, the study map or the passport.
 * Loads in its own chunk; the maps load one by one as they're shown.
 */
import { useMemo } from 'react';
import { navigate, useRoute } from '../../app/router';
import { data } from '../../data/store';
import { isAsk, isDiff, isStyle } from '../../domain/atlas/model';
import { Hub } from './Hub';
import { Learn } from './Learn';
import { Passport } from './Passport';
import { Play, type Mode } from './Play';
import { atlasOf, deckOf } from './store';
import './atlas.css';

const TABS = [
  { id: '', label: 'Play' },
  { id: 'learn', label: 'Learn' },
  { id: 'passport', label: 'Passport' },
];

function modeOf(rest: string[]): Mode | null {
  const marks = atlasOf(data.get()).marks;
  const [a, b, c, d, e] = rest;
  if (a === 'daily') return { kind: 'daily' };
  if (a === 'review') {
    const deck = deckOf(b ?? 'world', marks);
    return deck ? { kind: 'review', deck } : null;
  }
  if (a === 'play' && b && c && d && e && isStyle(b) && isAsk(c) && isDiff(e)) {
    const deck = deckOf(d, marks);
    return deck ? { kind: 'game', style: b, ask: c, deck, diff: e } : null;
  }
  return null;
}

export default function AtlasPage() {
  const route = useRoute();
  const path = route.rest.join('/');
  // the game is fixed by the address; the "weak spots" deck is whatever it was when you started
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mode = useMemo(() => modeOf(route.rest), [path]);
  const tab = route.rest[0] === 'learn' || route.rest[0] === 'passport' ? route.rest[0] : '';
  return (
    <div className="at">
      {mode ? (
        <Play mode={mode} />
      ) : (
        <>
          <header className="at-top">
            <button type="button" className="at-back" onClick={() => navigate('home', ['more'])}>
              ◀ More
            </button>
            <h1 className="at-title">
              <span aria-hidden="true">地</span> Atlas
            </h1>
            <nav className="at-tabs" aria-label="Atlas pages">
              {TABS.map((t) => (
                <button key={t.id} type="button" aria-current={tab === t.id ? 'page' : undefined} onClick={() => navigate('atlas', t.id ? [t.id] : [], { replace: true })}>
                  {t.label}
                </button>
              ))}
            </nav>
          </header>
          {tab === 'learn' ? <Learn /> : tab === 'passport' ? <Passport /> : <Hub />}
        </>
      )}
    </div>
  );
}
