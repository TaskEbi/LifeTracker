/** Maths' sheets: log time, a paper (real or practice), a problem, and the brief for a contest. */
import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { ltToday, sectionEntries } from '../../data/lt';
import { deleteRecord } from '../../data/records';
import { deleteSession } from '../../data/sessions';
import { data } from '../../data/store';
import { shortDay } from '../../domain/log/dates';
import {
  amcGuess,
  amcNeeded,
  againOn,
  CONTESTS,
  contestInfo,
  mathsSession,
  OUTCOME_LABEL,
  pace,
  problemOf,
  SESSION_KINDS,
  sittingOf,
  statusOf,
  TOPICS,
  type ContestId,
  type MathsDetail,
  type Outcome,
  type Topic,
} from '../../domain/maths/model';
import { useStore } from '../../lib/createStore';
import { Picks, Stepper } from '../../ui/i/bits';
import { DayPick, MinutesField } from '../../ui/i/fields';
import { Sheet } from '../../ui/i/Sheet';
import { blankSitting, checkSitting, formOfSitting, formScore, logMaths, removeSitting, saveProblem, saveSitting, startMock, timerMock, type SittingForm } from './actions';

const topicOptions = TOPICS.map((t) => ({ id: t, label: t }));
const contestOptions = CONTESTS.map((c) => ({ id: c.id, label: c.name }));
const OUTCOMES: Outcome[] = ['clean', 'hint', 'stuck'];

// ─── log time ───────────────────────────────────────────────────────────────

function MathsSheet({ spec }: { spec: SheetSpec }) {
  const mock = spec.minutes != null ? timerMock() : null;
  // A timer started as a practice paper comes back to that paper, with its minutes.
  if (mock) return <SittingSheet spec={{ ...spec, contest: mock, real: false }} />;
  return <LogSheet spec={spec} />;
}

function LogSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const st = data.get();
  const editId = (spec.editId as string | undefined) ?? null;
  const prev = editId ? sectionEntries<MathsDetail>(st, 'maths').find((s) => s.entry.id === editId) : undefined;
  const pd = prev ? mathsSession(prev.entry, prev.detail) : null;
  const [kind, setKind] = useState(pd?.kind && (SESSION_KINDS as readonly string[]).includes(pd.kind) ? pd.kind : 'Problems');
  const [topic, setTopic] = useState<Topic | null>((pd?.topic as Topic | null) ?? null);
  const [minutes, setMinutes] = useState(pd?.minutes ?? (spec.minutes as number | undefined) ?? 45);
  const [date, setDate] = useState(pd?.date ?? today);
  const [note, setNote] = useState(pd?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const save = () => {
    const err = logMaths({ kind, topic, minutes, date, note }, editId);
    if (err) setError(err);
    else closeSheet();
  };
  return (
    <Sheet
      title={prev ? 'Edit maths session' : 'CH12 · log maths'}
      onClose={closeSheet}
      accent="maths"
      footer={
        <>
          {prev && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteSession(prev.entry.id), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <Picks label="What you did" value={kind} onChange={setKind} options={SESSION_KINDS.map((k) => ({ id: k, label: k }))} />
      <MinutesField value={minutes} onChange={setMinutes} presets={[20, 30, 45, 60, 90, 120]} />
      <div className="i-field">
        <span className="i-lab">Topic · optional</span>
        <Picks label="Topic" value={topic} onChange={(t) => setTopic(t === topic ? null : t)} options={topicOptions} />
      </div>
      <DayPick value={date} onChange={setDate} today={today} />
      <textarea className="i-textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="What you worked on · optional" aria-label="Notes" />
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}

// ─── a paper ────────────────────────────────────────────────────────────────

function SittingSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const st = useStore(data, (s) => s);
  const rec = spec.editId ? st.lt_records.get(spec.editId as string) : undefined;
  const known = rec ? sittingOf(rec) : null;
  const [f, setF] = useState<SittingForm>(() => {
    if (known) return formOfSitting(known);
    const base = blankSitting((spec.contest as ContestId) ?? 'amc12', spec.real !== false, today);
    return { ...base, minutes: spec.minutes != null ? String(spec.minutes) : base.minutes, label: (spec.label as string) ?? '' };
  });
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<SittingForm>) => {
    setF((x) => ({ ...x, ...patch }));
    setError(null);
  };
  const info = contestInfo(f.contest);
  const score = formScore(f);
  const canScore = f.date != null && f.date <= today;
  const choose = (contest: ContestId) => {
    const fresh = blankSitting(contest, f.real, today);
    setF({ ...fresh, label: f.label, date: f.date, note: f.note, minutes: f.minutes, award: f.award });
    setError(null);
  };
  const save = () => {
    const err = saveSitting(f, known?.id);
    if (err) setError(err);
    else closeSheet();
  };
  const placeholder = f.real ? `${info.name === 'Other' ? 'Name' : info.name} ${today.slice(0, 4)}` : `${info.name === 'Other' ? 'Paper' : info.name} and year`;
  return (
    <Sheet
      title={known ? known.label : f.real ? 'Add a contest' : 'Add a practice paper'}
      onClose={closeSheet}
      accent="maths"
      footer={
        <>
          {known && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (removeSitting(known), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <Picks label="Contest" value={f.contest} onChange={choose} options={contestOptions} />
      <Picks<'real' | 'practice'> label="Real or practice" value={f.real ? 'real' : 'practice'} onChange={(v) => set({ real: v === 'real', date: v === 'real' ? f.date : f.date ?? today })} options={[{ id: 'real', label: 'The real thing' }, { id: 'practice', label: 'Practice paper' }]} />
      <div className="i-field">
        <label className="i-lab" htmlFor="ma-label">Name{f.contest === 'other' ? '' : ' · optional'}</label>
        <input id="ma-label" className="i-input" value={f.label} onChange={(e) => set({ label: e.target.value })} placeholder={placeholder} maxLength={80} />
      </div>
      <div className="i-field">
        <label className="i-lab" htmlFor="ma-date">{f.real ? 'Date · leave empty if not known yet' : 'Date'}</label>
        <input id="ma-date" className="i-input" type="date" value={f.date ?? ''} onChange={(e) => set({ date: e.target.value || null })} />
      </div>
      {canScore && (
        <>
          {info.scoring === 'amc' && (
            <div className="ma-steps">
              <span>Right</span>
              <Stepper value={f.correct} label="questions right" onStep={(d) => set({ correct: Math.max(0, Math.min(info.questions - f.blank, f.correct + d)) })} />
              <span>Left blank</span>
              <Stepper value={f.blank} label="questions left blank" onStep={(d) => set({ blank: Math.max(0, Math.min(info.questions - f.correct, f.blank + d)) })} />
            </div>
          )}
          {info.scoring === 'marks' && (
            <div className="i-field">
              <span className="i-lab">Marks per problem · out of {info.max / info.questions}</span>
              <div className="ma-marks">
                {f.marks.map((m, i) => (
                  <label key={i} className="ma-mark">
                    <span>Q{i + 1}</span>
                    <input className="i-input" inputMode="numeric" value={m} aria-label={`Marks for problem ${i + 1}`} onChange={(e) => set({ marks: f.marks.map((x, j) => (j === i ? e.target.value.replace(/[^0-9]/g, '').slice(0, 2) : x)) })} />
                  </label>
                ))}
              </div>
            </div>
          )}
          {info.scoring === 'total' && (
            <div className="i-field ma-total">
              <span className="i-lab">Score</span>
              <div className="ma-total__row">
                <input className="i-input" inputMode="decimal" value={f.total} aria-label="Score" placeholder="—" onChange={(e) => set({ total: e.target.value.replace(/[^0-9.]/g, '').slice(0, 6) })} />
                <span>out of</span>
                <input className="i-input" inputMode="numeric" value={f.max} aria-label="Maximum score" disabled={f.contest !== 'other'} onChange={(e) => set({ max: e.target.value.replace(/[^0-9]/g, '').slice(0, 5) })} />
              </div>
            </div>
          )}
          {score != null && info.scoring !== 'total' && <p className="ma-sum" role="status">{score} out of {info.max}</p>}
          {f.real && (
            <div className="i-field">
              <label className="i-lab" htmlFor="ma-award">Award or next step · optional</label>
              <input id="ma-award" className="i-input" value={f.award} onChange={(e) => set({ award: e.target.value })} placeholder="Gold, Distinction, through to BMO2…" maxLength={60} />
            </div>
          )}
          <div className="i-field">
            <label className="i-lab" htmlFor="ma-min">Minutes spent · optional, goes in the Daily Log</label>
            <input id="ma-min" className="i-input" inputMode="numeric" value={f.minutes} placeholder={String(info.minutes)} onChange={(e) => set({ minutes: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })} />
          </div>
        </>
      )}
      {!canScore && f.real && f.date && <p className="i-note">It goes on the calendar. The score fields open on the day.</p>}
      <textarea className="i-textarea" value={f.note} onChange={(e) => set({ note: e.target.value })} maxLength={2000} placeholder="How it went, what to do differently · optional" aria-label="Notes" />
      {(error ?? (score != null ? checkSitting(f, today) : null)) && <p className="i-error" role="alert">{error ?? checkSitting(f, today)}</p>}
    </Sheet>
  );
}

// ─── a problem ──────────────────────────────────────────────────────────────

function ProblemSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const st = useStore(data, (s) => s);
  const rec = spec.editId ? st.lt_records.get(spec.editId as string) : undefined;
  const known = rec ? problemOf(rec) : null;
  const [title, setTitle] = useState(known?.title ?? (spec.title as string) ?? '');
  const [topic, setTopic] = useState<Topic | null>(known?.topic ?? null);
  const [statement, setStatement] = useState(known?.statement ?? '');
  const [idea, setIdea] = useState(known?.idea ?? '');
  const [outcome, setOutcome] = useState<Outcome | null>(known ? null : 'stuck');
  const [date, setDate] = useState(today);
  const save = () => {
    saveProblem({ title, topic, statement, idea }, outcome ? { date, outcome } : null, known?.id);
    closeSheet();
  };
  const on = known ? againOn(known) : null;
  return (
    <Sheet
      title={known ? known.title : 'Add a problem'}
      onClose={closeSheet}
      accent="maths"
      footer={
        <>
          {known && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(known.id, 'Problem deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!title.trim()} onClick={save}>
            Save
          </button>
        </>
      }
    >
      <div className="i-field">
        <label className="i-lab" htmlFor="ma-title">Which problem</label>
        <input id="ma-title" className="i-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="BMO1 2019 Q3" maxLength={120} autoFocus={!known && !spec.title} />
      </div>
      <div className="i-field">
        <span className="i-lab">Topic</span>
        <Picks label="Topic" value={topic} onChange={(t) => setTopic(t === topic ? null : t)} options={topicOptions} />
      </div>
      <div className="i-field">
        <span className="i-lab">{known ? 'Another go · optional' : 'How it went'}</span>
        <Picks label="How it went" value={outcome} onChange={(o) => setOutcome(o === outcome ? null : o)} options={OUTCOMES.map((o) => ({ id: o, label: OUTCOME_LABEL[o] }))} />
      </div>
      {outcome && <DayPick value={date} onChange={setDate} today={today} />}
      <textarea className="i-textarea" value={idea} onChange={(e) => setIdea(e.target.value)} maxLength={4000} placeholder="The key idea, or where you got stuck" aria-label="Key idea" />
      <textarea className="i-textarea" value={statement} onChange={(e) => setStatement(e.target.value)} maxLength={4000} placeholder="The problem itself · optional" aria-label="Problem statement" />
      {known && known.attempts.length > 0 && (
        <p className="i-note">
          {known.attempts.map((a) => `${shortDay(a.date)}: ${OUTCOME_LABEL[a.outcome].toLowerCase()}`).join(' · ')}
          {on ? ` · comes back ${on <= today ? 'now' : shortDay(on)}` : statusOf(known) === 'clean' ? ' · done with' : ''}
        </p>
      )}
    </Sheet>
  );
}

// ─── the brief ──────────────────────────────────────────────────────────────

function BriefSheet({ spec }: { spec: SheetSpec }) {
  const c = contestInfo(spec.contest as ContestId);
  const per = pace(c);
  return (
    <Sheet title={`${c.name} · the brief`} onClose={closeSheet} accent="maths">
      <p className="ma-brief__fmt">{c.format}</p>
      {per && <p className="i-note">About {per} a question if it went evenly. Run by {c.org}. Check the rules with them or your centre, since they can change.</p>}
      <div className="ma-brief__tips">
        <h3>Getting in</h3>
        <p>{c.entry}</p>
        <h3>On the day</h3>
        <ul>
          {c.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      {c.id === 'amc12' && (
        <div className="ma-brief__tips">
          <h3>Guess or leave it blank?</h3>
          <table className="ma-table">
            <thead>
              <tr>
                <th scope="col">Options left</th>
                <th scope="col">A guess is worth</th>
                <th scope="col">Against blank (1.5)</th>
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2].map((n) => {
                const g = amcGuess(n);
                return (
                  <tr key={n}>
                    <td>{n}</td>
                    <td>{g.worth.toFixed(2)}</td>
                    <td>{g.advice === 'guess' ? 'Guess' : g.advice === 'blank' ? 'Leave it' : 'No difference'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="i-note">Rule out two options and a guess pays. With nothing ruled out, a blank is worth more.</p>
          <h3>What a score takes</h3>
          <table className="ma-table">
            <thead>
              <tr>
                <th scope="col">Score</th>
                <th scope="col">Right, the rest blank</th>
              </tr>
            </thead>
            <tbody>
              {[80, 90, 100, 110, 120].map((t) => (
                <tr key={t}>
                  <td>{t}</td>
                  <td>{amcNeeded(t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button type="button" className="i-btn i-btn--block" onClick={() => startMock(c.id)}>
        Sit a practice paper · {c.minutes} min timer
      </button>
      <button type="button" className="i-btn i-btn--block" style={{ marginTop: 8 }} onClick={() => (closeSheet(), openSheet({ type: 'maths-sitting', contest: c.id, real: false }))}>
        Add a marked paper
      </button>
    </Sheet>
  );
}

registerSheet('maths', MathsSheet);
registerSheet('maths-sitting', SittingSheet);
registerSheet('maths-problem', ProblemSheet);
registerSheet('maths-brief', BriefSheet);
