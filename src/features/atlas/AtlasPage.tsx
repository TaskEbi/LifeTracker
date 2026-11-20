/**
 * Atlas 地: every country's flag, place on the map and capital, learnt by playing. This file is
 * the way in: it reads the address and shows the hub, a game, a voyage, a mini-game, the study
 * map, the Chandlery or the passport. The chart bought at the Chandlery colours every map.
 * Loads in its own chunk; the maps load one by one as they're shown.
 */
import { useMemo } from 'react';
import { navigate, useRoute } from '../../app/router';
import { data } from '../../data/store';
import { isAsk, isDiff, isStyle } from '../../domain/atlas/model';
import { Coin } from './bits';
import { Compass, Fill, Pairs } from './Games';
import { Hub } from './Hub';
import { Learn } from './Learn';
import { Passport } from './Passport';
import { Play, type Mode } from './Play';
import { Shop } from './Shop';
import { atlasOf, deckOf, kitOf, useAtlas, useWallet } from './store';
import { Voyage } from './Voyage';
import './atlas.css';
import './more.css';

const TABS = [
  { id: '', label: 'Play' },
  { id: 'learn', label: 'Learn' },
  { id: 'shop', label: 'Shop' },
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
  const atlas = useAtlas();
  const w = useWallet();
  const chart = kitOf(atlas, w).chart;
  const path = route.rest.join('/');
  // the game is fixed by the address; the "weak spots" deck is whatever it was when you started
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mode = useMemo(() => modeOf(route.rest), [path]);
  const [first, second] = route.rest;
  const tab = first === 'learn' || first === 'passport' || first === 'shop' ? first : '';
  const screen =
    mode ? <Play mode={mode} /> : first === 'voyage' ? <Voyage key={second ?? ''} id={second ?? null} /> : first === 'fill' ? <Fill /> : first === 'pairs' ? <Pairs /> : first === 'compass' ? <Compass /> : null;
  return (
    <div className="at" data-chart={chart}>
      {screen ?? (
        <>
          <header className="at-top">
            <button type="button" className="at-back" onClick={() => navigate('home', ['more'])}>
              ◀ More
            </button>
            <h1 className="at-title">
              <span aria-hidden="true">地</span> Atlas
            </h1>
            <div className="at-top__right">
              <button type="button" className="at-purse" onClick={() => navigate('atlas', ['shop'])} aria-label={`Purse: ${w.balance} Doubloons. Open the shop`}>
                <Coin n={w.balance} />
              </button>
              <nav className="at-tabs" aria-label="Atlas pages">
                {TABS.map((t) => (
                  <button key={t.id} type="button" aria-current={tab === t.id ? 'page' : undefined} onClick={() => navigate('atlas', t.id ? [t.id] : [], { replace: true })}>
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>
          </header>
          {tab === 'learn' ? <Learn /> : tab === 'passport' ? <Passport /> : tab === 'shop' ? <Shop /> : <Hub />}
        </>
      )}
    </div>
  );
}
