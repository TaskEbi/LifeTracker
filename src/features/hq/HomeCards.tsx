/** What the Hideout puts on Home: the next move, the shadow rival, the inner weather, rituals, this week's Big Three. */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { navigate, type RouteName } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { progressInput, useBoss, usePlans, useQuests, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { legsHurt } from '../../domain/hq/body';
import { weatherOf, WEATHER } from '../../domain/hq/checkin';
import { nextMoves, type Energy, type Move } from '../../domain/hq/nextMove';
import { currentReview, reviewIsDue } from '../../domain/hq/review';
import { appliesOn, slotAt, SLOTS } from '../../domain/hq/rituals';
import { shadowRace } from '../../domain/hq/shadow';
import { reviewQueue } from '../../domain/hq/srs';
import { formatMinutes } from '../../domain/log/duration';
import { marathonOf } from '../../domain/plans/progress';
import { dayFacts } from '../../domain/progress/quests';
import { sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { accent, Chips } from '../../ui/i/bits';
import { hourIn } from '../../domain/fun/season';
import { startFocus } from '../focus/focus';
import { savedSound, setSound } from '../focus/sound';
import { RitualRow } from './rooms/Rituals';
import { deadlinesOf, saveCheckIn, tickBig, useHq } from './store';
import './cards.css';

const minutesNow = (tz: string, d = new Date()) => {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
    return +parts.find((p) => p.type === 'hour')!.value * 60 + +parts.find((p) => p.type === 'minute')!.value;
  } catch {
    return d.getHours() * 60 + d.getMinutes();
  }
};

function runMove(m: Move) {
  const a = m.action;
  if (a.type === 'focus') {
    startFocus(a.section, a.goal);
    // This is a tap, so the browser lets last time's sound begin.
    setSound(savedSound(), false);
    openSheet({ type: 'focus' });
  } else if (a.type === 'sheet') openSheet({ type: a.sheet, ...a.extra });
  else navigate(a.route as RouteName, a.rest ?? []);
}

const TIME_KEY = 'lt.hq.move';
const readChoice = (): { minutes: string; energy: Energy } => {
  try {
    const v = JSON.parse(localStorage.getItem(TIME_KEY) ?? 'null');
    if (v && typeof v.minutes === 'string' && typeof v.energy === 'string') return v;
  } catch {
    /* use the default */
  }
  return { minutes: '30', energy: 'ok' };
};

/** 次の一手: how long, how you feel, and the best thing to do with that. */
export function NextMoveCard() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const hq = useHq();
  const boss = useBoss();
  const quests = useQuests();
  const plans = usePlans();
  const [choice, setChoice] = useState(readChoice);
  const put = (patch: Partial<typeof choice>) => {
    const next = { ...choice, ...patch };
    setChoice(next);
    try {
      localStorage.setItem(TIME_KEY, JSON.stringify(next));
    } catch {
      /* remembered for this visit only */
    }
  };
  const moves = useMemo(() => {
    const input = progressInput(st, today);
    const m = marathonOf(input, plans);
    const week = m && m.current >= 1 ? m.weeks[m.current - 1] : null;
    const run = week?.runs.find((r) => r.date === today && m!.sessions.get(r.id)?.status !== 'done');
    const big = currentReview(hq.reviews, today)?.big.filter((b) => !b.done).map((b) => ({ text: b.text, section: b.section })) ?? [];
    return nextMoves(input, {
      nowMin: minutesNow(st.settings.log_timezone),
      minutes: Number(choice.minutes),
      energy: choice.energy,
      deadlines: deadlinesOf(st, today, 45),
      cardsDue: reviewQueue(hq.cards, today).length,
      bigThree: big,
      legsHurt: legsHurt(hq.niggles),
      planRun: run ? { title: run.title, km: run.km } : null,
      bossWeak: boss.defeatedOn ? null : boss.boss.weak,
      quests: quests.daily.quests.filter((q) => !q.doneOn && q.section).map((q) => ({ title: q.title, section: q.section! })),
      overdueTasks: input.todos.filter((t) => !t.done_at && t.due && t.due < today).length,
      sleepLogged: input.metrics.some((x) => x.metric === 'sleep' && x.date === today),
    });
  }, [st, today, hq, boss, quests, plans, choice]);
  const [first, ...rest] = moves;
  return (
    <section className="hc" aria-label="Next move">
      <h2 className="h-h2">
        <span aria-hidden="true">次の一手</span> Next move
      </h2>
      <div className="hc-move">
        <div className="hc-move__ask">
          <Chips label="Time you have" value={choice.minutes} onChange={(v) => put({ minutes: v })} options={['15', '30', '60', '90'].map((m) => ({ id: m, label: `${m} min` }))} />
          <Chips
            label="How you feel"
            value={choice.energy}
            onChange={(v) => put({ energy: v })}
            options={[
              { id: 'low' as const, label: 'Tired' },
              { id: 'ok' as const, label: 'OK' },
              { id: 'high' as const, label: 'Sharp' },
            ]}
          />
        </div>
        {first ? (
          <button type="button" className="hc-move__best" style={accent(first.section)} onClick={() => runMove(first)}>
            <span className="hc-move__k" aria-hidden="true">
              {first.section ? sectionInfo(first.section).kanji : '務'}
            </span>
            <span className="hc-move__t">
              <b>{first.title}</b>
              <small>{first.why.slice(0, 2).join(' · ')}</small>
            </span>
            <span className="hc-move__go" aria-hidden="true">
              {first.action.type === 'focus' ? `▶ ${first.action.goal}m` : '▶'}
            </span>
          </button>
        ) : (
          <p className="i-note">Nothing fits that. Fifteen minutes of nothing is allowed.</p>
        )}
        {rest.length > 0 && (
          <div className="hc-move__alts">
            {rest.map((m) => (
              <button key={m.id} type="button" className="hc-move__alt" style={accent(m.section)} onClick={() => runMove(m)} title={m.why.join(' · ')}>
                <b>{m.title}</b>
                <small>{m.why[0]}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** 影: the race against your own last four weeks. */
export function ShadowCard() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const [now, setNow] = useState(() => minutesNow(st.settings.log_timezone));
  useEffect(() => {
    const t = setInterval(() => setNow(minutesNow(data.get().settings.log_timezone)), 60_000);
    return () => clearInterval(t);
  }, []);
  const race = useMemo(() => shadowRace(dayFacts(progressInput(st, today)), today, now / 1440), [st, today, now]);
  if (!race) return null;
  const end = Math.max(race.shadowTotal, race.me) * 1.04 || 1;
  const pos = (v: number) => `${Math.min(100, (v / end) * 100)}%`;
  const ahead = race.lead >= 0;
  return (
    <section className="hc" aria-label="Shadow rival">
      <div className="hc-shadow" role="img" aria-label={`${formatMinutes(race.me)} this week against your shadow's ${formatMinutes(race.shadow)}: ${formatMinutes(Math.abs(race.lead))} ${ahead ? 'ahead' : 'behind'}`}>
        <div className="hc-shadow__h">
          <span className="hc-shadow__k" aria-hidden="true">
            影
          </span>
          <b>{ahead ? `${formatMinutes(race.lead)} ahead of your shadow` : `Your shadow leads by ${formatMinutes(-race.lead)}`}</b>
        </div>
        <div className="hc-shadow__track">
          <span className="hc-shadow__lane">
            <i className="hc-shadow__ghost" style={{ left: pos(race.shadow) } as CSSProperties} />
          </span>
          <span className="hc-shadow__lane">
            <i className="hc-shadow__me" style={{ left: pos(race.me) } as CSSProperties} />
          </span>
          <span className="hc-shadow__flag" style={{ left: pos(race.shadowTotal) } as CSSProperties} />
        </div>
        <small>
          You: {formatMinutes(race.me)} · Shadow finishes the week on {formatMinutes(race.shadowTotal)}. It’s your last {race.weeks === 1 ? 'week' : `${race.weeks} weeks`}, plus 5%.
        </small>
      </div>
    </section>
  );
}

/** 心の天気: ten seconds, once a day. */
export function CheckInCard({ always }: { always?: boolean }) {
  const today = useToday();
  const hq = useHq();
  const c = hq.checkIns.find((x) => x.date === today);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(c?.note ?? '');
  useEffect(() => setNote(c?.note ?? ''), [c?.note]);
  if (c && !open && !always) {
    const w = weatherOf(c.mood);
    return (
      <button type="button" className="hc-weather__done" style={{ '--w': w.c } as CSSProperties} onClick={() => setOpen(true)} aria-label={`Inner weather today: ${w.name}. Change`}>
        <span aria-hidden="true">{w.kanji}</span> {w.name}
        {c.energy ? ` · energy ${c.energy}/5` : ''}
      </button>
    );
  }
  return (
    <section className="hc" aria-label="Inner weather">
      <div className="hc-weather">
        <span className="hc-weather__q">
          <span aria-hidden="true">心の天気</span> What’s the weather in there today?
        </span>
        <div className="hc-weather__row" role="group" aria-label="Inner weather">
          {WEATHER.map((w) => (
            <button key={w.v} type="button" className="hc-weather__b" aria-pressed={c?.mood === w.v} style={{ '--w': w.c } as CSSProperties} onClick={() => {
                // Stay open for the energy and the line.
                setOpen(true);
                saveCheckIn(today, { mood: w.v, energy: c?.energy ?? null, note });
              }}
            >
              <b aria-hidden="true">{w.kanji}</b>
              <small>{w.name}</small>
            </button>
          ))}
        </div>
        {c && (
          <>
            <div className="hc-weather__energy" role="group" aria-label="Energy">
              <span>Energy</span>
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} type="button" className={`hc-batt${(c.energy ?? 0) >= v ? ' is-on' : ''}`} aria-label={`Energy ${v} of 5`} aria-pressed={c.energy === v} onClick={() => saveCheckIn(today, { mood: c.mood, energy: v, note })} />
              ))}
            </div>
            <input className="i-input" value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== c.note && saveCheckIn(today, { mood: c.mood, energy: c.energy, note })} placeholder="One line about today · optional" aria-label="One line about today" maxLength={280} />
            {!always && (
              <button type="button" className="i-link" onClick={() => setOpen(false)}>
                Done
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** The rituals for this part of the day, until they're done. */
export function RitualsCard() {
  const today = useToday();
  const hq = useHq();
  const st = useStore(data, (s) => s);
  const slot = slotAt(hourIn(st.settings.log_timezone));
  const live = hq.rituals.filter((r) => !r.archived && appliesOn(r, today));
  const doneIds = hq.ritualDays.get(today);
  const open = live.filter((r) => !doneIds?.has(r.id));
  // This part of the day first; earlier parts stay until ticked.
  const order = SLOTS.map((s) => s.id);
  const shown = open.filter((r) => order.indexOf(r.slot) <= order.indexOf(slot)).slice(0, 4);
  if (!live.length || (!shown.length && !open.length)) return null;
  if (!shown.length) return null;
  return (
    <section className="hc" aria-label="Rituals">
      <div className="h-h2row">
        <h2 className="h-h2">
          <span aria-hidden="true">日課</span> Rituals · {live.length - open.length}/{live.length}
        </h2>
        <button type="button" className="i-link" onClick={() => navigate('base', ['rituals'])}>
          All ▶
        </button>
      </div>
      <div className="hq-rits">
        {shown.map((r) => (
          <RitualRow key={r.id} r={r} today={today} compact />
        ))}
      </div>
    </section>
  );
}

/** This week's theme and Big Three, or the nudge to choose them. */
export function BigThreeCard() {
  const today = useToday();
  const hq = useHq();
  const review = currentReview(hq.reviews, today);
  if (reviewIsDue(today, hq.reviews)) {
    return (
      <button type="button" className="hc-review" onClick={() => navigate('base', ['war'])}>
        <span className="hc-review__k" aria-hidden="true">
          作戦
        </span>
        <span>
          <b>Weekly review</b>
          <small>Ten minutes: last week on tape, then this week’s Big Three</small>
        </span>
        <span aria-hidden="true">▶</span>
      </button>
    );
  }
  if (!review || !review.big.length) return null;
  return (
    <section className="hc" aria-label="This week's Big Three">
      <div className="h-h2row">
        <h2 className="h-h2">
          <span aria-hidden="true">三本</span> {review.theme || 'Big Three'}
        </h2>
        <button type="button" className="i-link" onClick={() => navigate('base', ['war'])}>
          War room ▶
        </button>
      </div>
      <div className="hc-big">
        {review.big.map((b, i) => (
          <button key={i} type="button" role="checkbox" aria-checked={b.done} className={`hq-tick${b.done ? ' is-done' : ''}`} style={accent(b.section)} onClick={() => tickBig(review, i)}>
            <span className="hq-tick__box" aria-hidden="true">
              {b.done ? '✓' : i + 1}
            </span>
            <span className="hq-tick__t">{b.text}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
