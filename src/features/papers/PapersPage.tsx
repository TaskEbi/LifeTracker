/**
 * 卷 Past papers, at /study/papers: every paper to 2021 for Physics, Maths, Further Maths and
 * Computer Science with ticks, scores and mock papers kept back; the hardest AS Physics questions
 * by topic from the examiner reports; topic-question booklets; and a retry list for anything
 * you got wrong, spaced 2, 7 and 21 days apart.
 */
import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { navigate, useRoute } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { useToday } from '../../data/lt';
import { data } from '../../data/store';
import { occurrences } from '../../domain/calendar/occurrences';
import { addDays, shortDay } from '../../domain/log/dates';
import { LAST_YEAR, type UnitRow } from '../../domain/papers/catalogue';
import { HARD_TOPICS, TIER_HINT, TIER_LABEL, type HardUnit, type Tier } from '../../domain/papers/hard';
import {
  BOARD,
  BOOKLET_NOTE,
  bookletPage,
  bookletsOf,
  hardList,
  matchHard,
  newestForMocks,
  nextPaper,
  NO_FILTER,
  paperById,
  papersOfUnit,
  pickHard,
  sortHard,
  SUBJECTS,
  topicCounts,
  unitProgress,
  unitsOf,
  type HardFilter,
  type HardItem,
  type Paper,
  type Subject,
} from '../../domain/papers/model';
import { pctOf, retryOrder, whyCounts, type HardMark, type Mistake } from '../../domain/papers/records';
import { createStore, useStore } from '../../lib/createStore';
import { Chips, H2, Meter } from '../../ui/i/bits';
import { dueCount, retryHard, retryMistake, setHard, setMock, toggleBooklet, togglePaperDone, type PapersState } from './actions';
import { PAPERS_KANJI, usePapers } from './door';
import './sheets';
import './papers.css';

const TABS = [
  { id: '', label: 'Papers' },
  { id: 'hard', label: 'Hard questions' },
  { id: 'topics', label: 'By topic' },
  { id: 'retry', label: 'Retry' },
] as const;

const UNIT_NAMES: Record<HardUnit, string> = {
  WPH11: 'Unit 1',
  WPH12: 'Unit 2',
  WPH13: 'Unit 3',
};

/** The page's own choices, kept while moving between tabs; subject is remembered on this device. */
const SUBJECT_KEY = 'lifetracker-papers-subject';
const savedSubject = (): Subject => {
  try {
    const s = localStorage.getItem(SUBJECT_KEY) as Subject | null;
    return s && SUBJECTS.includes(s) ? s : 'Physics';
  } catch {
    return 'Physics';
  }
};
const view = createStore<{
  subject: Subject;
  filter: HardFilter;
  flash: string | null;
}>({ subject: savedSubject(), filter: NO_FILTER, flash: null });
const setSubject = (subject: Subject) => {
  view.set({ subject });
  try {
    localStorage.setItem(SUBJECT_KEY, subject);
  } catch {
    /* remembered for this visit */
  }
};
const setFilter = (f: Partial<HardFilter>) => view.set((s) => ({ ...s, filter: { ...s.filter, ...f } }));

function Ext({ href, children, primary, label }: { href: string | null; children: ReactNode; primary?: boolean; label?: string }) {
  if (!href) return null;
  return (
    <a className={`pq-link${primary ? ' pq-link--main' : ''}`} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
      {children}
    </a>
  );
}

function Tick({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className="pq-tick" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick}>
      {on ? '✓' : ''}
    </button>
  );
}

export default function PapersPage() {
  const route = useRoute();
  const tab = TABS.find((t) => t.id === (route.rest[1] ?? ''))?.id ?? '';
  const s = usePapers();
  const today = useToday();
  const due = dueCount(s, today);
  return (
    <div className="pq">
      <button type="button" className="i-link epq-back" onClick={() => navigate('study')}>
        ◀ Study
      </button>
      <Head s={s} today={today} due={due} meters={tab === ''} />
      <nav className="epq-tabs" aria-label="Past paper pages">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="epq-tab"
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() =>
              navigate('study', t.id ? ['papers', t.id] : ['papers'], {
                replace: true,
              })
            }
          >
            {t.label}
            {t.id === 'retry' && due > 0 && <small>{due}</small>}
          </button>
        ))}
      </nav>
      {tab === 'hard' ? <HardTab s={s} today={today} /> : tab === 'topics' ? <TopicsTab s={s} today={today} /> : tab === 'retry' ? <RetryTab s={s} today={today} /> : <PapersTab s={s} today={today} />}
    </div>
  );
}

function Head({ s, today, due, meters }: { s: PapersState; today: string; due: number; meters: boolean }) {
  const events = useStore(data, (x) => x.lt_events);
  const exam = useMemo(() => occurrences(events.values(), today, addDays(today, 240)).find((o) => !o.cancelled && o.event.kind === 'exam'), [events, today]);
  const done = [...s.marks.values()].filter((m) => m.done).length;
  const hardDone = [...s.hard.values()].filter((m) => m.state === 'done').length;
  return (
    <>
      <header className="epq-head pq-head">
        <span className="epq-head__k" aria-hidden="true">
          {PAPERS_KANJI}
        </span>
        <span className="epq-head__t">
          <small>A-level · papers to {LAST_YEAR}</small>
          <h1>Past papers</h1>
          {meters && <p>Tick what you’ve done, score it, keep the newest for mocks, and come back to what you got wrong.</p>}
        </span>
      </header>
      {meters && (
        <div className="i-meters" style={{ marginTop: 10 }}>
          <Meter value={done} label="Papers done" />
          <Meter value={`${hardDone}/${hardList().length}`} label="Hard questions" onClick={() => navigate('study', ['papers', 'hard'], { replace: true })} />
          <Meter value={due} label="To retry today" onClick={() => navigate('study', ['papers', 'retry'], { replace: true })} />
          <Meter value={exam ? `${Math.round((Date.parse(exam.date) - Date.parse(today)) / 864e5)}d` : '—'} label={exam ? `To ${exam.event.title}` : 'No exam set'} />
        </div>
      )}
    </>
  );
}

// ── Papers ──

function PapersTab({ s, today }: { s: PapersState; today: string }) {
  const subject = useStore(view, (v) => v.subject);
  const units = unitsOf(subject);
  const as = units.filter((u) => u.spec === 'new' && u.level === 'AS');
  const a2 = units.filter((u) => u.spec === 'new' && u.level === 'A2');
  const old = units.filter((u) => u.spec === 'old');
  return (
    <div className="pq-tab">
      <Chips label="Subject" value={subject} onChange={setSubject} options={SUBJECTS.map((x) => ({ id: x, label: x }))} />
      <p className="i-note pq-board">
        {BOARD[subject]}. Papers {LAST_YEAR} and earlier. Links open Physics &amp; Maths Tutor’s copies
        {subject === 'Physics' ? '; examiner reports open a mirror of Pearson’s' : ''}.
      </p>
      <H2>AS units</H2>
      {as.map((u) => (
        <UnitBlock key={u.code} unit={u} s={s} today={today} open />
      ))}
      {a2.length > 0 && (
        <details className="pq-more">
          <summary>
            A2 units <small>{a2.map((u) => u.short).join(' · ')}</small>
          </summary>
          {a2.map((u) => (
            <UnitBlock key={u.code} unit={u} s={s} today={today} />
          ))}
        </details>
      )}
      {old.length > 0 && (
        <details className="pq-more">
          <summary>
            Older spec, same topics <small>{subject === 'Physics' ? 'WPH01–06 and the UK 6PH0x papers' : '9608, before 9618'}</small>
          </summary>
          <p className="i-note">
            {subject === 'Physics'
              ? 'The papers before the 2018 spec. Most questions still fit; a few topics moved between units.'
              : 'Cambridge 9608, the course before 9618. Most of the theory carries over; check the 9618 syllabus for what changed.'}
          </p>
          {old.map((u) => (
            <UnitBlock key={u.code} unit={u} s={s} today={today} />
          ))}
        </details>
      )}
    </div>
  );
}

function UnitBlock({ unit, s, today, open }: { unit: UnitRow; s: PapersState; today: string; open?: boolean }) {
  const papers = papersOfUnit(unit.code);
  const prog = unitProgress(papers, s.marks);
  const next = nextPaper(papers, s.marks);
  const hardBy = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of hardList()) if (h.u === unit.code) m.set(`${h.u}|${h.s}`, (m.get(`${h.u}|${h.s}`) ?? 0) + 1);
    return m;
  }, [unit.code]);
  const label = `${unit.short} · ${unit.name}`;
  return (
    <details className="pq-unit" open={open}>
      <summary>
        <span className="pq-unit__t">
          <b>{label}</b>
          <small>
            {unit.code} · {prog.done}/{prog.total} done
            {prog.avg != null ? ` · average ${prog.avg}%` : ''}
            {prog.kept ? ` · ${prog.kept} kept for mocks` : ''}
          </small>
        </span>
        <span className="pq-bar" aria-hidden="true">
          <i
            style={{
              width: `${prog.total ? (prog.done / prog.total) * 100 : 0}%`,
            }}
          />
        </span>
      </summary>
      <div className="pq-unit__acts">
        {next && (
          <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'paper', id: next.id })} aria-label={`Next paper: ${unit.short} ${next.short}`}>
            Next: {next.short}
          </button>
        )}
        {!prog.kept && papers.length > 4 && (
          <button type="button" className="i-link" onClick={() => setMock(newestForMocks(papers, s.marks, 2), true)}>
            Keep the newest two for mocks
          </button>
        )}
      </div>
      <ul className="pq-papers" aria-label={`${label} papers`}>
        {papers.map((p) => (
          <PaperRow key={p.id} p={p} s={s} today={today} hard={hardBy.get(p.id) ?? 0} />
        ))}
      </ul>
    </details>
  );
}

function PaperRow({ p, s, today, hard }: { p: Paper; s: PapersState; today: string; hard: number }) {
  const m = s.marks.get(p.id);
  const pc = m ? pctOf(m) : null;
  const name = `${p.unit.short} ${p.short}`;
  return (
    <li className={`pq-paper${m?.done ? ' is-done' : ''}`}>
      <Tick on={!!m?.done} label={`${name} done`} onClick={() => togglePaperDone(p.id, today)} />
      <button type="button" className="pq-paper__t" onClick={() => openSheet({ type: 'paper', id: p.id })} aria-label={`${name}: score and details`}>
        <b>{p.short}</b>
        <small>
          {m?.done ? `done ${shortDay(m.done, today)}` : m?.mock ? 'kept for a mock' : ''}
          {pc != null ? ` · ${m!.score}/${m!.outOf} (${pc}%)` : ''}
        </small>
      </button>
      {m?.mock && !m.done && <span className="pq-tag pq-tag--mock">Mock</span>}
      <span className="pq-paper__links">
        <Ext href={p.qp} primary label={`${name} question paper`}>
          QP
        </Ext>
        <Ext href={p.ms} label={`${name} mark scheme`}>
          MS
        </Ext>
        <Ext href={p.ma} label={`${name} model answers`}>
          Ans
        </Ext>
        <Ext href={p.er} label={`${name} examiner report`}>
          Report
        </Ext>
        {hard > 0 && (
          <button
            type="button"
            className="pq-link pq-link--hard"
            onClick={() => {
              view.set({
                filter: {
                  ...NO_FILTER,
                  unit: p.unit.code as HardUnit,
                  search: p.short,
                },
              });
              navigate('study', ['papers', 'hard'], { replace: true });
            }}
            aria-label={`${name}: ${hard} hard questions`}
          >
            {hard} hard
          </button>
        )}
      </span>
    </li>
  );
}

// ── Hard questions ──

function HardTab({ s, today }: { s: PapersState; today: string }) {
  const f = useStore(view, (v) => v.filter);
  const flash = useStore(view, (v) => v.flash);
  const all = hardList();
  const shown = useMemo(() => sortHard(all.filter((h) => matchHard(h, f, s.hard))), [all, f, s.hard]);
  const done = all.filter((h) => s.hard.get(h.key)?.state === 'done').length;
  const topics = topicCounts(f.unit, s.hard);
  const tryOne = () => {
    const h = pickHard(shown.length ? shown : all, s.hard, Math.random());
    if (!h) return;
    view.set({ flash: h.key });
    requestAnimationFrame(() => document.getElementById(`hq-${cssId(h.key)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };
  return (
    <div className="pq-tab">
      <p className="i-note">
        Edexcel International AS Physics, January 2019 to October 2021: the questions candidates scored worst on, from Pearson’s examiner reports. Exact percentages are only published for some
        multiple-choice questions; otherwise the level comes from how the examiners described the answers. June 2021 had no report, so none of its questions are here.
      </p>
      <div className="pq-legend" aria-label="Levels">
        {([1, 2, 3] as Tier[]).map((t) => (
          <span key={t}>
            <span className={`pq-pill pq-t${t}`}>{TIER_LABEL[t]}</span> {TIER_HINT[t]}
          </span>
        ))}
      </div>

      <details className="pq-more pq-topicbox" open={f.unit !== 'all'} key={f.unit}>
        <summary>
          Topics <small>{f.unit === 'all' ? 'all three units' : UNIT_NAMES[f.unit]} · tap one to filter</small>
        </summary>
        <div className="pq-topics" role="group" aria-label="Topics">
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              className="pq-topic"
              aria-pressed={f.topic === t.id}
              onClick={() =>
                setFilter({
                  topic: f.topic === t.id ? 'all' : t.id,
                  unit: t.unit,
                })
              }
              style={
                {
                  '--p': `${t.total ? (t.done / t.total) * 100 : 0}%`,
                } as CSSProperties
              }
            >
              <b>{t.name}</b>
              <small>
                {UNIT_NAMES[t.unit]} · {t.done}/{t.total}
                {t.wrong ? ` · ${t.wrong} to retry` : ''}
              </small>
              <span className="pq-bar" aria-hidden="true">
                <i />
              </span>
            </button>
          ))}
        </div>
      </details>

      <section className="i-pnl pq-filters" aria-label="Filter questions">
        <Chips
          label="Unit"
          value={f.unit}
          onChange={(u) =>
            setFilter({
              unit: u,
              topic: u === 'all' || HARD_TOPICS.find((t) => t.id === f.topic)?.unit === u ? f.topic : 'all',
            })
          }
          options={[
            { id: 'all', label: 'All units' },
            ...(Object.keys(UNIT_NAMES) as HardUnit[]).map((u) => ({
              id: u,
              label: `${UNIT_NAMES[u]} (${u})`,
            })),
          ]}
        />
        <Chips
          label="Level"
          value={String(f.tier)}
          onChange={(t) => setFilter({ tier: Number(t) as Tier | 0 })}
          options={[
            { id: '0', label: 'All levels' },
            ...([1, 2, 3] as Tier[]).map((t) => ({
              id: String(t),
              label: TIER_LABEL[t],
            })),
          ]}
        />
        <input
          className="i-input pq-search"
          type="search"
          value={f.search}
          onChange={(e) => setFilter({ search: e.target.value })}
          placeholder="Search: fireboat, Jan 2020, Q14, polarisation"
          aria-label="Search questions"
        />
        <div className="pq-checks">
          <label>
            <input type="checkbox" checked={f.hideDone} onChange={(e) => setFilter({ hideDone: e.target.checked })} /> Hide done
          </label>
          <label>
            <input type="checkbox" checked={f.mcqOnly} onChange={(e) => setFilter({ mcqOnly: e.target.checked })} /> Multiple choice only
          </label>
          <label>
            <input type="checkbox" checked={f.wrongOnly} onChange={(e) => setFilter({ wrongOnly: e.target.checked })} /> Got wrong
          </label>
          <button type="button" className="i-link" onClick={() => view.set({ filter: NO_FILTER })}>
            Clear filters
          </button>
        </div>
      </section>

      <H2
        aside={
          <button type="button" className="i-link" onClick={tryOne}>
            Pick one for me
          </button>
        }
      >
        Hardest first
      </H2>
      <p className="i-mono i-small i-dim pq-count" aria-live="polite">
        {shown.length} shown · {done}/{all.length} done
      </p>
      {shown.length ? (
        <ol className="pq-qs">
          {shown.map((h) => (
            <HardCard key={h.key} h={h} m={s.hard.get(h.key)} today={today} flash={flash === h.key} />
          ))}
        </ol>
      ) : (
        <p className="i-pnl pq-empty">No questions match these filters. Clear them to see all {all.length}.</p>
      )}
      <p className="i-note">
        Want more on one topic?{' '}
        <button type="button" className="i-link" onClick={() => navigate('study', ['papers', 'topics'], { replace: true })}>
          Topic booklets
        </button>{' '}
        collect every past question on it.
      </p>
    </div>
  );
}

const cssId = (k: string) => k.replace(/[^a-zA-Z0-9]+/g, '-');

function HardCard({ h, m, today, flash }: { h: HardItem; m: HardMark | undefined; today: string; flash: boolean }) {
  const p = h.paper;
  const name = `${UNIT_NAMES[h.u]} ${p?.short ?? h.s} ${h.q}`;
  return (
    <li id={`hq-${cssId(h.key)}`} className={`pq-q pq-q--t${h.tier}${m?.state === 'done' ? ' is-done' : ''}${flash ? ' is-flash' : ''}`}>
      <Tick on={m?.state === 'done'} label={`${name} done`} onClick={() => setHard(h.key, m?.state === 'done' ? null : 'done', today)} />
      <div className="pq-q__b">
        <div className="pq-q__meta">
          <b className="i-mono">{h.q}</b>
          <span className="pq-pill pq-pill--line">
            {h.u} {p?.short ?? h.s}
          </span>
          <span className={`pq-pill pq-t${h.tier}`}>{TIER_LABEL[h.tier]}</span>
          <span className="pq-pill pq-pill--topic">{h.topic}</span>
          {h.mcq && <span className="pq-pill pq-pill--dash">Multiple choice</span>}
          {m?.state === 'wrong' && m.retry && <span className="pq-pill pq-pill--retry">Retry {m.retry.due <= today ? 'today' : shortDay(m.retry.due, today)}</span>}
        </div>
        <p className="pq-q__t">{h.title}</p>
        <p className="pq-q__n">{h.note}</p>
        <div className="pq-q__links">
          <Ext href={p?.qp ?? null} primary label={`${name}: question paper`}>
            Question paper
          </Ext>
          <Ext href={p?.ms ?? null} label={`${name}: mark scheme`}>
            Mark scheme
          </Ext>
          <Ext href={p?.er ?? null} label={`${name}: examiner report`}>
            Examiner report
          </Ext>
          {m?.state === 'wrong' ? (
            <button type="button" className="i-link pq-q__wrong" onClick={() => setHard(h.key, null, today)}>
              Undo “got it wrong”
            </button>
          ) : (
            <button type="button" className="i-link pq-q__wrong" onClick={() => setHard(h.key, 'wrong', today)} aria-label={`${name}: got it wrong, retry later`}>
              Got it wrong
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

// ── Topic booklets ──

function TopicsTab({ s, today }: { s: PapersState; today: string }) {
  const subject = useStore(view, (v) => v.subject);
  const units = unitsOf(subject).filter((u) => u.spec === 'new' && bookletsOf(u.code).length);
  return (
    <div className="pq-tab">
      <Chips label="Subject" value={subject} onChange={setSubject} options={SUBJECTS.map((x) => ({ id: x, label: x }))} />
      <p className="i-note">Past-paper questions sorted into booklets by topic, each with its mark scheme where there is one. Good for drilling a weak topic before sitting whole papers.</p>
      {!units.length && <p className="i-pnl pq-empty">No topic booklets for {subject} here: work through the papers by year instead.</p>}
      {units.map((u) => (
        <BookletUnit key={u.code} unit={u} s={s} today={today} />
      ))}
    </div>
  );
}

function BookletUnit({ unit, s, today }: { unit: UnitRow; s: PapersState; today: string }) {
  const list = bookletsOf(unit.code);
  const sets = [...new Set(list.map((b) => b.set))];
  const done = list.filter((b) => s.booklets.has(b.key)).length;
  const page = bookletPage(unit.code);
  return (
    <section className="pq-bk" aria-label={`${unit.short} topic booklets`}>
      <H2 aside={`${done}/${list.length}`}>
        {unit.short} · {unit.name}
      </H2>
      {(BOOKLET_NOTE[unit.code] || page) && (
        <p className="i-note">
          {BOOKLET_NOTE[unit.code]}{' '}
          {page && (
            <a className="i-link" href={page} target="_blank" rel="noopener noreferrer">
              The source page
            </a>
          )}
        </p>
      )}
      {sets.map((set, i) => {
        const items = list.filter((b) => b.set === set);
        const n = items.filter((b) => s.booklets.has(b.key)).length;
        return (
          <details key={set} className="pq-set" open={i === 0}>
            <summary>
              {set}{' '}
              <small>
                {n}/{items.length}
              </small>
            </summary>
            <ul className="pq-papers">
              {items.map((b) => (
                <li key={b.key} className={`pq-paper${s.booklets.has(b.key) ? ' is-done' : ''}`}>
                  <Tick on={s.booklets.has(b.key)} label={`${unit.short} ${set}: ${b.name} done`} onClick={() => toggleBooklet(b.key, today)} />
                  <span className="pq-paper__t">
                    <b>{b.name}</b>
                    {s.booklets.has(b.key) && <small>done {shortDay(s.booklets.get(b.key)!, today)}</small>}
                  </span>
                  <span className="pq-paper__links">
                    <Ext href={b.qp} primary label={`${b.name} questions`}>
                      Qs
                    </Ext>
                    <Ext href={b.ms} label={`${b.name} mark scheme`}>
                      MS
                    </Ext>
                  </span>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </section>
  );
}

// ── Retry ──

function RetryTab({ s, today }: { s: PapersState; today: string }) {
  const hardMarks = [...s.hard.values()];
  const hard = retryOrder(hardMarks, today);
  const mist = retryOrder(s.mistakes, today);
  const items = hardList();
  const byKey = new Map(items.map((h) => [h.key, h]));
  const why = whyCounts(s.mistakes);
  const maxWhy = Math.max(1, ...why.map((w) => w.n));
  const dueN = hard.due.length + mist.due.length;
  const fixed = s.mistakes.filter((m) => m.fixed);
  return (
    <div className="pq-tab">
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'paper-mistake', subject: view.get().subject })}>
        + Log a mistake
      </button>
      <p className="i-note">Anything you get wrong comes back in 2 days, then 7, then 21. Get it right on the last go and it’s cleared; get it wrong and it starts again.</p>

      <H2 aside={dueN ? `${dueN} due` : undefined}>Due now</H2>
      {dueN ? (
        <ul className="pq-retry">
          {hard.due.map((m) => byKey.get(m.key) && <HardRetry key={m.key} h={byKey.get(m.key)!} m={m} today={today} />)}
          {mist.due.map((m) => (
            <MistakeRetry key={m.id} m={m} today={today} />
          ))}
        </ul>
      ) : (
        <p className="i-pnl pq-empty">Nothing due. Mark a hard question “Got it wrong”, or log a mistake from any paper, and it comes back here.</p>
      )}

      {hard.later.length + mist.later.length > 0 && (
        <>
          <H2>Coming up</H2>
          <ul className="pq-retry pq-retry--later">
            {[
              ...hard.later.map((m) => ({
                due: m.retry!.due,
                k: m.key,
                el: byKey.get(m.key) && <HardRetry key={m.key} h={byKey.get(m.key)!} m={m} today={today} later />,
              })),
              ...mist.later.map((m) => ({
                due: m.retry!.due,
                k: m.id,
                el: <MistakeRetry key={m.id} m={m} today={today} later />,
              })),
            ]
              .sort((a, b) => a.due.localeCompare(b.due))
              .map((x) => x.el)}
          </ul>
        </>
      )}

      {why.length > 0 && (
        <>
          <H2 aside={`${s.mistakes.length} logged`}>What trips you up</H2>
          <div className="i-pnl pq-why">
            {why.map((w) => (
              <div key={w.why} className="pq-why__r">
                <span>{w.why}</span>
                <span className="pq-bar" aria-hidden="true">
                  <i style={{ width: `${(w.n / maxWhy) * 100}%` }} />
                </span>
                <b className="i-mono">{w.n}</b>
              </div>
            ))}
          </div>
        </>
      )}
      {fixed.length > 0 && (
        <details className="pq-more">
          <summary>
            Cleared <small>{fixed.length}</small>
          </summary>
          <ul className="pq-retry pq-retry--later">
            {fixed.slice(0, 30).map((m) => (
              <MistakeRetry key={m.id} m={m} today={today} later />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function RetryButtons({ name, onRight, onWrong }: { name: string; onRight: () => void; onWrong: () => void }) {
  return (
    <span className="pq-retry__acts">
      <button type="button" className="i-btn i-btn--sm" onClick={onRight} aria-label={`${name}: right this time`}>
        Right ✓
      </button>
      <button type="button" className="i-btn i-btn--sm" onClick={onWrong} aria-label={`${name}: still wrong`}>
        Still wrong
      </button>
    </span>
  );
}

function HardRetry({ h, m, today, later }: { h: HardItem; m: HardMark; today: string; later?: boolean }) {
  const name = `${h.u} ${h.paper?.short ?? h.s} ${h.q}`;
  return (
    <li className="pq-retry__i">
      <span className="pq-retry__t">
        <b>{h.title}</b>
        <small>
          {name} · {h.topic}
          {later && m.retry ? ` · ${shortDay(m.retry.due, today)}` : ''}
        </small>
        <span className="pq-q__links">
          <Ext href={h.paper?.qp ?? null} primary>
            Question paper
          </Ext>
          <Ext href={h.paper?.ms ?? null}>Mark scheme</Ext>
        </span>
      </span>
      {!later && <RetryButtons name={name} onRight={() => retryHard(m, true, today)} onWrong={() => retryHard(m, false, today)} />}
    </li>
  );
}

function MistakeRetry({ m, today, later }: { m: Mistake; today: string; later?: boolean }) {
  const p = m.paper ? paperById(m.paper) : undefined;
  const where = p ? `${p.unit.short} ${p.short}` : m.paper;
  const name = [m.subject, where, m.q].filter(Boolean).join(' ');
  return (
    <li className="pq-retry__i">
      <button type="button" className="pq-retry__t" onClick={() => openSheet({ type: 'paper-mistake', editId: m.id })} aria-label={`Edit mistake: ${name}`}>
        <b>{m.topic || name}</b>
        <small>
          {name} · {m.why}
          {m.fixed ? ` · cleared ${shortDay(m.fixed, today)}` : later && m.retry ? ` · ${shortDay(m.retry.due, today)}` : ''}
        </small>
        {m.note && <span className="pq-retry__n">{m.note}</span>}
      </button>
      {p && (
        <span className="pq-q__links">
          <Ext href={p.qp} primary>
            Question paper
          </Ext>
          <Ext href={p.ms}>Mark scheme</Ext>
        </span>
      )}
      {!later && <RetryButtons name={name} onRight={() => retryMistake(m, true, today)} onWrong={() => retryMistake(m, false, today)} />}
    </li>
  );
}
