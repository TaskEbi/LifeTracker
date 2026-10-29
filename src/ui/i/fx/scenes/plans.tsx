/**
 * Training plans: a session done (the day's cell flips to 修), a week done (seven cards flip in a
 * wave) and a phase done (the camera runs through torii gates toward the next phase).
 */
import { Burst, Caption, Ink, range, Seal, Stamp, type Css } from '../kit';
import type { MomentFx, MomentFxMap } from './types';
import './plans.css';

const PLAN_NAME = { marathon: 'Marathon plan', gym: 'Gym plan' } as const;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_K = ['月', '火', '水', '木', '金', '土', '日'];
/** Monday = 0. */
const todayIndex = () => (new Date().getDay() + 6) % 7;

// ─── 17 plan-session: the sheet slides in, today's cell flips to 修 ─────────

const planSession: MomentFx<'plan-session'> = {
  tell: (m) => ({ kicker: 'Planned session done', title: m.title, line: `${PLAN_NAME[m.plan]} · week ${m.week}`, color: '#7bd389' }),
  time: () => ({ dur: 2600, hit: 1250 }),
  calm: () => <Seal chars="修" className="fx-seal--calm" />,
  Scene: ({ m }) => {
    const day = todayIndex();
    return (
      <div className="fx-scene fx-ps" style={{ '--tc': '#7bd389' } as Css}>
        <i className="fx-bg fx-plan-bg" />
        <i className="fx-glow" />
        <div className="fx-at fx-ps__at">
          <div className="fx-ps__sheet">
            <header>
              <b>{PLAN_NAME[m.plan]}</b>
              <span>week {m.week}</span>
            </header>
            <div className="fx-ps__grid">
              {DAYS.map((d) => (
                <span key={d} className="fx-ps__head">
                  {d}
                </span>
              ))}
              {range(21).map((i) => {
                const row = Math.floor(i / 7);
                const col = i % 7;
                const done = row < 1 || (row === 1 && col < day);
                if (row === 1 && col === day) {
                  return (
                    <span key={i} className="fx-ps__cell fx-ps__cell--today">
                      <span className="fx-ps__flip">
                        <span className="fx-ps__face fx-ps__face--front">{m.plan === 'gym' ? '力' : '走'}</span>
                        <span className="fx-ps__face fx-ps__face--back">
                          <b>修</b>
                        </span>
                      </span>
                    </span>
                  );
                }
                return <span key={i} className={`fx-ps__cell${done && (i * 7) % 3 ? ' is-done' : ''}${row === 2 ? ' is-later' : ''}`} />;
              })}
            </div>
          </div>
        </div>
        <Ink seed={m.week * 13 + 1} n={10} at={[(day - 3) * 42, 16]} />
        <Caption chip={`${PLAN_NAME[m.plan]} · week ${m.week}`} title={m.title} line="Planned session done" />
      </div>
    );
  },
};

// ─── 18 plan-week: seven day-cards flip in a wave ───────────────────────────

const planWeek: MomentFx<'plan-week'> = {
  tell: (m) => ({ kicker: 'Plan week complete', title: `Week ${m.week} of ${m.of}`, line: PLAN_NAME[m.plan], color: '#7bd389' }),
  time: () => ({ dur: 2650, hit: 1480 }),
  calm: () => <Seal chars="週" className="fx-seal--calm" />,
  Scene: ({ m }) => {
    const pct = Math.max(0, Math.min(1, m.week / Math.max(1, m.of)));
    return (
      <div className="fx-scene fx-pw" style={{ '--tc': '#7bd389' } as Css}>
        <i className="fx-bg fx-plan-bg" />
        <i className="fx-glow" />
        <div className="fx-at fx-pw__at">
          <div className="fx-pw__row">
            {DAYS.map((d, i) => (
              <div key={d} className="fx-pw__card" style={{ '--d': `${380 + i * 120}ms`, '--ry': `${(i - 3) * -7}deg`, '--z': `${-Math.abs(i - 3) * 16}px`, '--x': `${(i - 3) * 47}px` } as Css}>
                <span className="fx-pw__f fx-pw__f--back">{d[0]}</span>
                <span className="fx-pw__f fx-pw__f--front">
                  <b>{DAY_K[i]}</b>
                  <i>✓</i>
                </span>
              </div>
            ))}
          </div>
        </div>
        <Burst n={12} seed={m.week} colors={['#7bd389', '#fff', '#ffd166']} spread={[150, 280]} />
        <div className="fx-pw__week">
          <small>{PLAN_NAME[m.plan]}</small>
          <b>
            WEEK {m.week}
            <span>/{m.of}</span>
          </b>
          <span className="fx-pw__bar">
            <i style={{ '--p': pct } as Css} />
          </span>
        </div>
        <Stamp className="fx-pw__seal" delay={300}>
          <Seal chars="週完" />
        </Stamp>
        <Caption chip="plan · week complete" title={`Week ${m.week} of ${m.of}`} line={m.week >= m.of ? 'The last week of the plan' : `${m.of - m.week} to go`} />
      </div>
    );
  },
};

// ─── 19 plan-phase: through the torii toward the next phase ─────────────────

function Torii() {
  return (
    <span className="fx-torii">
      <i className="fx-torii__kasagi" />
      <i className="fx-torii__nuki" />
      <i className="fx-torii__p fx-torii__p--l" />
      <i className="fx-torii__p fx-torii__p--r" />
      <i className="fx-torii__plaque" />
    </span>
  );
}

const planPhase: MomentFx<'plan-phase'> = {
  tell: (m) => ({ kicker: 'Plan phase complete', title: m.next ? `Next: ${m.next}` : 'Plan complete', line: `${m.phase} done`, color: '#ff6b4a' }),
  time: () => ({ dur: 2800, hit: 1750 }),
  calm: () => <span className="fx-calm__k">門</span>,
  Scene: ({ m }) => (
    <div className="fx-scene fx-pp" style={{ '--tc': '#ff6b4a' } as Css}>
      <i className="fx-bg fx-pp__bg" />
      <i className="fx-pp__path" />
      <div className="fx-stage fx-pp__cam">
        {range(3).map((i) => (
          <div key={i} className="fx-pp__gate" style={{ '--d': `${i * 330}ms` } as Css}>
            <Torii />
          </div>
        ))}
      </div>
      <div className="fx-pp__next">
        <small className="fx-pp__done">
          <span className="fx-strike">{m.phase}</span> ✓
        </small>
        <b>{m.next ?? '完'}</b>
        <span>{m.next ? 'next phase' : 'plan complete'}</span>
      </div>
      <i className="fx-flash fx-pp__flash" />
      <Caption chip="plan · phase complete" title={m.next ? `On to ${m.next}` : 'Plan complete'} line={`${m.phase} phase done`} />
    </div>
  ),
};

export const PLAN_FX: Pick<MomentFxMap, 'plan-session' | 'plan-week' | 'plan-phase'> = {
  'plan-session': planSession,
  'plan-week': planWeek,
  'plan-phase': planPhase,
};
