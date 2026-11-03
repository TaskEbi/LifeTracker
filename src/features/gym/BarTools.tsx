/** Gym: what plates to load, your estimated one-rep max, and how to warm up to it. */
import { useMemo, useState } from 'react';
import { useToday } from '../../data/lt';
import { estimateMax, platesFor, roundToPlates, warmUp } from '../../domain/hq/body2';
import { H2, Source, Stepper } from '../../ui/i/bits';
import { isGymDetail, type GymSession } from './model';
import { shortDay } from '../../domain/log/dates';

const PLATE_COLOR: Record<number, string> = { 25: '#d03a3a', 20: '#2f6fd0', 15: '#e0b520', 10: '#3a9a55', 5: '#f2f2f2', 2.5: '#3a3a3a', 1.25: '#b8b8b8' };

function Barbell({ side, bar }: { side: number[]; bar: number }) {
  const W = 320;
  const c = W / 2;
  const h = (p: number) => 34 + p * 1.6;
  let x = c - 44;
  const plates: { x: number; w: number; p: number }[] = [];
  for (const p of side) {
    const w = p >= 10 ? 12 : p >= 5 ? 8 : 5;
    x -= w + 1;
    plates.push({ x, w, p });
  }
  return (
    <svg className="bt-bar" viewBox={`0 0 ${W} 90`} role="img" aria-label={side.length ? `Each side: ${side.join(', ')} kilograms, on a ${bar} kilogram bar` : `Just the ${bar} kilogram bar`}>
      <rect x="8" y="42" width={W - 16} height="6" fill="#8b8f96" />
      <rect x={c - 44} y="38" width="88" height="14" fill="#6d7178" />
      {plates.map((pl, i) => (
        <g key={i}>
          <rect x={pl.x} y={45 - h(pl.p) / 2} width={pl.w} height={h(pl.p)} rx="2" fill={PLATE_COLOR[pl.p] ?? '#999'} />
          <rect x={W - pl.x - pl.w} y={45 - h(pl.p) / 2} width={pl.w} height={h(pl.p)} rx="2" fill={PLATE_COLOR[pl.p] ?? '#999'} />
        </g>
      ))}
    </svg>
  );
}

export function BarTools({ sessions }: { sessions: GymSession[] }) {
  const today = useToday();
  const [target, setTarget] = useState(60);
  const [bar, setBar] = useState(20);
  const [lift, setLift] = useState(60);
  const [reps, setReps] = useState(5);
  const load = useMemo(() => platesFor(target, bar), [target, bar]);
  const max = estimateMax(lift, reps);
  const ramp = useMemo(() => warmUp(target, bar), [target, bar]);
  const bests = useMemo(() => {
    const by = new Map<string, { kg: number; from: string; date: string }>();
    for (const s of sessions) {
      if (!isGymDetail(s.detail)) continue;
      for (const ex of s.detail.exercises) {
        if (ex.unit === 's') continue;
        for (const set of ex.sets) {
          if (!set.done || set.weight <= 0 || set.reps <= 0) continue;
          const kg = estimateMax(set.weight, set.reps);
          const cur = by.get(ex.name);
          if (!cur || kg > cur.kg) by.set(ex.name, { kg, from: `${set.weight} kg × ${set.reps}`, date: s.entry.date });
        }
      }
    }
    return [...by].sort((a, b) => b[1].kg - a[1].kg).slice(0, 6);
  }, [sessions]);
  return (
    <>
      <H2>Bar tools</H2>
      <div className="i-pnl i-stack">
        <div className="i-kv">
          <span>On the bar</span>
          <Stepper value={`${target} kg`} label="weight on the bar" onStep={(s) => setTarget(Math.max(bar, target + 2.5 * s))} />
        </div>
        <div className="i-kv">
          <span>Bar</span>
          <Stepper value={`${bar} kg`} label="bar weight" onStep={(s) => setBar(Math.max(5, Math.min(25, bar + 5 * s)))} />
        </div>
        <Barbell side={load.side} bar={bar} />
        <p className="bt-load">{load.side.length ? `Each side: ${load.side.join(' + ')} kg` : 'Just the bar'}</p>
        {load.off !== 0 && <p className="i-note">Closest you can make is {load.total} kg.</p>}
        {ramp.length > 0 && (
          <p className="i-note">
            Warm-up to {target} kg: {ramp.map((r) => `${r.weight} × ${r.reps}`).join(', ')}.
          </p>
        )}
      </div>
      <H2 aside="Epley formula">Estimated one-rep max</H2>
      <div className="i-pnl i-stack">
        <div className="i-kv">
          <span>Weight</span>
          <Stepper value={`${lift} kg`} label="weight lifted" onStep={(s) => setLift(Math.max(2.5, lift + 2.5 * s))} />
        </div>
        <div className="i-kv">
          <span>Reps</span>
          <Stepper value={reps} label="reps" onStep={(s) => setReps(Math.max(1, Math.min(20, reps + s)))} />
        </div>
        <p className="bt-load">About {max} kg</p>
        <p className="i-note">
          {[90, 80, 70, 60].map((p) => `${p}% ${roundToPlates((max * p) / 100)}`).join(' · ')} kg
          {reps > 12 ? ' · past 12 reps this is only a rough guide' : ''}
        </p>
        {bests.length > 0 && (
          <div className="i-rows">
            {bests.map(([name, b]) => (
              <div key={name} className="i-row" style={{ minHeight: 38, padding: '6px 0' }}>
                <span className="i-row__t">
                  {name}
                  <small>
                    {b.from}, {shortDay(b.date, today)}
                  </small>
                </span>
                <span className="i-row__n">≈ {b.kg} kg</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Source kind="off">An estimate for choosing weights, not a target to test. Plates assume a full set down to 1.25 kg.</Source>
    </>
  );
}
