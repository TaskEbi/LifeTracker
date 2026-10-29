import { navigate } from '../../app/router';
import { dayCount, shortDay } from '../../domain/log/dates';
import { planWorkout } from '../../domain/plans/gym';
import { PLAN_WEEKS, type PlanSession } from '../../domain/plans/marathon';
import { STATUS_LABEL, logRun } from './MarathonPanel';
import { usePlanView } from './plans';
import './plans.css';

/** Home: today's planned run and/or gym workout, with a race countdown. Only once a plan is started. */
export function PlanToday() {
  const v = usePlanView();
  const m = v.marathon;
  if (!m && !v.plans.gym) return null;
  const wk = m && m.current >= 1 && m.current <= PLAN_WEEKS ? m.weeks[m.current - 1] : null;
  const rows: { s: PlanSession; status: keyof typeof STATUS_LABEL }[] = [];
  if (wk) for (const r of wk.runs) if (r.date === v.today) rows.push({ s: r, status: m!.sessions.get(r.id)!.status });
  if (v.plans.gym && v.gym) for (const g of v.gym.sessions) if (g.date === v.today) rows.push({ s: g, status: v.gym.states.get(g.id)!.status });
  const toGo = m ? Math.max(0, dayCount(v.today, m.race) - 1) : null;
  const next = m?.weeks.flatMap((w) => w.runs).find((r) => r.date > v.today);

  return (
    <section className="pl-home" aria-label="Training plan today">
      <div className="pl-home__h">
        <span className="pl-home__k" aria-hidden="true">計画</span>
        <b>Today’s plan</b>
        {toGo != null && (
          <span className="pl-home__chip" title={`Race ${shortDay(m!.race)}`}>
            {toGo === 0 ? 'RACE DAY' : `D-${toGo}`}
            {m!.current >= 1 && m!.current <= PLAN_WEEKS ? ` · WK ${m!.current}` : ''}
          </span>
        )}
      </div>
      {rows.length ? (
        rows.map(({ s, status }) => (
          <div key={s.id} className={`pl-home__row is-${status}`}>
            <button type="button" className="pl-home__t" onClick={() => navigate(s.kind === 'run' ? 'sports' : 'gym')}>
              <span className="pl-home__ico" aria-hidden="true">{s.kind === 'run' ? '走' : '力'}</span>
              <span>
                <b>{s.title}</b>
                <small>{s.kind === 'run' ? s.desc.split('. ')[0] : s.adjust?.note ?? `Gym plan · ~${planWorkout(s.workout)?.estimate ?? 60} min`}</small>
              </span>
            </button>
            {status === 'done' ? (
              <span className="pl-st pl-st--done">Done</span>
            ) : s.kind === 'run' && m ? (
              <button type="button" className="i-btn i-btn--sm" onClick={() => logRun(s, v.plans.marathon!.goal)} aria-label={`Log ${s.title}`}>
                Log
              </button>
            ) : (
              <span className={`pl-st pl-st--${status}`}>{STATUS_LABEL[status]}</span>
            )}
          </div>
        ))
      ) : (
        <p className="pl-home__rest">
          {m && m.current === 0 ? `Plan starts ${shortDay(v.plans.marathon!.start)}.` : 'Rest day in the plan.'}
          {next ? ` Next run: ${next.title}, ${shortDay(next.date)}.` : ''}
        </p>
      )}
    </section>
  );
}
