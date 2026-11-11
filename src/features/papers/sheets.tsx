/** Past paper sheets: score a paper (and log its time), and log a mistake to retry. */
import { useState, type ReactNode } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { ltToday } from '../../data/lt';
import { deleteRecord } from '../../data/records';
import { data } from '../../data/store';
import { allPapers, paperById, SUBJECTS, typicalOf, type Subject } from '../../domain/papers/model';
import { MISTAKE_WHY, mistakeOf, paperMarkOf, type MistakeWhy } from '../../domain/papers/records';
import { Picks, Toggle } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { saveMistake, saveScore, setMock, togglePaperDone } from './actions';
import { pairId } from '../../data/logActions';

const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(/[,\s]/g, '')));

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="i-field">
      <span className="i-lab">{label}</span>
      {children}
    </label>
  );
}

function PaperSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const p = paperById(spec.id as string);
  const rec = p ? data.get().lt_records.get(pairId('ppq:paper', p.id)) : undefined;
  const m = rec && !rec.deleted_at ? paperMarkOf(rec) : null;
  const typ = p ? typicalOf(p.unit.code) : null;
  const [done, setDone] = useState(m?.done ?? today);
  const [score, setScore] = useState(m?.score != null ? String(m.score) : '');
  const [outOf, setOutOf] = useState(String(m?.outOf ?? typ?.marks ?? ''));
  const [minutes, setMinutes] = useState(String(m?.minutes ?? typ?.minutes ?? ''));
  const [toMarks, setToMarks] = useState(m ? !!m.markId : true);
  const [logTime, setLogTime] = useState(!m?.done);
  if (!p) {
    return (
      <Sheet title="Paper" onClose={closeSheet} accent="study">
        <p className="i-note">This paper isn’t in the list any more.</p>
      </Sheet>
    );
  }
  const name = `${p.unit.short} ${p.short}`;
  const sc = num(score);
  const oo = num(outOf);
  const mins = num(minutes);
  const valid =
    !!done &&
    (sc == null || (Number.isFinite(sc) && sc >= 0)) &&
    (oo == null || (Number.isFinite(oo) && oo > 0)) &&
    (sc == null || oo == null || sc <= oo) &&
    (mins == null || (Number.isFinite(mins) && mins > 0 && mins <= 600));
  const save = () => {
    saveScore(
      p.id,
      { done, score: sc, outOf: sc != null ? oo : null, minutes: mins },
      toMarks
        ? {
            subject: p.unit.subject,
            title: `${p.unit.short} ${p.short} past paper`,
          }
        : null,
    );
    closeSheet();
    if (logTime && mins)
      openSheet({
        type: 'study',
        subject: p.unit.subject,
        minutes: Math.round(mins),
        kind: 'Past paper',
        topic: `${p.unit.short} ${p.short}`,
      });
  };
  return (
    <Sheet
      title={name}
      onClose={closeSheet}
      accent="study"
      footer={
        <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!valid} onClick={save}>
          {m?.done ? 'Save' : 'Mark as done'}
        </button>
      }
    >
      <p className="i-note">
        {p.unit.code} · {p.unit.name} · {p.session}
      </p>
      <div className="pq-q__links">
        <a className="pq-link pq-link--main" href={p.qp} target="_blank" rel="noopener noreferrer">
          Question paper
        </a>
        {p.ms && (
          <a className="pq-link" href={p.ms} target="_blank" rel="noopener noreferrer">
            Mark scheme
          </a>
        )}
        {p.ma && (
          <a className="pq-link" href={p.ma} target="_blank" rel="noopener noreferrer">
            Model answers
          </a>
        )}
        {p.er && (
          <a className="pq-link" href={p.er} target="_blank" rel="noopener noreferrer">
            Examiner report
          </a>
        )}
      </div>
      <Field label="Done on">
        <input className="i-input" type="date" value={done} max={today} onChange={(e) => setDone(e.target.value)} />
      </Field>
      <span style={{ display: 'flex', gap: 8 }}>
        <Field label="Score · optional">
          <input className="i-input" inputMode="numeric" value={score} onChange={(e) => setScore(e.target.value)} placeholder="e.g. 62" />
        </Field>
        <Field label="Out of">
          <input className="i-input" inputMode="numeric" value={outOf} onChange={(e) => setOutOf(e.target.value)} />
        </Field>
        <Field label="Minutes">
          <input className="i-input" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </Field>
      </span>
      {typ && (
        <p className="i-note">
          Filled in with the usual {typ.marks} marks in {typ.minutes} minutes for {p.unit.code}; check the front of the paper.
        </p>
      )}
      <Toggle on={toMarks} onChange={setToMarks} label="Add the score to Study’s marks" hint="Counts in the subject’s average" />
      <Toggle on={logTime} onChange={setLogTime} label="Then log the time as a Study session" hint="Earns Study XP like any session" />
      <div className="pq-sheet-acts">
        <button
          type="button"
          className="i-link"
          onClick={() => (
            closeSheet(),
            openSheet({
              type: 'paper-mistake',
              subject: p.unit.subject,
              paper: p.id,
            })
          )}
        >
          + Log a mistake from this paper
        </button>
        {m?.done ? (
          <button type="button" className="i-link" onClick={() => (togglePaperDone(p.id, today), closeSheet())}>
            Not done after all
          </button>
        ) : (
          <button type="button" className="i-link" onClick={() => (setMock([p.id], !m?.mock), closeSheet())}>
            {m?.mock ? 'Don’t keep it for a mock' : 'Keep it for a mock instead'}
          </button>
        )}
      </div>
    </Sheet>
  );
}

function MistakeSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const rec = spec.editId ? data.get().lt_records.get(spec.editId as string) : undefined;
  const m = rec && !rec.deleted_at ? mistakeOf(rec) : null;
  const [subject, setSubject] = useState<Subject>((m?.subject ?? spec.subject ?? 'Physics') as Subject);
  const [paper, setPaper] = useState(m?.paper ?? (spec.paper as string | undefined) ?? '');
  const [q, setQ] = useState(m?.q ?? '');
  const [topic, setTopic] = useState(m?.topic ?? '');
  const [why, setWhy] = useState<MistakeWhy>(m?.why ?? 'Method');
  const [note, setNote] = useState(m?.note ?? '');
  const [date, setDate] = useState(m?.date ?? today);
  const known = paperById(paper);
  const recent = allPapers().filter((p) => p.unit.subject === subject && p.unit.spec === 'new' && p.unit.level === 'AS');
  const valid = !!(topic.trim() || q.trim()) && !!date;
  return (
    <Sheet
      title={m ? 'Mistake' : 'Log a mistake'}
      onClose={closeSheet}
      accent="study"
      footer={
        <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!valid} onClick={() => (saveMistake({ subject, paper, q, topic, why, note, date }, m?.id), closeSheet())}>
          Save
        </button>
      }
    >
      <Picks label="Subject" value={subject} onChange={setSubject} options={SUBJECTS.map((x) => ({ id: x, label: x }))} />
      <Field label="Paper · optional">
        <select className="i-input" value={known ? paper : ''} onChange={(e) => setPaper(e.target.value)}>
          <option value="">Not from the list (or type below)</option>
          {(known && !recent.includes(known) ? [known, ...recent] : recent).map((p) => (
            <option key={p.id} value={p.id}>
              {p.unit.short} {p.short}
            </option>
          ))}
        </select>
      </Field>
      {!known && (
        <Field label="Or where it was from · optional">
          <input className="i-input" value={paper} onChange={(e) => setPaper(e.target.value)} maxLength={80} placeholder="e.g. school mock, textbook ch. 4" />
        </Field>
      )}
      <span style={{ display: 'flex', gap: 8 }}>
        <Field label="Question">
          <input className="i-input" value={q} onChange={(e) => setQ(e.target.value)} maxLength={30} placeholder="Q7(b)" />
        </Field>
        <Field label="Topic">
          <input className="i-input" data-autofocus value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={80} placeholder="e.g. internal resistance" />
        </Field>
      </span>
      <div className="i-field">
        <span className="i-lab">Why it went wrong</span>
        <Picks label="Why it went wrong" value={why} onChange={setWhy} options={MISTAKE_WHY.map((w) => ({ id: w, label: w }))} />
      </div>
      <Field label="What to remember · optional">
        <textarea className="i-textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} placeholder="The fix, in a line, for next time" />
      </Field>
      <Field label="Day">
        <input className="i-input" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
      </Field>
      {m && (
        <button type="button" className="i-link" onClick={() => (deleteRecord(m.id, 'Mistake deleted'), closeSheet())}>
          Delete this mistake
        </button>
      )}
    </Sheet>
  );
}

registerSheet('paper', PaperSheet);
registerSheet('paper-mistake', MistakeSheet);
