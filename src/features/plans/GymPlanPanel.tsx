import { useMemo, useState } from 'react';
import { sectionRecords } from '../../data/lt';
import { data } from '../../data/store';
import { shortDay } from '../../domain/log/dates';
import { planWorkout, PLAN_WORKOUTS, PROGRESSION_RULE, STARTING_WEIGHTS_NOTE } from '../../domain/plans/gym';
import { courtNotes, DAY_NAMES, PLAN_WEEKS } from '../../domain/plans/marathon';
import { useStore } from '../../lib/createStore';
import { H2 } from '../../ui/i/bits';
import { startWorkout } from '../gym/active';
import { templateOf } from '../gym/model';
import { STATUS_LABEL } from './MarathonPanel';
import { adoptGymPlan, planTemplateForToday, stopGymPlan, usePlanView } from './plans';
import './plans.css';

/** "My plan" in the Gym channel: the week's three plan workouts, or the button to take the plan up. */
export function GymPlanPanel() {
  const v = usePlanView();
  const st = useStore(data, (s) => s);
  const templates = useMemo(() => new Map(sectionRecords(st, 'gym', 'gym_template').map((r) => [r.id, templateOf(r)])), [st]);
  const [sure, setSure] = useState(false);
  const adopted = !!v.plans.gym;
  const week = v.gym;
  const inMarathon = !!week && week.of > 0;
  const taper = inMarathon && week!.week >= 22;
  const notes = week ? courtNotes(week.sessions, v.courtDays) : [];

  if (!adopted || !week)
    return (
      <section aria-label="My gym plan">
        <H2>My plan</H2>
        <div className="i-pnl pl-gplan">
          <span className="pl-gkick">計画 · 3 days a week</span>
          <p className="pl-glede">Upper-body strength and volume, plus one short athletic day for volleyball and tennis. Legs are kept light on purpose: the running does that work.</p>
          <div className="i-rows">
            {PLAN_WORKOUTS.map((w) => (
              <div key={w.id} className="i-row pl-grow">
                <span className="pl-gday">{DAY_NAMES[w.day].toUpperCase()}</span>
                <span className="i-row__t">
                  <b>{w.name}</b>
                  <small>{w.focus} · {w.exercises.length} exercises · ~{w.estimate} min</small>
                </span>
              </div>
            ))}
          </div>
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => adoptGymPlan()}>
            Use my gym plan
          </button>
          <p className="i-note">Adds the three as normal templates you can edit. {STARTING_WEIGHTS_NOTE}</p>
        </div>
      </section>
    );

  return (
    <section aria-label="My gym plan">
      <H2 aside={inMarathon ? `Week ${week.week} of ${PLAN_WEEKS} · ${week.done}/${week.sessions.length}` : `Week ${week.week} · ${week.done}/${week.sessions.length}`}>My plan</H2>
      <div className="i-pnl i-pnl--flush pl-gplan">
        {week.sessions.map((s) => {
          const state = week.states.get(s.id)!;
          const tid = v.plans.gym!.templates[s.workout];
          const t = tid ? templates.get(tid) : undefined;
          const w = planWorkout(s.workout)!;
          return (
            <div key={s.id} className={`i-row pl-grow is-${state.status}`}>
              <span className="pl-gday">{DAY_NAMES[s.day].toUpperCase()}</span>
              <span className="i-row__t">
                <b>{s.title}</b>
                <small>
                  {state.status === 'done' && state.by ? `Done ${shortDay(state.by.date)}` : `${w.focus} · ~${w.estimate} min`}
                  {s.adjust ? ` · ${s.adjust.note}` : ''}
                </small>
                <span className={`pl-st pl-st--${state.status}`}>{STATUS_LABEL[state.status]}</span>
              </span>
              {state.status !== 'done' && t && !t.archived && (
                <button type="button" className="i-btn i-btn--sm" onClick={() => startWorkout(planTemplateForToday(t))} aria-label={`Start ${s.title}`}>
                  Start
                </button>
              )}
            </div>
          );
        })}
        {week.sessions.some((s) => !v.plans.gym!.templates[s.workout] || !templates.get(v.plans.gym!.templates[s.workout])) && (
          <div className="i-row">
            <span className="i-row__t">
              <small>A plan template is missing (deleted?).</small>
            </span>
            <button type="button" className="i-btn i-btn--sm" onClick={() => adoptGymPlan()}>Add it back</button>
          </div>
        )}
      </div>
      {notes.map((x) => (
        <p key={x.id} className="i-note pl-court">
          {shortDay(x.date)}: {x.text}
        </p>
      ))}
      <div className="pl-rules">
        <p>
          <b>Progression</b> {PROGRESSION_RULE}
        </p>
        <p>
          <b>Weights</b> {STARTING_WEIGHTS_NOTE}
        </p>
        {v.plans.marathon && (
          <p className={taper ? 'is-on' : ''}>
            <b>Marathon taper{taper ? ' · now' : ''}</b> Weeks 22–23: Athletic halved (no box jumps). Race week: upper days at 2 sets, no Athletic, no gym in the two days before the race.
          </p>
        )}
        <p>
          <b>Days</b> Mon · Wed · Thu. Moved a day? A plan workout counts any day of its week.
        </p>
        <p>
          {sure ? (
            <>
              <button type="button" className="i-link" onClick={() => stopGymPlan()}>Yes, stop the gym plan</button> (your templates stay)
            </>
          ) : (
            <button type="button" className="i-link" onClick={() => setSure(true)}>Stop the gym plan…</button>
          )}
        </p>
      </div>
      <p className="i-note pl-credit">Plan by LifeTracker for your goals (upper body first, light legs, plyos and reaction for court sports). Adjust it if anything hurts; not medical advice.</p>
    </section>
  );
}
