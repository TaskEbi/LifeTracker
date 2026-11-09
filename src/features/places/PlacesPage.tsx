/**
 * 旅 Places, at /places: the map of where you've been, trips with their Album photos
 * (/places/trips), time outside against a weekly goal (/places/outside) and where you want to go
 * next (/places/next), linked to the bucket list.
 */
import { useMemo, type CSSProperties } from 'react';
import { navigate, useRoute } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { useToday } from '../../data/lt';
import { toast } from '../../data/ui';
import { shortDay, weekStart } from '../../domain/log/dates';
import { formatMinutes } from '../../domain/log/duration';
import { countriesBeen, outsideByWeek, outsideStreak, tripDays, type Place } from '../../domain/places/model';
import { H2, Meter, Picks } from '../../ui/i/bits';
import { Photo } from '../album/Photo';
import { useAlbum } from '../album/store';
import { crossOff } from '../bucket/actions';
import { Empty, LifePage } from '../life/Frame';
import { saveOuting, savePlace, setOutsideGoal, usePlaces, type PlacesState } from './store';
import { WorldMap } from './WorldMap';
import './sheets';
import './places.css';

/** One line for Home. */
export function placesLine(s: PlacesState, today: string): string {
  const week = outsideByWeek(s.outings, today, 1)[0].minutes;
  const c = countriesBeen(s.places).length;
  if (!s.places.length && !s.outings.length) return 'Where you’ve been, time outside, where next';
  return `${formatMinutes(week)} outside this week${c ? ` · ${c} ${c === 1 ? 'country' : 'countries'}` : ''}`;
}

export function PlacesPage() {
  const route = useRoute();
  const tab = (['trips', 'outside', 'next'] as const).find((t) => t === route.rest[0]) ?? '';
  const s = usePlaces();
  const today = useToday();
  const want = s.places.filter((p) => p.state === 'Want').length;
  const started = s.places.length > 0 || s.outings.length > 0 || s.trips.length > 0;
  return (
    <LifePage
      id="places"
      line={started ? placesLine(s, today) : undefined}
      tabs={[
        { id: '', label: 'Map' },
        { id: 'trips', label: 'Trips', n: s.trips.length },
        { id: 'outside', label: 'Outside' },
        { id: 'next', label: 'Where next', n: want },
      ]}
      tab={tab}
    >
      {tab === 'trips' ? <TripsTab s={s} today={today} /> : tab === 'outside' ? <OutsideTab s={s} today={today} /> : tab === 'next' ? <NextTab s={s} today={today} /> : <MapTab s={s} today={today} started={started} />}
    </LifePage>
  );
}

function PlaceRow({ p, today }: { p: Place; today: string }) {
  return (
    <button type="button" className="i-row pl-row" onClick={() => openSheet({ type: 'pl-place', editId: p.id })}>
      <span className="i-row__t">
        <b>{p.name}</b>
        <small>{[p.country, p.first ? `first ${shortDay(p.first, today)}` : '', p.note].filter(Boolean).join(' · ')}</small>
      </span>
    </button>
  );
}

function MapTab({ s, today, started }: { s: PlacesState; today: string; started: boolean }) {
  const countries = countriesBeen(s.places);
  const been = useMemo(() => new Set(countries.map((c) => c.country)), [countries]);
  const list = s.places.filter((p) => p.state === 'Been');
  return (
    <>
      <div className="lf-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'pl-place' })}>
          + Been there
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'pl-out' })}>
          + Time outside
        </button>
      </div>
      <WorldMap places={s.places} been={been} />
      <div className="i-meters">
        <Meter value={countries.length} label={countries.length === 1 ? 'Country' : 'Countries'} />
        <Meter value={list.length} label="Places" />
        <Meter value={s.trips.length} label="Trips" />
      </div>
      {!started && (
        <Empty>
          Add the places you’ve been (home counts), and they fill in on the map. Log time outside to see your week, and keep the places you want to go, linked to your bucket list.
        </Empty>
      )}
      {countries.length > 0 && (
        <div className="lf-pills pl-countries" aria-label="Countries you've been to">
          {countries.map((c) => (
            <span key={c.country} className="lf-pill">
              {c.country}
              {c.n > 1 ? ` · ${c.n}` : ''}
            </span>
          ))}
        </div>
      )}
      {list.length > 0 && (
        <>
          <H2 aside={String(list.length)}>Been there</H2>
          <div className="i-pnl i-pnl--flush">
            {list.map((p) => (
              <PlaceRow key={p.id} p={p} today={today} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function TripsTab({ s, today }: { s: PlacesState; today: string }) {
  const album = useAlbum();
  const names = new Map(s.places.map((p) => [p.id, p.name]));
  return (
    <>
      <div className="lf-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'pl-trip' })}>
          + Trip
        </button>
      </div>
      {s.trips.length ? (
        <div className="pl-trips">
          {s.trips.map((t) => {
            const shots = album.shots.filter((x) => x.date >= t.from && x.date <= t.to && x.role === 'memory').sort((a, b) => a.at.localeCompare(b.at));
            const live = t.from <= today && t.to >= today;
            return (
              <article key={t.id} className="i-pnl pl-trip" aria-label={t.title}>
                <button type="button" className="pl-trip__h" onClick={() => openSheet({ type: 'pl-trip', editId: t.id })}>
                  <b>{t.title}</b>
                  <small>
                    {t.from === t.to ? shortDay(t.from, today) : `${shortDay(t.from, today)} – ${shortDay(t.to, today)}`} · {tripDays(t)} {tripDays(t) === 1 ? 'day' : 'days'}
                    {live ? ' · now' : t.from > today ? ' · coming up' : ''}
                  </small>
                </button>
                {t.placeIds.length > 0 && <small className="pl-trip__places">{t.placeIds.map((id) => names.get(id)).filter(Boolean).join(' · ')}</small>}
                {t.note && <p className="pl-trip__note">{t.note}</p>}
                {shots.length > 0 && (
                  <div className="pl-trip__shots" aria-label={`${shots.length} photos from the Album`}>
                    {shots.slice(0, 8).map((x) => (
                      <button key={x.id} type="button" onClick={() => navigate('album')} aria-label={x.caption || `Photo from ${shortDay(x.date, today)}`}>
                        <Photo shot={x} small />
                      </button>
                    ))}
                    {shots.length > 8 && <span className="pl-trip__more">+{shots.length - 8}</span>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="i-note">Log a trip with its dates, and the photos you take for the Album on those days gather under it.</p>
      )}
    </>
  );
}

const GOALS = ['180', '300', '420', '600'];

function OutsideTab({ s, today }: { s: PlacesState; today: string }) {
  const weeks = useMemo(() => outsideByWeek(s.outings, today, 8), [s.outings, today]);
  const week = weeks.at(-1)!.minutes;
  const streak = outsideStreak(s.outings, today);
  const max = Math.max(s.goal, ...weeks.map((w) => w.minutes));
  const todays = s.outings.filter((o) => o.date === today).reduce((a, o) => a + o.minutes, 0);
  return (
    <>
      <div className="lf-acts pl-quick" role="group" aria-label="Log time outside">
        {[15, 30, 60].map((m) => (
          <button key={m} type="button" className="i-btn" onClick={() => (saveOuting({ date: today, minutes: m, what: 'Just outside' }), toast(`${m} minutes outside logged`))}>
            +{m} min
          </button>
        ))}
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'pl-out' })}>
          More…
        </button>
      </div>
      <div className="i-meters">
        <Meter value={formatMinutes(todays)} label="Outside today" />
        <Meter value={formatMinutes(week)} label="This week" />
        <Meter value={streak} label={streak === 1 ? 'Day running' : 'Days running'} />
      </div>
      <div className="i-pnl pl-goal">
        <div className="mn-budget__h">
          <b>This week’s goal</b>
          <span className="i-mono">
            {formatMinutes(week)} / {formatMinutes(s.goal)}
          </span>
        </div>
        <span className="lf-bar" style={{ '--p': `${Math.min(100, (week / s.goal) * 100)}%` } as CSSProperties} role="progressbar" aria-label="Time outside this week" aria-valuenow={Math.round((week / s.goal) * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i />
        </span>
        <small>{week >= s.goal ? 'Goal reached this week.' : `${formatMinutes(s.goal - week)} to go by Sunday.`}</small>
        <Picks label="Weekly goal" value={String(s.goal)} onChange={(v) => setOutsideGoal(Number(v))} options={GOALS.map((g) => ({ id: g, label: `${Number(g) / 60} h` }))} />
      </div>
      <H2 aside="hours a week">Last 8 weeks</H2>
      <div className="i-pnl pl-weeks" aria-label="Time outside per week">
        {weeks.map((w) => (
          <span key={w.monday} className={`pl-weeks__w${w.minutes >= s.goal ? ' is-met' : ''}`} title={`Week of ${shortDay(w.monday)}: ${formatMinutes(w.minutes)}`}>
            <i style={{ height: `${(w.minutes / max) * 100}%` }} />
            <small>{w.minutes ? Math.round(w.minutes / 6) / 10 : ''}</small>
          </span>
        ))}
      </div>
      {s.outings.length > 0 && (
        <>
          <H2>Lately</H2>
          <div className="i-pnl i-pnl--flush">
            {s.outings.slice(0, 12).map((o) => (
              <button key={o.id} type="button" className="i-row pl-row" onClick={() => openSheet({ type: 'pl-out', editId: o.id })}>
                <span className="i-row__t">
                  <b>{o.what || 'Outside'}</b>
                  <small>{shortDay(o.date, today)}{o.date >= weekStart(today) ? ' · this week' : ''}</small>
                </span>
                <span className="i-row__n">{formatMinutes(o.minutes)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function NextTab({ s, today }: { s: PlacesState; today: string }) {
  const want = s.places.filter((p) => p.state === 'Want');
  const beenThere = (p: Place) => {
    savePlace({ ...p, state: 'Been', first: today }, p.id);
    if (p.bucketId) crossOff(p.bucketId);
    else toast(`${p.name}: been there!`);
  };
  return (
    <>
      <div className="lf-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'pl-place', state: 'Want' })}>
          + Somewhere to go
        </button>
      </div>
      {want.length ? (
        <div className="i-pnl i-pnl--flush" aria-label="Where you want to go">
          {want.map((p) => (
            <div key={p.id} className="i-row">
              <button type="button" className="i-row__t" style={{ textAlign: 'left' }} onClick={() => openSheet({ type: 'pl-place', editId: p.id })}>
                <b>{p.name}</b>
                <small>{[p.country, p.bucketId ? 'on the bucket list' : '', p.note].filter(Boolean).join(' · ')}</small>
              </button>
              <button type="button" className="i-btn i-btn--sm" onClick={() => beenThere(p)} aria-label={`Been to ${p.name}`}>
                Been there!
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="i-note">Where do you want to go? Add it here; put it on the bucket list too, and crossing it off happens when you mark it been.</p>
      )}
    </>
  );
}
