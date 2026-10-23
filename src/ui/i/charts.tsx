/**
 * Scope-style charts drawn to one scale, each with a "Show as a table" alternative.
 * Values come straight from the records; nothing here invents data.
 */
import { useId } from 'react';

const niceStep = (raw: number) => {
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
};

function DataTable({ labels, values, fmt, caption }: { labels: string[]; values: number[]; fmt: (v: number) => string; caption: string }) {
  return (
    <details className="i-chart-table">
      <summary>Show as a table</summary>
      <table>
        <caption className="i-sr">{caption}</caption>
        <tbody>
          {labels.map((l, i) => (
            <tr key={`${l}-${i}`}>
              <th scope="row">{l}</th>
              <td>{fmt(values[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

interface BarsProps {
  values: number[];
  labels: string[];
  /** Full labels for the table and tooltips (defaults to labels). */
  long?: string[];
  target?: number | null;
  /** Indexes drawn in full colour (e.g. the current week). */
  hi?: number[];
  max?: number;
  fmt?: (v: number) => string;
  caption: string;
  height?: number;
}

export function Bars({ values, labels, long, target, hi = [], max, fmt = (v) => `${v}`, caption, height = 150 }: BarsProps) {
  const w = 340;
  const pad = { t: 16, r: 8, b: 22, l: 34 };
  const rawMax = Math.max(...values, target ?? 0, 1) * 1.05;
  let ticks = 3;
  const step = niceStep((max ?? rawMax) / ticks);
  const top = max ?? Math.ceil(rawMax / step) * step;
  if (!max) ticks = Math.max(1, Math.round(top / step));
  const iw = w - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const bw = iw / Math.max(1, values.length);
  const y = (v: number) => pad.t + ih - (v / top) * ih;
  const id = useId();
  return (
    <figure style={{ margin: 0 }} aria-labelledby={id}>
      <svg className="i-chart" viewBox={`0 0 ${w} ${height}`} role="img" aria-labelledby={id}>
        <title id={id}>{caption}</title>
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = (top / ticks) * i;
          return (
            <g key={i}>
              <line className="g" x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} />
              <text className="ax" x={pad.l - 6} y={y(v) + 3.5} textAnchor="end">
                {fmt(Math.round(v))}
              </text>
            </g>
          );
        })}
        {values.map((v, i) => {
          const x = pad.l + i * bw + bw * 0.18;
          const bwid = bw * 0.64;
          const cls = `bar${hi.includes(i) ? ' hi' : ''}${target && v >= target ? ' met' : ''}`;
          return (
            <g key={i}>
              <rect className={cls} x={x} y={y(v)} width={bwid} height={Math.max(0, pad.t + ih - y(v))} rx={2}>
                <title>{`${(long ?? labels)[i]}: ${fmt(v)}`}</title>
              </rect>
              <text className={`lb${hi.includes(i) ? ' hi' : ''}`} x={x + bwid / 2} y={height - 6} textAnchor="middle">
                {labels[i]}
              </text>
            </g>
          );
        })}
        {target ? (
          <>
            <line className="tg" x1={pad.l} x2={w - pad.r} y1={y(target)} y2={y(target)} />
            <text className="tgl" x={w - pad.r} y={10} textAnchor="end">
              - - target {fmt(target)}
            </text>
          </>
        ) : null}
      </svg>
      <DataTable labels={long ?? labels} values={values} fmt={fmt} caption={caption} />
    </figure>
  );
}

interface LineProps {
  values: number[];
  labels: string[];
  long?: string[];
  fmt?: (v: number) => string;
  every?: number;
  min?: number;
  max?: number;
  caption: string;
  height?: number;
}

export function Line({ values, labels, long, fmt = (v) => `${v}`, every = 1, min, max, caption, height = 150 }: LineProps) {
  const w = 340;
  const pad = { t: 14, r: 12, b: 22, l: 38 };
  const id = useId();
  if (values.length < 2) return <p className="i-note">Not enough records yet to draw a trend.</p>;
  let ticks = 3;
  const lo0 = min ?? Math.min(...values);
  const hi0 = max ?? Math.max(...values);
  const st = niceStep((hi0 - lo0 || 1) / ticks);
  const lo = min ?? Math.floor(lo0 / st) * st;
  const hi = max ?? Math.max(lo + st * ticks, Math.ceil(hi0 / st) * st);
  ticks = Math.max(1, Math.round((hi - lo) / st));
  const iw = w - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const n = values.length;
  const x = (i: number) => pad.l + (i / (n - 1)) * iw;
  const y = (v: number) => pad.t + ih - ((v - lo) / (hi - lo || 1)) * ih;
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  return (
    <figure style={{ margin: 0 }}>
      <svg className="i-chart" viewBox={`0 0 ${w} ${height}`} role="img" aria-labelledby={id}>
        <title id={id}>{caption}</title>
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = lo + ((hi - lo) / ticks) * i;
          return (
            <g key={i}>
              <line className="g" x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} />
              <text className="ax" x={pad.l - 6} y={y(v) + 3.5} textAnchor="end">
                {fmt(Math.round(v * 10) / 10)}
              </text>
            </g>
          );
        })}
        {labels.map((l, i) =>
          i % every === 0 || i === n - 1 ? (
            <text key={i} className="lb" x={x(i)} y={height - 6} textAnchor="middle">
              {l}
            </text>
          ) : null,
        )}
        <path className="ar" d={`M${pts[0]} L${pts.join(' L')} L${x(n - 1)},${pad.t + ih} L${x(0)},${pad.t + ih} Z`} />
        <polyline className="ln" points={pts.join(' ')} />
        {values.map((v, i) => (
          <circle key={i} className={`dt${i === n - 1 ? ' end' : ''}`} cx={x(i)} cy={y(v)} r={i === n - 1 ? 4 : 2.4}>
            <title>{`${(long ?? labels)[i]}: ${fmt(v)}`}</title>
          </circle>
        ))}
      </svg>
      <DataTable labels={long ?? labels} values={values} fmt={fmt} caption={caption} />
    </figure>
  );
}

/** 28-day activity matrix: one cell per day, darker for more. */
export function Matrix({ days, today, label }: { days: { date: string; minutes: number }[]; today: string; label: string }) {
  return (
    <div className="i-matrix" role="img" aria-label={label}>
      {days.map((d) => (
        <i key={d.date} className={`${d.minutes === 0 ? '' : d.minutes < 40 ? 'l1' : d.minutes < 90 ? 'l2' : 'l3'}${d.date === today ? ' now' : ''}`} title={`${d.date}: ${d.minutes} min`} />
      ))}
    </div>
  );
}
