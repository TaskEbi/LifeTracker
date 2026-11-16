/** Learn: the map and a card for every country, to look around before (or after) being asked. Nothing is saved here. */
import { useEffect, useMemo, useState } from 'react';
import { CONTS, contName, country, deck as deckById, lookalikes, norm, viewOf } from '../../domain/atlas/model';
import { Flag, Pips } from './bits';
import { MapView } from './MapView';
import { useAtlas } from './store';

const KEY = 'lt-atlas-learn';

export function Learn() {
  const atlas = useAtlas();
  const [deckId, setDeckId] = useState(() => {
    try {
      const d = localStorage.getItem(KEY);
      return d && deckById(d) ? d : 'europe';
    } catch {
      return 'europe';
    }
  });
  const d = deckById(deckId)!;
  const [cur, setCur] = useState(d.ids[0]);
  const [find, setFind] = useState('');
  const list = useMemo(() => {
    const q = norm(find);
    return q ? d.ids.filter((id) => norm(country(id).name).includes(q) || norm(country(id).cap).includes(q)) : d.ids;
  }, [d, find]);
  const c = country(d.ids.includes(cur) ? cur : d.ids[0]);
  const at = d.ids.indexOf(c.id);
  const step = (by: number) => setCur(d.ids[(at + by + d.ids.length) % d.ids.length]);
  const pickDeck = (id: string) => {
    setDeckId(id);
    setCur(deckById(id)!.ids[0]);
    setFind('');
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* not remembered */
    }
  };
  // any country can be opened from a card, whichever map is up
  const open = (id: string) => {
    if (!d.ids.includes(id)) pickDeck(country(id).cont);
    setCur(id);
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  });

  const marks = useMemo(() => ({ [c.id]: 'hl' as const }), [c.id]);
  const alike = lookalikes(c.id);
  return (
    <div className="at-learn">
      <div className="at-chips" role="group" aria-label="Map">
        <button type="button" aria-pressed={deckId === 'world'} onClick={() => pickDeck('world')}>
          World
        </button>
        {CONTS.map((k) => (
          <button key={k.id} type="button" aria-pressed={deckId === k.id} onClick={() => pickDeck(k.id)}>
            {k.name}
          </button>
        ))}
      </div>

      <div className="at-learn__stage">
        <MapView view={viewOf(d)} marks={marks} onPick={open} focus={c.id} />
        <article className="at-study" aria-label={c.name}>
          <p className="at-kick">
            {at + 1} of {d.ids.length} · {d.name}
          </p>
          <Flag id={c.id} className="at-study__flag" alt={`Flag of ${c.name}`} />
          <h2>{c.name}</h2>
          <dl>
            <dt>Capital</dt>
            <dd>{c.cap}</dd>
            <dt>Region</dt>
            <dd>
              {c.sub}
              {c.sub !== contName(c.cont) ? `, ${contName(c.cont)}` : ''}
            </dd>
            <dt>You know</dt>
            <dd>
              <Pips id={c.id} marks={atlas.marks} /> <small>flag · place · capital{atlas.stamps.has(c.id) ? ' · stamped' : ''}</small>
            </dd>
          </dl>
          <div className="at-study__rel">
            <p>Nearby</p>
            <div>
              {c.near.map((id) => (
                <button key={id} type="button" onClick={() => open(id)} title={country(id).name} aria-label={country(id).name}>
                  <Flag id={id} alt="" />
                </button>
              ))}
            </div>
          </div>
          {alike.length > 0 && (
            <div className="at-study__rel">
              <p>Often mixed up with</p>
              <div>
                {alike.map((id) => (
                  <button key={id} type="button" onClick={() => open(id)} title={country(id).name} aria-label={country(id).name}>
                    <Flag id={id} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="at-study__nav">
            <button type="button" className="at-btn at-btn--ghost" onClick={() => step(-1)}>
              ← Previous
            </button>
            <button type="button" className="at-btn" onClick={() => step(1)}>
              Next →
            </button>
          </div>
        </article>
      </div>

      <section className="at-roster" aria-label="Countries">
        <div className="at-roster__head">
          <h2 className="at-h">
            {d.name} · {d.ids.length}
          </h2>
          <input type="search" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Find a country or capital" aria-label="Find a country or capital" />
        </div>
        <div className="at-grid">
          {list.map((id) => (
            <button key={id} type="button" className="at-tile" aria-current={id === c.id ? 'true' : undefined} onClick={() => open(id)}>
              <Flag id={id} alt="" />
              <span>
                {country(id).name}
                <small>{country(id).cap}</small>
              </span>
              <Pips id={id} marks={atlas.marks} />
            </button>
          ))}
          {!list.length && <p className="at-note">Nothing in {d.name} matches “{find}”.</p>}
        </div>
      </section>
    </div>
  );
}
