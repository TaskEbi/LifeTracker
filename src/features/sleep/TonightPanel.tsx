/** Sleep's "tonight" panel: what you owe from the last two weeks and when bed has to be. */
import { useMemo } from 'react';
import { useSleepSchedule, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { occurrences } from '../../domain/calendar/occurrences';
import { sleepBank, tonight } from '../../domain/hq/sleepBank';
import { addDays } from '../../domain/log/dates';
import { formatMinutes, shortMinutes } from '../../domain/log/duration';
import { useStore } from '../../lib/createStore';
import { H2 } from '../../ui/i/bits';

const STATE = { unknown: 'Log three nights to see this', clear: 'All paid up', light: 'A little owed', heavy: 'Running on empty' } as const;

export function TonightPanel() {
  const today = useToday();
  const schedule = useSleepSchedule();
  const metrics = useStore(data, (s) => s.log_metrics);
  const events = useStore(data, (s) => s.lt_events);
  const bank = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of metrics.values()) if (!r.deleted_at && r.metric === 'sleep') m.set(r.date, r.minutes);
    return sleepBank(m, today, schedule);
  }, [metrics, today, schedule]);
  const first = useMemo(() => {
    const tomorrow = addDays(today, 1);
    const hit = occurrences(events.values(), tomorrow, tomorrow).filter((o) => !o.cancelled && o.start).sort((a, b) => a.start!.localeCompare(b.start!))[0];
    return hit ? { title: hit.event.title, start: hit.start! } : null;
  }, [events, today]);
  const t = tonight(today, schedule, bank, first);
  return (
    <>
      <H2 aside={STATE[bank.state]}>Tonight</H2>
      <div className="i-pnl i-stack s-tonight">
        <div className="s-tonight__row">
          <div>
            <span className="i-lab">In bed by</span>
            <b className="i-mono">{t.bed}</b>
          </div>
          <div>
            <span className="i-lab">Up at</span>
            <b className="i-mono">{t.wake}</b>
          </div>
          <div>
            <span className="i-lab">Sleep owed</span>
            <b className="i-mono">{bank.state === 'unknown' ? '—' : shortMinutes(bank.debt)}</b>
          </div>
        </div>
        <p className="i-note">{t.because.join(' · ')}.</p>
        <p className="i-note">What you owe is the last two weeks against the {formatMinutes(bank.need)} your schedule asks for, with recent nights counting most. Sleep can’t be banked in advance.</p>
      </div>
    </>
  );
}
