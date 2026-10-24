import { useMemo, useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { ltToday, setTargets, useTargets, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { addDays, shortDay, weekStart } from '../../domain/log/dates';
import { formatMinutes } from '../../domain/log/duration';
import { useStore } from '../../lib/createStore';
import { accent, H2, Meter, Source, Stepper, Toggle } from '../../ui/i/bits';
import { Bars } from '../../ui/i/charts';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { Icon } from '../../ui/i/Icon';
import { RelatedTasks } from '../../ui/i/RelatedTasks';
import { Sheet } from '../../ui/i/Sheet';
import { clearScreen, saveScreen } from '../sleep/actions';
import { ScreenArt } from './Art';
import './theme.css';

function useScreenDays(): Map<string, number> {
  const metrics = useStore(data, (s) => s.log_metrics);
  return useMemo(() => {
    const m = new Map<string, number>();
    for (const r of metrics.values()) if (!r.deleted_at && r.metric === 'screen') m.set(r.date, r.minutes);
    return m;
  }, [metrics]);
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

function ScreenSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const [date, setDate] = useState((spec.date as string) ?? today);
  const existing = [...data.get().log_metrics.values()].find((m) => m.metric === 'screen' && m.date === date && !m.deleted_at);
  const target = useTargets().screenDay;
  const [minutes, setMinutes] = useState(existing?.minutes ?? 180);
  const [h, setH] = useState(String(Math.floor((existing?.minutes ?? 180) / 60)));
  const [m, setM] = useState(String((existing?.minutes ?? 180) % 60));
  const [error, setError] = useState<string | null>(null);
  const set = (v: number) => {
    const c = Math.max(0, Math.min(1440, v));
    setMinutes(c);
    setH(String(Math.floor(c / 60)));
    setM(String(c % 60));
  };
  const typed = (hh: string, mm: string) => {
    setH(hh);
    setM(mm);
    const v = (parseInt(hh || '0', 10) || 0) * 60 + (parseInt(mm || '0', 10) || 0);
    if (v >= 0 && v <= 1440) setMinutes(v);
  };
  const save = () => {
    const err = saveScreen(date, minutes);
    if (err) setError(err);
    else closeSheet();
  };
  return (
    <Sheet
      title="CH08 · screen time"
      onClose={closeSheet}
      accent="screen"
      footer={
        <>
          {existing && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (clearScreen(date), closeSheet())}>
              Clear
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
            Save {formatMinutes(minutes)}
          </button>
        </>
      }
    >
      <div className="i-picks" role="group" aria-label="Day">
        {[today, addDays(today, -1)].map((d, i) => (
          <button key={d} type="button" className="i-pick" aria-pressed={date === d} onClick={() => setDate(d)}>
            {i === 0 ? 'Today' : 'Yesterday'}
          </button>
        ))}
      </div>
      <div className="i-dial">
        <button type="button" className="i-sq" onClick={() => set(minutes - 15)} aria-label="15 minutes less">
          −15
        </button>
        <output aria-live="polite" style={{ fontSize: 40 }}>
          {formatMinutes(minutes)}
          <small>{target == null ? 'no target set' : minutes <= target ? 'within your target' : `${minutes - target} min over target`}</small>
        </output>
        <button type="button" className="i-sq" onClick={() => set(minutes + 15)} aria-label="15 minutes more">
          +15
        </button>
      </div>
      <div className="i-picks" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <input className="i-input" inputMode="numeric" value={h} onChange={(e) => typed(e.target.value.replace(/\D/g, '').slice(0, 2), m)} aria-label="Hours" style={{ width: 70, textAlign: 'center' }} />
        <span className="i-mono">h</span>
        <input className="i-input" inputMode="numeric" value={m} onChange={(e) => typed(h, e.target.value.replace(/\D/g, '').slice(0, 2))} aria-label="Minutes" style={{ width: 70, textAlign: 'center' }} />
        <span className="i-mono">m</span>
      </div>
      {error && (
        <p className="i-error" role="alert">
          {error}
        </p>
      )}
      <p className="i-note">Copy the day's total from Settings → Screen Time on your iPhone. A web app can't read it directly.</p>
    </Sheet>
  );
}
registerSheet('screen', ScreenSheet);

export function ScreenChannel() {
  const today = useToday();
  const days = useScreenDays();
  const targets = useTargets();
  const target = targets.screenDay;
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const thisWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart(today), i)).filter((d) => d <= today);
  const lastWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart(today), i - 7));
  const tw = avg(thisWeek.map((d) => days.get(d)).filter((v): v is number => v != null));
  const lw = avg(lastWeek.map((d) => days.get(d)).filter((v): v is number => v != null));
  const todayVal = days.get(today);

  return (
    <div style={accent('screen')}>
      <ChannelHead id="screen" art={<ScreenArt />} />
      <div className="i-pnl i-stack">
        {todayVal != null ? (
          <>
            <span className="i-lab">Today</span>
            <b className="i-mono" style={{ fontSize: 40, fontWeight: 400, letterSpacing: '-.03em' }}>
              {formatMinutes(todayVal)}
            </b>
            <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'screen', date: today })} style={{ justifySelf: 'start' }}>
              Edit
            </button>
          </>
        ) : (
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'screen', date: today })}>
            <Icon name="plus" /> Enter today's total
          </button>
        )}
        <Source kind="off">Manual daily totals. A web app can't read iPhone Screen Time; a native companion would need separate investigation.</Source>
      </div>
      <div className="i-meters" style={{ marginTop: 10 }}>
        <Meter value={tw != null ? formatMinutes(tw) : '—'} label="Daily average · this week" />
        <Meter value={tw != null && lw != null ? <span style={{ color: tw <= lw ? 'var(--ok)' : 'var(--warn)' }}>{tw <= lw ? '−' : '+'}{Math.abs(tw - lw)}m</span> : '—'} label={`vs last week${lw != null ? ` (${formatMinutes(lw)})` : ''}`} />
      </div>
      <H2 aside="hours a day">Last 14 days</H2>
      <div className="i-pnl">
        <Bars values={last14.map((d) => days.get(d) ?? 0)} labels={last14.map((d) => shortDay(d).slice(0, 1))} long={last14.map((d) => `${shortDay(d)}${days.has(d) ? '' : ' (not entered)'}`)} target={target} hi={[13]} fmt={(v) => `${Math.round((v / 60) * 10) / 10}h`} caption="Screen time per day, last 14 days" />
      </div>
      <H2 aside="tap to edit">Days</H2>
      <div className="i-pnl i-pnl--flush">
        {last14
          .filter((d) => days.has(d))
          .reverse()
          .map((d) => (
            <button key={d} type="button" className="i-row" onClick={() => openSheet({ type: 'screen', date: d })}>
              <span className="i-row__t">
                <b>{shortDay(d)}</b>
                {target != null && <small>{days.get(d)! <= target ? 'within target' : `${days.get(d)! - target} min over`}</small>}
              </span>
              <span className="i-row__n">{formatMinutes(days.get(d)!)}</span>
            </button>
          ))}
        {!last14.some((d) => days.has(d)) && <p className="i-note" style={{ padding: '12px 0' }}>No totals entered in the last two weeks.</p>}
      </div>
      <H2>Personal target</H2>
      <div className="i-pnl i-pnl--flush">
        <Toggle on={target != null} label="Use a daily target" hint="optional; changes apply from this week on" onChange={(on) => setTargets({ screenDay: on ? 210 : null })} />
        {target != null && (
          <div className="i-kv">
            <span>Daily target</span>
            <Stepper value={formatMinutes(target)} label="daily target" onStep={(s) => setTargets({ screenDay: Math.max(15, target + 15 * s) })} />
          </div>
        )}
      </div>
      <RelatedTasks section="screen" />
    </div>
  );
}
