import { useState, type CSSProperties } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { addDays, dayCount, shortDay, weekStart } from '../../domain/log/dates';
import { fmtPace, halfForGoal, pacesFor, PHASE_CLEAR, PHASES, PLAN_WEEKS, raceDate, riegel, DAY_NAMES, courtNotes, type MarathonStatus, type PlanRun, type PlanSession, type PlanWeek, type SessionState } from '../../domain/plans/marathon';
import { DEFAULT_HALF, fmtHms, GOAL_MAX, GOAL_MIN, parseHms, type MarathonPlanPref } from '../../domain/plans/types';
import { H2, Stepper } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { defaultStart, runMinutes, startMarathon, stopMarathon, updateMarathon, usePlanView } from './plans';
import './plans.css';

export const STATUS_LABEL: Record<SessionState['status'], string> = { done: 'Done', missed: 'Missed', today: 'Today', upcoming: 'Planned' };
const phaseStyle = (id: string) => ({ '--pc': `var(--pl-${id})` }) as CSSProperties;

/** Digits that flip in when they change. */
export function FlipNum({ value, label }: { value: number | string; label?: string }) {
  const s = String(value);
  return (
    <span className="pl-flip">
      <span className="visually-hidden">{label ?? s}</span>
      {[...s].map((d, i) => (
        <span key={`${i}-${d}`} className="pl-flip__d" style={{ animationDelay: `${i * 60}ms` }} aria-hidden="true">
          {d}
        </span>
      ))}
    </span>
  );
}

export function logRun(run: PlanRun, goal: string) {
  openSheet({ type: 'sports', sport: 'running', km: run.km, minutes: runMinutes(run, goal), planned: `${run.title} (week ${run.week})` });
}

function PaceTable({ goal }: { goal: string }) {
  const p = pacesFor(goal);
  const rows: [string, string, string][] = [
    ['Easy', `${fmtPace(p.easy[0])}–${fmtPace(p.easy[1])}`, 'Most runs. You could chat.'],
    ['Long run', `${fmtPace(p.long[0])}–${fmtPace(p.long[1])}`, 'Sundays. Slower is fine.'],
    ['Marathon (MP)', fmtPace(p.mp), `Race pace for ${goal.replace(/:00$/, '')}.`],
    ['Half-marathon', fmtPace(p.hmp), '1.6 km repeats.'],
    ['Threshold (T)', `${fmtPace(p.t[0])}–${fmtPace(p.t[1])}`, 'Comfortably hard, about an hour’s race effort.'],
    ['Intervals (I)', fmtPace(p.i), 'Hard 1–1.2 km repeats.'],
    ['Strides', `~${fmtPace(p.strides)}`, '20 s fast and relaxed, not a sprint.'],
  ];
  return (
    <div className="i-pnl i-pnl--flush pl-paces">
      {rows.map(([k, v, h]) => (
        <div key={k} className="i-row">
          <span className="i-row__t">
            <b>{k}</b>
            <small>{h}</small>
          </span>
          <span className="i-row__n">{v}<small className="i-dim"> /km</small></span>
        </div>
      ))}
    </div>
  );
}

function SessionRow({ s, st, goal, court }: { s: PlanSession; st: SessionState | undefined; goal: string; court?: string }) {
  const status = st?.status ?? 'upcoming';
  return (
    <div className={`pl-sess is-${status}`}>
      <span className="pl-sess__d i-mono">{DAY_NAMES[s.day]} {+s.date.slice(8)}</span>
      <span className="pl-sess__t">
        <b>{s.kind === 'run' ? s.title : `${s.title}${s.adjust ? ' (lighter)' : ''}`}</b>
        <small>{s.kind === 'run' ? `${s.optional ? 'Optional · ' : ''}${s.desc}` : s.adjust?.note ?? 'Gym plan · exercises in the Gym channel'}</small>
        {st?.by && st.by.date !== s.date && <small className="pl-moved">Logged {shortDay(st.by.date)}{st.by.km ? ` · ${st.by.km} km` : ''}</small>}
        {court && <small className="pl-court">{court}</small>}
      </span>
      <span className={`pl-st pl-st--${status}`}>{STATUS_LABEL[status]}</span>
      {s.kind === 'run' && status !== 'done' && status !== 'upcoming' && (
        <button type="button" className="i-btn i-btn--sm" onClick={() => (closeSheet(), logRun(s, goal))}>
          Log
        </button>
      )}
    </div>
  );
}

function WeekSheet({ spec }: { spec: SheetSpec }) {
  const v = usePlanView();
  const m = v.marathon;
  const n = Number(spec.week);
  const w = m?.weeks[n - 1];
  if (!m || !w || !v.plans.marathon) return null;
  const ws = m.week.get(n)!;
  const notes = courtNotes([...w.runs, ...w.gym], v.courtDays);
  return (
    <Sheet title={`Week ${n} of ${PLAN_WEEKS}`} onClose={closeSheet} accent="sports">
      <p className="pl-wkhead" style={phaseStyle(w.phase.id)}>
        <span className="pl-phasechip">{w.phase.kanji} {w.phase.name}</span>
        {w.stepBack && <span className="pl-sbchip">Step-back</span>}
        <span className="i-mono i-small">{shortDay(w.start)} – {shortDay(addDays(w.start, 6))} · {w.km} km planned · {ws.km} km logged</span>
      </p>
      {w.note && <p className="i-note">{w.note}</p>}
      <div className="pl-sesslist">
        {[...w.runs, ...w.gym]
          .sort((a, b) => a.day - b.day || (a.kind === 'run' ? -1 : 1))
          .map((s) => (
            <SessionRow key={s.id} s={s} st={m.sessions.get(s.id)} goal={v.plans.marathon!.goal} court={notes.find((x) => x.id === s.id)?.text} />
          ))}
      </div>
      <p className="i-note">
        {ws.done}/{ws.of} runs done. A run counts when one is logged that week: same day first, otherwise the nearest day; the long run takes the week’s longest run if it is at least 75% of the plan.
      </p>
    </Sheet>
  );
}
registerSheet('plan-week', WeekSheet);

function Ladder({ m }: { m: MarathonStatus }) {
  const max = Math.max(...m.weeks.slice(0, PLAN_WEEKS - 1).map((w) => w.km));
  const cur = Math.min(Math.max(m.current, 1), PLAN_WEEKS);
  return (
    <div className="pl-ladder" style={{ '--cur': cur - 1 } as CSSProperties}>
      <span className="pl-runner" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <circle cx="15" cy="4" r="2.4" fill="currentColor" />
          <path d="M14 7l-4 3 1 4-3 5M11 10l4 1 2 4M13 14l-3 2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div className="pl-ladder__bars">
        {m.weeks.map((w, i) => {
          const ws = m.week.get(w.n)!;
          const h = Math.min(1, w.km / max);
          return (
            <button
              key={w.n}
              type="button"
              className={`pl-bar is-${ws.status}${w.n === m.current ? ' is-cur' : ''}${w.stepBack ? ' is-sb' : ''}`}
              style={{ ...phaseStyle(w.phase.id), '--h': h, '--i': i } as CSSProperties}
              onClick={() => openSheet({ type: 'plan-week', week: w.n })}
              aria-label={`Week ${w.n}: ${w.n === 24 ? 'race week' : `${w.km} km`}, ${w.phase.name}${w.stepBack ? ', step-back' : ''}, ${ws.status === 'now' ? 'this week' : ws.status}`}
            >
              <i />
              <small>{w.n}</small>
            </button>
          );
        })}
      </div>
      <div className="pl-ladder__ph" aria-hidden="true">
        {PHASES.map((p) => (
          <span key={p.id} style={{ ...phaseStyle(p.id), flex: p.to - p.from + 1 }}>
            {p.kanji} {p.to - p.from > 1 ? p.name.replace('Marathon-specific', 'Specific') : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function WeekStrip({ w, m, today, court }: { w: PlanWeek; m: MarathonStatus; today: string; court: Set<string> }) {
  return (
    <div className="pl-week">
      {DAY_NAMES.map((dn, d) => {
        const date = addDays(w.start, d);
        const ss: PlanSession[] = [...w.runs.filter((r) => r.day === d), ...w.gym.filter((g) => g.day === d)];
        return (
          <button key={d} type="button" className={`pl-day${date === today ? ' is-now' : ''}`} onClick={() => openSheet({ type: 'plan-week', week: w.n })} aria-label={`${dn} ${shortDay(date)}: ${ss.map((s) => `${s.title} ${STATUS_LABEL[m.sessions.get(s.id)?.status ?? 'upcoming']}`).join(', ') || 'rest'}`}>
            <span className="i-mono">{dn}</span>
            <b>{+date.slice(8)}</b>
            {ss.length ? (
              ss.map((s) => (
                <span key={s.id} className={`pl-dot pl-dot--${s.kind} is-${m.sessions.get(s.id)?.status ?? 'upcoming'}`}>
                  {s.kind === 'run' ? (s.type === 'race' ? 'RACE' : `${s.km}`) : s.workout === 'athletic' ? 'ATH' : s.workout === 'upper-a' ? 'UP A' : 'UP B'}
                </span>
              ))
            ) : (
              <span className="pl-dot pl-dot--rest">rest</span>
            )}
            {court.has(date) && <span className="pl-dot pl-dot--court">court</span>}
          </button>
        );
      })}
    </div>
  );
}

function Settings({ pref }: { pref: MarathonPlanPref }) {
  const [goal, setGoal] = useState(pref.goal);
  const [half, setHalf] = useState(pref.half ?? '');
  const [sure, setSure] = useState(false);
  const goalSec = parseHms(goal);
  const goalBad = goalSec == null || goalSec < GOAL_MIN || goalSec > GOAL_MAX;
  const halfSec = parseHms(half);
  const mondays = mondayOptions(pref.start);
  const stepGoal = (d: number) => {
    const s = Math.min(GOAL_MAX, Math.max(GOAL_MIN, (parseHms(pref.goal) ?? 15000) + d * 300));
    setGoal(fmtHms(s));
    updateMarathon({ goal: fmtHms(s) });
  };
  return (
    <div className="i-pnl i-pnl--flush">
      <label className="i-kv">
        <span>Week 1 starts</span>
        <select className="i-input pl-select" value={pref.start} onChange={(e) => updateMarathon({ start: e.target.value })} aria-label="Plan start Monday">
          {mondays.map((d) => (
            <option key={d} value={d}>
              Mon {shortDay(d).slice(4)} → race {shortDay(raceDate(d)).slice(4)}
            </option>
          ))}
        </select>
      </label>
      <div className="i-kv">
        <span>
          Goal time
          <br />
          <span className="i-mono i-small i-dim">paces follow it</span>
        </span>
        <span className="i-btns" style={{ alignItems: 'center' }}>
          <Stepper value={pref.goal.replace(/:00$/, '')} label="goal time by 5 minutes" onStep={stepGoal} />
          <input className="i-input" style={{ width: 92 }} value={goal} onChange={(e) => setGoal(e.target.value)} onBlur={() => !goalBad && updateMarathon({ goal: fmtHms(goalSec!) })} aria-label="Goal time h:mm:ss" aria-invalid={goalBad} />
        </span>
      </div>
      <div className="i-kv">
        <span>
          Recent half marathon
          <br />
          <span className="i-mono i-small i-dim">{halfSec ? `predicts ~${fmtHms(riegel(halfSec)).slice(0, -3)} (Riegel)` : 'optional'}</span>
        </span>
        <input className="i-input" style={{ width: 92 }} value={half} onChange={(e) => setHalf(e.target.value)} onBlur={() => updateMarathon({ half: halfSec ? fmtHms(halfSec) : null })} aria-label="Recent half marathon h:mm:ss" placeholder={DEFAULT_HALF} />
      </div>
      <div className="i-kv">
        <span>Stop the plan</span>
        {sure ? (
          <span className="i-btns">
            <button type="button" className="i-btn i-btn--sm i-btn--danger" onClick={() => stopMarathon()}>Stop plan</button>
            <button type="button" className="i-btn i-btn--sm" onClick={() => setSure(false)}>Keep</button>
          </span>
        ) : (
          <button type="button" className="i-btn i-btn--sm" onClick={() => setSure(true)}>Stop…</button>
        )}
      </div>
      <p className="i-note" style={{ padding: '8px 0' }}>Stopping keeps every run you logged; only the plan view goes. Starting again later uses the same weeks.</p>
    </div>
  );
}

function mondayOptions(current: string): string[] {
  const base = weekStart(current < '2026-10-26' ? current : '2026-10-26');
  const out = Array.from({ length: 40 }, (_, i) => addDays(base, 7 * i));
  return out.includes(current) ? out : [current, ...out];
}

function StartCard({ today }: { today: string }) {
  const [start, setStart] = useState(defaultStart(today));
  const [goal, setGoal] = useState('4:10:00');
  const g = parseHms(goal);
  const ok = g != null && g >= GOAL_MIN && g <= GOAL_MAX;
  const p = pacesFor(ok ? goal : '4:10:00');
  return (
    <section className="i-pnl pl-start" aria-label="Marathon plan">
      <span className="pl-kick">走 · 24-week plan</span>
      <h2 className="pl-title">Marathon plan</h2>
      <p className="pl-lede">
        Base → Build → Marathon-specific → Peak → Taper. Four runs a week (five from week 9), a step-back every fourth week, long runs to 32 km, a half-marathon tune-up in week 12, gym on Mon and Thu, plyos and reaction on Wed.
      </p>
      <label className="i-kv">
        <span>Week 1 starts</span>
        <select className="i-input pl-select" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Plan start Monday">
          {mondayOptions(start).map((d) => (
            <option key={d} value={d}>
              Mon {shortDay(d).slice(4)} → race {shortDay(raceDate(d)).slice(4)}
            </option>
          ))}
        </select>
      </label>
      <label className="i-kv">
        <span>Goal time</span>
        <input className="i-input" style={{ width: 100 }} value={goal} onChange={(e) => setGoal(e.target.value)} aria-label="Goal time h:mm:ss" aria-invalid={!ok} />
      </label>
      <p className="i-note">
        Marathon pace {fmtPace(p.mp)}/km, easy {fmtPace(p.easy[0])}–{fmtPace(p.easy[1])}. Your 1:56 half predicts about {fmtHms(riegel(6960)).slice(0, -3)}, so 4:10 leaves a margin.
      </p>
      <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!ok} onClick={() => startMarathon({ start, goal: fmtHms(g!) })}>
        Start plan · race {shortDay(raceDate(start))}
      </button>
    </section>
  );
}

/** The marathon plan block at the top of the Sports channel. */
export function MarathonPanel() {
  const v = usePlanView();
  const pref = v.plans.marathon;
  const m = v.marathon;
  const [open, setOpen] = useState(false);
  if (!pref || !m) return <StartCard today={v.today} />;

  const toGo = Math.max(0, dayCount(v.today, m.race) - 1);
  const wk = m.current >= 1 && m.current <= PLAN_WEEKS ? m.weeks[m.current - 1] : null;
  const shown = wk ?? (m.current === 0 ? m.weeks[0] : m.weeks[PLAN_WEEKS - 1]);
  const phase = wk?.phase ?? null;
  const todayRuns = wk ? wk.runs.filter((r) => r.date === v.today) : [];
  const todayGym = wk ? wk.gym.filter((g) => g.date === v.today) : [];
  const allSessions = m.weeks.flatMap((w) => w.runs);
  const next = allSessions.find((r) => r.date >= v.today && m.sessions.get(r.id)?.status !== 'done');
  const notes = courtNotes([...shown.runs, ...shown.gym], v.courtDays);
  const ws = m.week.get(shown.n)!;
  const ph = m.phases.find((x) => x.phase.id === (phase ?? shown.phase).id)!;
  const halfSec = pref.half ? parseHms(pref.half) : null;

  return (
    <section className="pl-mara" aria-label="Marathon plan">
      <div className="pl-hero" style={phaseStyle((phase ?? shown.phase).id)}>
        <span className="pl-kick">走 Marathon plan · goal {pref.goal.replace(/:00$/, '')}</span>
        <div className="pl-count">
          <FlipNum value={toGo} label={`${toGo} days`} />
          <span className="pl-count__l">
            {toGo === 0 ? 'Race day' : toGo === 1 ? 'day to go' : 'days to go'}
            <small>{shortDay(m.race, v.today)}</small>
          </span>
        </div>
        <div className="pl-hero__row">
          <span className="pl-wkchip">{m.current === 0 ? `Starts ${shortDay(pref.start)}` : m.current > PLAN_WEEKS ? 'Plan finished' : `Week ${m.current} of ${PLAN_WEEKS}`}</span>
          <span className="pl-phasechip">{(phase ?? shown.phase).kanji} {(phase ?? shown.phase).name}</span>
          {wk?.stepBack && <span className="pl-sbchip">Step-back</span>}
        </div>
      </div>

      {m.current <= PLAN_WEEKS && (
        <div className="i-pnl pl-today">
          <span className="i-lab">{m.current === 0 ? `First run · ${shortDay(next?.date ?? pref.start)}` : todayRuns.length ? `Today · ${shortDay(v.today)}` : `Today · ${todayGym.length ? 'gym day' : 'rest day'}`}</span>
          {(todayRuns.length ? todayRuns : next ? [next] : []).slice(0, 1).map((r) => {
            const st = m.sessions.get(r.id)!;
            const isToday = r.date === v.today;
            return (
              <div key={r.id} className={`pl-run is-${st.status}`}>
                {!isToday && <span className="i-mono i-small i-dim">Next run · {shortDay(r.date)}</span>}
                <div className="pl-run__h">
                  <h3>{r.title}</h3>
                  <span className="pl-run__km">
                    <b>{r.type === 'race' ? '42.2' : r.km}</b>km
                  </span>
                </div>
                <p>{r.desc}</p>
                {st.status === 'done' ? (
                  <p className="pl-ok" role="status">
                    ✓ Done{st.by && st.by.km ? ` · ${st.by.km} km logged` : ''}
                    {st.by && st.by.date !== r.date ? ` on ${shortDay(st.by.date)}` : ''}
                  </p>
                ) : (
                  <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => logRun(r, pref.goal)}>
                    Log this run
                  </button>
                )}
              </div>
            );
          })}
          {todayGym.map((g) => (
            <p key={g.id} className="pl-gymline">
              Also today: <b>{g.title}</b> (gym plan{m.sessions.get(g.id)!.status === 'done' ? ', done' : ''}){g.adjust ? ` · ${g.adjust.note}` : ''}
            </p>
          ))}
          {!todayRuns.length && !todayGym.length && m.current > 0 && <p className="i-note">Rest is part of the plan. Court practice today is fine; keep it relaxed if a quality run is tomorrow.</p>}
        </div>
      )}

      <H2 aside={`${ws.km} / ${shown.km} km`}>{m.current >= 1 && m.current <= PLAN_WEEKS ? 'This week' : `Week ${shown.n}`}</H2>
      <WeekStrip w={shown} m={m} today={v.today} court={v.courtDays} />
      {shown.note && <p className="i-note pl-wknote">{shown.note}</p>}
      {notes.map((x) => (
        <p key={x.id} className="i-note pl-court">
          {shortDay(x.date)}: {x.text}
        </p>
      ))}

      <H2 aside={`${ph.phase.name} · ${ph.done}/${ph.of} runs`}>24-week route</H2>
      <div className="i-pnl">
        <Ladder m={m} />
        <p className="i-note pl-legend">
          Bars are weekly kilometres, coloured by phase; hatched bars are step-back weeks. Tap a week to see its sessions. A phase clears once its last long run is done and at least {Math.round(PHASE_CLEAR * 100)}% of its runs are.
        </p>
        <div className="pl-phases">
          {m.phases.map((p) => (
            <span key={p.phase.id} className={`pl-ph is-${p.status}`} style={phaseStyle(p.phase.id)} title={p.phase.aim}>
              <b>{p.phase.kanji}</b> {p.phase.name}
              <small>{p.status === 'cleared' ? 'cleared' : p.status === 'active' ? `${p.done}/${p.of}` : p.status === 'over' ? `${p.done}/${p.of} · over` : `wk ${p.phase.from}–${p.phase.to}`}</small>
            </span>
          ))}
        </div>
      </div>

      <H2 aside={<button type="button" className="i-link" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Hide' : 'Settings'}</button>}>Paces</H2>
      <PaceTable goal={pref.goal} />
      {halfSec && (
        <p className="i-note">
          Your {pref.half!.replace(/:00$/, '')} half predicts about {fmtHms(riegel(halfSec)).slice(0, -3)}; the goal needs a half of about {fmtHms(halfForGoal(parseHms(pref.goal)!)).slice(0, -3)}.
        </p>
      )}
      {open && <Settings pref={pref} />}
      <p className="i-note pl-credit">Plan by LifeTracker, written for your answers (25–40 km a week now, a 1:56 half, goal about 4:10). Adjust it if anything hurts: sharp or worsening pain, especially shins, means stop and rest, not push through. Not medical advice.</p>
    </section>
  );
}
