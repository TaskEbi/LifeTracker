/** 東海道: every kilometre you run moves you along the old road from Edo to Kyoto. */
import { useMemo, useRef, type CSSProperties } from 'react';
import { navigate } from '../../app/router';
import { progressInput, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { journey, ROAD_KM, STATIONS } from '../../domain/hq/tokaido';
import { trainingLogs } from '../../domain/plans/progress';
import { useStore } from '../../lib/createStore';
import { accent, H2, Source } from '../../ui/i/bits';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { SportsArt } from './Art';
import './road.css';

function useRunTotal(): number {
  const today = useToday();
  const st = useStore(data, (s) => s);
  return useMemo(() => trainingLogs(progressInput(st, today)).runs.filter((r) => r.date <= today).reduce((n, r) => n + (r.km ?? 0), 0), [st, today]);
}

/** On Sports: where you've got to. */
export function RoadCard() {
  const total = useRunTotal();
  const j = journey(total);
  return (
    <button type="button" className="tk-card" onClick={() => navigate('sports', ['road'])} aria-label={`The Tōkaidō: ${Math.round(total)} kilometres run, at ${j.last.name}${j.next ? `, ${j.toNext} to ${j.next.name}` : ''}`}>
      <span className="tk-card__k" aria-hidden="true">
        東海道
      </span>
      <span className="tk-card__t">
        <b>
          {j.last.name} <span lang="ja">{j.last.ja}</span>
        </b>
        <small>{j.next ? `${j.toNext} km to ${j.next.name} · station ${j.passed} of 54` : 'Kyoto!'}</small>
        <span className="tk-card__bar" aria-hidden="true">
          <i style={{ width: `${j.pct * 100}%` }} />
        </span>
      </span>
    </button>
  );
}

export function TokaidoPage() {
  const total = useRunTotal();
  const j = journey(total);
  const here = useRef<HTMLLIElement>(null);
  return (
    <div style={accent('sports')}>
      <ChannelHead id="sports" sub="the Tōkaidō" art={<SportsArt />} />
      <button type="button" className="i-link" onClick={() => navigate('sports')}>
        ◀ Back to training
      </button>
      <section className="tk-print" aria-label="Your place on the road">
        <svg viewBox="0 0 400 130" aria-hidden="true">
          <defs>
            <linearGradient id="tk-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1e4e7c" />
              <stop offset="0.65" stopColor="#f4dcb4" />
            </linearGradient>
          </defs>
          <rect width="400" height="130" fill="url(#tk-sky)" />
          <path d="M120 112 L205 28 q6 -6 12 0 L302 112Z" fill="#335c84" />
          <path d="M193 42 L205 28 q6 -6 12 0 L229 42 l-9 6 -9 -7 -9 7z" fill="#fff" />
          <path d="M0 112 Q90 92 180 110 T400 104 V130 H0Z" fill="#3d6650" />
          <path d="M0 122 Q120 110 240 122 T400 118 V130 H0Z" fill="#2c4a3b" />
          <path d="M20 118 Q200 100 380 112" fill="none" stroke="#f4e9d2" strokeWidth="2" strokeDasharray="3 5" />
          <circle cx={20 + 360 * j.pct} cy={118 - 14 * Math.sin(j.pct * Math.PI) - 4 * j.pct} r="5" fill="#d3372b" stroke="#fff" strokeWidth="1.5" />
        </svg>
        <div className="tk-print__t">
          <b>{Math.round(total * 10) / 10} km</b> run
          {j.trips > 0 && ` · ${j.trips} ${j.trips === 1 ? 'trip' : 'trips'} to Kyoto`}
          <small>
            At {j.last.name}. {j.next ? `${j.toNext} km to ${j.next.name}, ${Math.round((ROAD_KM - j.km) * 10) / 10} km to Kyoto` : ''}
          </small>
        </div>
      </section>
      <button type="button" className="i-link" onClick={() => here.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })}>
        Find me on the road
      </button>
      <H2 aside="Edo to Kyoto">The 53 stations</H2>
      <ol className="tk-road">
        {STATIONS.map((s) => {
          const passed = s.km <= j.km;
          const isHere = s.n === j.passed;
          return (
            <li key={s.n} ref={isHere ? here : undefined} className={`${passed ? 'is-passed' : ''}${isHere ? ' is-here' : ''}`} style={{ '--n': s.n } as CSSProperties}>
              <span className="tk-road__dot" aria-hidden="true" />
              <span className="tk-road__ja" lang="ja" aria-hidden="true">
                {s.ja}
              </span>
              <span className="tk-road__t">
                <b>{s.name}</b>
                {isHere && <span className="i-tag i-tag--c">You’re here</span>}
                {(passed || isHere) && s.note && <small>{s.note}</small>}
              </span>
              <span className="tk-road__km i-mono">{s.km} km</span>
            </li>
          );
        })}
      </ol>
      <Source kind="live">Your running kilometres from your log, all of them. Distances are worked out from the traditional ri between the post towns, so they’re close to the old road and not to today’s.</Source>
    </div>
  );
}
