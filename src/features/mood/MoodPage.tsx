/**
 * 心 Mood, at /mood: today's check-in (weather, energy, stress, what was going on), the last
 * thirty days, this week against last, and what tends to go with good and hard days. It reads the
 * Hideout's check-ins, so the Lab, the Lighthouse and Next move all see the same days.
 */
import { useMemo, useState, type CSSProperties } from 'react';
import { navigate } from '../../app/router';
import { progressInput, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { MOOD_TAGS, stressName, weatherOf } from '../../domain/hq/checkin';
import { fmtMetric, labRows, METRIC_LABEL, runLab } from '../../domain/hq/lab';
import { shortDay } from '../../domain/log/dates';
import { bestAndHard, checkInStreak, series, tagEffects, weekdayMoods, weekOnWeek, type DayPoint } from '../../domain/mood/patterns';
import { useStore } from '../../lib/createStore';
import { H2, Meter, Source } from '../../ui/i/bits';
import { CheckInCard } from '../hq/HomeCards';
import { saveCheckIn, useHq } from '../hq/store';
import { LifePage } from '../life/Frame';
import { socialByDay } from '../people/store';
import './mood.css';

const LINES = [
  { k: 'mood', label: 'Weather', c: '#ff8fb0' },
  { k: 'energy', label: 'Energy', c: '#7ddc6f' },
  { k: 'stress', label: 'Stress', c: '#f0a03e' },
] as const;

function Chart({ points }: { points: DayPoint[] }) {
  const W = 340;
  const H = 130;
  const pad = { l: 18, r: 6, t: 8, b: 18 };
  const x = (i: number) => pad.l + (i / (points.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + ((5 - v) / 4) * (H - pad.t - pad.b);
  const logged = points.filter((p) => p.mood != null).length;
  return (
    <figure className="mo-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`The last ${points.length} days: ${logged} check-ins`}>
        {[1, 3, 5].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="g" />
            <text x={pad.l - 5} y={y(v) + 3.5} textAnchor="end" className="ax">
              {v}
            </text>
          </g>
        ))}
        {LINES.map((l) => {
          // break the line where a day is missing
          const segs: string[][] = [[]];
          points.forEach((p, i) => {
            const v = p[l.k];
            if (v == null) segs.push([]);
            else segs[segs.length - 1].push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`);
          });
          return (
            <g key={l.k} style={{ '--l': l.c } as CSSProperties}>
              {segs
                .filter((s) => s.length > 1)
                .map((s, i) => (
                  <polyline key={i} points={s.join(' ')} className="ln" />
                ))}
              {points.map((p, i) => (p[l.k] != null ? <circle key={i} cx={x(i)} cy={y(p[l.k]!)} r={2.2} className="dt" /> : null))}
            </g>
          );
        })}
        <text x={pad.l} y={H - 4} className="ax">
          {shortDay(points[0].date)}
        </text>
        <text x={W - pad.r} y={H - 4} textAnchor="end" className="ax">
          Today
        </text>
      </svg>
      <figcaption className="mo-key">
        {LINES.map((l) => (
          <span key={l.k}>
            <i style={{ background: l.c }} /> {l.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

function Delta({ now, before, good }: { now: number | null; before: number | null; good: 'up' | 'down' }) {
  if (now == null || before == null) return <span className="lf-delta">no week before</span>;
  const d = Math.round((now - before) * 10) / 10;
  if (Math.abs(d) < 0.1) return <span className="lf-delta">same as last week</span>;
  const better = good === 'up' ? d > 0 : d < 0;
  return <span className={`lf-delta ${better ? 'is-good' : 'is-bad'}`}>{`${d > 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)} on last week`}</span>;
}

function Tags({ today }: { today: string }) {
  const hq = useHq();
  const c = hq.checkIns.find((x) => x.date === today);
  const [own, setOwn] = useState('');
  if (!c) return null;
  const tags = c.tags ?? [];
  const shown = [...new Set([...MOOD_TAGS, ...hq.checkIns.flatMap((x) => x.tags ?? [])])].slice(0, 24);
  const toggle = (t: string) => saveCheckIn(today, { mood: c.mood, tags: tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t] });
  return (
    <div className="i-pnl mo-tags">
      <span className="i-lab">What was going on? · tap any</span>
      <div className="lf-pills" role="group" aria-label="What was going on">
        {shown.map((t) => (
          <button key={t} type="button" className="lf-pill" aria-pressed={tags.includes(t)} onClick={() => toggle(t)}>
            {t}
          </button>
        ))}
      </div>
      <form
        className="mo-own"
        onSubmit={(e) => {
          e.preventDefault();
          const t = own.trim().slice(0, 30);
          if (t && !tags.includes(t)) toggle(t);
          setOwn('');
        }}
      >
        <input className="i-input" value={own} onChange={(e) => setOwn(e.target.value)} placeholder="Something else" aria-label="Add your own tag" maxLength={30} />
        <button type="submit" className="i-btn" disabled={!own.trim()}>
          Add
        </button>
      </form>
    </div>
  );
}

export function MoodPage() {
  const today = useToday();
  const hq = useHq();
  const st = useStore(data, (s) => s);
  const list = hq.checkIns;
  const streak = checkInStreak(list, today);
  const points = useMemo(() => series(list, today, 30), [list, today]);
  const week = weekOnWeek(list, today);
  const tags = useMemo(() => tagEffects(list), [list]);
  const { best, hard } = useMemo(() => bestAndHard(list, 3), [list]);
  const wd = useMemo(() => weekdayMoods(list), [list]);
  const findings = useMemo(
    () => runLab(labRows(progressInput(st, today), list, 365, socialByDay(st))).findings.filter((f) => ['mood', 'energy', 'stress'].includes(f.hypothesis.y) && f.strength !== 'none'),
    [st, today, list],
  );
  const fmt = (v: number | null) => (v == null ? '–' : v.toFixed(1));
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <LifePage
      id="mood"
      line={list.length ? `${list.length} ${list.length === 1 ? 'day' : 'days'} logged · the Lab sees them too` : undefined}
      aside={
        <span className="lf-head__big">
          <b>{streak}</b>
          <span>{streak === 1 ? 'day running' : 'days running'}</span>
        </span>
      }
    >
      <CheckInCard always />
      <Tags today={today} />

      <H2 aside="last 30 days">How it’s been</H2>
      <div className="i-pnl">{list.length >= 2 ? <Chart points={points} /> : <p className="i-note">Check in for a few days and the lines appear here.</p>}</div>

      <div className="i-meters mo-meters">
        <Meter value={fmt(week.now.mood)} label={<>Weather this week <Delta now={week.now.mood} before={week.before.mood} good="up" /></>} />
        <Meter value={fmt(week.now.energy)} label={<>Energy <Delta now={week.now.energy} before={week.before.energy} good="up" /></>} />
        <Meter value={fmt(week.now.stress)} label={<>Stress <Delta now={week.now.stress} before={week.before.stress} good="down" /></>} />
      </div>

      <H2 aside={tags.length ? `${tags.length} tags` : undefined}>What goes with it</H2>
      {tags.length ? (
        <div className="i-pnl i-pnl--flush" aria-label="Tags and your weather">
          {tags.map((t) => {
            const d = t.mood - t.moodWithout;
            return (
              <div key={t.tag} className="i-row">
                <span className="i-row__t">
                  <b>{t.tag}</b>
                  <small>
                    {t.n} days · weather {t.mood.toFixed(1)} vs {t.moodWithout.toFixed(1)} without
                    {t.stress != null && t.stressWithout != null ? ` · stress ${t.stress.toFixed(1)} vs ${t.stressWithout.toFixed(1)}` : ''}
                  </small>
                </span>
                <span className={`lf-delta ${d >= 0.2 ? 'is-good' : d <= -0.2 ? 'is-bad' : ''}`}>{`${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}`}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="i-note">Tag what was going on when you check in. Once a tag has three days, you’ll see how those days compare.</p>
      )}
      {findings.length > 0 && (
        <div className="mo-finds">
          {findings.slice(0, 4).map((f) => (
            <p key={f.hypothesis.id} className="i-note">
              <b>{f.hypothesis.title}.</b> {f.hypothesis.hi}: {fmtMetric(f.hypothesis.y, f.hiMean)} {METRIC_LABEL[f.hypothesis.y].toLowerCase()}; {f.hypothesis.lo.toLowerCase()}: {fmtMetric(f.hypothesis.y, f.loMean)} ({f.n} days).
            </p>
          ))}
        </div>
      )}
      <Source kind="live">Patterns from your own days, not cause and effect. More in the Hideout’s Lab.</Source>
      <button type="button" className="i-link" onClick={() => navigate('base', ['lab'])}>
        Open the Lab ▶
      </button>

      {list.length >= 14 && (
        <>
          <H2 aside="on average">Your week</H2>
          <div className="i-pnl mo-week" aria-label="Weather and stress by weekday">
            {days.map((d, i) => (
              <div key={i} className="mo-week__d">
                <span className="mo-week__w" style={{ '--w': wd.mood[i] != null ? weatherOf(wd.mood[i]!).c : 'var(--rule)' } as CSSProperties}>
                  {wd.mood[i] != null ? weatherOf(wd.mood[i]!).kanji : '·'}
                </span>
                <small>{d}</small>
                <em>{wd.stress[i] != null ? `stress ${wd.stress[i]!.toFixed(1)}` : ''}</em>
              </div>
            ))}
          </div>
        </>
      )}

      {best.length > 0 && (
        <>
          <H2>Best days and hard days</H2>
          <div className="mo-days">
            {[
              { title: 'Best', list: best },
              { title: 'Hardest', list: hard },
            ].map((g) => (
              <div key={g.title} className="i-pnl i-pnl--flush">
                <span className="i-lab mo-days__h">{g.title}</span>
                {g.list.map((c) => (
                  <div key={c.date} className="i-row">
                    <span className="i-row__t">
                      <b>
                        {weatherOf(c.mood).kanji} {shortDay(c.date, today)}
                      </b>
                      <small>
                        {[weatherOf(c.mood).name, c.energy ? `energy ${c.energy}` : '', c.stress ? stressName(c.stress).toLowerCase() : '', ...(c.tags ?? [])].filter(Boolean).join(' · ')}
                        {c.note ? ` · “${c.note}”` : ''}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </LifePage>
  );
}
