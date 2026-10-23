import { useEffect, useMemo, useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { ltToday, sectionEntries, useToday, withReward } from '../../data/lt';
import { deleteSession, saveSession } from '../../data/sessions';
import { data } from '../../data/store';
import { ROAD_STAGES, type LogEntry, type RoadStageId } from '../../data/types';
import { addDays, monthName, rangeLabel, shortDay, weekdayLetter } from '../../domain/log/dates';
import { formatMinutes } from '../../domain/log/duration';
import { useStore } from '../../lib/createStore';
import { accent, Chips, H2, Meter, Picks, Source, Stepper } from '../../ui/i/bits';
import { Bars } from '../../ui/i/charts';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { DayPick, MinutesField } from '../../ui/i/fields';
import { Icon } from '../../ui/i/Icon';
import { RelatedTasks } from '../../ui/i/RelatedTasks';
import { Sheet } from '../../ui/i/Sheet';
import { seasonCalendar, upcoming, type CalendarEntry } from './road/calendar';
import { dragon, dragonBase, fetchDragon, STALE_MS } from './road/dragon';
import { countdown, currentStage, daysUntil, gatesThisSeason, isHardDay, lastSeven, proofNote, seasonYear, STAGE_INFO, stageWhen, trainingByDay, upsolveLine, zonedInstant, type StageWhen } from './road/rules';
import './road/sheets';
import './coding.css';

const KINDS = ['Problems', 'Contest', 'Upsolve', 'Learning', 'Project'] as const;
const CODING = '__coding__';

interface CodingDetail {
  kind: string;
  platform?: string;
  solved?: number;
}

function CodingSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const editId = (spec.editId as string | undefined) ?? null;
  const prev = editId ? sectionEntries<CodingDetail>(data.get(), 'coding').find((s) => s.entry.id === editId) : undefined;
  const [kind, setKind] = useState<string>(prev?.detail?.kind ?? (spec.kind as string) ?? 'Problems');
  const [platform, setPlatform] = useState(prev?.detail?.platform ?? '');
  const [solved, setSolved] = useState(prev?.detail?.solved ?? 0);
  const [minutes, setMinutes] = useState(prev?.entry.minutes ?? (spec.low ? 10 : 60));
  const [date, setDate] = useState(prev?.entry.date ?? today);
  const [note, setNote] = useState(prev?.entry.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const save = () => {
    let err: string | null = null;
    withReward(() => {
      const r = saveSession({ section: 'coding', date, minutes, note, subcategory: null, detail: { kind, ...(platform.trim() ? { platform: platform.trim().slice(0, 40) } : {}), ...(solved ? { solved } : {}) } }, editId);
      if ('error' in r) err = r.error;
      return !('error' in r);
    });
    if (err) setError(err);
    else closeSheet();
  };
  return (
    <Sheet
      title={prev ? 'Edit session' : 'CH02 · log coding'}
      onClose={closeSheet}
      accent="coding"
      footer={
        <>
          {prev && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteSession(prev.entry.id), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
            Save · raise a gate
          </button>
        </>
      }
    >
      <Picks label="Kind" value={kind} onChange={setKind} options={KINDS.map((k) => ({ id: k, label: k }))} />
      <MinutesField value={minutes} onChange={setMinutes} presets={[10, 30, 60, 90, 180]} />
      <div className="i-kv">
        <span>Solved (AC)</span>
        <Stepper value={solved} label="problems solved" onStep={(d) => setSolved(Math.max(0, solved + d))} />
      </div>
      <input className="i-input" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Where · optional (AtCoder, JOI past papers, USACO…)" aria-label="Platform" maxLength={40} />
      <DayPick value={date} onChange={setDate} today={today} />
      <textarea className="i-textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="What clicked · optional (it comes back on a hard day)" aria-label="What clicked" />
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}
registerSheet('coding', CodingSheet);

const ZONE_NAMES: Record<string, string> = { 'Asia/Tokyo': 'JST', 'Asia/Singapore': 'SGT', 'Europe/Berlin': 'Berlin', 'America/New_York': 'US Eastern' };
const zoneName = (z: string) => ZONE_NAMES[z] ?? z.replace(/^.*\//, '').replace(/_/g, ' ');
function whenLine(w: StageWhen): string {
  const days = w.until && w.until !== w.date ? rangeLabel(w.date, w.until) : shortDay(w.date);
  return `${days}${w.time ? ` · ${w.time} ${zoneName(w.zone)}` : ''}${w.from === 'dragon' ? ' · from DragonCode' : w.from === 'schedule' ? ' · published schedule' : ''}`;
}
function inDays(c: CalendarEntry, today: string): string {
  const d = daysUntil(c.date, today);
  if (d <= 0) return 'Today';
  if (c.approx) return d < 14 ? 'Soon' : d < 60 ? `~${Math.round(d / 7)} wk` : `~${Math.round(d / 30)} mo`;
  return d === 1 ? 'Tomorrow' : `${d}d`;
}
const ago = (ms: number) => {
  const min = Math.round((Date.now() - ms) / 60_000);
  return min < 1 ? 'just now' : min < 60 ? `${min} min ago` : min < 1440 ? `${Math.round(min / 60)} hr ago` : `${Math.round(min / 1440)} days ago`;
};

function Countdown({ when, today }: { when: StageWhen; today: string }) {
  const target = zonedInstant(when.date, when.time, when.zone);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now >= target || (when.date === today && !when.time)) return <p className="r-count r-count--today">TODAY · GO GET IT</p>;
  const c = countdown(target - now);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    <p className="r-count" role="timer" aria-label={`${c.days} days ${c.hours} hours ${c.minutes} minutes to go`}>
      {c.days > 0 && (
        <span>
          <b>{c.days}</b>
          <small>D</small>
        </span>
      )}
      <span>
        <b>{p(c.hours)}</b>
        <small>H</small>
      </span>
      <span>
        <b>{p(c.minutes)}</b>
        <small>M</small>
      </span>
      {c.days === 0 && (
        <span>
          <b>{p(c.seconds)}</b>
          <small>S</small>
        </span>
      )}
    </p>
  );
}

function useDragonRefresh(url: string, key: string) {
  useEffect(() => {
    if (!key) return;
    const refresh = () => {
      const { fetchedAt, loading } = dragon.get();
      if (!loading && (!fetchedAt || Date.now() - fetchedAt > STALE_MS)) void fetchDragon(url, key);
    };
    refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [url, key]);
}

function useLowEnergy(today: string, hardDay: boolean): [boolean, (on: boolean) => void] {
  const KEY = 'lifetracker-road-low';
  const [saved, setSaved] = useState(() => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  });
  const on = saved === `on:${today}` ? true : saved === `off:${today}` ? false : hardDay;
  return [
    on,
    (v) => {
      const value = `${v ? 'on' : 'off'}:${today}`;
      setSaved(value);
      try {
        localStorage.setItem(KEY, value);
      } catch {
        /* lasts until the page closes */
      }
    },
  ];
}

function Road() {
  const road = useStore(data, (s) => s.settings.road);
  const st = useStore(data, (s) => s);
  const today = useToday();
  const summary = useStore(dragon, (s) => s.summary);
  const fetchedAt = useStore(dragon, (s) => s.fetchedAt);
  const loading = useStore(dragon, (s) => s.loading);
  const dragonError = useStore(dragon, (s) => s.error);
  const [showHidden, setShowHidden] = useState(false);
  const linked = !!road.dragon_key;
  const base = dragonBase(road.dragon_url);
  const dd = linked ? summary : null;
  useDragonRefresh(road.dragon_url, road.dragon_key);

  // Every coding-section entry counts as Road training (the coding section maps to the Road topic when there is one).
  const entries: LogEntry[] = useMemo(() => sectionEntries(st, 'coding').map((s) => ({ ...s.entry, topic_id: CODING })), [st]);
  const trained = useMemo(() => trainingByDay(entries, CODING, dd), [entries, dd]);
  const week = lastSeven(trained, today);
  const count = week.filter((d) => d.state === 'ac').length;
  const weekMinutes = week.reduce((a, d) => a + (trained.get(d.date) ?? 0), 0);
  const gates = gatesThisSeason(trained, today);
  const hard = isHardDay(trained, today);
  const [low, setLow] = useLowEnergy(today, hard);
  const note = useMemo(() => proofNote(entries, CODING, dd, today), [entries, dd, today]);
  const upsolve = upsolveLine(dd);
  const acToday = dd?.days.find((d) => d.date === today)?.ac ?? 0;
  const stageId = currentStage(road);
  const when = stageId ? stageWhen(stageId, road.stages[stageId], dd, today) : null;
  const calendar = useMemo(() => upcoming(seasonCalendar(road.events), today), [road.events, today]);
  const passed = when && (when.until ?? when.date) < today;

  return (
    <>
      {(!road.why || hard) && (
        <button type="button" className="r-why" onClick={() => openSheet({ type: 'road-setup' })}>
          <span className="i-lab">My why</span>
          <span>{road.why || 'Why do I want this? Write it in one sentence; it comes back on the hard days.'}</span>
          {road.why && hard && <small>Three quiet days. Ten minutes still raises a gate.</small>}
        </button>
      )}

      <section className="i-pnl r-hero" aria-labelledby="road-next">
        <span className="i-lab">Road to IOI · season {seasonYear(road, today)}</span>
        {stageId ? (
          passed ? (
            <>
              <h2 id="road-next" className="r-stage">{STAGE_INFO[stageId].name}</h2>
              <p className="i-mono i-small">Was on {shortDay(when!.date)}. How did it go?</p>
              <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'road-stage', id: stageId })}>
                I qualified / change the date
              </button>
            </>
          ) : when ? (
            <>
              <Countdown when={when} today={today} />
              <h2 id="road-next" className="r-stage">to {STAGE_INFO[stageId].name}</h2>
              <p className="i-mono i-small i-mid">{whenLine(when)}</p>
            </>
          ) : (
            <>
              <h2 id="road-next" className="r-stage">{STAGE_INFO[stageId].name}</h2>
              <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'road-stage', id: stageId })}>
                Set the date
              </button>
            </>
          )
        ) : (
          <h2 id="road-next" className="r-stage">You made it to the IOI.</h2>
        )}
        <ol className="r-ladder" aria-label="Stages">
          {ROAD_STAGES.map((id: RoadStageId) => {
            const s = road.stages[id];
            const w = stageWhen(id, s, dd, today);
            const state = s.cleared_on ? 'cleared' : id === stageId ? 'now' : 'ahead';
            return (
              <li key={id}>
                <button type="button" className={`r-step is-${state}`} onClick={() => openSheet({ type: 'road-stage', id })} aria-label={`${STAGE_INFO[id].name}: ${state === 'cleared' ? 'cleared' : state === 'now' ? 'next' : 'ahead'}${w ? `, ${shortDay(w.date)}` : ''}`}>
                  <i aria-hidden="true" />
                  <b>{id === 'ioi' ? 'IOI' : STAGE_INFO[id].short}</b>
                  <small>{s.cleared_on ? 'AC' : w ? shortDay(w.date).slice(4) : 'set'}</small>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="i-cols">
        <div>
          <H2 aside={low ? 'low-energy day' : shortDay(today)}>Today</H2>
          <div className="i-pnl i-stack">
            {low ? (
              <div className="r-task">
                <span className="i-mono">01</span>
                <span>
                  <b>Spend ten minutes understanding one solution.</b>
                  <small>Partial score is still score.</small>
                </span>
              </div>
            ) : (
              <>
                <div className={`r-task${acToday ? ' is-done' : ''}`}>
                  <span className="i-mono">01</span>
                  <span>
                    <b>Solve one problem that makes you think.{acToday > 0 && ' Done today.'}</b>
                    {base && (
                      <a className="i-link" href={`${base}/today`} target="_blank" rel="noreferrer">
                        Open DragonCode ↗
                      </a>
                    )}
                  </span>
                </div>
                <div className="r-task">
                  <span className="i-mono">02</span>
                  <span>
                    <b>{upsolve.problemId ? `Upsolve: ${upsolve.title}` : upsolve.title}</b>
                    {upsolve.detail && <small>{upsolve.detail}</small>}
                    {upsolve.problemId && base && (
                      <a className="i-link" href={`${base}/workspace/${encodeURIComponent(upsolve.problemId)}`} target="_blank" rel="noreferrer">
                        Open in DragonCode ↗
                      </a>
                    )}
                  </span>
                </div>
              </>
            )}
            <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'coding', low })}>
              Log a session · raise a gate
            </button>
            <button type="button" className="i-link" aria-pressed={low} onClick={() => setLow(!low)}>
              {low ? 'Back to the full day' : 'Tired? Ten minutes still raises a gate.'}
            </button>
          </div>
        </div>
        <div>
          <H2 aside={`${count}/7 days${weekMinutes ? ` · ${formatMinutes(weekMinutes)}` : ''}`}>This week</H2>
          <div className="i-pnl">
            <ol className="r-week">
              {week.map((d) => (
                <li key={d.date} className={`is-${d.state}`}>
                  <i aria-hidden="true" />
                  <span aria-hidden="true">{d.state === 'now' ? 'NOW' : weekdayLetter(d.date).slice(0, 2).toUpperCase()}</span>
                  <span className="visually-hidden">
                    {shortDay(d.date)}: {d.state === 'ac' ? `trained, ${formatMinutes(trained.get(d.date) ?? 0)}` : d.state === 'now' ? 'not yet today' : 'rest'}
                  </span>
                </li>
              ))}
            </ol>
            <div className="r-gates">
              <b>{gates}</b>
              <span>
                {gates === 1 ? 'gate' : 'gates'} raised this season
                <br />
                <small>one for every day of training since 1 Sep</small>
              </span>
            </div>
          </div>
          {note && (
            <figure className="r-note">
              <figcaption className="i-lab">A note from you · {shortDay(note.date, today)}</figcaption>
              <blockquote>{note.text}</blockquote>
            </figure>
          )}
        </div>
      </div>

      <H2 aside="NOI · USACO · APIO">Side paths</H2>
      <div className="i-pnl i-pnl--flush">
        {calendar.shown.length ? (
          calendar.shown.map((c) => (
            <button key={c.event.id} type="button" className="i-row i-row--lead" onClick={() => openSheet({ type: 'road-event', id: c.event.id })}>
              <span className="r-date" aria-hidden="true">
                {c.approx ? <small>~</small> : <b>{+c.date.slice(8, 10)}</b>}
                {monthName(c.date)}
              </span>
              <span className="i-row__t">
                <b>{c.event.name}</b>
                <small>{c.event.where}{c.approx ? ' · day not announced yet' : ''}</small>
              </span>
              <span className="i-row__n">{inDays(c, today)}</span>
            </button>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>Nothing else ahead this season.</p>
        )}
      </div>
      {calendar.hidden.length > 0 && (
        <button type="button" className="i-link" onClick={() => setShowHidden(!showHidden)} aria-expanded={showHidden}>
          {showHidden ? 'Hide' : 'Show'} {calendar.hidden.length} hidden
        </button>
      )}
      {showHidden && calendar.hidden.map((c) => (
        <button key={c.event.id} type="button" className="i-row" onClick={() => openSheet({ type: 'road-event', id: c.event.id })}>
          <span className="i-row__t">{c.event.name}<small>Hidden</small></span>
        </button>
      ))}

      {road.why && !hard && (
        <button type="button" className="r-why r-why--quiet" onClick={() => openSheet({ type: 'road-setup' })}>
          <span className="i-lab">My why</span>
          <span>{road.why}</span>
        </button>
      )}

      <Source kind={linked && !dragonError ? 'live' : 'off'}>
        {linked ? (
          <>
            DragonCode {loading ? 'updating…' : fetchedAt ? `updated ${ago(fetchedAt)}` : 'linked'}
            {dd?.mockOpen && ' · mock in progress, names hidden'}
            {dragonError && ` · ${dragonError}`} ·{' '}
            <button type="button" className="i-link" disabled={loading} onClick={() => void fetchDragon(road.dragon_url, road.dragon_key)}>
              refresh
            </button>
          </>
        ) : (
          <>
            DragonCode isn't linked on this device, so only sessions logged here count.{' '}
            <button type="button" className="i-link" onClick={() => openSheet({ type: 'road-setup' })}>
              Link it
            </button>
          </>
        )}
      </Source>
      <div className="i-btns" style={{ marginTop: 8 }}>
        <a className="i-btn i-btn--sm" href={base ?? 'https://dragon-academy-sigma.vercel.app'} target="_blank" rel="noreferrer">
          Open DragonCode ↗
        </a>
        <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'road-setup' })}>
          Setup
        </button>
      </div>
    </>
  );
}

function AllCoding() {
  const st = useStore(data, (s) => s);
  const today = useToday();
  const sessions = useMemo(() => sectionEntries<CodingDetail>(st, 'coding'), [st]);
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(today, -7 * (7 - i) - 6));
  const perWeek = weeks.map((w) => sessions.filter((s) => s.entry.date >= w && s.entry.date <= addDays(w, 6)).reduce((a, s) => a + s.entry.minutes, 0));
  const solved28 = sessions.filter((s) => s.entry.date > addDays(today, -28)).reduce((a, s) => a + (s.detail?.solved ?? 0), 0);
  return (
    <>
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'coding' })}>
        <Icon name="plus" /> Log coding
      </button>
      <div className="i-meters" style={{ marginTop: 10 }}>
        <Meter value={formatMinutes(perWeek[7])} label="Last 7 days" />
        <Meter value={solved28} label="Solved (logged) · 4 weeks" />
      </div>
      <H2 aside="min / week">Weekly minutes</H2>
      <div className="i-pnl">
        <Bars values={perWeek} labels={weeks.map((w) => w.slice(8))} long={weeks.map((w) => `Week from ${shortDay(w)}`)} hi={[7]} caption="Coding minutes per 7 days, last 8 weeks" />
      </div>
      <H2 aside={`${sessions.length} sessions`}>Sessions</H2>
      <div className="i-pnl i-pnl--flush">
        {sessions.length ? (
          sessions.slice(0, 15).map((s) => (
            <button key={s.entry.id} type="button" className="i-row" onClick={() => openSheet({ type: 'coding', editId: s.entry.id })}>
              <span className="i-row__t">
                <b>{s.detail?.kind ?? 'Coding'}{s.detail?.platform ? ` · ${s.detail.platform}` : ''}</b> <span className="i-mono i-small i-dim">{shortDay(s.entry.date)}</span>
                <small>{[s.detail?.solved ? `${s.detail.solved} AC` : '', s.entry.note].filter(Boolean).join(' · ') || (s.detail ? '' : 'From the Daily Log')}</small>
              </span>
              <span className="i-row__n">{s.entry.minutes}m</span>
            </button>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>Nothing logged yet.</p>
        )}
      </div>
      <Source kind="off">Problem results from DragonCode show on the Road tab when it is linked. AtCoder/Codeforces imports aren't built.</Source>
    </>
  );
}

export function CodingChannel() {
  const [tab, setTab] = useState<'road' | 'all'>(() => (location.hash === '#all' ? 'all' : 'road'));
  return (
    <div style={accent('coding')}>
      <ChannelHead id="coding" />
      <Chips label="View" value={tab} onChange={setTab} options={[{ id: 'road', label: 'Road to IOI' }, { id: 'all', label: 'All coding' }]} />
      {tab === 'road' ? <Road /> : <AllCoding />}
      <RelatedTasks section="coding" />
    </div>
  );
}
