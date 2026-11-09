/**
 * 観 Media, at /media: what you're watching, reading, playing and playing on repeat, with one tap
 * for the next episode; the whole shelf (/media/shelf); and the year in media (/media/year).
 */
import { useMemo, useState, type CSSProperties } from 'react';
import { useRoute } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { useToday } from '../../data/lt';
import { shortDay } from '../../domain/log/dates';
import { DOING, MEDIA_TYPES, pickNext, progressLabel, stepOn, TYPE_ICON, UNIT, yearInMedia, type MediaItem, type MediaState, type MediaType } from '../../domain/media/model';
import { H2, Meter } from '../../ui/i/bits';
import { Bars } from '../../ui/i/charts';
import { Empty, LifePage } from '../life/Frame';
import { patchMedia, useMedia } from './store';
import './sheets';
import './media.css';

/** One line for Home. */
export function mediaLine(items: MediaItem[], today: string): string {
  const on = items.filter((m) => m.state === 'On it');
  if (on.length) return `${DOING[on[0].type]} ${on[0].title}${on.length > 1 ? ` + ${on.length - 1} more` : ''}`;
  const y = yearInMedia(items, Number(today.slice(0, 4))).finished;
  return items.length ? `${y} finished this year` : 'Films, shows, anime, manga, music, games';
}

const stars = (n: number | null) => (n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '');

export function MediaPage() {
  const route = useRoute();
  const tab = route.rest[0] === 'shelf' ? 'shelf' : route.rest[0] === 'year' ? 'year' : '';
  const items = useMedia();
  const today = useToday();
  return (
    <LifePage
      id="media"
      line={items.length ? mediaLine(items, today) : undefined}
      tabs={items.length ? [{ id: '', label: 'Now' }, { id: 'shelf', label: 'Shelf', n: items.length }, { id: 'year', label: 'The year' }] : undefined}
      tab={tab}
    >
      {!items.length ? (
        <Empty action="Add something" onAction={() => openSheet({ type: 'md-item' })}>
          Keep what you watch, read, play and listen to: one tap for each new episode or chapter, a rating when you finish, a list of what you want next, and your year in media at the end.
        </Empty>
      ) : tab === 'shelf' ? (
        <Shelf items={items} today={today} />
      ) : tab === 'year' ? (
        <Year items={items} today={today} />
      ) : (
        <Now items={items} today={today} />
      )}
    </LifePage>
  );
}

function Row({ m, today }: { m: MediaItem; today: string }) {
  const p = progressLabel(m);
  return (
    <button type="button" className="i-row md-row" onClick={() => openSheet({ type: 'md-item', editId: m.id })}>
      <span className="lf-row-k" aria-hidden="true">
        {TYPE_ICON[m.type]}
      </span>
      <span className="i-row__t">
        <b>
          {m.title}
          {m.fav ? ' ♥' : ''}
        </b>
        <small>{[m.type, m.by, p, m.state === 'Done' && m.finished ? `finished ${shortDay(m.finished, today)}` : m.state === 'Dropped' ? 'dropped' : ''].filter(Boolean).join(' · ')}</small>
      </span>
      {m.rating != null && <span className="lf-stars" aria-label={`${m.rating} of 5`}>{stars(m.rating)}</span>}
    </button>
  );
}

function Now({ items, today }: { items: MediaItem[]; today: string }) {
  const on = items.filter((m) => m.state === 'On it');
  const want = items.filter((m) => m.state === 'Want');
  const done = items.filter((m) => m.state === 'Done').sort((a, b) => (b.finished ?? '').localeCompare(a.finished ?? '')).slice(0, 5);
  const year = yearInMedia(items, Number(today.slice(0, 4)));
  const [pick, setPick] = useState<MediaItem | null>(null);
  return (
    <>
      <div className="lf-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'md-item' })}>
          + Add
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'md-item', state: 'Want' })}>
          + Want list
        </button>
      </div>
      <div className="i-meters">
        <Meter value={on.length} label="On the go" />
        <Meter value={year.finished} label={`Finished in ${today.slice(0, 4)}`} />
        <Meter value={want.length} label="On the want list" />
      </div>

      <H2>On the go</H2>
      {on.length ? (
        <div className="lf-cards md-now" aria-label="On the go">
          {on.map((m) => {
            const unit = UNIT[m.type];
            return (
              <article key={m.id} className="lf-card md-card">
                <button type="button" className="md-card__t" onClick={() => openSheet({ type: 'md-item', editId: m.id })}>
                  <em>
                    {TYPE_ICON[m.type]} {DOING[m.type]}
                  </em>
                  <b>{m.title}</b>
                  <small>{progressLabel(m) || m.by || m.type}</small>
                </button>
                {m.total != null && m.progress != null && (
                  <span className="lf-bar" style={{ '--p': `${(m.progress / m.total) * 100}%` } as CSSProperties}>
                    <i />
                  </span>
                )}
                <div className="md-card__acts">
                  {unit && (
                    <button type="button" className="i-btn i-btn--sm" onClick={() => patchMedia(m, stepOn(m, today))} aria-label={`${m.title}: ${unit === '%' ? '+10%' : `next ${unit === 'ep' ? 'episode' : 'chapter'}`}`}>
                      {unit === '%' ? '+10%' : `+1 ${unit}`}
                    </button>
                  )}
                  <button
                    type="button"
                    className="i-btn i-btn--sm"
                    aria-label={`${m.title}: finished`}
                    onClick={() => {
                      patchMedia(m, { state: 'Done', finished: today, started: m.started ?? today });
                      openSheet({ type: 'md-item', editId: m.id });
                    }}
                  >
                    Finished
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="i-note">Nothing on the go. Start something from the want list, or add what you’re into.</p>
      )}

      {want.length > 0 && (
        <>
          <H2 aside={<button type="button" className="i-link" onClick={() => setPick(pickNext(want, Math.random()))}>Can’t choose?</button>}>Want list</H2>
          {pick && (
            <div className="lf-nudge md-pick" role="status">
              <span>
                Try <b>{pick.title}</b> ({pick.type.toLowerCase()}).
              </span>
              <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => (patchMedia(pick, { state: 'On it', started: today }), setPick(null))}>
                Start it
              </button>
            </div>
          )}
          <div className="i-pnl i-pnl--flush">
            {want.slice(0, 6).map((m) => (
              <Row key={m.id} m={m} today={today} />
            ))}
          </div>
        </>
      )}

      {done.length > 0 && (
        <>
          <H2>Lately finished</H2>
          <div className="i-pnl i-pnl--flush">
            {done.map((m) => (
              <Row key={m.id} m={m} today={today} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function Shelf({ items, today }: { items: MediaItem[]; today: string }) {
  const [type, setType] = useState<MediaType | ''>('');
  const [state, setState] = useState<MediaState | ''>('');
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items
      .filter((m) => (!type || m.type === type) && (!state || m.state === state) && (!s || m.title.toLowerCase().includes(s) || m.by.toLowerCase().includes(s)))
      .sort((a, b) => (b.finished ?? b.started ?? '').localeCompare(a.finished ?? a.started ?? '') || a.title.localeCompare(b.title));
  }, [items, type, state, q]);
  const types = MEDIA_TYPES.filter((t) => items.some((m) => m.type === t));
  return (
    <>
      <input className="i-input lf-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the shelf" aria-label="Search the shelf" />
      <div className="lf-pills" role="group" aria-label="Type">
        {(['', ...types] as const).map((t) => (
          <button key={t || 'all'} type="button" className="lf-pill" aria-pressed={type === t} onClick={() => setType(t)}>
            {t || 'Everything'}
          </button>
        ))}
      </div>
      <div className="lf-pills md-states" role="group" aria-label="State">
        {(['', 'On it', 'Done', 'Want', 'Dropped'] as const).map((s) => (
          <button key={s || 'any'} type="button" className="lf-pill" aria-pressed={state === s} onClick={() => setState(s)}>
            {s === '' ? 'Any' : s === 'On it' ? 'On the go' : s}
          </button>
        ))}
      </div>
      <div className="i-pnl i-pnl--flush">
        {list.map((m) => (
          <Row key={m.id} m={m} today={today} />
        ))}
        {!list.length && <p className="i-note" style={{ padding: 12 }}>Nothing matches.</p>}
      </div>
    </>
  );
}

function Year({ items, today }: { items: MediaItem[]; today: string }) {
  const thisYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(thisYear);
  const first = items.reduce((y, m) => Math.min(y, Number((m.finished ?? today).slice(0, 4))), thisYear);
  const y = yearInMedia(items, year);
  return (
    <>
      <H2
        aside={
          <span className="hq-yearnav">
            <button type="button" className="i-link" disabled={year <= first} onClick={() => setYear(year - 1)} aria-label="Previous year">
              ◀
            </button>
            {year}
            <button type="button" className="i-link" disabled={year >= thisYear} onClick={() => setYear(year + 1)} aria-label="Next year">
              ▶
            </button>
          </span>
        }
      >
        {year} in media
      </H2>
      <div className="i-meters">
        <Meter value={y.finished} label="Finished" />
        <Meter value={y.avg != null ? y.avg.toFixed(1) : '–'} label="Average rating" />
        <Meter value={y.favs.length} label="New favourites" />
      </div>
      {y.byType.length > 0 && (
        <div className="lf-pills md-types" aria-label="Finished by type">
          {y.byType.map((t) => (
            <span key={t.type} className="lf-pill">
              {TYPE_ICON[t.type]} {t.n} {t.type === 'Anime' || t.type === 'Manga' ? t.type.toLowerCase() : `${t.type.toLowerCase()}${t.n === 1 ? '' : 's'}`}
            </span>
          ))}
        </div>
      )}
      {y.finished > 0 && (
        <div className="i-pnl" style={{ marginTop: 10 }}>
          <Bars values={y.months} labels={['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']} caption={`Finished per month in ${year}`} />
        </div>
      )}
      {y.top.length > 0 && (
        <>
          <H2>Highest rated</H2>
          <div className="i-pnl i-pnl--flush">
            {y.top.map((m) => (
              <Row key={m.id} m={m} today={today} />
            ))}
          </div>
        </>
      )}
      {!y.finished && <p className="i-note">Nothing finished in {year} yet. Ratings and favourites gather here as you go.</p>}
    </>
  );
}
