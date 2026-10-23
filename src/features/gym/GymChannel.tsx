import { useEffect, useMemo, useState } from 'react';
import { openSheet } from '../../app/sheets';
import { getSectionTopics, sectionEntries, sectionRecords, setTargets, topicSectionMap, useTargets, useToday } from '../../data/lt';
import { saveRecord } from '../../data/records';
import { data } from '../../data/store';
import { occurrences } from '../../domain/calendar/occurrences';
import { addDays, shortDay, weekdayIndex, weekStart } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { accent, Chips, H2, Meter, Seg, Source, Stepper } from '../../ui/i/bits';
import { Line } from '../../ui/i/charts';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { ChannelBar } from '../../app/Shell';
import { Icon } from '../../ui/i/Icon';
import { RelatedTasks } from '../../ui/i/RelatedTasks';
import { active, addExercise, addSet, bump, discardWorkout, removeSet, startWorkout, toggleSet } from './active';
import { isGymDetail, legsHeavy, progression, setsDone, setsTotal, STARTER_TEMPLATES, templateOf, trackedExercises, type GymDetail, type Template } from './model';
import './sheets';
import './gym.css';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function RestBar() {
  const rest = useStore(active, (s) => s.rest);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!rest) return;
    const id = setInterval(() => {
      tick((n) => n + 1);
      if (Date.now() >= rest.end) active.set({ rest: null });
    }, 500);
    return () => clearInterval(id);
  }, [rest]);
  if (!rest) return null;
  const left = Math.max(0, Math.ceil((rest.end - Date.now()) / 1000));
  return (
    <div className="g-rest" role="timer" aria-label={`Rest, ${left} seconds left`}>
      <span className="i-mono i-small">REST</span>
      <span className="g-rest__track">
        <i style={{ width: `${(left / rest.total) * 100}%` }} />
      </span>
      <b className="i-mono">
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
      </b>
      <button type="button" onClick={() => active.set({ rest: { ...rest, end: rest.end + 30000, total: rest.total + 30 } })}>
        +30s
      </button>
      <button type="button" onClick={() => active.set({ rest: null })}>
        Skip
      </button>
    </div>
  );
}

function Session() {
  const a = useStore(active, (s) => s.a)!;
  const [newEx, setNewEx] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const done = setsDone(a.detail);
  const total = setsTotal(a.detail);
  return (
    <div style={accent('gym')}>
      <header className="i-chhead">
        <div>
          <span className="i-chhead__k">CH04 · session running · {shortDay(a.date)}</span>
          <h1>{a.detail.name}</h1>
        </div>
        <div className="i-chhead__lv">
          SETS<b>{done}/{total}</b>
          {Math.max(1, Math.round((Date.now() - a.startedAt) / 60000))} min
        </div>
        <Seg pct={done / Math.max(1, total)} n={Math.max(1, total)} label="Sets done" />
      </header>
      <div className="i-pnl i-pnl--flush">
        {a.detail.exercises.map((e, ei) => (
          <div key={ei} className="g-ex">
            <div className="g-ex__h">
              <b>{e.name}</b>
              <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'gym-swap', ei })}>
                Swap
              </button>
            </div>
            {e.swappedFrom && <p className="i-note">Instead of {e.swappedFrom}</p>}
            {e.sets.map((s, si) => (
              <div key={si} className={`g-set${s.done ? ' is-done' : ''}`}>
                <span className="i-mono i-small i-dim">S{si + 1}</span>
                <span className="g-adj">
                  <button type="button" onClick={() => bump(ei, si, 'weight', -2.5)} aria-label={`Set ${si + 1} less weight`}>−</button>
                  <output>{s.weight ? <>{s.weight}<small>kg</small></> : <small>BW</small>}</output>
                  <button type="button" onClick={() => bump(ei, si, 'weight', 2.5)} aria-label={`Set ${si + 1} more weight`}>+</button>
                </span>
                <span className="g-adj">
                  <button type="button" onClick={() => bump(ei, si, 'reps', -1)} aria-label={`Set ${si + 1} fewer ${e.unit === 's' ? 'seconds' : 'reps'}`}>−</button>
                  <output>{s.reps}<small>{e.unit === 's' ? 's' : '×'}</small></output>
                  <button type="button" onClick={() => bump(ei, si, 'reps', 1)} aria-label={`Set ${si + 1} more ${e.unit === 's' ? 'seconds' : 'reps'}`}>+</button>
                </span>
                <button type="button" className={`g-led${s.done ? ' is-on' : ''}`} onClick={() => toggleSet(ei, si)} aria-label={`${e.name} set ${si + 1} done`} aria-pressed={s.done}>
                  <i />
                </button>
              </div>
            ))}
            <div className="g-ex__f">
              <span className="i-mono i-small i-dim">REST {e.rest}s</span>
              <span className="i-btns">
                <button type="button" className="i-btn i-btn--sm" onClick={() => removeSet(ei)} disabled={e.sets.length < 2}>− Set</button>
                <button type="button" className="i-btn i-btn--sm" onClick={() => addSet(ei)}>+ Set</button>
              </span>
            </div>
          </div>
        ))}
      </div>
      <span style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <input className="i-input" value={newEx} onChange={(e) => setNewEx(e.target.value)} placeholder="Add an exercise to today" aria-label="Add an exercise to today" maxLength={60} />
        <button type="button" className="i-btn i-btn--sm" disabled={!newEx.trim()} onClick={() => (addExercise(newEx.trim()), setNewEx(''))}>Add</button>
      </span>
      <div className="i-btns" style={{ marginTop: 14 }}>
        {confirmDiscard ? (
          <>
            <button type="button" className="i-btn i-btn--danger" onClick={() => discardWorkout()}>Discard, save nothing</button>
            <button type="button" className="i-btn" onClick={() => setConfirmDiscard(false)}>Keep going</button>
          </>
        ) : (
          <button type="button" className="i-btn" onClick={() => setConfirmDiscard(true)}>Discard</button>
        )}
        <button type="button" className="i-btn i-btn--sig" style={{ flex: 1 }} onClick={() => openSheet({ type: 'gym-finish' })}>
          Finish session
        </button>
      </div>
      <p className="i-note" style={{ marginTop: 8 }}>Placeholder plan, not a personalised training or medical prescription. Stop if something hurts.</p>
      <div style={{ height: 72 }} aria-hidden="true" />
      <RestBar />
    </div>
  );
}

export function GymChannel() {
  const running = useStore(active, (s) => !!s.a);
  const today = useToday();
  const targets = useTargets();
  const st = useStore(data, (s) => s);
  const templates = useMemo(() => sectionRecords(st, 'gym', 'gym_template').map(templateOf), [st]);
  const sessions = useMemo(() => sectionEntries<GymDetail>(st, 'gym'), [st]);
  const tracked = useMemo(() => trackedExercises(sessions), [sessions]);
  const [lift, setLift] = useState<string | null>(null);
  const shownLift = lift && tracked.includes(lift) ? lift : tracked[0] ?? null;

  const monday = weekStart(today);
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const occ = useMemo(() => occurrences(st.lt_events.values(), monday, addDays(monday, 13)).filter((o) => !o.cancelled), [st.lt_events, monday]);
  const map = topicSectionMap(st.log_topics.values(), getSectionTopics());
  const sportByDay = (d: string) => occ.some((o) => o.date === d && o.event.section === 'sports') || [...st.log_entries.values()].some((e) => !e.deleted_at && e.date === d && map.get(e.topic_id) === 'sports');
  const gymPlanned = occ.filter((o) => o.event.section === 'gym' && o.date >= today);
  const next = gymPlanned[0];
  const nextTemplate = templates.find((t) => t.id === next?.event.data.template) ?? templates.find((t) => !t.archived);
  const thisWeek = sessions.filter((s) => s.entry.date >= monday && s.entry.date <= today).length;
  const warnings = gymPlanned
    .filter((o) => {
      const t = templates.find((x) => x.id === o.event.data.template);
      return t && legsHeavy(t) && (sportByDay(o.date) || sportByDay(addDays(o.date, 1)));
    })
    .slice(0, 2);

  if (running) return (
    <>
      <ChannelBar current="gym" />
      <Session />
    </>
  );

  const start = (t: Template) => startWorkout(t);
  const live = templates.filter((t) => !t.archived);

  return (
    <div style={accent('gym')}>
      <ChannelHead id="gym" />
      <div className="i-pnl i-stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span className="i-lab">{next ? `${next.date === today ? 'Planned today' : `Next · ${shortDay(next.date)}`}${next.start ? ` ${next.start}` : ''}` : 'Nothing planned'}</span>
          <span className="i-tag i-tag--c">{thisWeek}/{targets.gymWeek} THIS WEEK</span>
        </div>
        {nextTemplate ? (
          <>
            <h2 className="g-title">{nextTemplate.name}</h2>
            <span className="i-mono i-small i-dim">{nextTemplate.focus.toUpperCase()} · {nextTemplate.exercises.length} EXERCISES · ~{nextTemplate.estimate} MIN</span>
            <div className="i-rows">
              {nextTemplate.exercises.map((e, i) => (
                <div key={i} className="i-row" style={{ minHeight: 38, padding: '6px 0' }}>
                  <span className="i-row__t">{e.name}</span>
                  <span className="i-row__n i-small">{e.sets}×{e.reps}{e.unit === 's' ? 's' : ''}{e.weight ? ` · ${e.weight}kg` : ''}</span>
                </div>
              ))}
            </div>
            <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => start(nextTemplate)}>
              Start {nextTemplate.name}
            </button>
          </>
        ) : (
          <div className="i-empty">
            <span>No workout templates yet.</span>
            <div className="i-btns">
              <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => STARTER_TEMPLATES.forEach((t) => saveRecord('gym', 'gym_template', { ...t }))}>
                Add 3 starter templates
              </button>
              <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'gym-template' })}>
                Make my own
              </button>
            </div>
          </div>
        )}
        <Source>Starter templates are placeholders to adjust, not a personalised training or medical plan.</Source>
      </div>

      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'gym-plan' })}>+ Plan</button>}>This week</H2>
      <div className="g-week">
        {week.map((d) => {
          const g = occ.filter((o) => o.date === d && o.event.section === 'gym');
          const doneThere = sessions.some((s) => s.entry.date === d);
          return (
            <div key={d} className={d === today ? 'is-now' : ''}>
              <span className="i-mono">{DAYS[weekdayIndex(d)]}</span>
              <b>{+d.slice(8)}</b>
              {doneThere && <span className="g-chip is-done">DONE</span>}
              {!doneThere && g.map((o) => <span key={o.key} className="g-chip">{o.event.title.replace(/^Gym — /, '').toUpperCase()}</span>)}
              {sportByDay(d) && <span className="g-sport">SPORT</span>}
            </div>
          );
        })}
      </div>
      {warnings.map((o) => (
        <p key={o.key} className="i-note" style={{ marginTop: 8 }}>
          {o.event.title} on {shortDay(o.date)} is a legs-heavy day next to sport. Consider moving one of them, or keeping the legs work light. Past shin discomfort: keep running volume steady on gym weeks.
        </p>
      ))}

      <div className="i-cols">
        <div>
          <H2 aside="top set · kg">Progression</H2>
          {tracked.length ? (
            <>
              <Chips label="Exercise" value={shownLift!} onChange={setLift} options={tracked.slice(0, 8).map((x) => ({ id: x, label: x }))} />
              <div className="i-pnl">
                {(() => {
                  const p = progression(sessions, shownLift!);
                  return <Line values={p.map((x) => x.weight)} labels={p.map((x) => shortDay(x.date).slice(4))} long={p.map((x) => shortDay(x.date))} fmt={(v) => `${v}`} every={2} caption={`${shownLift} heaviest completed set, kg`} />;
                })()}
              </div>
            </>
          ) : (
            <p className="i-note">A trend appears once an exercise has two sessions with weight.</p>
          )}
        </div>
        <div>
          <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'gym-template' })}>+ New</button>}>Templates</H2>
          <div className="i-pnl i-pnl--flush">
            {live.length ? (
              live.map((t) => (
                <div key={t.id} className="i-row">
                  <button type="button" className="i-row__t" style={{ textAlign: 'left' }} onClick={() => openSheet({ type: 'gym-template', editId: t.id })}>
                    <b>{t.name}</b>
                    <small>{t.focus} · {t.exercises.length} exercises · ~{t.estimate} min</small>
                  </button>
                  <button type="button" className="i-btn i-btn--sm" onClick={() => start(t)}>Start</button>
                </div>
              ))
            ) : (
              <p className="i-note" style={{ padding: '12px 0' }}>No templates.</p>
            )}
          </div>
        </div>
      </div>

      <H2 aside={`${sessions.length} sessions`}>History</H2>
      <div className="i-pnl i-pnl--flush">
        {sessions.length ? (
          sessions.slice(0, 12).map((s) => {
            const d = isGymDetail(s.detail) ? s.detail : null;
            return (
              <button key={s.entry.id} type="button" className="i-row" onClick={() => openSheet({ type: 'gym-edit', editId: s.entry.id })}>
                <span className="i-row__t">
                  <b>{d?.name ?? 'Gym'}</b> <span className="i-mono i-small i-dim">{shortDay(s.entry.date)}</span>
                  <small>
                    {d ? `${setsDone(d)} sets` : 'From the Daily Log · no sets'}
                    {d?.effort ? ` · effort ${d.effort}/10` : ''}
                    {d?.soreness != null ? ` · soreness ${d.soreness}` : ''}
                    {d?.pain ? ` · pain noted${d.painNote ? `: ${d.painNote}` : ''}` : ''}
                  </small>
                </span>
                <span className="i-row__n">{s.entry.minutes}m</span>
              </button>
            );
          })
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>Finished sessions appear here.</p>
        )}
      </div>

      <H2>Weekly target</H2>
      <div className="i-pnl i-pnl--flush">
        <div className="i-kv">
          <span>
            Gym sessions per week
            <br />
            <span className="i-mono i-small i-dim">from this week on; past weeks keep theirs</span>
          </span>
          <Stepper value={targets.gymWeek} label="gym sessions per week" onStep={(s) => setTargets({ gymWeek: Math.max(1, Math.min(6, targets.gymWeek + s)) })} />
        </div>
      </div>
      <div className="i-meters" style={{ marginTop: 10 }}>
        <Meter value={sessions.filter((s) => s.entry.date > addDays(today, -28)).length} label="Sessions · last 4 weeks" />
        <Meter value={sessions.length ? `${Math.round(sessions.slice(0, 8).reduce((a, s) => a + s.entry.minutes, 0) / Math.min(8, sessions.length))}m` : '—'} label="Average length · recent" />
      </div>
      <RelatedTasks section="gym" />
      <button type="button" className="i-btn i-btn--sm" style={{ marginTop: 12 }} onClick={() => openSheet({ type: 'gym-plan' })}>
        <Icon name="cal" size={16} /> Plan a session
      </button>
    </div>
  );
}
