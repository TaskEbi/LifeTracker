import { useMemo, useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { ltToday, sectionEntries, setTargets, useTargets, useToday, withReward } from '../../data/lt';
import { deleteSession, saveSession } from '../../data/sessions';
import { data } from '../../data/store';
import { occurrences } from '../../domain/calendar/occurrences';
import { addDays, shortDay, weekStart } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { accent, Chips, H2, Meter, Picks, Source, Stepper } from '../../ui/i/bits';
import { Bars } from '../../ui/i/charts';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { DayPick, MinutesField } from '../../ui/i/fields';
import { Icon } from '../../ui/i/Icon';
import { RelatedTasks } from '../../ui/i/RelatedTasks';
import { Sheet } from '../../ui/i/Sheet';
import { bests, isSportDetail, paceOf, SPORTS, sportInfo, type SportDetail, type SportId, type SportSession } from './model';
import { SportsArt } from './Art';
import './theme.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function SportSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const editId = (spec.editId as string | undefined) ?? null;
  const prev = editId ? sectionEntries<SportDetail>(data.get(), 'sports').find((s) => s.entry.id === editId) : undefined;
  const pd = prev && isSportDetail(prev.detail) ? prev.detail : null;
  const [sport, setSport] = useState<SportId>(pd?.sport ?? (spec.sport as SportId) ?? 'running');
  const [date, setDate] = useState(prev?.entry.date ?? today);
  const [minutes, setMinutes] = useState(prev?.entry.minutes ?? (sportInfo(sport)?.kind === 'court' ? 90 : 40));
  const [km, setKm] = useState(pd?.km ?? (sport === 'swimming' ? 1.5 : sport === 'cycling' ? 20 : 7));
  const [type, setType] = useState<'training' | 'match'>(pd?.type ?? 'training');
  const [score, setScore] = useState(pd?.score ?? '');
  const [route, setRoute] = useState(pd?.route ?? '');
  const [note, setNote] = useState(prev?.entry.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const info = sportInfo(sport)!;
  const distance = info.kind === 'distance';
  const step = sport === 'swimming' ? 0.05 : sport === 'cycling' ? 1 : 0.1;

  const changeSport = (s: SportId) => {
    setSport(s);
    if (!prev) {
      setKm(s === 'swimming' ? 1.5 : s === 'cycling' ? 20 : 7);
      setMinutes(sportInfo(s)!.kind === 'court' ? 90 : 40);
    }
  };
  const save = () => {
    const detail: SportDetail = distance ? { sport, km: Math.round(km * 100) / 100, ...(route.trim() ? { route: route.trim().slice(0, 80) } : {}) } : { sport, type, ...(type === 'match' && score.trim() ? { score: score.trim().slice(0, 60) } : {}) };
    let err: string | null = null;
    withReward(() => {
      const r = saveSession({ section: 'sports', date, minutes, note, subcategory: info.name, detail: detail as unknown as Record<string, unknown> }, editId);
      if ('error' in r) err = r.error;
      return !('error' in r);
    });
    if (err) setError(err);
    else closeSheet();
  };
  return (
    <Sheet
      title={prev ? 'Edit session' : 'CH03 · log sport'}
      onClose={closeSheet}
      accent="sports"
      footer={
        <>
          {prev && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteSession(prev.entry.id), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <Picks label="Sport" value={sport} onChange={changeSport} options={SPORTS.map((s) => ({ id: s.id, label: s.name }))} />
      <MinutesField value={minutes} onChange={setMinutes} presets={distance ? [20, 30, 45, 60, 90] : [60, 75, 90, 120]} />
      {distance ? (
        <>
          <div className="i-kv">
            <span>Distance</span>
            <span className="i-btns" style={{ alignItems: 'center' }}>
              <Stepper value={`${km.toFixed(sport === 'swimming' ? 2 : 1)} km`} label="distance" onStep={(s) => setKm(Math.max(step, Math.round((km + step * s) * 100) / 100))} />
              <input className="i-input" inputMode="decimal" value={km} onChange={(e) => setKm(Math.max(0, Number(e.target.value.replace(',', '.')) || 0))} aria-label="Distance in km" style={{ width: 80 }} />
            </span>
          </div>
          <div className="i-kv">
            <span>{sport === 'cycling' ? 'Speed' : 'Pace'} · worked out</span>
            <b className="i-mono" style={{ color: 'var(--c-sports)' }}>
              {paceOf(sport, minutes, km) ?? '—'}
            </b>
          </div>
          <input className="i-input" value={route} onChange={(e) => setRoute(e.target.value)} placeholder="Route · optional" aria-label="Route" maxLength={80} />
        </>
      ) : (
        <>
          <Picks label="Type" value={type} onChange={setType} options={[{ id: 'training', label: 'Training' }, { id: 'match', label: 'Match' }]} />
          {type === 'match' && <input className="i-input" value={score} onChange={(e) => setScore(e.target.value)} placeholder="Score · optional (e.g. 6–4, 3–6, 10–7)" aria-label="Score" maxLength={60} />}
        </>
      )}
      <DayPick value={date} onChange={setDate} today={today} />
      <textarea className="i-textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder={distance ? 'How it felt · optional' : 'Skill notes · optional (serve receive, backhand…)'} aria-label="Notes" />
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}
registerSheet('sports', SportSheet);

export function SportsChannel() {
  const today = useToday();
  const targets = useTargets();
  const st = useStore(data, (s) => s);
  const sessions = useMemo(() => sectionEntries<SportDetail>(st, 'sports'), [st]);
  const [sport, setSport] = useState<SportId | 'all'>('all');
  const shown = sessions.filter((s) => sport === 'all' || (isSportDetail(s.detail) && s.detail.sport === sport));
  const monday = weekStart(today);
  const weekCount = sessions.filter((s) => s.entry.date >= monday && s.entry.date <= today).length;
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(monday, -7 * (7 - i)));
  const perWeek = weeks.map((w) => shown.filter((s) => s.entry.date >= w && s.entry.date <= addDays(w, 6)).reduce((a, s) => a + s.entry.minutes, 0));
  const pbs = bests(sessions).filter((b) => sport === 'all' || b.sport === sport);
  const schedule = useMemo(() => {
    const seen = new Map<string, ReturnType<typeof occurrences>[number]>();
    for (const o of occurrences(st.lt_events.values(), today, addDays(today, 42))) if (o.event.section === 'sports' && o.event.repeat && !seen.has(o.event.id)) seen.set(o.event.id, o);
    return [...seen.values()];
  }, [st.lt_events, today]);

  return (
    <div style={accent('sports')}>
      <ChannelHead id="sports" art={<SportsArt />} />
      <Chips label="Sport" value={sport} onChange={setSport} options={[{ id: 'all' as const, label: 'All' }, ...SPORTS.map((s) => ({ id: s.id, label: s.name }))]} />
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'sports', sport: sport === 'all' ? 'running' : sport })}>
        <Icon name="plus" /> Log {sport === 'all' ? 'a session' : sportInfo(sport)!.name.toLowerCase()}
      </button>
      <div className="i-meters" style={{ marginTop: 10 }}>
        <Meter value={<>{weekCount}<small>/{targets.sportsWeek}</small></>} label="Sessions this week" />
        <Meter value={`${shown.filter((s) => s.entry.date > addDays(today, -28)).reduce((a, s) => a + s.entry.minutes, 0)}m`} label={`${sport === 'all' ? 'All sports' : sportInfo(sport)!.name} · last 4 weeks`} />
      </div>

      <H2 aside={`${shown.length} sessions`}>Log</H2>
      <div className="i-pnl i-pnl--flush">
        {shown.length ? (
          shown.slice(0, 12).map((s: SportSession) => {
            const d = isSportDetail(s.detail) ? s.detail : null;
            const info = sportInfo(d?.sport);
            return (
              <button key={s.entry.id} type="button" className="i-row" onClick={() => openSheet({ type: 'sports', editId: s.entry.id })}>
                <span className="i-row__t">
                  <b>{info?.name ?? 'Sport'}{d?.type === 'match' ? ' · match' : ''}</b> <span className="i-mono i-small i-dim">{shortDay(s.entry.date)}</span>
                  <small>
                    {d?.km ? `${d.km} km · ${paceOf(d.sport, s.entry.minutes, d.km)}` : ''}
                    {d?.score ? `Score ${d.score}` : ''}
                    {d?.route ? ` · ${d.route}` : ''}
                    {s.entry.note ? ` · ${s.entry.note}` : ''}
                    {!d ? 'From the Daily Log · no details' : ''}
                  </small>
                </span>
                <span className="i-row__n">{s.entry.minutes}m</span>
              </button>
            );
          })
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>Nothing logged{sport === 'all' ? '' : ` for ${sportInfo(sport)!.name.toLowerCase()}`} yet.</p>
        )}
      </div>
      <Source kind="off">Garmin Connect and Strava aren't connected. Strava's API allows authorised activity imports; it needs an app registration and is listed as a future integration.</Source>

      <div className="i-cols">
        <div>
          <H2>Bests</H2>
          <div className="i-pnl i-pnl--flush">
            {pbs.length ? (
              pbs.map((b) => (
                <div key={b.sport + b.label} className="i-row">
                  <span className="i-row__t">
                    <b>{sportInfo(b.sport)!.name} · {b.label}</b>
                    <small>{shortDay(b.date)}</small>
                  </span>
                  <span className="i-row__n">{b.value}</span>
                </div>
              ))
            ) : (
              <p className="i-note" style={{ padding: '12px 0' }}>Bests are worked out from runs, rides and swims with a distance.</p>
            )}
          </div>
        </div>
        <div>
          <H2 aside="min / week">Weekly minutes</H2>
          <div className="i-pnl">
            <Bars values={perWeek} labels={weeks.map((w) => w.slice(8))} long={weeks.map((w) => `Week of ${shortDay(w)}`)} hi={[7]} caption="Sport minutes per week, last 8 weeks" />
          </div>
        </div>
      </div>

      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'event', preset: { kind: 'session', section: 'sports', title: 'Volleyball practice' } })}>+ Practice</button>}>Schedule</H2>
      <div className="i-pnl i-pnl--flush">
        {schedule.length ? (
          schedule.map((o) => (
            <button key={o.key} type="button" className="i-row" onClick={() => openSheet({ type: 'event', key: o.key })}>
              <span className="i-row__t">
                <b>{o.event.title}</b>
                <small>
                  {o.event.repeat!.days.map((d) => DAYS[d]).join(' & ')}
                  {o.start ? ` · ${o.start}–${o.end}` : ''}
                  {o.event.repeat!.until ? ` · until ${shortDay(o.event.repeat!.until)}` : ''} · next {shortDay(o.date)}
                </small>
              </span>
              <span className="i-link">Edit</span>
            </button>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>No repeating practices. Add the season's schedule; later you can change one date or every date from a point on.</p>
        )}
      </div>

      <H2>Weekly target</H2>
      <div className="i-pnl i-pnl--flush">
        <div className="i-kv">
          <span>
            Sessions per week
            <br />
            <span className="i-mono i-small i-dim">from this week on</span>
          </span>
          <Stepper value={targets.sportsWeek} label="sports sessions per week" onStep={(s) => setTargets({ sportsWeek: Math.max(1, Math.min(14, targets.sportsWeek + s)) })} />
        </div>
      </div>
      <RelatedTasks section="sports" />
    </div>
  );
}
