/**
 * The run window: the best hours to run in the next day and a half, from Open-Meteo's forecast and
 * your calendar. Your place is only sent to Open-Meteo, and only after you choose one.
 */
import { useEffect, useMemo, useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet } from '../../app/sheets';
import { ltToday, prefValue, setPref, useSleepSchedule, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { occurrences } from '../../domain/calendar/occurrences';
import { parseForecast, runWindows, type HourForecast } from '../../domain/hq/runWindow';
import { addDays, relativeDay } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { H2, Source } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';

interface Place {
  name: string;
  lat: number;
  lon: number;
}
const isPlace = (v: unknown): v is Place => !!v && typeof (v as Place).lat === 'number' && typeof (v as Place).lon === 'number' && typeof (v as Place).name === 'string';

function PlaceSheet() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const choose = (p: Place) => {
    setPref('run_place', p);
    closeSheet();
  };
  const search = async () => {
    setStatus('Searching…');
    setResults([]);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error();
      const j = (await res.json()) as { results?: { name: string; admin1?: string; country?: string; latitude: number; longitude: number }[] };
      const list = (j.results ?? []).map((r) => ({ name: [r.name, r.admin1, r.country].filter(Boolean).join(', '), lat: r.latitude, lon: r.longitude }));
      setResults(list);
      setStatus(list.length ? null : 'Nowhere by that name.');
    } catch {
      setStatus('Couldn’t reach the place search. Try again in a moment.');
    }
  };
  const locate = () => {
    if (!navigator.geolocation) return setStatus('This browser can’t share its location.');
    setStatus('Finding you…');
    navigator.geolocation.getCurrentPosition(
      (p) => choose({ name: 'My location', lat: Math.round(p.coords.latitude * 100) / 100, lon: Math.round(p.coords.longitude * 100) / 100 }),
      () => setStatus('Location wasn’t allowed. Search for your city instead.'),
      { timeout: 10000 },
    );
  };
  return (
    <Sheet title="Where do you run?" onClose={closeSheet} accent="sports">
      <form
        className="s-place"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) void search();
        }}
      >
        <input data-autofocus className="i-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Your city" aria-label="Your city" />
        <button type="submit" className="i-btn" disabled={!q.trim()}>
          Search
        </button>
      </form>
      <button type="button" className="i-btn i-btn--block" onClick={locate}>
        Use my location
      </button>
      {status && <p className="i-note" role="status">{status}</p>}
      {results.length > 0 && (
        <div className="i-pnl i-pnl--flush">
          {results.map((p) => (
            <button key={`${p.lat},${p.lon}`} type="button" className="i-row" onClick={() => choose(p)}>
              <span className="i-row__t">
                <b>{p.name}</b>
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="i-note">Only the place is sent, to Open-Meteo, a free weather service. It’s rounded when it comes from your location.</p>
    </Sheet>
  );
}
registerSheet('run-place', PlaceSheet);

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ok'; hours: HourForecast[]; now: string };

export function RunWindowPanel({ minutes }: { minutes: number }) {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const schedule = useSleepSchedule();
  const raw = prefValue(st, 'run_place');
  const place = isPlace(raw) ? raw : null;
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!place) return;
    let live = true;
    setLoad({ status: 'loading' });
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&hourly=apparent_temperature,precipitation_probability,wind_speed_10m,is_day&forecast_days=3&timezone=auto`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((j: { current_weather?: unknown; utc_offset_seconds?: number }) => {
        if (!live) return;
        const offset = typeof j.utc_offset_seconds === 'number' ? j.utc_offset_seconds : 0;
        const now = new Date(Date.now() + offset * 1000).toISOString().slice(0, 16);
        setLoad({ status: 'ok', hours: parseForecast(j as Parameters<typeof parseForecast>[0]), now });
      })
      .catch(() => live && setLoad({ status: 'error' }));
    return () => {
      live = false;
    };
  }, [place?.lat, place?.lon, attempt]);
  const windows = useMemo(() => {
    if (load.status !== 'ok') return [];
    const from = ltToday();
    const busy = occurrences(st.lt_events.values(), from, addDays(from, 2)).filter((o) => !o.cancelled && o.start).map((o) => ({ date: o.date, start: o.start!, end: o.end }));
    const end = load.hours.filter((h) => h.time <= `${addDays(today, 1)}T23:59`);
    return runWindows(end, minutes, load.now, busy, { from: schedule.weekday.wake, to: '21:30' });
  }, [load, st.lt_events, minutes, schedule, today]);

  return (
    <>
      <H2 aside={place ? <button type="button" className="i-link" onClick={() => openSheet({ type: 'run-place' })}>{place.name.split(',')[0]}</button> : undefined}>Run window</H2>
      {!place ? (
        <div className="i-pnl i-stack">
          <p className="i-note">Find the coolest, driest gap for a {minutes}-minute run around your calendar, from a real forecast.</p>
          <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'run-place' })}>
            Choose your city
          </button>
        </div>
      ) : load.status === 'loading' ? (
        <p className="i-note" role="status">Checking the forecast for {place.name}…</p>
      ) : load.status === 'error' ? (
        <div className="i-pnl i-stack">
          <p className="i-error" role="alert">Couldn’t reach the forecast. No windows are shown until it loads.</p>
          <button type="button" className="i-btn i-btn--sm" onClick={() => setAttempt(attempt + 1)}>
            Try again
          </button>
        </div>
      ) : windows.length ? (
        <>
          <div className="i-pnl i-pnl--flush">
            {windows.map((w, i) => (
              <button key={w.date + w.start} type="button" className="i-row" onClick={() => openSheet({ type: 'event', preset: { title: 'Run', section: 'sports', kind: 'session', date: w.date, start: w.start, end: w.end } })} aria-label={`Block ${relativeDay(w.date, today)} ${w.start} in the calendar`}>
                <span className="i-row__t">
                  <b>
                    {relativeDay(w.date, today)} {w.start}–{w.end}
                    {i === 0 ? ' ★' : ''}
                  </b>
                  <small>{w.why.join(' · ')}</small>
                </span>
                <span className="i-row__n">{w.score}</span>
              </button>
            ))}
          </div>
          <Source kind="live">Forecast from Open-Meteo for {place.name}, around your calendar. Tap one to block it.</Source>
        </>
      ) : (
        <p className="i-note">No free {minutes}-minute gap between waking and 21:30 today or tomorrow.</p>
      )}
    </>
  );
}
