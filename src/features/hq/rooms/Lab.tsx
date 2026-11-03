/** 研究室: the weather year, what your data says, and self-experiments. */
import { useMemo, useState, type CSSProperties } from 'react';
import { registerSheet } from '../../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../../app/sheets';
import { progressInput, useToday } from '../../../data/lt';
import { deleteRecord } from '../../../data/records';
import { data } from '../../../data/store';
import { WEATHER, weatherOf } from '../../../domain/hq/checkin';
import { EXPERIMENT_METRICS, experimentResult, fmtMetric, labRows, METRIC_LABEL, MIN_PAIRS, runLab, weekdayProfile, type Finding, type Metric } from '../../../domain/hq/lab';
import { addDays, monthEnd, shortDay } from '../../../domain/log/dates';
import { useStore } from '../../../lib/createStore';
import { Chips, H2, Source } from '../../../ui/i/bits';
import { Bars } from '../../../ui/i/charts';
import { Sheet } from '../../../ui/i/Sheet';
import { CheckInCard } from '../HomeCards';
import { RoomHead } from '../HqView';
import { saveExperiment, useHq } from '../store';

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function WeatherYear({ year, today, moods }: { year: number; today: string; moods: Map<string, number> }) {
  const logged = [...moods.keys()].filter((d) => d.startsWith(String(year))).length;
  return (
    <figure className="hq-year" role="img" aria-label={`Inner weather, ${year}: ${logged} days logged`}>
      {MONTHS.map((m, i) => {
        const month = `${year}-${String(i + 1).padStart(2, '0')}`;
        const last = +monthEnd(`${month}-01`).slice(8);
        return (
          <div key={month} className="hq-year__row">
            <span aria-hidden="true">{m}</span>
            {Array.from({ length: 31 }, (_, d) => {
              const date = `${month}-${String(d + 1).padStart(2, '0')}`;
              if (d + 1 > last) return <i key={d} className="is-none" />;
              const v = moods.get(date);
              return <i key={d} className={date === today ? 'is-today' : date > today ? 'is-future' : ''} style={v ? ({ background: weatherOf(v).c } as CSSProperties) : undefined} title={v ? `${shortDay(date)}: ${weatherOf(v).name}` : undefined} />;
            })}
          </div>
        );
      })}
    </figure>
  );
}

function Dots({ f }: { f: Finding }) {
  const W = 120;
  const H = 54;
  const xs = f.points.map((p) => p[0]);
  const ys = f.points.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const px = (v: number) => 3 + ((v - x0) / (x1 - x0 || 1)) * (W - 6);
  const py = (v: number) => H - 3 - ((v - y0) / (y1 - y0 || 1)) * (H - 6);
  return (
    <svg className="hq-dots" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {f.points.slice(-120).map((p, i) => (
        <circle key={i} cx={px(p[0])} cy={py(p[1])} r="1.6" />
      ))}
    </svg>
  );
}

function FindingCard({ f }: { f: Finding }) {
  const h = f.hypothesis;
  const words = { strong: 'A clear pattern', some: 'A weak pattern', none: 'No clear link' }[f.strength];
  return (
    <article className={`hq-find is-${f.strength}`}>
      <div className="hq-find__h">
        <b>{h.title}</b>
        <span className="i-tag">{words}</span>
      </div>
      <div className="hq-find__b">
        <Dots f={f} />
        <dl>
          <div>
            <dt>{h.hi}</dt>
            <dd>{fmtMetric(h.y, f.hiMean)}</dd>
          </div>
          <div>
            <dt>{h.lo}</dt>
            <dd>{fmtMetric(h.y, f.loMean)}</dd>
          </div>
        </dl>
      </div>
      <small className="i-mono i-dim">
        {METRIC_LABEL[h.y]} · {f.n} days · r = {f.r.toFixed(2)}
        {!h.binary ? ` · split at ${fmtMetric(h.x, f.split)}` : ''}
      </small>
    </article>
  );
}

function ExperimentSheet({ spec }: { spec: SheetSpec }) {
  const today = useToday();
  const [title, setTitle] = useState((spec.title as string) ?? '');
  const [metric, setMetric] = useState<Metric>('sleep');
  const [days, setDays] = useState('14');
  const [start, setStart] = useState(today);
  return (
    <Sheet
      title="New self-experiment"
      onClose={closeSheet}
      footer={
        <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!title.trim()} onClick={() => (saveExperiment({ title, start, days: Number(days), metric }), closeSheet())}>
          Start it
        </button>
      }
    >
      <p className="i-note">Change one thing for a while. The Lab compares those days with the same number of days just before.</p>
      <label className="i-field">
        <span className="i-lab">What are you changing?</span>
        <input data-autofocus className="i-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. No phone after 22:00" maxLength={100} />
      </label>
      <div className="i-field">
        <span className="i-lab">What should it move?</span>
        <Chips label="What to watch" value={metric} onChange={setMetric} options={EXPERIMENT_METRICS.map((m) => ({ id: m, label: METRIC_LABEL[m] }))} />
      </div>
      <div className="i-field">
        <span className="i-lab">For how long?</span>
        <Chips label="How long" value={days} onChange={setDays} options={['7', '14', '21', '30'].map((d) => ({ id: d, label: `${d} days` }))} />
      </div>
      <label className="i-field">
        <span className="i-lab">Starting</span>
        <input className="i-input" type="date" value={start} min={addDays(today, -30)} onChange={(e) => e.target.value && setStart(e.target.value)} />
      </label>
    </Sheet>
  );
}
registerSheet('hq-experiment', ExperimentSheet);

const IDEAS = ['No phone after 22:00', 'Bed before 23:00', 'Run before school', 'Read instead of scrolling at night', 'Violin first thing after school'];

export function LabRoom() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const hq = useHq();
  const rows = useMemo(() => labRows(progressInput(st, today), hq.checkIns), [st, today, hq.checkIns]);
  const { findings, pending } = useMemo(() => runLab(rows), [rows]);
  const profile = useMemo(() => weekdayProfile(rows), [rows]);
  const moods = useMemo(() => new Map(hq.checkIns.map((c) => [c.date, c.mood])), [hq.checkIns]);
  const [year, setYear] = useState(+today.slice(0, 4));
  const firstYear = hq.checkIns.reduce((y, c) => Math.min(y, +c.date.slice(0, 4)), +today.slice(0, 4));
  const clear = findings.filter((f) => f.strength !== 'none');
  const none = findings.filter((f) => f.strength === 'none');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div>
      <RoomHead room="lab" />
      <CheckInCard always />

      <H2 aside={
        <span className="hq-yearnav">
          <button type="button" className="i-link" disabled={year <= firstYear} onClick={() => setYear(year - 1)} aria-label="Previous year">◀</button>
          {year}
          <button type="button" className="i-link" disabled={year >= +today.slice(0, 4)} onClick={() => setYear(year + 1)} aria-label="Next year">▶</button>
        </span>
      }>
        Weather year
      </H2>
      <div className="i-pnl">
        <WeatherYear year={year} today={today} moods={moods} />
        <div className="hq-legend" aria-hidden="true">
          {WEATHER.map((w) => (
            <span key={w.v}>
              <i style={{ background: w.c }} /> {w.kanji} {w.name}
            </span>
          ))}
        </div>
      </div>

      <H2 aside={`${findings.length} tested`}>What your data says</H2>
      {clear.length > 0 ? (
        <div className="hq-finds">
          {clear.map((f) => (
            <FindingCard key={f.hypothesis.id} f={f} />
          ))}
        </div>
      ) : (
        <p className="i-note">{findings.length ? 'Nothing clear yet, which is a result too.' : `Each question needs ${MIN_PAIRS} days with both things logged. Keep logging sleep, screen time and your weather.`}</p>
      )}
      <Source kind="live">Worked out from your own records. These are patterns, not cause and effect: a good night and a good day can both come from a good week.</Source>
      {none.length > 0 && (
        <details className="hq-more">
          <summary>{none.length} with no clear link</summary>
          <div className="hq-finds">
            {none.map((f) => (
              <FindingCard key={f.hypothesis.id} f={f} />
            ))}
          </div>
        </details>
      )}
      {pending.length > 0 && (
        <details className="hq-more">
          <summary>{pending.length} still collecting</summary>
          <div className="i-pnl i-stack">
            {pending.map((p) => (
              <div key={p.hypothesis.id} className="hq-bar">
                <span>{p.hypothesis.title}</span>
                <i style={{ width: `${(p.n / MIN_PAIRS) * 100}%` }} />
                <b className="i-mono">
                  {p.n}/{MIN_PAIRS}
                </b>
              </div>
            ))}
          </div>
        </details>
      )}

      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'hq-experiment' })}>+ New</button>}>Self-experiments</H2>
      {hq.experiments.length ? (
        <div className="i-pnl i-pnl--flush">
          {hq.experiments.map((e) => {
            const r = experimentResult(rows, e, today);
            const verdict = r.diff == null ? null : `${r.diff > 0 ? '+' : '−'}${fmtMetric(e.metric, Math.abs(r.diff))}`;
            return (
              <div key={e.id} className="i-row">
                <span className="i-row__t">
                  <b>{e.title}</b>
                  <small>
                    {METRIC_LABEL[e.metric]} · {r.status === 'not-started' ? `starts ${shortDay(e.start)}` : r.status === 'running' ? `day ${r.day} of ${e.days}` : `finished ${shortDay(addDays(e.start, e.days - 1))}`}
                    {r.during && r.before ? ` · ${fmtMetric(e.metric, r.before.mean)} → ${fmtMetric(e.metric, r.during.mean)} (${r.before.n} and ${r.during.n} days)` : r.status !== 'not-started' ? ' · not enough logged to compare yet' : ''}
                  </small>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {verdict && <span className="i-row__n">{verdict}</span>}
                  <button type="button" className="i-btn i-btn--sm" onClick={() => deleteRecord(e.id, 'Experiment deleted')} aria-label={`Delete experiment: ${e.title}`}>
                    ✕
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="i-chips i-chips--wrap">
          {IDEAS.map((t) => (
            <button key={t} type="button" className="i-chip" onClick={() => openSheet({ type: 'hq-experiment', title: t })}>
              {t}
            </button>
          ))}
        </div>
      )}

      {rows.length >= 14 && (
        <>
          <H2 aside="minutes, on average">Your week</H2>
          <div className="i-pnl">
            <Bars values={profile.work} labels={days.map((d) => d.slice(0, 1))} long={days.map((d, i) => `${d}${profile.mood[i] != null ? `, mostly ${weatherOf(profile.mood[i]!).name.toLowerCase()}` : ''}`)} caption="Average minutes logged per weekday" />
          </div>
        </>
      )}
    </div>
  );
}
