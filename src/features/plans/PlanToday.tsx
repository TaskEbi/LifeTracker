import { navigate } from '../../app/router';
import { dayCount, shortDay } from '../../domain/log/dates';
import { PLAN_WEEKS, type PlanSession, type SessionStatus } from '../../domain/plans/marathon';
import { logRun } from './MarathonPanel';
import { usePlanView } from './plans';
import './plans.css';

/** Home: today's planned run, with a race countdown. Only once the plan is started. */
export function PlanToday() {
  const v = usePlanView();
  const m = v.marathon;
  if (!m) return null;
  const wk = m.current >= 1 && m.current <= PLAN_WEEKS ? m.weeks[m.current - 1] : null;
  const rows: { s: PlanSession; status: SessionStatus }[] = [];
  if (wk) for (const r of wk.runs) if (r.date === v.today) rows.push({ s: r, status: m.sessions.get(r.id)!.status });
  const toGo = Math.max(0, dayCount(v.today, m.race) - 1);
  const next = m.weeks.flatMap((w) => w.runs).find((r) => r.date > v.today);

  return (
    <section className="pl-home" aria-label="Training plan today">
      <div className="pl-home__h">
        <span className="pl-home__k" aria-hidden="true">計画</span>
        <b>Today’s plan</b>
        <span className="pl-home__chip" title={`Race ${shortDay(m.race)}`}>
          {toGo === 0 ? 'RACE DAY' : `D-${toGo}`}
          {m.current >= 1 && m.current <= PLAN_WEEKS ? ` · WK ${m.current}` : ''}
        </span>
      </div>
      {rows.length ? (
        rows.map(({ s, status }) => (
          <div key={s.id} className={`pl-home__row is-${status}`}>
            <button type="button" className="pl-home__t" onClick={() => navigate('sports')}>
              <span className="pl-home__ico" aria-hidden="true">走</span>
              <span>
                <b>{s.title}</b>
                <small>{s.desc.split('. ')[0]}</small>
              </span>
            </button>
            {status === 'done' ? (
              <span className="pl-st pl-st--done">Done</span>
            ) : (
              <button type="button" className="i-btn i-btn--sm" onClick={() => logRun(s, v.plans.marathon!.goal)} aria-label={`Log ${s.title}`}>
                Log
              </button>
            )}
          </div>
        ))
      ) : (
        <p className="pl-home__rest">
          {m.current === 0 ? `Plan starts ${shortDay(v.plans.marathon!.start)}.` : 'Rest day in the plan.'}
          {next ? ` Next run: ${next.title}, ${shortDay(next.date)}.` : ''}
        </p>
      )}
    </section>
  );
}
