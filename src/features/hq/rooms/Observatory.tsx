/** 天文台: where the current pace leads, and what a little more each day would change. */
import { useMemo, useState } from 'react';
import { progressInput, progressOf, useToday } from '../../../data/lt';
import { data } from '../../../data/store';
import { TIMED_SECTIONS, type TimedSection } from '../../../data/types';
import { masteryClocks, nextMilestones, runways, xpFromExtraMinutes, xpRate } from '../../../domain/hq/forecast';
import { shortDay } from '../../../domain/log/dates';
import { sectionInfo } from '../../../domain/sections';
import { useStore } from '../../../lib/createStore';
import { accent, Chips, H2, Meter, Source } from '../../../ui/i/bits';
import { RoomHead } from '../HqView';
import { deadlinesOf } from '../store';

const hrs = (h: number) => (h >= 100 ? Math.round(h).toLocaleString('en-GB') : h >= 10 ? Math.round(h).toString() : (Math.round(h * 10) / 10).toString());

export function ObservatoryRoom() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const [section, setSection] = useState<TimedSection>('violin');
  const [extra, setExtra] = useState(0);
  const input = progressInput(st, today);
  const p = progressOf(st, today);
  const rate = useMemo(() => xpRate(p.events, today), [p.events, today]);
  const withExtra = rate + xpFromExtraMinutes(extra);
  const miles = useMemo(() => nextMilestones(p.total, p.overall.level, rate, today, 4), [p, rate, today]);
  const milesIf = useMemo(() => nextMilestones(p.total, p.overall.level, withExtra, today, 4), [p, withExtra, today]);
  const add = { [section]: extra } as Partial<Record<TimedSection, number>>;
  const clocks = useMemo(() => masteryClocks(input, add), [input, section, extra]);
  const base = useMemo(() => masteryClocks(input), [input]);
  const deadlines = useMemo(() => deadlinesOf(st, today, 200), [st, today]);
  const ways = useMemo(() => runways(input, deadlines, add), [input, deadlines, section, extra]);
  const baseWays = useMemo(() => runways(input, deadlines), [input, deadlines]);

  return (
    <div>
      <RoomHead room="observatory" />
      <div className="i-meters">
        <Meter value={Math.round(rate)} label="XP a day, last 4 weeks" />
        <Meter value={`LV ${p.overall.level}`} label={`${p.overall.toNext} XP to the next level`} />
      </div>

      <div className="hq-whatif">
        <span className="i-lab">What if I did more?</span>
        <Chips label="Section" value={section} onChange={setSection} options={TIMED_SECTIONS.map((s) => ({ id: s, label: sectionInfo(s).name, c: s }))} />
        <label className="hq-whatif__slider" style={accent(section)}>
          <span>
            <b className="i-mono">+{extra}</b> minutes a day of {sectionInfo(section).name.toLowerCase()}
          </span>
          <input type="range" min={0} max={120} step={5} value={extra} onChange={(e) => setExtra(Number(e.target.value))} aria-label={`Extra minutes a day of ${sectionInfo(section).name}`} />
        </label>
        {extra > 0 && <p className="i-note">That’s {Math.round((extra * 365) / 60)} hours over a year.</p>}
      </div>

      <H2>Next forms and ranks</H2>
      <div className="i-pnl i-pnl--flush">
        {miles.map((m, i) => {
          const alt = milesIf[i];
          const moved = extra > 0 && alt.date && m.date && alt.date !== m.date;
          return (
            <div key={`${m.kind}${m.name}`} className="i-row">
              <span className="i-row__t">
                <b>
                  {m.name} <span className="i-tag">{m.kind}</span>
                </b>
                <small>
                  LV {m.level} · {m.xpLeft.toLocaleString('en-GB')} XP away
                </small>
              </span>
              <span className="i-row__n hq-when">
                {m.date ? shortDay(m.date, today) : '—'}
                {moved && <small className="hq-sooner">→ {shortDay(alt.date!, today)}</small>}
              </span>
            </div>
          );
        })}
        {!miles.length && <p className="i-note" style={{ padding: '12px 0' }}>Nothing left to reach. Final form.</p>}
      </div>

      <H2 aside="at your last 4 weeks' pace">Time before kick-off</H2>
      {ways.length ? (
        <div className="i-pnl i-pnl--flush">
          {ways.slice(0, 8).map((w, i) => {
            const before = baseWays[i];
            return (
              <div key={`${w.title}${w.date}`} className="i-row" style={accent(w.section)}>
                <span className="i-row__t">
                  <b>{w.title}</b>
                  <small>
                    {shortDay(w.date, today)} · {w.daysLeft === 0 ? 'today' : `${w.daysLeft} days`} · {sectionInfo(w.section).name} at {hrs(w.perWeek)} h a week
                  </small>
                </span>
                <span className="i-row__n hq-when">
                  {hrs(before?.hours ?? w.hours)} h{extra > 0 && w.section === section && <small className="hq-sooner">→ {hrs(w.hours)} h</small>}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="i-note">Add exams, performances and contests to the calendar to see how much time you’ll have before each.</p>
      )}

      <H2 aside="lifetime, from your log">Mastery clocks</H2>
      {clocks.length ? (
        <div className="i-pnl i-pnl--flush">
          {clocks.map((c) => {
            const was = base.find((b) => b.section === c.section);
            const pct = Math.min(1, Math.log10(1 + c.hours) / 4);
            return (
              <div key={c.section} className="hq-clock" style={accent(c.section)}>
                <div className="hq-clock__h">
                  <b>{sectionInfo(c.section).name}</b>
                  <span className="i-mono">{hrs(c.hours)} h</span>
                </div>
                <span className="hq-clock__bar" role="progressbar" aria-label={`${sectionInfo(c.section).name}: ${Math.round(c.hours)} of 10,000 hours`} aria-valuenow={Math.round(c.hours)} aria-valuemin={0} aria-valuemax={10000}>
                  <i style={{ width: `${pct * 100}%` }} />
                </span>
                <small>
                  {c.perDay > 0 ? `${Math.round(c.perDay)} min a day · ` : ''}
                  {c.nextDate ? `${c.next.toLocaleString('en-GB')} h by ${shortDay(c.nextDate, today)}` : `${c.next.toLocaleString('en-GB')} h next`}
                  {c.masteryDate ? ` · 10,000 h in ${c.masteryDate.slice(0, 4)}` : ' · 10,000 h: not at this pace'}
                  {extra > 0 && c.section === section && was?.masteryDate && c.masteryDate && c.masteryDate !== was.masteryDate ? ` (was ${was.masteryDate.slice(0, 4)})` : ''}
                </small>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="i-note">Log a session and its clock starts.</p>
      )}
      <Source kind="live">
        Forecasts are your last few weeks carried forward, not promises. XP counts time up to the engine’s daily cap, and quests and bosses stay at their recent rate.
      </Source>
    </div>
  );
}
