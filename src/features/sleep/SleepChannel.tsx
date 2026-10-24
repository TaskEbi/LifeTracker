import { useMemo } from 'react';
import { openSheet } from '../../app/sheets';
import { setPref, useSleepSchedule, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { addDays, shortDay, weekdayIndex } from '../../domain/log/dates';
import { formatMinutes, shortMinutes } from '../../domain/log/duration';
import { bedDelta, RULES } from '../../domain/progress/engine';
import type { SleepSchedule } from '../../domain/prefs';
import { useStore } from '../../lib/createStore';
import { accent, H2, Meter, Source, Stepper, Toggle } from '../../ui/i/bits';
import { Line } from '../../ui/i/charts';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { Icon } from '../../ui/i/Icon';
import { fromMin, nightsFrom, plannedFor, sleepStats, toMin, windDownAt, type Night } from './model';
import './SleepSheet';
import './sleep.css';
import { SleepArt } from './Art';
import './theme.css';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** Bars from bedtime to wake on a 21:00 → 10:00 axis, the planned window shaded behind. */
function Timeline({ nights, schedule }: { nights: Night[]; schedule: SleepSchedule }) {
  const W = 330;
  const rh = 24;
  const top = 18;
  const l = 46;
  const r = 44;
  const start = 21 * 60;
  const span = 13 * 60;
  const x = (t: string) => {
    const m = toMin(t);
    const v = m < 12 * 60 ? m + 1440 : m;
    return l + (Math.max(start, Math.min(start + span, v)) - start) / span * (W - l - r);
  };
  const H = top + nights.length * rh + 4;
  return (
    <svg className="s-tl" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Nightly timeline: bedtime to wake, planned window shaded">
      {['21:00', '00:00', '03:00', '06:00', '09:00'].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={12} y2={H - 2} className="s-grid" />
          <text x={x(t)} y={9} textAnchor="middle" className="s-ax">
            {t}
          </text>
        </g>
      ))}
      {nights.map((n, i) => {
        const y = top + i * rh;
        const p = plannedFor(n.date, schedule);
        const ok = n.bed ? Math.abs(bedDelta({ date: n.date, bed: n.bed }, schedule)) <= RULES.bedtimeWindow : true;
        return (
          <g key={n.date}>
            <rect x={x(p.bed)} y={y + 3} width={Math.max(0, x(p.wake) - x(p.bed))} height={rh - 6} rx={4} className="s-win" />
            {n.bed && n.wake ? (
              <rect x={x(n.bed)} y={y + 7} width={Math.max(3, x(n.wake) - x(n.bed))} height={rh - 14} rx={3} className={`s-bar${ok ? '' : ' is-off'}`}>
                <title>{`${shortDay(n.date)}: ${n.bed}–${n.wake}`}</title>
              </rect>
            ) : (
              <text x={(x(p.bed) + x(p.wake)) / 2} y={y + rh / 2 + 3.5} textAnchor="middle" className="s-ax">
                total only
              </text>
            )}
            <text x={0} y={y + rh / 2 + 3.5} className="s-d">
              {DAYS[weekdayIndex(n.date)]} {+n.date.slice(8)}
            </text>
            <text x={W} y={y + rh / 2 + 3.5} textAnchor="end" className="s-d">
              {shortMinutes(n.minutes)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ScheduleRow({ label, hint, value, onChange }: { label: string; hint: string; value: { bed: string; wake: string }; onChange: (v: { bed: string; wake: string }) => void }) {
  return (
    <div className="i-kv">
      <span>
        {label}
        <br />
        <span className="i-mono i-small i-dim">{hint}</span>
      </span>
      <span style={{ display: 'grid', gap: 4, justifyItems: 'end' }}>
        <Stepper value={`bed ${value.bed}`} label={`${label} bedtime`} onStep={(s) => onChange({ ...value, bed: fromMin(toMin(value.bed) + 15 * s) })} />
        <Stepper value={`up ${value.wake}`} label={`${label} wake time`} onStep={(s) => onChange({ ...value, wake: fromMin(toMin(value.wake) + 15 * s) })} />
      </span>
    </div>
  );
}

export function SleepChannel() {
  const today = useToday();
  const schedule = useSleepSchedule();
  const metrics = useStore(data, (s) => s.log_metrics);
  const nightRows = useStore(data, (s) => s.lt_nights);
  const nights = useMemo(() => nightsFrom(metrics.values(), nightRows.values()), [metrics, nightRows]);
  const last = nights.find((n) => n.date === today);
  const week = sleepStats(nights, addDays(today, -6), today, schedule);
  const recent = nights.filter((n) => n.date > addDays(today, -10)).reverse();
  const trend = nights.filter((n) => n.date > addDays(today, -14));
  const setSchedule = (patch: Partial<SleepSchedule>) => setPref('sleep', { ...schedule, ...patch });

  return (
    <div style={accent('sleep')}>
      <ChannelHead id="sleep" art={<SleepArt />} />
      <div className="s-night">
        {last ? (
          <>
            <span className="i-lab">Last night</span>
            <b className="s-big i-mono">{formatMinutes(last.minutes)}</b>
            <span className="i-mono s-dim">
              {last.bed ? `${last.bed} → ${last.wake}` : 'total only'}
              {last.score != null ? ` · score ${last.score}` : ''}
            </span>
            <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'sleep', date: today })}>
              Edit
            </button>
          </>
        ) : (
          <>
            <span className="i-lab">Last night isn't logged</span>
            <span className="s-dim">Planned {plannedFor(today, schedule).bed} → {plannedFor(today, schedule).wake}</span>
            <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'sleep', date: today })}>
              <Icon name="plus" /> Log last night
            </button>
          </>
        )}
        <Source>Manual entry. A Garmin sleep import isn't built; nights from Curio Cabinet's Daily Log show here too.</Source>
      </div>

      <div className="i-meters i-meters--4" style={{ marginTop: 10 }}>
        <Meter value={week.avgMinutes != null ? formatMinutes(week.avgMinutes) : '—'} label={`Average · ${week.nights} of 7 nights`} />
        <Meter value={week.spread != null ? `±${week.spread}m` : '—'} label="Bedtime spread (lower is steadier)" />
        <Meter value={week.withBed ? `${week.inWindow}/${week.withBed}` : '—'} label={`Within ${RULES.bedtimeWindow} min of plan`} />
        <Meter value={week.avgBed ?? '—'} label={week.avgScore != null ? `Average bedtime · score ${week.avgScore}` : 'Average bedtime'} />
      </div>

      <div className="i-cols">
        <div>
          <H2 aside="shaded = planned">Nightly timeline</H2>
          <div className="i-pnl">{recent.length ? <Timeline nights={recent} schedule={schedule} /> : <p className="i-note">Nights you log appear here.</p>}</div>
        </div>
        <div>
          <H2 aside="hours · 14 nights">Duration</H2>
          <div className="i-pnl">
            <Line values={trend.map((n) => Math.round(n.minutes / 6) / 10)} labels={trend.map((n) => n.date.slice(8))} long={trend.map((n) => shortDay(n.date))} fmt={(v) => `${v}h`} every={2} caption="Hours asleep per night, last 14 nights" />
          </div>
        </div>
      </div>

      <H2 aside="tap to edit">Nights</H2>
      <div className="i-pnl i-pnl--flush">
        {recent.length ? (
          recent.map((n) => (
            <button key={n.date} type="button" className="i-row" onClick={() => openSheet({ type: 'sleep', date: n.date })}>
              <span className="i-row__t">
                <b>{shortDay(n.date)}</b>
                <small>
                  {n.bed ? `${n.bed} → ${n.wake}` : 'total only'}
                  {n.score != null ? ` · score ${n.score}` : ''}
                </small>
              </span>
              <span className="i-row__n">{formatMinutes(n.minutes)}</span>
            </button>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>No nights yet.</p>
        )}
      </div>

      <H2>Schedule</H2>
      <div className="i-pnl i-pnl--flush">
        <ScheduleRow label="School nights" hint="Sunday to Thursday" value={schedule.weekday} onChange={(weekday) => setSchedule({ weekday })} />
        <ScheduleRow label="Weekends" hint="Friday and Saturday" value={schedule.weekend} onChange={(weekend) => setSchedule({ weekend })} />
        <div className="i-kv">
          <span>Wind down before bed</span>
          <Stepper value={`${schedule.windDown} min`} label="wind-down" onStep={(s) => setSchedule({ windDown: Math.max(0, Math.min(120, schedule.windDown + 15 * s)) })} />
        </div>
        <Toggle on={schedule.reminders} label="Wind-down reminder" hint={`shows on Today at ${windDownAt(today, schedule)} tonight`} onChange={(reminders) => setSchedule({ reminders })} />
      </div>
      <p className="i-note" style={{ marginTop: 6 }}>
        The reminder appears inside LifeTracker. Phone notifications would need push setup that isn't built. XP rewards logging and a steady bedtime, never less sleep.
      </p>
    </div>
  );
}
