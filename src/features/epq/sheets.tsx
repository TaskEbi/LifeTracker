/** EPQ sheets: the project, a log entry, a milestone, a source and today's word count. */
import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { ltToday } from '../../data/lt';
import { deleteRecord } from '../../data/records';
import { data } from '../../data/store';
import { DEFAULT_HOURS, DEFAULT_WORDS, EPQ_SUBJECT, LOG_KINDS, LOG_MAX, LOG_PROMPTS, logOf, milestoneOf, MY_PLAN, NOTE_MAX, SOURCE_TYPES, sourceOf, TRUST, type LogKind, type SourceType, type Trust } from '../../domain/epq/model';
import { Picks, Toggle } from '../../ui/i/bits';
import { DayPick } from '../../ui/i/fields';
import { Sheet } from '../../ui/i/Sheet';
import { epqIn, saveLog, saveMilestone, saveProject, saveSource, saveWords } from './actions';

const num = (s: string) => Number(s.replace(/[,\s]/g, ''));

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="i-field">
      <span className="i-lab">{label}</span>
      {children}
    </label>
  );
}

function ProjectSheet() {
  const today = ltToday();
  const p = epqIn(data.get()).project;
  const [title, setTitle] = useState(p?.title ?? MY_PLAN.title);
  const [question, setQuestion] = useState(p?.question ?? MY_PLAN.question);
  const [deadline, setDeadline] = useState(p?.deadline ?? MY_PLAN.deadline);
  const [words, setWords] = useState(String(p?.wordTarget ?? DEFAULT_WORDS));
  const [hours, setHours] = useState(String(p?.hoursTarget ?? DEFAULT_HOURS));
  const [subject, setSubject] = useState(p?.subject ?? EPQ_SUBJECT);
  const [started, setStarted] = useState(p?.started ?? MY_PLAN.started);
  const w = num(words);
  const h = num(hours);
  const valid = Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0 && !!subject.trim();
  const save = () => {
    saveProject({ title, question, deadline: deadline || null, wordTarget: Math.round(w), hoursTarget: Math.round(h), subject, started: started || null });
    closeSheet();
  };
  return (
    <Sheet
      title={p ? 'Your EPQ' : 'Set up your EPQ'}
      onClose={closeSheet}
      accent="study"
      footer={
        <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!valid} onClick={save}>
          Save
        </button>
      }
    >
      <Field label="Working title">
        <input className="i-input" data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="e.g. Should AI mark GCSE essays?" />
      </Field>
      <Field label="Research question · optional">
        <textarea className="i-textarea" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={400} placeholder="To what extent…" />
      </Field>
      <Field label="Hand-in date">
        <input className="i-input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </Field>
      <Field label="Started">
        <input className="i-input" type="date" value={started} max={today} onChange={(e) => setStarted(e.target.value)} />
      </Field>
      <span style={{ display: 'flex', gap: 8 }}>
        <Field label="Word target">
          <input className="i-input" inputMode="numeric" value={words} onChange={(e) => setWords(e.target.value)} />
        </Field>
        <Field label="Hours target">
          <input className="i-input" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} />
        </Field>
      </span>
      <Field label="Study subject for its sessions">
        <input className="i-input" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={40} />
      </Field>
      <p className="i-note">Time on the project is logged as a Study session in this subject, so it counts toward Study’s level, streaks and the weekly boss. Most boards expect about 5,000 words and 120 hours; check your school’s.</p>
      {!p && <p className="i-note">Filled in from your plan. The hand-in date of 30 April is an assumption until your supervisor confirms the real one.</p>}
    </Sheet>
  );
}

function LogSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const rec = spec.editId ? data.get().lt_records.get(spec.editId as string) : undefined;
  const e = rec ? logOf(rec) : null;
  const [kind, setKind] = useState<LogKind>(e?.kind ?? ((spec.kind as LogKind) || 'Progress'));
  const [text, setText] = useState(e?.text ?? '');
  const [next, setNext] = useState(e?.next ?? '');
  const [date, setDate] = useState(e?.date ?? today);
  return (
    <Sheet
      title={e ? 'Edit log entry' : 'Production log'}
      onClose={closeSheet}
      accent="study"
      footer={
        <>
          {rec && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(rec.id, 'Log entry deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!text.trim()} onClick={() => (saveLog({ date, kind, text, next }, rec?.id), closeSheet())}>
            Save entry
          </button>
        </>
      }
    >
      <Picks label="Kind of entry" value={kind} onChange={setKind} options={LOG_KINDS.map((k) => ({ id: k, label: k }))} />
      <Field label={LOG_PROMPTS[kind]}>
        <textarea className="i-textarea" data-autofocus value={text} onChange={(ev) => setText(ev.target.value)} maxLength={LOG_MAX} rows={6} />
      </Field>
      <Field label="Next step · optional">
        <input className="i-input" value={next} onChange={(ev) => setNext(ev.target.value)} maxLength={400} />
      </Field>
      <DayPick value={date} onChange={setDate} today={today} />
      {text.length > LOG_MAX - 200 && <p className="i-note">{LOG_MAX - text.length} characters left in this entry.</p>}
    </Sheet>
  );
}

function MilestoneSheet({ spec }: { spec: SheetSpec }) {
  const rec = spec.editId ? data.get().lt_records.get(spec.editId as string) : undefined;
  const m = rec ? milestoneOf(rec) : null;
  const [title, setTitle] = useState(m?.title ?? '');
  const [due, setDue] = useState(m?.due ?? '');
  const [done, setDone] = useState(m?.done ?? '');
  return (
    <Sheet
      title={m ? 'Edit milestone' : 'New milestone'}
      onClose={closeSheet}
      accent="study"
      footer={
        <>
          {rec && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(rec.id, 'Milestone deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!title.trim()} onClick={() => (saveMilestone({ title, due: due || null, done: done || null }, rec?.id), closeSheet())}>
            Save
          </button>
        </>
      }
    >
      <Field label="Milestone">
        <input className="i-input" data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </Field>
      <Field label="Due">
        <input className="i-input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </Field>
      <Field label="Done on · leave empty if not yet">
        <input className="i-input" type="date" value={done} max={ltToday()} onChange={(e) => setDone(e.target.value)} />
      </Field>
    </Sheet>
  );
}

function SourceSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const rec = spec.editId ? data.get().lt_records.get(spec.editId as string) : undefined;
  const s = rec ? sourceOf(rec) : null;
  const [title, setTitle] = useState(s?.title ?? '');
  const [author, setAuthor] = useState(s?.author ?? '');
  const [year, setYear] = useState(s?.year ?? '');
  const [type, setType] = useState<SourceType>(s?.type ?? 'Book');
  const [publisher, setPublisher] = useState(s?.publisher ?? '');
  const [url, setUrl] = useState(s?.url ?? '');
  const [notes, setNotes] = useState(s?.notes ?? '');
  const [trust, setTrust] = useState<Trust>(s?.trust ?? 2);
  const [used, setUsed] = useState(s?.used ?? true);
  const save = () => {
    saveSource({ title: title.trim(), author: author.trim(), year: year.trim(), type, publisher: publisher.trim(), url: url.trim(), accessed: url.trim() ? (s?.url === url.trim() ? s.accessed : today) : null, notes: notes.trim(), trust, used }, rec?.id);
    closeSheet();
  };
  return (
    <Sheet
      title={s ? 'Edit source' : 'Add a source'}
      onClose={closeSheet}
      accent="study"
      footer={
        <>
          {rec && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(rec.id, 'Source deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!title.trim()} onClick={save}>
            Save source
          </button>
        </>
      }
    >
      <Picks label="Type" value={type} onChange={setType} options={SOURCE_TYPES.map((t) => ({ id: t, label: t }))} />
      <Field label="Title">
        <input className="i-input" data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} />
      </Field>
      <span style={{ display: 'flex', gap: 8 }}>
        <Field label="Author (Surname, I.)">
          <input className="i-input" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={200} />
        </Field>
        <Field label="Year">
          <input className="i-input" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} maxLength={12} style={{ width: 90 }} />
        </Field>
      </span>
      <Field label="Publisher or site · optional">
        <input className="i-input" value={publisher} onChange={(e) => setPublisher(e.target.value)} maxLength={200} />
      </Field>
      <Field label="Link · optional">
        <input className="i-input" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={600} placeholder="https://" />
      </Field>
      <Field label="Notes: what it says, and what you'll use it for">
        <textarea className="i-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={NOTE_MAX} rows={4} />
      </Field>
      <Picks label="How far you'd trust it" value={String(trust) as '1' | '2' | '3'} onChange={(v) => setTrust(Number(v) as Trust)} options={([3, 2, 1] as Trust[]).map((t) => ({ id: String(t) as '1' | '2' | '3', label: TRUST[t] }))} />
      <p className="i-note">Who wrote it and do they know? When? Why was it written? What evidence does it give?</p>
      <Toggle on={used} label="In the reference list" hint="Sources you read but don't cite stay in the library" onChange={setUsed} />
    </Sheet>
  );
}

function WordsSheet() {
  const today = ltToday();
  const st = epqIn(data.get());
  const last = st.words.at(-1)?.words;
  const [words, setWords] = useState(last != null ? String(last) : '');
  const n = num(words);
  const valid = words.trim() !== '' && Number.isFinite(n) && n >= 0;
  return (
    <Sheet
      title="Word count today"
      onClose={closeSheet}
      accent="study"
      footer={
        <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!valid} onClick={() => (saveWords(today, n), closeSheet())}>
          Save
        </button>
      }
    >
      <Field label="Words in the essay now">
        <input className="i-input" data-autofocus inputMode="numeric" value={words} onChange={(e) => setWords(e.target.value)} />
      </Field>
      {valid && last != null && <p className="i-note">{n - last >= 0 ? `+${(n - last).toLocaleString('en-GB')}` : (n - last).toLocaleString('en-GB')} since the last count.</p>}
    </Sheet>
  );
}

registerSheet('epq-project', ProjectSheet);
registerSheet('epq-log', LogSheet);
registerSheet('epq-milestone', MilestoneSheet);
registerSheet('epq-source', SourceSheet);
registerSheet('epq-words', WordsSheet);
