/**
 * Records: a heavier lift, a faster pace, the longest run, a distance milestone and a marathon.
 */
import { useMemo } from 'react';
import { Burst, Caption, Confetti, Extruded, range, rng, Roller, Seal, seedOf, Stamp, Streaks, type Css } from '../kit';
import { Barbell } from './sections';
import type { MomentFx, MomentFxMap } from './types';
import './records.css';

const fmtKm = (n: number) => (Math.round(n * 10) / 10).toFixed(n % 1 ? 1 : 0);
const RUN_LABEL = { '5k': '5K', '10k': '10K', half: 'HALF', marathon: 'FULL' } as const;
const RUN_FULL = { '5k': '5 km', '10k': '10 km', half: 'Half marathon', marathon: 'Marathon' } as const;
const kanji = (ch: string) => <span className="fx-calm__k">{ch}</span>;

// ─── 12 pr-lift: 新記録 ──────────────────────────────────────────────────────

const PR_PLATES = [
  { d: 156, c: '#c62828' },
  { d: 150, c: '#1565c0' },
  { d: 138, c: '#f9a825' },
  { d: 118, c: '#2e7d32' },
];

const prLift: MomentFx<'pr-lift'> = {
  tell: (m) => ({ kicker: 'New record', title: `${m.exercise} · ${m.weight} kg`, line: `${m.weight} kg × ${m.reps}${m.previous ? ` · was ${m.previous} kg` : ''}`, color: '#ffcf3a' }),
  time: () => ({ dur: 2750, hit: 1300 }),
  calm: () => <Seal chars="新記録" className="fx-seal--calm fx-seal--tall" />,
  Scene: ({ m }) => (
    <div className="fx-scene fx-prl" style={{ '--tc': '#ffcf3a' } as Css}>
      <i className="fx-bg fx-prl__bg" />
      <Streaks n={10} seed={m.weight} />
      <div className="fx-prl__kanji">
        <Extruded text="新記録" depth={5} step={4} back="#c62828" />
      </div>
      <div className="fx-at fx-prl__at">
        <div className="fx-prl__rig">
          <Barbell plates={PR_PLATES} first={180} step={105} />
        </div>
      </div>
      <Burst n={10} seed={seedOf(m.exercise)} colors={['#ffcf3a', '#fff', '#c62828']} spread={[140, 280]} />
      <div className="fx-prl__num">
        <Roller value={String(m.weight)} delay={250} step={70} />
        <small>kg</small>
      </div>
      <p className="fx-prl__was">
        <span>× {m.reps}</span>
        {m.previous ? <span className="fx-strike">was {m.previous} kg</span> : null}
      </p>
      <Caption chip="new record · 新記録" title={m.exercise} line={`Heaviest set ever: ${m.weight} kg × ${m.reps}`} />
    </div>
  ),
};

// ─── 13 pr-run: the finish tape snaps, a stopwatch, the distance bib ────────

const prRun: MomentFx<'pr-run'> = {
  tell: (m) => ({ kicker: 'Fastest pace', title: `${RUN_FULL[m.distance]} · ${m.pace} /km`, line: m.previous ? `Was ${m.previous} /km` : 'A new best pace', color: '#ff5a5f' }),
  time: () => ({ dur: 2700, hit: 950 }),
  calm: (m) => <span className="fx-calm__k fx-calm__k--sm">{RUN_LABEL[m.distance]}</span>,
  Scene: ({ m }) => (
    <div className="fx-scene fx-prr" style={{ '--tc': '#ff5a5f' } as Css}>
      <i className="fx-bg fx-prr__bg" />
      <div className="fx-stage fx-prr__cam">
        <div className="fx-prr__track">
          <i className="fx-prr__lanes" />
        </div>
      </div>
      <Streaks n={10} seed={7} />
      <div className="fx-at">
        <div className="fx-prr__tape fx-prr__tape--l">
          <span>FINISH</span>
        </div>
        <div className="fx-prr__tape fx-prr__tape--r">
          <span>FINISH</span>
        </div>
      </div>
      <div className="fx-at">
        <div className="fx-prr__watch">
          <svg viewBox="0 0 160 180" aria-hidden="true">
            <rect x="68" y="0" width="24" height="14" rx="3" fill="#cfd4da" />
            <rect x="74" y="12" width="12" height="10" fill="#9aa0a6" />
            <circle cx="80" cy="100" r="76" fill="#1a1c20" stroke="#cfd4da" strokeWidth="6" />
            <circle cx="80" cy="100" r="66" fill="#f4f4f0" />
            <g stroke="#1a1c20" strokeWidth="2">
              {range(12).map((i) => (
                <path key={i} d="M80 38v8" transform={`rotate(${i * 30} 80 100)`} />
              ))}
            </g>
          </svg>
          <i className="fx-prr__hand" />
          <span className="fx-prr__pace">
            <b>{m.pace}</b>
            <small>/km</small>
          </span>
        </div>
      </div>
      <Stamp className="fx-prr__bib" delay={450}>
        <i className="fx-prr__pin" />
        <i className="fx-prr__pin fx-prr__pin--r" />
        <b>{RUN_LABEL[m.distance]}</b>
        <small>personal best</small>
      </Stamp>
      {m.previous ? (
        <p className="fx-prr__was">
          <span className="fx-strike">was {m.previous}</span>
        </p>
      ) : null}
      <Burst n={12} seed={11} colors={['#ff5a5f', '#fff', '#ffd166']} spread={[150, 300]} />
      <Caption chip={`fastest · ${RUN_FULL[m.distance]}`} title={`${m.pace} /km`} line={m.previous ? `Best pace over ${RUN_FULL[m.distance].toLowerCase()} · was ${m.previous}` : `Best pace over ${RUN_FULL[m.distance].toLowerCase()}`} />
    </div>
  ),
};

// ─── 14 long-run: the road unrolls to the horizon, km markers pass ─────────

const longRun: MomentFx<'long-run'> = {
  tell: (m) => ({ kicker: 'Longest run', title: `${fmtKm(m.km)} km`, line: m.previous ? `Was ${fmtKm(m.previous)} km` : 'Your longest run yet', color: '#ffb347' }),
  time: () => ({ dur: 2750, hit: 1500 }),
  calm: () => kanji('道'),
  Scene: ({ m }) => {
    const top = Math.max(1, Math.floor(m.km));
    const marks = range(5).map((i) => Math.max(1, top - 4 + i));
    return (
      <div className="fx-scene fx-lr" style={{ '--tc': '#ffb347' } as Css}>
        <i className="fx-bg fx-lr__sky" />
        <i className="fx-lr__sun" />
        <i className="fx-lr__hills" />
        <div className="fx-stage fx-lr__cam">
          <div className="fx-lr__road">
            {marks.map((k, i) => (
              <div key={i} className={`fx-lr__post${i % 2 ? ' fx-lr__post--r' : ''}`} style={{ '--d': `${150 + i * 190}ms` } as Css}>
                <span>
                  {k}
                  <small>km</small>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="fx-lr__num">
          <small>longest run</small>
          <b>
            <Roller value={fmtKm(m.km)} delay={600} step={60} />
            <em>km</em>
          </b>
          {m.previous ? <span className="fx-strike">was {fmtKm(m.previous)} km</span> : null}
        </div>
        <Caption chip="longest run · 道" title={`${fmtKm(m.km)} km`} line={m.previous ? `Further than ever: ${fmtKm(m.km - m.previous)} km past your old best` : 'Further than ever'} />
      </div>
    );
  },
};

// ─── 15 distance: the odometer rolls to the milestone ───────────────────────

function Drum({ from, to, place, delay }: { from: number; to: number; place: number; delay: number }) {
  const p = 10 ** place;
  const a0 = Math.floor(from / p) * 36;
  const a1 = Math.floor(to / p) * 36;
  return (
    <span className="fx-odo__drum" style={{ '--a0': `${a0}deg`, '--a1': `${a1}deg`, '--d': `${delay}ms` } as Css}>
      {range(10).map((i) => (
        <i key={i} style={{ transform: `rotateX(${-i * 36}deg) translateZ(86px)` }}>
          {i}
        </i>
      ))}
    </span>
  );
}

const distance: MomentFx<'distance'> = {
  tell: (m) => ({ kicker: 'Distance milestone', title: `${m.km} km`, line: 'Running distance in total', color: '#4fd1c5' }),
  time: () => ({ dur: 2700, hit: 1450 }),
  calm: () => kanji('程'),
  Scene: ({ m }) => {
    const to = Math.max(1, Math.round(m.km));
    const from = Math.max(0, to - 47);
    const n = Math.max(4, String(to).length);
    return (
      <div className="fx-scene fx-odo" style={{ '--tc': '#4fd1c5' } as Css}>
        <i className="fx-bg fx-odo__bg" />
        <div className="fx-at fx-odo__gat">
          <svg className="fx-odo__gauge" viewBox="0 0 300 170" aria-hidden="true">
            <path d="M30 160A120 120 0 0 1 270 160" fill="none" stroke="#2b3a44" strokeWidth="14" />
            <path d="M30 160A120 120 0 0 1 270 160" fill="none" stroke="#4fd1c5" strokeWidth="4" strokeDasharray="2 12" />
            {range(9).map((i) => (
              <text key={i} x={150 - 104 * Math.cos((i / 8) * Math.PI)} y={164 - 104 * Math.sin((i / 8) * Math.PI)} textAnchor="middle" fontSize="11" fill="#9fb3bf" fontFamily="M PLUS 1 Code, monospace">
                {i * 2}
              </text>
            ))}
          </svg>
          <i className="fx-odo__needle" />
        </div>
        <div className="fx-odo__row">
          <div className="fx-odo__box">
            {range(n).map((i) => (
              <Drum key={i} from={from} to={to} place={n - 1 - i} delay={300} />
            ))}
            <span className="fx-odo__unit">km</span>
            <i className="fx-odo__glass" />
          </div>
        </div>
        <Stamp className="fx-odo__stamp" delay={150}>
          <Seal chars="走破" />
        </Stamp>
        <Burst n={14} seed={to} colors={['#4fd1c5', '#fff', '#ffd166']} spread={[150, 300]} delay="1450ms" />
        <Caption chip="milestone · total distance" title={`${to} km run`} line="Every run added up" />
      </div>
    );
  },
};

// ─── 16 race: the finish arch, a medal swinging on its ribbon, 完走 ─────────

const race: MomentFx<'race'> = {
  tell: (m) => ({ kicker: 'Marathon finished', title: m.time, line: `${fmtKm(m.km)} km`, color: '#ffd166' }),
  time: () => ({ dur: 3200, hit: 1250 }),
  calm: () => <Seal chars="完走" className="fx-seal--calm" />,
  Scene: ({ m }) => {
    const colors = useMemo(() => ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#fff'], []);
    const flecks = useMemo(() => {
      const r = rng(5);
      return range(6).map(() => ({ left: `${10 + r() * 80}%`, top: `${8 + r() * 30}%` }));
    }, []);
    return (
      <div className="fx-scene fx-race" style={{ '--tc': '#ffd166' } as Css}>
        <i className="fx-bg fx-race__bg" />
        {flecks.map((f, i) => (
          <i key={i} className="fx-race__fleck" style={f} />
        ))}
        <i className="fx-race__road" />
        <div className="fx-stage fx-race__cam">
          <div className="fx-race__arch">
            <i className="fx-race__pillar" />
            <i className="fx-race__pillar fx-race__pillar--r" />
            <span className="fx-race__banner">FINISH</span>
          </div>
        </div>
        <Confetti n={16} seed={42} colors={colors} delay={1100} />
        <div className="fx-race__brush" aria-hidden="true">
          <span>完</span>
          <span>走</span>
        </div>
        <div className="fx-race__hang">
          <i className="fx-race__strap fx-race__strap--l" />
          <i className="fx-race__strap fx-race__strap--r" />
          <div className="fx-race__medal">
            {[-6, -4.5, -3, -1.5].map((z) => (
              <i key={z} className="fx-race__edge" style={{ transform: `translateZ(${z}px)` }} />
            ))}
            <span className="fx-race__face">
              <small>finisher</small>
              <b>42.195</b>
              <small>km</small>
            </span>
            <span className="fx-race__back" />
          </div>
        </div>
        <Burst n={12} seed={77} colors={colors} spread={[160, 320]} />
        <Stamp className="fx-race__time" delay={650}>
          {m.time}
        </Stamp>
        <Caption chip="race · 完走" title="Marathon finished" line={`${fmtKm(m.km)} km in ${m.time}`} />
        <i className="fx-flash fx-race__flash" />
      </div>
    );
  },
};

export const RECORD_FX: Pick<MomentFxMap, 'pr-lift' | 'pr-run' | 'long-run' | 'distance' | 'race'> = {
  'pr-lift': prLift,
  'pr-run': prRun,
  'long-run': longRun,
  distance,
  race,
};

