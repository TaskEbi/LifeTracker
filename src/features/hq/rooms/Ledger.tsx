/** 帳場: where the 168 hours went, and whether that matches what you say matters. */
import { useMemo, useState, type CSSProperties } from 'react';
import { prefValue, progressInput, setPref, useToday } from '../../../data/lt';
import { data } from '../../../data/store';
import { normaliseRanking, priorityGap, weekLedger } from '../../../domain/hq/ledger';
import { addDays, rangeLabel, weekStart } from '../../../domain/log/dates';
import { sectionInfo } from '../../../domain/sections';
import { useStore } from '../../../lib/createStore';
import { accent, H2, Source } from '../../../ui/i/bits';
import { RoomHead } from '../HqView';

const COLOR: Record<string, string> = { sleep: '#6d78d8', screen: '#8c8c8c', fixed: '#b98a5c', general: '#a58ec9', spare: '#2f2a24' };
const lineColor = (id: string) => COLOR[id] ?? `var(--c-${id})`;
const hrs = (m: number) => `${(Math.round((m / 60) * 10) / 10).toString()} h`;

export function LedgerRoom() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const [back, setBack] = useState(0);
  const monday = addDays(weekStart(today), -7 * back);
  const input = progressInput(st, today);
  const week = useMemo(() => weekLedger(input, st.lt_events.values(), monday), [input, st.lt_events, monday]);
  const ranking = useMemo(() => normaliseRanking(prefValue(st, 'hq_priorities')), [st]);
  const rows = useMemo(() => priorityGap(input, ranking), [input, ranking]);
  const move = (i: number, d: -1 | 1) => {
    const next = [...ranking];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setPref('hq_priorities', next);
  };
  const short = rows.filter((r) => r.gap >= 2).sort((a, b) => b.gap - a.gap)[0];
  const over = rows.filter((r) => r.gap <= -2).sort((a, b) => a.gap - b.gap)[0];
  const parts = [...week.lines, ...(week.unaccounted ? [{ id: 'spare', label: 'Unaccounted', minutes: week.unaccounted }] : [])];
  return (
    <div>
      <RoomHead room="ledger" />
      <div className="i-chips" role="group" aria-label="Which week">
        {['This week', 'Last week', 'Two weeks ago'].map((l, i) => (
          <button key={l} type="button" className="i-chip" aria-pressed={back === i} onClick={() => setBack(i)}>
            {l}
          </button>
        ))}
      </div>
      <H2 aside={rangeLabel(monday, addDays(monday, 6))}>{back === 0 ? `${week.days * 24} of 168 hours so far` : '168 hours'}</H2>
      <div className="i-pnl i-stack">
        <div className="lg-bar" role="img" aria-label={parts.map((p) => `${p.label} ${hrs(p.minutes)}`).join(', ')}>
          {parts.map((p) => (
            <i key={p.id} style={{ flexGrow: p.minutes, background: lineColor(p.id) } as CSSProperties} />
          ))}
        </div>
        <ul className="lg-lines">
          {parts.map((p) => (
            <li key={p.id}>
              <i style={{ background: lineColor(p.id) }} aria-hidden="true" />
              <span>{p.label}</span>
              <b className="i-mono">{hrs(p.minutes)}</b>
              <small className="i-mono">{week.total ? Math.round((p.minutes / week.total) * 100) : 0}%</small>
            </li>
          ))}
        </ul>
        {(week.nightsMissing > 0 || week.screenDaysMissing > 0) && (
          <p className="i-note">
            Reads high on Unaccounted: {week.nightsMissing > 0 ? `${week.nightsMissing} ${week.nightsMissing === 1 ? 'night' : 'nights'} and ` : ''}
            {week.screenDaysMissing} screen {week.screenDaysMissing === 1 ? 'day' : 'days'} not logged. Unaccounted includes meals, travel and anything else with no log, and screen time can overlap other things.
          </p>
        )}
      </div>

      <H2 aside="last 4 weeks">What you say matters</H2>
      <p className="i-note">Put these in the order you’d defend out loud. Then look at the second column.</p>
      <div className="i-pnl i-pnl--flush">
        {rows.map((r, i) => (
          <div key={r.section} className="lg-row" style={accent(r.section)}>
            <span className="lg-row__rank i-mono">{r.rank}</span>
            <span className="lg-row__t">
              <b>{sectionInfo(r.section).name}</b>
              <small>
                {hrs(r.minutes)} · {Math.round(r.share * 100)}% · {r.actual === r.rank ? (r.minutes ? 'matches your time' : 'no time yet') : `#${r.actual} by time`}
              </small>
            </span>
            {r.gap !== 0 && <span className={`i-tag ${r.gap > 0 ? 'i-tag--warn' : ''}`}>{r.gap > 0 ? `${r.gap} short` : `${-r.gap} over`}</span>}
            <span className="lg-row__move">
              <button type="button" className="i-btn i-btn--sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${sectionInfo(r.section).name} up`}>
                ▲
              </button>
              <button type="button" className="i-btn i-btn--sm" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${sectionInfo(r.section).name} down`}>
                ▼
              </button>
            </span>
          </div>
        ))}
      </div>
      {short && <p className="hq-verdict">You rank {sectionInfo(short.section).name} #{short.rank}, and your time ranks it #{short.actual}.{over ? ` ${sectionInfo(over.section).name} is taking what it isn’t getting.` : ''}</p>}
      {!short && rows.some((r) => r.minutes > 0) && <p className="hq-verdict">Your time roughly matches what you say matters. That’s rarer than you’d think.</p>}
      <Source kind="live">From your own log and calendar.</Source>
    </div>
  );
}
