import { useState, type CSSProperties } from 'react';
import { useLookBack, useToday } from '../../data/lt';
import { formatMinutes } from '../../domain/log/duration';
import { longDay, monthName, rangeLabel, shortDay } from '../../domain/log/dates';
import type { XpSection } from '../../domain/progress/engine';
import { HEAT_BANDS, type HeatDay, type WeekRecap } from '../../domain/progress/recap';
import { sectionInfo } from '../../domain/sections';
import './lookback.css';

const secName = (s: XpSection) => (s === 'general' ? 'Other topics' : s === 'quests' ? 'Quests' : sectionInfo(s).name);
const secKanji = (s: XpSection) => (s === 'general' || s === 'quests' ? '・' : sectionInfo(s).kanji);

function change(r: WeekRecap): { text: string; up: boolean | null } {
  if (!r.prevMinutes) return { text: r.minutes ? 'first logged week in a while' : '', up: null };
  const d = Math.round(((r.minutes - r.prevMinutes) / r.prevMinutes) * 100);
  if (d === 0) return { text: 'same as the week before', up: null };
  return { text: `${d > 0 ? '+' : ''}${d}% on the week before`, up: d > 0 };
}

/** "Previously on…": last week in a few lines, like the recap before an episode. */
export function Recap({ recap }: { recap: WeekRecap }) {
  const ch = change(recap);
  const top = recap.sections.slice(0, 3);
  const max = top[0]?.minutes ?? 1;
  return (
    <section className="lb-recap" aria-label="Last week's recap">
      <span className="lb-recap__kick">
        <span aria-hidden="true">前回</span> Previously · {rangeLabel(recap.start, recap.end)}
      </span>
      {recap.minutes === 0 && recap.activeDays === 0 ? (
        <p className="lb-recap__lead">A quiet week. This one is a fresh chapter.</p>
      ) : (
        <>
          <p className="lb-recap__lead">
            <b>{formatMinutes(recap.minutes)}</b> over {recap.activeDays} day{recap.activeDays === 1 ? '' : 's'}
            {ch.text && <span className={ch.up === true ? 'is-up' : ch.up === false ? 'is-down' : ''}> · {ch.text}</span>}
          </p>
          {top.length > 0 && (
            <ul className="lb-recap__secs">
              {top.map((s) => (
                <li key={s.id} style={{ '--c': `var(--c-${s.id})` } as CSSProperties}>
                  <span aria-hidden="true">{secKanji(s.id)}</span>
                  <span>{secName(s.id)}</span>
                  <i style={{ width: `${Math.max(8, (s.minutes / max) * 100)}%` }} />
                  <b>{formatMinutes(s.minutes)}</b>
                </li>
              ))}
            </ul>
          )}
          <ul className="lb-recap__facts">
            {recap.bestDay && <li>Best day {shortDay(recap.bestDay.date)} · {formatMinutes(recap.bestDay.minutes)}</li>}
            {recap.longest >= 30 && <li>Longest session {formatMinutes(recap.longest)}</li>}
            {recap.quests > 0 && <li>{recap.quests} quest{recap.quests === 1 ? '' : 's'} cleared</li>}
            {recap.tasks > 0 && <li>{recap.tasks} task{recap.tasks === 1 ? '' : 's'} done</li>}
            {recap.nights > 0 && <li>{recap.nights} night{recap.nights === 1 ? '' : 's'} logged</li>}
            {recap.boss && <li className={recap.boss.defeatedOn ? 'is-up' : ''}>{recap.boss.defeatedOn ? `${recap.boss.name} defeated` : `${recap.boss.name} escaped at ${Math.max(0, recap.boss.hp - recap.boss.damage)} HP`}</li>}
          </ul>
        </>
      )}
    </section>
  );
}

const label = (d: HeatDay) =>
  `${longDay(d.date)}: ${d.minutes ? formatMinutes(d.minutes) : d.level ? 'logged, no time' : d.rest ? 'rest day' : 'nothing logged'}${d.sections.length ? ` · ${d.sections.map((s) => sectionInfo(s).name).join(', ')}` : ''}`;

/** Every day of the last few months as a square, darker for more time. Tap one to see it. */
export function Heatmap({ weeks }: { weeks: HeatDay[][] }) {
  const today = useToday();
  const [pick, setPick] = useState<HeatDay | null>(null);
  const flat = weeks.flat();
  const active = flat.filter((d) => d.level > 0).length;
  const total = flat.reduce((n, d) => n + d.minutes, 0);
  return (
    <section className="lb-heat" aria-label="Training heatmap">
      <div className="lb-heat__months" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
        {weeks.map((w, i) => (
          <span key={i}>{w[0] && (i === 0 || w[0].date.slice(5, 7) !== weeks[i - 1][0]?.date.slice(5, 7)) ? monthName(w[0].date) : ''}</span>
        ))}
      </div>
      <div
        className="lb-heat__grid"
        style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`Training heatmap, last ${weeks.length} weeks: ${active} active day${active === 1 ? '' : 's'}, ${formatMinutes(total)}`}
        onClick={(e) => {
          const date = (e.target as HTMLElement).dataset.date;
          const d = date ? flat.find((x) => x.date === date) : undefined;
          setPick(d && pick?.date !== d.date ? d : null);
        }}
      >
        {weeks.map((w, i) => (
          <div key={i} className="lb-heat__col">
            {w.map((d) => (
              <i key={d.date} data-date={d.date} title={label(d)} className={`lb-heat__d l${d.level}${d.rest && !d.level ? ' is-rest' : ''}${d.date === today ? ' is-today' : ''}${pick?.date === d.date ? ' is-pick' : ''}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="lb-heat__foot">
        <span className="i-note" aria-live="polite">{pick ? label(pick) : `${active} active day${active === 1 ? '' : 's'} · ${formatMinutes(total)} in ${weeks.length} weeks`}</span>
        <span className="lb-heat__key" aria-hidden="true">
          less
          {[0, 2, 3, 4, 5].map((l) => (
            <i key={l} className={`lb-heat__d l${l}`} />
          ))}
          more
        </span>
      </div>
      <p className="i-note lb-heat__bands">Shades: under {HEAT_BANDS[1]} min · {HEAT_BANDS[1]}+ · {HEAT_BANDS[2]}+ · {HEAT_BANDS[3]}+ min a day. A dot is a rest day.</p>
    </section>
  );
}

/** Both, for the Progress overview. */
export function LookBack() {
  const { recap, heat } = useLookBack(20);
  return (
    <>
      <Recap recap={recap} />
      <Heatmap weeks={heat} />
    </>
  );
}
