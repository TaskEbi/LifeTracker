/** /sports/race: pace band, fuel and what to do when, worked out from your marathon goal. */
import { useMemo, useState } from 'react';
import { navigate } from '../../app/router';
import { prefValue, setPref, usePlans, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { fuelPlan, paceBand, RACE_STEPS } from '../../domain/hq/body2';
import { dayCount, shortDay } from '../../domain/log/dates';
import { raceDate } from '../../domain/plans/marathon';
import { DEFAULT_GOAL, parseHms } from '../../domain/plans/types';
import { useStore } from '../../lib/createStore';
import { accent, Chips, H2, Source } from '../../ui/i/bits';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { SportsArt } from './Art';
import './road.css';

export function RaceKit() {
  const today = useToday();
  const plans = usePlans();
  const st = useStore(data, (s) => s);
  const planned = plans.marathon?.goal ?? DEFAULT_GOAL;
  const [goal, setGoal] = useState(planned.replace(/:00$/, ''));
  const [neg, setNeg] = useState('1');
  const secs = parseHms(goal);
  const band = useMemo(() => (secs ? paceBand(secs, Number(neg) / 100) : []), [secs, neg]);
  const fuel = useMemo(() => (secs ? fuelPlan(secs) : []), [secs]);
  const checks = useMemo(() => {
    const v = prefValue(st, 'race_checks');
    return new Set(Array.isArray(v) ? (v as string[]) : []);
  }, [st]);
  const flip = (id: string) => {
    const next = new Set(checks);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPref('race_checks', [...next]);
  };
  const race = plans.marathon ? raceDate(plans.marathon.start) : null;
  return (
    <div style={accent('sports')}>
      <ChannelHead id="sports" sub="race kit" art={<SportsArt />} />
      <button type="button" className="i-link" onClick={() => navigate('sports')}>
        ◀ Back to training
      </button>
      {race && race >= today && (
        <p className="i-note">
          Race day: {shortDay(race, today)}, {dayCount(today, race) - 1} days to go.
        </p>
      )}
      <label className="i-field">
        <span className="i-lab">Goal time (h:mm)</span>
        <input className="i-input" value={goal} onChange={(e) => setGoal(e.target.value)} inputMode="numeric" aria-label="Goal time" />
      </label>
      {!secs && <p className="i-error" role="alert">Write it as hours and minutes, like 4:10.</p>}
      <Chips label="Second half quicker by" value={neg} onChange={setNeg} options={[{ id: '0', label: 'Even splits' }, { id: '1', label: '1% negative' }, { id: '2', label: '2% negative' }]} />
      {secs && (
        <>
          <H2 aside="on the clock">Pace band</H2>
          <div className="i-pnl">
            <table className="rk-band">
              <thead>
                <tr>
                  <th scope="col">Mark</th>
                  <th scope="col">Time</th>
                  <th scope="col">Pace /km</th>
                </tr>
              </thead>
              <tbody>
                {band.map((b) => (
                  <tr key={b.label} className={b.label === 'Half' ? 'is-half' : ''}>
                    <td>{b.label}</td>
                    <td>{b.at}</td>
                    <td>{b.pace}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <H2 aside="practise on long runs">Fuel plan</H2>
          <div className="i-pnl i-pnl--flush">
            {fuel.map((f) => (
              <div key={f.minute} className="i-row">
                <span className="i-row__t">
                  <b>{f.what}</b>
                  <small>about km {f.km}</small>
                </span>
                <span className="i-row__n">{f.minute} min</span>
              </div>
            ))}
          </div>
        </>
      )}
      <H2 aside={`${[...checks].filter((c) => RACE_STEPS.some((s) => s.id === c)).length}/${RACE_STEPS.length}`}>What to do when</H2>
      <div className="i-pnl i-pnl--flush">
        {RACE_STEPS.map((s) => (
          <button key={s.id} type="button" role="checkbox" aria-checked={checks.has(s.id)} className={`rk-step${checks.has(s.id) ? ' is-done' : ''}`} onClick={() => flip(s.id)}>
            <span className="rk-step__box" aria-hidden="true">
              {checks.has(s.id) ? '✓' : ''}
            </span>
            <span>
              <b>{s.when}</b>
              {s.what}
            </span>
          </button>
        ))}
      </div>
      <Source kind="off">Common marathon guidance, worked out for your goal. Gut training and fuelling vary a lot from person to person: test it all on long runs, and it isn’t medical advice.</Source>
    </div>
  );
}
