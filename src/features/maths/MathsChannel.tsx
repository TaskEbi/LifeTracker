/**
 * CH12 · Maths: a page of Byrne's Euclid. Desk is what's next (the countdown, what's due another go),
 * Road the two ways up with your results, Notebook the problems worth keeping, and Papers practice
 * against the clock.
 */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { navigate, useRoute } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { setTargets, useAchievements, useTargets, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { toast } from '../../data/ui';
import { addDays, shortDay, weekStart } from '../../domain/log/dates';
import { formatMinutes } from '../../domain/log/duration';
import {
  againOn,
  amcScore,
  awaitingResult,
  bestAt,
  CONTESTS,
  contestInfo,
  daysUntil,
  dueAgain,
  lastTried,
  MATHS_XP,
  OUTCOME_LABEL,
  percentOf,
  results,
  roadOf,
  ROADS,
  statusOf,
  topicSpread,
  TOPICS,
  upcoming,
  weakestTopic,
  type ContestId,
  type MathsSession,
  type Outcome,
  type Problem,
  type Rung,
  type Sitting,
} from '../../domain/maths/model';
import { useStore } from '../../lib/createStore';
import { accent, Chips, H2, Meter, Stepper } from '../../ui/i/bits';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { Bars, Matrix } from '../../ui/i/charts';
import { Emblem } from '../../ui/i/Emblem';
import { Icon } from '../../ui/i/Icon';
import { RelatedTasks } from '../../ui/i/RelatedTasks';
import { addSeason, problemsIn, sessionsIn, sittingsIn, startMock, syncContestEvents } from './actions';
import { MathsArt } from './Art';
import './sheets';
import './maths.css';
import './theme.css';

const TABS = [
  { id: '', label: 'Desk' },
  { id: 'road', label: 'Road' },
  { id: 'notebook', label: 'Notebook' },
  { id: 'papers', label: 'Papers' },
] as const;

const openSitting = (s: Sitting) => openSheet({ type: 'maths-sitting', editId: s.id });
const whenWord = (n: number) => (n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `${n} days`);
const scoreLine = (s: Sitting) => `${s.score}/${s.max}${percentOf(s) != null ? ` · ${percentOf(s)}%` : ''}`;

export function MathsChannel() {
  const today = useToday();
  const route = useRoute();
  const tab = TABS.find((t) => t.id === (route.rest[0] ?? ''))?.id ?? '';
  const st = useStore(data, (s) => s);
  const sittings = useMemo(() => sittingsIn(st), [st]);
  const problems = useMemo(() => problemsIn(st), [st]);
  const sessions = useMemo(() => sessionsIn(st), [st]);
  const next = upcoming(sittings, today)[0] ?? null;
  const satCount = sittings.filter((s) => s.real && s.score != null).length;
  // An undo brings a paper back without passing through a save.
  useEffect(() => syncContestEvents(), [sittings]);

  return (
    <div style={accent('maths')} className="ma">
      <ChannelHead id="maths" art={<MathsArt days={next?.date ? daysUntil(next.date, today) : null} name={next?.label.replace(/ \d{4}$/, '') ?? null} sat={satCount} />} />
      <nav className="ma-tabs" aria-label="Maths sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" className="ma-tab" aria-current={tab === t.id ? 'page' : undefined} onClick={() => navigate('maths', t.id ? [t.id] : [], { replace: true })}>
            {t.label}
          </button>
        ))}
      </nav>
      {tab === 'road' ? (
        <RoadTab sittings={sittings} today={today} />
      ) : tab === 'notebook' ? (
        <NotebookTab problems={problems} today={today} />
      ) : tab === 'papers' ? (
        <PapersTab sittings={sittings} />
      ) : !sittings.length && !problems.length && !sessions.length ? (
        <Welcome />
      ) : (
        <Desk sittings={sittings} problems={problems} sessions={sessions} today={today} />
      )}
    </div>
  );
}

// ─── first visit ────────────────────────────────────────────────────────────

function Welcome() {
  return (
    <section className="ma-pnl ma-welcome">
      <h2>This season</h2>
      <p>Your contests, ready to add. They go on the calendar, and you can change any of them later.</p>
      <ul className="ma-season">
        <li>
          <b>SMC 2026</b>
          <span>7 Oct · 112 out of 125</span>
        </li>
        <li>
          <b>AMC 12B 2026</b>
          <span>Sat 14 Nov</span>
        </li>
        <li>
          <b>BMO1 2026</b>
          <span>Thu 19 Nov · at school</span>
        </li>
      </ul>
      <button
        type="button"
        className="i-btn i-btn--sig i-btn--block"
        onClick={() => {
          const n = addSeason();
          toast(n ? `${n} contests added` : 'They were already here');
        }}
      >
        <Icon name="plus" /> Add these three
      </button>
      <button type="button" className="i-btn i-btn--block" style={{ marginTop: 8 }} onClick={() => openSheet({ type: 'maths-sitting' })}>
        Add a different contest
      </button>
    </section>
  );
}

// ─── Desk ───────────────────────────────────────────────────────────────────

function Next({ s, after, today }: { s: Sitting; after: Sitting | null; today: string }) {
  const n = s.date ? daysUntil(s.date, today) : null;
  const info = contestInfo(s.contest);
  const gap = s.date && after?.date ? daysUntil(after.date, s.date) : null;
  return (
    <section className="ma-pnl ma-next" aria-label="Next contest">
      <button type="button" className="ma-next__head" onClick={() => openSitting(s)}>
        <span className="ma-next__k">Next contest</span>
        <b>{s.label}</b>
        <span className="ma-next__when">{n == null ? 'Date not set · tap to add it' : `${whenWord(n)} · ${shortDay(s.date!)}${s.note && s.note.length <= 30 ? ` · ${s.note.toLowerCase()}` : ''}`}</span>
      </button>
      {info.format && <p className="ma-next__fmt">{info.format}</p>}
      {gap != null && gap <= 21 && <p className="i-note">{after!.label} follows {gap === 0 ? 'the same day' : gap === 1 ? 'the next day' : `${gap} days later`}.</p>}
      <div className="ma-acts">
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'maths-brief', contest: s.contest })}>
          The brief
        </button>
        <button type="button" className="i-btn i-btn--sig" onClick={() => startMock(s.contest)}>
          Sit a practice paper
        </button>
      </div>
    </section>
  );
}

function Desk({ sittings, problems, sessions, today }: { sittings: Sitting[]; problems: Problem[]; sessions: MathsSession[]; today: string }) {
  const target = useTargets().mathsWeek;
  const monday = weekStart(today);
  const week = sessions.filter((s) => s.date >= monday && s.date <= today).reduce((n, s) => n + s.minutes, 0);
  const coming = upcoming(sittings, today);
  const waiting = awaitingResult(sittings, today);
  const due = dueAgain(problems, today);
  const solved = problems.filter((p) => statusOf(p) === 'clean').length;
  const days = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sessions) m.set(s.date, (m.get(s.date) ?? 0) + s.minutes);
    return Array.from({ length: 28 }, (_, i) => addDays(today, i - 27)).map((date) => ({ date, minutes: m.get(date) ?? 0 }));
  }, [sessions, today]);
  return (
    <>
      {coming[0] ? (
        <Next s={coming[0]} after={coming[1] ?? null} today={today} />
      ) : (
        <button type="button" className="i-btn i-btn--block" onClick={() => openSheet({ type: 'maths-sitting' })}>
          <Icon name="plus" /> Add your next contest
        </button>
      )}
      {waiting.map((s) => (
        <button key={s.id} type="button" className="ma-pnl ma-await" onClick={() => openSitting(s)}>
          <b>{s.label}: how did it go?</b>
          <small>{shortDay(s.date!)} · add your score when you have it</small>
        </button>
      ))}
      <button type="button" className="i-btn i-btn--sig i-btn--block" style={{ marginTop: 10 }} onClick={() => openSheet({ type: 'maths' })}>
        <Icon name="plus" /> Log maths
      </button>
      <div className="i-meters" style={{ marginTop: 10 }}>
        <Meter value={formatMinutes(week)} label={`of ${formatMinutes(target)} this week`} />
        <Meter value={solved} label="Problems solved" />
        <Meter value={sittings.filter((s) => s.score != null).length} label="Papers marked" />
      </div>

      <H2 aside={<button type="button" className="i-link" onClick={() => navigate('maths', ['notebook'])}>Notebook</button>}>Worth another go</H2>
      {due.length ? (
        <div className="i-pnl i-pnl--flush">
          {due.slice(0, 4).map((p) => (
            <ProblemRow key={p.id} p={p} today={today} />
          ))}
        </div>
      ) : (
        <p className="i-note">{problems.length ? 'Nothing due. Problems you got stuck on come back after a week, ones you needed a hint for after three.' : 'Add a problem that beat you, with the idea you were missing. It comes back when you might have forgotten it.'}</p>
      )}

      <H2 aside={formatMinutes(days.reduce((n, d) => n + d.minutes, 0))}>Last 4 weeks</H2>
      <div className="i-pnl">
        <Matrix days={days} today={today} label="Maths in the last 4 weeks" />
      </div>

      <Awards />

      <H2 aside={`${sessions.length} sessions`}>Recent sessions</H2>
      <div className="i-pnl i-pnl--flush">
        {sessions.length ? (
          sessions.slice(0, 6).map((s) => (
            <button key={s.id} type="button" className="i-row" onClick={() => openSheet(s.sittingId ? { type: 'maths-sitting', editId: s.sittingId } : { type: 'maths', editId: s.id })}>
              <span className="i-row__t">
                <b>{s.paper ?? s.kind}</b> <span className="i-mono i-small i-dim">{shortDay(s.date)}</span>
                <small>{[s.topic, s.note].filter(Boolean).join(' · ')}</small>
              </span>
              <span className="i-row__n">{s.minutes}m</span>
            </button>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>Nothing logged yet.</p>
        )}
      </div>

      <div className="i-pnl ma-target">
        <span>
          Maths per week
          <br />
          <span className="i-mono i-small i-dim">applies from this week; past weeks keep theirs</span>
        </span>
        <Stepper value={formatMinutes(target)} label="weekly target" onStep={(s) => setTargets({ mathsWeek: Math.max(15, target + 15 * s) })} />
      </div>
      <RelatedTasks section="maths" />
      <p className="i-note">Time goes into the Daily Log as “Maths competitions” and earns XP like any section. A real contest earns {MATHS_XP.contest} XP once it has a score, a marked practice paper {MATHS_XP.paper}, and a problem solved without help {MATHS_XP.solved}, up to {MATHS_XP.solvedPerDay} problems a day.</p>
    </>
  );
}

function Awards() {
  const all = useAchievements();
  const mine = all.filter((a) => a.group === 'maths');
  const won = mine.filter((a) => a.unlockedOn).sort((a, b) => b.unlockedOn!.localeCompare(a.unlockedOn!));
  const next = mine.filter((a) => !a.unlockedOn).sort((a, b) => b.progress / b.goal - a.progress / a.goal).slice(0, 2);
  return (
    <>
      <H2 aside={<button type="button" className="i-link" onClick={() => navigate('progress', ['achievements'])}>{won.length} of {mine.length}</button>}>Emblems</H2>
      <div className="i-pnl i-pnl--flush">
        {[...won.slice(0, 1), ...next].slice(0, 3).map((a) => (
          <div key={a.id} className="i-row i-row--lead">
            <Emblem a={a} size={46} locked={!a.unlockedOn} />
            <span className="i-row__t">
              <b>{a.title}</b>
              <small>{a.desc}</small>
            </span>
            <span className="i-row__n">{a.unlockedOn ? shortDay(a.unlockedOn) : `${a.progress}/${a.goal}`}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Road ───────────────────────────────────────────────────────────────────

function RungRow({ r, today }: { r: Rung; today: string }) {
  const s = r.sitting;
  const line =
    r.state === 'done'
      ? `${scoreLine(s!)}${s!.date ? ` · ${shortDay(s!.date)}` : ''}${s!.award ? ` · ${s!.award}` : ''}`
      : r.state === 'booked'
        ? s!.date
          ? s!.date < today
            ? `${shortDay(s!.date)} · add your score`
            : `${whenWord(daysUntil(s!.date, today))} · ${shortDay(s!.date)}`
          : 'Date not set'
        : r.contest.entry;
  const open = () => (s ? openSitting(s) : openSheet({ type: 'maths-sitting', contest: r.contest.id, real: true }));
  return (
    <li className={`ma-rung is-${r.state}`}>
      <button type="button" className="ma-rung__b" onClick={open}>
        <i className="ma-rung__mark" aria-hidden="true" />
        <span>
          <b>{r.contest.name}</b>
          <small>{line}</small>
        </span>
      </button>
      <button type="button" className="i-link ma-rung__info" onClick={() => openSheet({ type: 'maths-brief', contest: r.contest.id })} aria-label={`The brief for ${r.contest.name}`}>
        Brief
      </button>
    </li>
  );
}

function RoadTab({ sittings, today }: { sittings: Sitting[]; today: string }) {
  const done = results(sittings).filter((s) => s.real);
  return (
    <>
      {ROADS.map((road) => (
        <section key={road.id} aria-label={`The ${road.name} road`}>
          <H2>{road.name}</H2>
          <ol className="ma-pnl ma-road">
            {roadOf(road.rungs, sittings).map((r) => (
              <RungRow key={r.contest.id} r={r} today={today} />
            ))}
          </ol>
        </section>
      ))}
      <p className="i-note">Tap a rung to add or change it. Scores needed to go through change every year, so check them with UKMT and MAA.</p>
      <button type="button" className="i-btn i-btn--block" onClick={() => openSheet({ type: 'maths-sitting', contest: 'other' })}>
        <Icon name="plus" /> Another contest
      </button>
      <H2 aside={done.length}>Results</H2>
      <div className="i-pnl i-pnl--flush">
        {done.length ? (
          done.map((s) => (
            <button key={s.id} type="button" className="i-row" onClick={() => openSitting(s)}>
              <span className="i-row__t">
                <b>{s.label}</b>
                <small>{[s.date ? shortDay(s.date) : null, s.award, s.note].filter(Boolean).join(' · ')}</small>
              </span>
              <span className="i-row__n">{s.score}/{s.max}</span>
            </button>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>No results yet.</p>
        )}
      </div>
    </>
  );
}

// ─── Notebook ───────────────────────────────────────────────────────────────

function ProblemRow({ p, today }: { p: Problem; today: string }) {
  const s = statusOf(p);
  const on = againOn(p);
  const last = lastTried(p);
  return (
    <button type="button" className="i-row i-row--lead" onClick={() => openSheet({ type: 'maths-problem', editId: p.id })}>
      <i className={`ma-shape ma-shape--${s ?? 'none'}`} aria-hidden="true" />
      <span className="i-row__t">
        <b>{p.title}</b>
        <small>{[p.topic, p.idea].filter(Boolean).join(' · ')}</small>
      </span>
      <span className="i-row__n">{s == null ? '' : on && on <= today ? 'Again' : s === 'clean' ? '∎' : last ? shortDay(last) : ''}</span>
    </button>
  );
}

type Filter = 'all' | Outcome | (typeof TOPICS)[number];

function NotebookTab({ problems, today }: { problems: Problem[]; today: string }) {
  const [filter, setFilter] = useState<Filter>('all');
  const spread = useMemo(() => topicSpread(problems), [problems]);
  const weak = weakestTopic(spread);
  const shown = problems
    .filter((p) => (filter === 'all' ? true : filter === 'clean' || filter === 'hint' || filter === 'stuck' ? statusOf(p) === filter : p.topic === filter))
    .sort((a, b) => (lastTried(b) ?? '').localeCompare(lastTried(a) ?? ''));
  const top = Math.max(1, ...spread.map((l) => l.tried));
  return (
    <>
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'maths-problem' })}>
        <Icon name="plus" /> Add a problem
      </button>
      <H2 aside={`${problems.length} kept`}>Four corners</H2>
      <div className="ma-pnl ma-topics">
        {spread.map((l) => (
          <div key={l.topic} className="ma-topic">
            <span>{l.topic}</span>
            <span className="ma-topic__bar" style={{ '--t': `${(l.tried / top) * 100}%`, '--s': `${l.tried ? (l.clean / l.tried) * 100 : 0}%` } as CSSProperties} aria-hidden="true">
              <i />
            </span>
            <b>{l.clean}/{l.tried}</b>
          </div>
        ))}
        {weak && <p className="i-note">{weak} could use the next hour.</p>}
      </div>
      <Chips
        label="Show"
        value={filter}
        onChange={setFilter}
        options={[{ id: 'all', label: 'All' }, ...(['stuck', 'hint', 'clean'] as Outcome[]).map((o) => ({ id: o, label: OUTCOME_LABEL[o] })), ...TOPICS.map((t) => ({ id: t, label: t }))] as { id: Filter; label: string }[]}
      />
      <H2 aside={`${shown.length}`}>Problems</H2>
      {shown.length ? (
        <div className="i-pnl i-pnl--flush">
          {shown.slice(0, 200).map((p) => (
            <ProblemRow key={p.id} p={p} today={today} />
          ))}
        </div>
      ) : (
        <p className="i-note">{problems.length ? 'Nothing here.' : 'Keep the ones that taught you something: the source, the idea, where you got stuck.'}</p>
      )}
    </>
  );
}

// ─── Papers ─────────────────────────────────────────────────────────────────

function AmcCalc() {
  const [right, setRight] = useState(15);
  const [blank, setBlank] = useState(5);
  return (
    <div className="ma-pnl ma-calc">
      <div className="ma-steps">
        <span>Right</span>
        <Stepper value={right} label="right answers" onStep={(d) => setRight(Math.max(0, Math.min(25 - blank, right + d)))} />
        <span>Blank</span>
        <Stepper value={blank} label="blank answers" onStep={(d) => setBlank(Math.max(0, Math.min(25 - right, blank + d)))} />
      </div>
      <p className="ma-sum" role="status">
        {amcScore(right, blank)} out of 150 <small>· {25 - right - blank} wrong</small>
      </p>
    </div>
  );
}

function PapersTab({ sittings }: { sittings: Sitting[] }) {
  const papers = results(sittings).filter((s) => !s.real);
  const contests = CONTESTS.filter((c) => c.id !== 'other' && c.id !== 'usamo');
  const trends = (contests.map((c) => c.id) as ContestId[])
    .map((id) => ({ id, list: papers.filter((s) => s.contest === id).reverse() }))
    .filter((t) => t.list.length >= 2);
  return (
    <>
      <H2>Against the clock</H2>
      <p className="i-note">Starts the timer at the contest’s length. When it ends, the minutes come back here for you to mark.</p>
      <div className="ma-clock">
        {contests.map((c) => (
          <button key={c.id} type="button" className="ma-clock__b" onClick={() => startMock(c.id)}>
            <b>{c.name}</b>
            <small>{formatMinutes(c.minutes)}</small>
          </button>
        ))}
      </div>
      <button type="button" className="i-btn i-btn--block" style={{ marginTop: 10 }} onClick={() => openSheet({ type: 'maths-sitting', real: false })}>
        <Icon name="plus" /> Add a marked paper
      </button>
      {trends.map((t) => {
        const best = bestAt(papers, t.id);
        return (
          <section key={t.id} aria-label={`${contestInfo(t.id).name} practice scores`}>
            <H2 aside={best ? `best ${best.score}/${best.max}` : undefined}>{contestInfo(t.id).name}</H2>
            <div className="i-pnl">
              <Bars
                values={t.list.map((s) => s.score!)}
                labels={t.list.map((s) => (s.date ? s.date.slice(8) : ''))}
                long={t.list.map((s) => `${s.label}${s.date ? `, ${shortDay(s.date)}` : ''}`)}
                hi={t.list.map((_, i) => i)}
                fmt={(v) => String(Math.round(v))}
                caption={`${contestInfo(t.id).name} practice scores, oldest first`}
                height={120}
              />
            </div>
          </section>
        );
      })}
      <H2 aside={papers.length}>Marked papers</H2>
      <div className="i-pnl i-pnl--flush">
        {papers.length ? (
          papers.map((s) => (
            <button key={s.id} type="button" className="i-row" onClick={() => openSitting(s)}>
              <span className="i-row__t">
                <b>{s.label}</b>
                <small>{[s.date ? shortDay(s.date) : null, s.minutes ? `${s.minutes} min` : null, s.note].filter(Boolean).join(' · ')}</small>
              </span>
              <span className="i-row__n">{s.score}/{s.max}</span>
            </button>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>No practice papers yet.</p>
        )}
      </div>
      <H2>AMC score</H2>
      <AmcCalc />
    </>
  );
}
