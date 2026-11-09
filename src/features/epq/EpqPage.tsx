/**
 * 探 EPQ, at /study/epq: the project at a glance (hours, words, days, milestones and pace),
 * the production log, and the sources library with a reference list.
 */
import { useMemo, type CSSProperties } from 'react';
import { navigate, useRoute } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { useToday } from '../../data/lt';
import { data } from '../../data/store';
import { toast } from '../../data/ui';
import { shortDay } from '../../domain/log/dates';
import { formatMinutes } from '../../domain/log/duration';
import { logAsText, milestoneState, minutesByWeek, paceOf, quietDays, referenceList, TRUST, type EpqProject, type Milestone } from '../../domain/epq/model';
import { useStore } from '../../lib/createStore';
import { H2, Meter } from '../../ui/i/bits';
import { addPlanMilestones, addUsualMilestones, epqIn, setSourceUsed, toggleMilestone, type EpqState } from './actions';
import './sheets';
import './epq.css';

export const EPQ_KANJI = '探';
const TABS = [
  { id: '', label: 'Project' },
  { id: 'log', label: 'Production log' },
  { id: 'sources', label: 'Sources' },
] as const;

export function useEpq(): EpqState {
  const st = useStore(data, (s) => s);
  return useMemo(() => epqIn(st), [st]);
}

const copy = (text: string, what: string) => {
  if (!navigator.clipboard) return toast(`Couldn’t copy: this browser doesn’t allow it`);
  navigator.clipboard.writeText(text).then(
    () => toast(`${what} copied`),
    () => toast(`Couldn’t copy the ${what.toLowerCase()}`),
  );
};

/** One line for the ways in (Study, Home): hours, words and the countdown. */
export function epqLine(s: EpqState, today: string): string {
  const p = s.project;
  if (!p) return 'Set up your Extended Project: log, milestones, sources';
  const minutes = s.sessions.reduce((a, x) => a + x.minutes, 0);
  const days = p.deadline ? paceOf(0, 1, today, p.deadline, null).days : null;
  return `${Math.round(minutes / 6) / 10}h of ${p.hoursTarget}h · ${(s.words.at(-1)?.words ?? 0).toLocaleString('en-GB')} of ${p.wordTarget.toLocaleString('en-GB')} words${days != null ? ` · D-${days}` : ''}`;
}

const logTime = (p: EpqProject | null) => openSheet({ type: 'study', subject: p?.subject ?? 'EPQ', minutes: 60 });

export function EpqPage() {
  const route = useRoute();
  const tab = TABS.find((t) => t.id === (route.rest[1] ?? ''))?.id ?? '';
  const s = useEpq();
  return (
    <div className="epq">
      <button type="button" className="i-link epq-back" onClick={() => navigate('study')}>
        ◀ Study
      </button>
      <Head s={s} />
      {s.project && (
        <nav className="epq-tabs" aria-label="EPQ pages">
          {TABS.map((t) => (
            <button key={t.id} type="button" className="epq-tab" aria-current={tab === t.id ? 'page' : undefined} onClick={() => navigate('study', t.id ? ['epq', t.id] : ['epq'], { replace: true })}>
              {t.label}
              {t.id === 'log' && s.log.length > 0 && <small>{s.log.length}</small>}
              {t.id === 'sources' && s.sources.length > 0 && <small>{s.sources.length}</small>}
            </button>
          ))}
        </nav>
      )}
      {!s.project ? <Welcome /> : tab === 'log' ? <LogTab s={s} /> : tab === 'sources' ? <SourcesTab s={s} /> : <ProjectTab s={s} />}
    </div>
  );
}

function Head({ s }: { s: EpqState }) {
  const today = useToday();
  const p = s.project;
  const days = p?.deadline ? paceOf(0, 1, today, p.deadline, null).days : null;
  return (
    <header className="epq-head">
      <span className="epq-head__k" aria-hidden="true">
        {EPQ_KANJI}
      </span>
      <div className="epq-head__t">
        <small>Extended Project</small>
        <h1>{p?.title || 'EPQ'}</h1>
        {p?.question && <p>{p.question}</p>}
      </div>
      {p && (
        <button type="button" className="epq-head__due" onClick={() => openSheet({ type: 'epq-project' })} aria-label={`Edit the project${days != null ? `. ${days} days to hand in` : ''}`}>
          {days != null ? (
            <>
              <b>{days === 0 ? 'TODAY' : `D-${days}`}</b>
              <span>{shortDay(p.deadline!)}</span>
            </>
          ) : (
            <span>Set a date</span>
          )}
          <i>Edit</i>
        </button>
      )}
    </header>
  );
}

function Welcome() {
  return (
    <div className="i-pnl epq-welcome">
      <p>
        Keep the whole EPQ in one place: the hours you put in (logged as Study sessions, so they earn Study XP), the word count against your target, milestones up to hand-in, a production log you can paste into the official form, and a library of sources that writes your reference list.
      </p>
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'epq-project' })}>
        Set up your EPQ
      </button>
    </div>
  );
}

function PaceLine({ label, done, target, unit, p, today }: { label: string; done: number; target: number; unit: 'h' | 'words'; p: EpqProject; today: string }) {
  const pace = paceOf(done, target, today, p.deadline, p.started);
  const fmt = (n: number) => (unit === 'h' ? `${Math.round(n * 10) / 10}h` : `${Math.round(n).toLocaleString('en-GB')} words`);
  let say: string;
  if (pace.left === 0) say = 'Target reached.';
  else if (pace.days == null) say = `${fmt(pace.left)} to go. Set a hand-in date to see the pace.`;
  else if (pace.days === 0) say = `${fmt(pace.left)} to go, and it’s due today.`;
  else
    say = `${fmt(pace.left)} to go: about ${fmt(pace.perWeek!)} a week${pace.ahead != null && Math.abs(pace.ahead) >= (unit === 'h' ? 1 : 100) ? `. ${fmt(Math.abs(pace.ahead))} ${pace.ahead > 0 ? 'ahead of' : 'behind'} an even pace` : ''}.`;
  return (
    <div className="epq-pace" style={{ '--p': `${pace.pct * 100}%`, '--e': pace.expected != null ? `${Math.min(1, pace.expected / target) * 100}%` : '-10%' } as CSSProperties}>
      <div className="epq-pace__h">
        <b>{label}</b>
        <span className="i-mono">
          {fmt(done)} / {fmt(target)}
        </span>
      </div>
      <span className="epq-pace__bar" role="progressbar" aria-label={`${label} progress`} aria-valuenow={Math.round(pace.pct * 100)} aria-valuemin={0} aria-valuemax={100}>
        <i />
        {pace.expected != null && <em title="Where an even pace would be today" />}
      </span>
      <small>{say}</small>
    </div>
  );
}

function ProjectTab({ s }: { s: EpqState }) {
  const today = useToday();
  const p = s.project!;
  const minutes = s.sessions.reduce((a, x) => a + x.minutes, 0);
  const words = s.words.at(-1)?.words ?? 0;
  const weeks = useMemo(() => minutesByWeek(s.sessions, today, 10), [s.sessions, today]);
  const maxWeek = Math.max(60, ...weeks.map((w) => w.minutes));
  const quiet = quietDays(today, [...s.sessions.map((x) => x.date), ...s.log.map((x) => x.date), ...s.words.map((x) => x.date)]);
  const done = s.milestones.filter((m) => m.done).length;
  const next = s.milestones.find((m) => !m.done);
  const loggedToday = s.log.some((e) => e.date === today);

  return (
    <>
      <div className="epq-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => logTime(p)}>
          + Time
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'epq-log' })}>
          + Log entry
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'epq-words' })}>
          Word count
        </button>
      </div>

      {quiet != null && quiet >= 7 && (
        <p className="epq-nudge" role="note">
          Nothing on the EPQ for {quiet} days. Twenty minutes and one log line keeps it moving.
        </p>
      )}
      {quiet == null && <p className="epq-nudge">Log your first session or entry and the pace lines below come alive.</p>}

      <div className="i-meters">
        <Meter value={`${done}/${s.milestones.length}`} label="Milestones" />
        <Meter value={formatMinutes(minutes)} label="On the project" />
        <Meter value={s.log.length} label="Log entries" />
        <Meter value={s.sources.filter((x) => x.used).length} label="Sources cited" />
      </div>

      <div className="i-pnl epq-paces">
        <PaceLine label="Hours" done={minutes / 60} target={p.hoursTarget} unit="h" p={p} today={today} />
        <PaceLine label="Words" done={words} target={p.wordTarget} unit="words" p={p} today={today} />
      </div>

      <H2
        aside={
          <button type="button" className="i-link" onClick={() => openSheet({ type: 'epq-milestone' })}>
            + Milestone
          </button>
        }
      >
        Milestones
      </H2>
      <div className="i-pnl i-pnl--flush">
        {s.milestones.length ? (
          s.milestones.map((m) => <MilestoneRow key={m.id} m={m} today={today} next={m === next} />)
        ) : (
          <div className="epq-empty">
            <p className="i-note">Add your school’s dates, use the gates and reviews from your research plan, or start from the usual stages of an essay EPQ spread up to your hand-in date and edit them.</p>
            <button type="button" className="i-btn i-btn--block" onClick={() => (addUsualMilestones(today, p.deadline, s.milestones), toast(p.deadline ? 'Eight milestones added up to hand-in' : 'Eight milestones added over six months: set a hand-in date to fit them'))}>
              Add the usual milestones
            </button>
            <button type="button" className="i-btn i-btn--block" onClick={() => (addPlanMilestones(s.milestones), toast('Your plan’s 11 dates added: move them once the real ones are confirmed'))}>
              Use my research plan’s dates
            </button>
          </div>
        )}
      </div>

      <H2 aside="Hours a week">Time</H2>
      <div className="i-pnl epq-weeks" aria-label="Minutes on the EPQ per week">
        {weeks.map((w) => (
          <span key={w.monday} className="epq-weeks__w" title={`Week of ${shortDay(w.monday)}: ${formatMinutes(w.minutes)}`}>
            <i style={{ height: `${(w.minutes / maxWeek) * 100}%` }} />
            <small>{w.minutes ? Math.round(w.minutes / 6) / 10 : ''}</small>
          </span>
        ))}
      </div>

      <H2
        aside={
          <button type="button" className="i-link" onClick={() => navigate('study', ['epq', 'log'], { replace: true })}>
            Whole log ▶
          </button>
        }
      >
        Latest in the log
      </H2>
      <div className="i-pnl i-pnl--flush">
        {s.log.length ? (
          s.log.slice(0, 2).map((e) => <LogRow key={e.id} e={e} />)
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>
            The production log is marked: write a few lines each time you decide something, hit a problem, or change course.
          </p>
        )}
        {!loggedToday && s.log.length > 0 && (
          <button type="button" className="i-row" onClick={() => openSheet({ type: 'epq-log' })}>
            <span className="i-row__t">
              <b>Add today’s entry</b>
            </span>
            <span className="i-row__n">+</span>
          </button>
        )}
      </div>
    </>
  );
}

function MilestoneRow({ m, today, next }: { m: Milestone; today: string; next: boolean }) {
  const state = milestoneState(m, today);
  const days = m.due ? paceOf(0, 1, today, m.due, null).days : null;
  return (
    <div className={`epq-ms is-${state}${next ? ' is-next' : ''}`}>
      <button type="button" role="checkbox" aria-checked={!!m.done} className="epq-ms__ck" onClick={() => toggleMilestone(m, today)} aria-label={`${m.title}${m.done ? ', done' : ''}`}>
        {m.done ? '✓' : ''}
      </button>
      <button type="button" className="epq-ms__t" onClick={() => openSheet({ type: 'epq-milestone', editId: m.id })} aria-label={`Edit ${m.title}`}>
        <b>{m.title}</b>
        <small>
          {m.done ? `Done ${shortDay(m.done)}` : m.due ? `${shortDay(m.due)} · ${state === 'late' ? 'late' : days === 0 ? 'today' : `in ${days} days`}` : 'No date'}
        </small>
      </button>
    </div>
  );
}

function LogRow({ e }: { e: EpqState['log'][number] }) {
  return (
    <button type="button" className="i-row epq-log" onClick={() => openSheet({ type: 'epq-log', editId: e.id })}>
      <span className="i-row__t">
        <b>
          <span className={`epq-kind is-${e.kind.toLowerCase()}`}>{e.kind}</span> {shortDay(e.date)}
        </b>
        <small>{e.text}</small>
        {e.next && <small className="epq-log__next">Next: {e.next}</small>}
      </span>
    </button>
  );
}

function LogTab({ s }: { s: EpqState }) {
  return (
    <>
      <div className="epq-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'epq-log' })}>
          + Log entry
        </button>
        <button type="button" className="i-btn" disabled={!s.log.length} onClick={() => copy(logAsText(s.log, s.project ?? undefined), 'Production log')}>
          Copy all as text
        </button>
      </div>
      <p className="i-note">Progress, decisions (and why), problems and what you tried, reflections. Copy it out, oldest first, for the official log.</p>
      <div className="i-pnl i-pnl--flush">
        {s.log.length ? s.log.map((e) => <LogRow key={e.id} e={e} />) : <p className="i-note" style={{ padding: '12px 0' }}>No entries yet.</p>}
      </div>
    </>
  );
}

function SourcesTab({ s }: { s: EpqState }) {
  const refs = referenceList(s.sources);
  const sorted = [...s.sources].sort((a, b) => b.trust - a.trust || a.title.localeCompare(b.title));
  return (
    <>
      <div className="epq-acts">
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'epq-source' })}>
          + Source
        </button>
        <button type="button" className="i-btn" disabled={!refs.length} onClick={() => copy(refs.join('\n'), 'Reference list')}>
          Copy reference list
        </button>
      </div>
      <div className="i-pnl i-pnl--flush">
        {sorted.length ? (
          sorted.map((x) => (
            <div key={x.id} className="epq-src">
              <button type="button" className="i-row" onClick={() => openSheet({ type: 'epq-source', editId: x.id })}>
                <span className="i-row__t">
                  <b>{x.title}</b>
                  <small>{[x.author || x.publisher, x.year, x.type].filter(Boolean).join(' · ')}</small>
                  {x.notes && <small className="epq-src__notes">{x.notes}</small>}
                </span>
                <span className={`epq-trust is-${x.trust}`}>{TRUST[x.trust]}</span>
              </button>
              <button type="button" role="switch" aria-checked={x.used} className="epq-src__use" onClick={() => setSourceUsed(x, !x.used)} aria-label={`${x.title}: in the reference list`}>
                {x.used ? 'Cited' : 'Not cited'}
              </button>
            </div>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>
            Add what you read as you read it, with a line on what it says. Judge each one: who wrote it, when, why, and on what evidence.
          </p>
        )}
      </div>
      {refs.length > 0 && (
        <>
          <H2>Reference list · Harvard style</H2>
          <ol className="i-pnl epq-refs">
            {refs.map((r, i) => (
              <li key={i}>{r.split(/\*(.+?)\*/).map((part, k) => (k % 2 ? <i key={k}>{part}</i> : part))}</li>
            ))}
          </ol>
          <p className="i-note">A draft in Harvard style. Check it against your school’s guide; italics show as *stars* when copied.</p>
        </>
      )}
    </>
  );
}
